import {
  AdditiveBlending,
  BackSide,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { DEG2RAD, clamp01, dampAngle } from '../core/damp'
import type { TierProfile } from '../core/tier'
import type { Theme } from '../cities/themes'
import type { Keyframe } from '../cities/keyframes'
import type { EarthTextures } from './textures'
import { GLOBE_RADIUS } from './Camera'

/**
 * The persistent Earth.
 *
 * One instance, created once, never rebuilt. Cities change its lighting,
 * atmosphere, clouds, night-lights and surface tint, and rotate it to new
 * coordinates — but it is always the same object, which is what makes the
 * journey read as one continuous place rather than six scenes.
 */

/* -----------------------------------------------------------------------------
   Coordinate conversion.

   Three's SphereGeometry lays out an equirectangular texture with u = 0 at
   longitude -180. For a point at (lat, lon):

     phi   = lon·π/180 + π
     theta = (90 - lat)·π/180
     p     = (-cos φ · sin θ,  cos θ,  sin φ · sin θ)

   Rotating that point to face the camera at +Z works out to a pleasingly small
   pair of Euler angles — see `orientationFor` below.
   -------------------------------------------------------------------------- */

export function latLonToVector3(lat: number, lon: number, radius = GLOBE_RADIUS): Vector3 {
  const phi = lon * DEG2RAD + Math.PI
  const theta = (90 - lat) * DEG2RAD
  return new Vector3(
    -Math.cos(phi) * Math.sin(theta) * radius,
    Math.cos(theta) * radius,
    Math.sin(phi) * Math.sin(theta) * radius,
  )
}

/**
 * Euler angles (order XYZ, so Y is applied first) that bring `lat`/`lon` to
 * face the camera.
 *
 * Derivation: rotating by `-π/2 - lon` about Y puts the meridian in the YZ
 * plane; rotating by `lat` about X lifts the parallel to the equator of the
 * view. Together they map the point exactly onto +Z.
 */
export function orientationFor(lat: number, lon: number): { x: number; y: number } {
  return { x: lat * DEG2RAD, y: -Math.PI / 2 - lon * DEG2RAD }
}

const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D uAlbedo;
  uniform sampler2D uNight;
  uniform sampler2D uNormalMap;
  uniform sampler2D uRoughnessMap;
  uniform float uHasNormal;
  uniform float uHasRoughness;

  uniform vec3 uSunDir;
  uniform vec3 uKey;
  uniform float uKeyIntensity;
  uniform vec3 uRim;
  uniform float uRimIntensity;
  uniform vec3 uAmbient;
  uniform float uAmbientIntensity;
  uniform vec3 uSurfaceTint;
  uniform float uNightMix;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 normalW = normalize(vNormalW);

    // Analytic tangent basis for a UV sphere: exact, and avoids shipping
    // tangent attributes for a mesh whose parameterisation we already know.
    if (uHasNormal > 0.5) {
      float phi = vUv.x * 6.28318530718;
      vec3 tangent = normalize(vec3(-sin(phi), 0.0, cos(phi)));
      vec3 bitangent = normalize(cross(normalW, tangent));
      vec3 sampled = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      // Restrained: a full-strength normal map on a globe reads as noise.
      sampled.xy *= 0.55;
      normalW = normalize(mat3(tangent, bitangent, normalW) * sampled);
    }

    vec3 viewDir = normalize(cameraPosition - vPositionW);
    vec3 albedo = texture2D(uAlbedo, vUv).rgb * uSurfaceTint;

    float ndl = dot(normalW, uSunDir);
    // A soft terminator; a hard one makes the sphere look like a cut-out.
    float day = smoothstep(-0.14, 0.26, ndl);

    vec3 diffuse = albedo * uKey * uKeyIntensity * max(ndl, 0.0);
    vec3 ambient = albedo * uAmbient * uAmbientIntensity;

    // Ocean specular, masked by the roughness map where one is available.
    float roughness = uHasRoughness > 0.5 ? texture2D(uRoughnessMap, vUv).g : 0.85;
    float shininess = mix(220.0, 12.0, roughness);
    vec3 halfway = normalize(uSunDir + viewDir);
    float specular = pow(max(dot(normalW, halfway), 0.0), shininess)
                   * (1.0 - roughness) * step(0.0, ndl);

    float fresnel = pow(1.0 - max(dot(normalW, viewDir), 0.0), 3.0);
    vec3 rim = uRim * uRimIntensity * fresnel;

    // City lights, only on the night side and only where the sun is not.
    vec3 nightLights = texture2D(uNight, vUv).rgb * (1.0 - day) * uNightMix * 2.4;

    vec3 color = diffuse + ambient + rim + nightLights + uKey * specular * 0.9;

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunDir;

  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    // Rendered on the back faces of a slightly larger sphere, so the normal
    // points inward; flipping it gives the outward-facing limb.
    vec3 normalW = normalize(-vNormalW);
    vec3 viewDir = normalize(cameraPosition - vPositionW);

    // A high exponent is what makes this read as atmosphere rather than as a
    // glass shell: the glow has to be confined to a narrow band at the limb and
    // vanish completely across the disc.
    float fresnel = pow(1.0 - max(dot(normalW, viewDir), 0.0), 6.0);
    // Scatter is strongest where the limb is also sunlit, which is what puts
    // the bright crescent on the day side and leaves the night side dim.
    float sunlit = smoothstep(-0.45, 0.55, dot(normalW, uSunDir));
    float alpha = fresnel * uIntensity * (0.16 + sunlit * 0.85);

    gl_FragColor = vec4(uColor * alpha, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export class Globe {
  /** Rotated to present the active city. Landmark orbits are centred on this. */
  readonly group = new Group()

  private readonly earth: Mesh
  private readonly atmosphere: Mesh
  private clouds: Mesh | null = null

  private readonly earthMaterial: ShaderMaterial
  private readonly atmosphereMaterial: ShaderMaterial
  private cloudMaterial: MeshBasicMaterial | null = null

  /** Scroll-authoritative orientation, in radians. */
  private baseX = 0
  private baseY = 0
  /** User drag, added on top and decaying back to zero. */
  private offsetX = 0
  private offsetY = 0
  private currentX = 0
  private currentY = 0

  private readonly sunDir = new Vector3(1, 0, 0)
  private readonly scratch = new Color()

  constructor(textures: EarthTextures, profile: TierProfile) {
    const segments = profile.globeSegments
    const geometry = new SphereGeometry(GLOBE_RADIUS, segments, segments / 2)

    this.earthMaterial = new ShaderMaterial({
      vertexShader: EARTH_VERTEX,
      fragmentShader: EARTH_FRAGMENT,
      uniforms: {
        uAlbedo: { value: textures.albedo },
        uNight: { value: textures.night },
        uNormalMap: { value: textures.normal ?? textures.albedo },
        uRoughnessMap: { value: textures.roughness ?? textures.albedo },
        uHasNormal: { value: textures.normal ? 1 : 0 },
        uHasRoughness: { value: textures.roughness ? 1 : 0 },
        uSunDir: { value: this.sunDir },
        uKey: { value: new Color(1, 1, 1) },
        uKeyIntensity: { value: 2 },
        uRim: { value: new Color(0.5, 0.7, 1) },
        uRimIntensity: { value: 0.8 },
        uAmbient: { value: new Color(0.15, 0.18, 0.25) },
        uAmbientIntensity: { value: 0.5 },
        uSurfaceTint: { value: new Color(1, 1, 1) },
        uNightMix: { value: 0.2 },
      },
    })

    this.earth = new Mesh(geometry, this.earthMaterial)
    this.group.add(this.earth)

    if (textures.clouds) {
      this.cloudMaterial = new MeshBasicMaterial({
        map: textures.clouds,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      })
      this.clouds = new Mesh(
        new SphereGeometry(GLOBE_RADIUS * 1.012, segments, segments / 2),
        this.cloudMaterial,
      )
      this.group.add(this.clouds)
    }

    this.atmosphereMaterial = new ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      uniforms: {
        uColor: { value: new Color(0.6, 0.8, 1) },
        uIntensity: { value: 1 },
        uSunDir: { value: this.sunDir },
      },
      transparent: true,
      side: BackSide,
      blending: AdditiveBlending,
      depthWrite: false,
    })

    // Hugs the surface closely. A wide shell reads as a bubble around the
    // planet; the glow has to sit on the limb. Still comfortably inside
    // EFFECTIVE_RADIUS, so the fit solver can never clip it.
    this.atmosphere = new Mesh(
      new SphereGeometry(GLOBE_RADIUS * 1.075, 64, 32),
      this.atmosphereMaterial,
    )
    this.group.add(this.atmosphere)
  }

  /** Target orientation from the current keyframe. */
  setTarget(lat: number, lon: number): void {
    const { x, y } = orientationFor(lat, lon)
    this.baseX = x
    this.baseY = y
  }

  /** Accumulate a drag, in radians. */
  addDrag(deltaX: number, deltaY: number): void {
    this.offsetY += deltaX
    this.offsetX += deltaY
    // Keep the vertical offset from flipping the globe over its poles.
    this.offsetX = Math.max(-0.9, Math.min(0.9, this.offsetX))
  }

  /**
   * Advance the orientation.
   *
   * Scroll is authoritative; the user's drag is an offset layered on top that
   * decays back to zero. The globe therefore always heals itself before the
   * next city lands, and drag and scroll can never deadlock against each other.
   */
  update(dt: number, lambda: number, dragDecay: number, reduced: boolean): void {
    const decay = Math.exp(-dragDecay * dt)
    this.offsetX *= decay
    this.offsetY *= decay

    this.currentX = dampAngle(this.currentX, this.baseX + this.offsetX, lambda, dt)
    this.currentY = dampAngle(this.currentY, this.baseY + this.offsetY, lambda, dt)

    this.group.rotation.x = this.currentX
    this.group.rotation.y = this.currentY

    // Cloud drift is autonomous motion, so reduced-motion removes it entirely.
    if (this.clouds && !reduced) {
      this.clouds.rotation.y += dt * 0.006
    }
  }

  applyTheme(theme: Theme, frame: Keyframe): void {
    const u = this.earthMaterial.uniforms

    this.scratch.setRGB(theme.key[0], theme.key[1], theme.key[2])
    ;(u.uKey!.value as Color).copy(this.scratch)
    this.scratch.setRGB(theme.rim[0], theme.rim[1], theme.rim[2])
    ;(u.uRim!.value as Color).copy(this.scratch)
    this.scratch.setRGB(theme.ambient[0], theme.ambient[1], theme.ambient[2])
    ;(u.uAmbient!.value as Color).copy(this.scratch)
    this.scratch.setRGB(theme.surfaceTint[0], theme.surfaceTint[1], theme.surfaceTint[2])
    ;(u.uSurfaceTint!.value as Color).copy(this.scratch)

    u.uKeyIntensity!.value = theme.keyIntensity
    u.uRimIntensity!.value = theme.rimIntensity
    u.uAmbientIntensity!.value = theme.ambientIntensity
    u.uNightMix!.value = frame.nightMix

    // Sun direction in world space from the keyframe's azimuth and elevation.
    const cosEl = Math.cos(frame.sunEl)
    this.sunDir
      .set(Math.sin(frame.sunAz) * cosEl, Math.sin(frame.sunEl), Math.cos(frame.sunAz) * cosEl)
      .normalize()

    const a = this.atmosphereMaterial.uniforms
    this.scratch.setRGB(theme.atmo[0], theme.atmo[1], theme.atmo[2])
    ;(a.uColor!.value as Color).copy(this.scratch)
    a.uIntensity!.value = theme.atmoIntensity * frame.atmoIntensity

    if (this.cloudMaterial) {
      this.cloudMaterial.opacity = clamp01(frame.cloudOpacity)
      this.scratch.setRGB(theme.cloudTint[0], theme.cloudTint[1], theme.cloudTint[2])
      this.cloudMaterial.color.copy(this.scratch)
    }
  }

  /** World-space sun direction, shared with the choreography and landmarks. */
  get sunDirection(): Vector3 {
    return this.sunDir
  }

  /**
   * Current orientation and the size of the user's outstanding drag.
   *
   * The harness uses `dragOffset` to check both halves of the drag contract:
   * that a drag actually turns the globe, and that the offset then decays back
   * to zero so scroll regains control before the next city.
   */
  get orientation(): { x: number; y: number; dragOffset: number } {
    return {
      x: this.currentX,
      y: this.currentY,
      dragOffset: Math.hypot(this.offsetX, this.offsetY),
    }
  }

  /** The Earth mesh, for raycasting against the sphere. */
  get surface(): Mesh {
    return this.earth
  }

  dispose(): void {
    this.earth.geometry.dispose()
    this.earthMaterial.dispose()
    this.atmosphere.geometry.dispose()
    this.atmosphereMaterial.dispose()
    this.clouds?.geometry.dispose()
    this.cloudMaterial?.dispose()
  }
}
