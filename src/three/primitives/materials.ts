import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Vector3 } from 'three'
import type { RGB } from '../../cities/themes'

/**
 * Shared materials for the procedural choreography.
 *
 * Every motif is lit by the same sun uniform as the globe, so a ribbon or a
 * ridge silhouette turns with the day rather than carrying its own fixed
 * shading. The lighting model is deliberately thin — a wrapped lambert term
 * plus a rim — because these are abstract forms catching light, not surfaces
 * that need to be believed as material.
 */

export interface SurfaceUniforms {
  uSun: { value: Vector3 }
  uColor: { value: Color }
  uShadow: { value: Color }
  uRim: { value: Color }
  uOpacity: { value: number }
  uRimStrength: { value: number }
}

const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const SURFACE_FRAGMENT = /* glsl */ `
  uniform vec3 uSun;
  uniform vec3 uColor;
  uniform vec3 uShadow;
  uniform vec3 uRim;
  uniform float uOpacity;
  uniform float uRimStrength;
  uniform float uEdgeFade;

  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec2 vUv;

  void main() {
    // Two-sided: these are thin forms and the camera sees both faces as they
    // orbit, so a back face must not go black.
    vec3 normalW = normalize(vNormalW);
    if (!gl_FrontFacing) normalW = -normalW;

    vec3 viewDir = normalize(cameraPosition - vPositionW);

    // Wrapped lambert: the shadow side stays readable instead of dropping out.
    float ndl = dot(normalW, uSun) * 0.5 + 0.5;
    vec3 base = mix(uShadow, uColor, ndl * ndl);

    float fresnel = pow(1.0 - max(dot(normalW, viewDir), 0.0), 2.2);
    base += uRim * fresnel * uRimStrength;

    // Optional border falloff. A faceted plane is generated on a rectangular
    // grid, and without this its four straight edges are plainly visible — the
    // terrain reads as a card lying in space rather than as ground continuing
    // out of frame.
    float alpha = uOpacity;
    if (uEdgeFade > 0.0) {
      vec2 d = min(vUv, 1.0 - vUv);
      alpha *= smoothstep(0.0, uEdgeFade, d.x) * smoothstep(0.0, uEdgeFade, d.y);
    }

    gl_FragColor = vec4(base, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function createSurfaceMaterial(sun: Vector3): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: SURFACE_VERTEX,
    fragmentShader: SURFACE_FRAGMENT,
    uniforms: {
      uSun: { value: sun },
      uColor: { value: new Color(1, 1, 1) },
      uShadow: { value: new Color(0.05, 0.06, 0.09) },
      uRim: { value: new Color(0.6, 0.8, 1) },
      uOpacity: { value: 1 },
      uRimStrength: { value: 0.8 },
      // Off by default; only the faceted terrain needs its borders softened.
      uEdgeFade: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
}

/**
 * Additive line material with a fade along the run.
 *
 * `uFade` walks a soft window along the line's own parameterisation, which is
 * what lets ribbons and guide lines appear to draw themselves in and out
 * without any geometry changing.
 */
const LINE_VERTEX = /* glsl */ `
  attribute float aRun;
  varying float vRun;

  void main() {
    vRun = aRun;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const LINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHead;
  uniform float uSoftness;

  varying float vRun;

  void main() {
    // Visible behind the head, fading out over uSoftness.
    float visible = smoothstep(uHead, uHead - uSoftness, vRun);
    // Taper both ends so a line never terminates in a hard stub.
    visible *= smoothstep(0.0, 0.08, vRun) * smoothstep(1.0, 0.9, vRun);
    if (visible <= 0.002) discard;

    gl_FragColor = vec4(uColor, visible * uOpacity);
  }
`

export function createLineMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    uniforms: {
      uColor: { value: new Color(1, 1, 1) },
      uOpacity: { value: 0.55 },
      uHead: { value: 1 },
      uSoftness: { value: 0.35 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}

export function setColor(target: Color, rgb: RGB): Color {
  return target.setRGB(rgb[0], rgb[1], rgb[2])
}
