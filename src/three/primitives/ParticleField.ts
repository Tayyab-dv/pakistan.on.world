import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { RGB } from '../../cities/themes'

/**
 * Particle fields — blossom, heat shimmer, sea spray, autumn leaf, dust motes,
 * dune sand, poplar gold, first snow.
 *
 * All motion happens in the vertex shader against a single uniform clock, so
 * twelve thousand particles cost one draw call and no per-frame CPU work. The
 * clock is advanced by delta time and simply stops under reduced motion, which
 * freezes the field in place without any separate code path.
 */

export type ParticleBehaviour = 'fall' | 'rise' | 'drift' | 'shimmer'

export interface ParticleFieldOptions {
  readonly count: number
  readonly behaviour: ParticleBehaviour
  /** Half-extents of the emission volume, in globe radii. */
  readonly spread: Vector3
  /** Metres per second, roughly, in globe radii. */
  readonly speed: number
  /** Lateral wander amplitude. */
  readonly swirl: number
  /** Point size in pixels at unit distance. */
  readonly size: number
  readonly opacity: number
  /** Additive reads as light (embers, shimmer); normal reads as matter (snow, leaves). */
  readonly additive: boolean
  /** Elongate along Y — leaves and petals rather than dots. */
  readonly stretch?: number
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uSwirl;
  uniform float uRate;
  uniform float uPixelRatio;
  uniform vec3 uSpread;
  uniform int uBehaviour;

  attribute float aSeed;
  attribute float aScale;

  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Per-particle time offset: without it the whole field pulses in unison.
    float t = uTime * (0.55 + aSeed * 0.9);

    if (uBehaviour == 0) {
      pos.y -= t * uSpeed;                       // fall
    } else if (uBehaviour == 1) {
      pos.y += t * uSpeed;                       // rise
    } else if (uBehaviour == 2) {
      pos.x += t * uSpeed * 0.6;                 // drift
      pos.y += sin(t * 0.4 + aSeed * 12.0) * uSwirl * 0.5;
    } else {
      // shimmer: no net travel, only agitation
      pos.y += sin(t * 3.1 + aSeed * 21.0) * uSwirl * 0.35;
    }

    pos.x += sin(t * 0.7 + aSeed * 31.4) * uSwirl;
    pos.z += cos(t * 0.53 + aSeed * 17.2) * uSwirl * 0.7;

    // Wrap inside the emission volume so the field never runs dry.
    pos = mod(pos + uSpread, 2.0 * uSpread) - uSpread;

    // uRate thins the field rather than resizing the buffer: particles above
    // the threshold are pushed to zero size and cost nothing to rasterise.
    vAlpha = step(aSeed, uRate);
    // Soften at the volume's vertical edges so nothing pops in or out.
    vAlpha *= smoothstep(uSpread.y, uSpread.y * 0.72, abs(pos.y));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * aScale * uPixelRatio / max(0.001, -mvPosition.z);
  }
`

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uStretch;

  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;

    vec2 uv = gl_PointCoord - 0.5;
    uv.y /= uStretch;

    float d = length(uv);
    // Soft-edged disc; a hard circle reads as a rendering artefact at this size.
    float mask = smoothstep(0.5, 0.06, d);
    if (mask <= 0.002) discard;

    gl_FragColor = vec4(uColor, mask * uOpacity * vAlpha);
  }
`

const BEHAVIOUR_INDEX: Record<ParticleBehaviour, number> = {
  fall: 0,
  rise: 1,
  drift: 2,
  shimmer: 3,
}

export class ParticleField {
  readonly points: Points
  private readonly material: ShaderMaterial
  private readonly geometry: BufferGeometry
  private readonly baseOpacity: number
  private time = 0

  constructor(options: ParticleFieldOptions, pixelRatio: number) {
    const { count, spread } = options

    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() * 2 - 1) * spread.x
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * spread.y
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * spread.z
      seeds[i] = Math.random()
      // Biased small: a few large particles read as depth, many large ones
      // read as noise.
      scales[i] = 0.45 + Math.random() ** 2.2 * 1.15
    }

    this.geometry = new BufferGeometry()
    this.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    this.geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
    this.geometry.setAttribute('aScale', new Float32BufferAttribute(scales, 1))

    this.baseOpacity = options.opacity

    this.material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: options.size },
        uSpeed: { value: options.speed },
        uSwirl: { value: options.swirl },
        uRate: { value: 1 },
        uPixelRatio: { value: pixelRatio },
        uSpread: { value: spread.clone() },
        uBehaviour: { value: BEHAVIOUR_INDEX[options.behaviour] },
        uColor: { value: new Color(1, 1, 1) },
        uOpacity: { value: options.opacity },
        uStretch: { value: options.stretch ?? 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: options.additive ? AdditiveBlending : NormalBlending,
    })

    this.points = new Points(this.geometry, this.material)
    this.points.frustumCulled = false
  }

  /**
   * @param rate 0..1 emission density from the keyframe.
   * @param reduced When true the clock stops: the field holds a still pose
   *                rather than vanishing, which keeps the composition intact.
   */
  update(dt: number, rate: number, colour: RGB, reduced: boolean): void {
    if (!reduced) this.time += dt

    const u = this.material.uniforms
    u.uTime!.value = this.time
    u.uRate!.value = rate
    u.uOpacity!.value = this.baseOpacity * rate
    ;(u.uColor!.value as Color).setRGB(colour[0], colour[1], colour[2])
  }

  setPixelRatio(ratio: number): void {
    this.material.uniforms.uPixelRatio!.value = ratio
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
