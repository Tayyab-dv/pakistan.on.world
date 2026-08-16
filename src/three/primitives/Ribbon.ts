import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  type ShaderMaterial,
  Vector3,
} from 'three'
import type { RGB } from '../../cities/themes'
import { createSurfaceMaterial } from './materials'

/**
 * Ribbons — ridge lines, coastal waves, marble inlay, dune flow, dhow wake.
 *
 * A ribbon is a strip swept along a procedurally generated curve: a smooth
 * low-frequency path with a couple of harmonics on top, tapered to nothing at
 * both ends. Built once as static geometry and animated only by transforming
 * its parent, so a long ribbon costs a single draw call and no per-frame vertex
 * work.
 */

export interface RibbonOptions {
  /** Samples along the curve. More is smoother and costs almost nothing. */
  readonly segments: number
  /** Overall length in globe radii. */
  readonly length: number
  /** Strip width at its widest. */
  readonly width: number
  /** Amplitude of the primary undulation. */
  readonly amplitude: number
  /** How many full waves fit along the length. */
  readonly frequency: number
  /** Lateral (Z) wander, which keeps the ribbon from reading as flat. */
  readonly depth: number
  /** Random seed so two ribbons in one city are never identical. */
  readonly seed: number
  readonly opacity: number
  readonly rimStrength?: number
}

function curvePoint(options: RibbonOptions, t: number): Vector3 {
  const { length, amplitude, frequency, depth, seed } = options
  const phase = seed * 6.283

  const x = (t - 0.5) * length
  const y =
    Math.sin(t * Math.PI * 2 * frequency + phase) * amplitude +
    Math.sin(t * Math.PI * 2 * frequency * 2.37 + phase * 1.7) * amplitude * 0.34
  const z =
    Math.cos(t * Math.PI * 2 * frequency * 0.73 + phase * 0.6) * depth +
    Math.sin(t * Math.PI * 2 * frequency * 1.91 + phase * 2.3) * depth * 0.28

  return new Vector3(x, y, z)
}

export class Ribbon {
  readonly mesh: Mesh
  private readonly geometry: BufferGeometry
  private readonly material: ShaderMaterial
  private readonly baseOpacity: number

  constructor(options: RibbonOptions, sun: Vector3) {
    const { segments, width } = options

    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    const previous = new Vector3()
    const current = new Vector3()
    const tangent = new Vector3()
    const side = new Vector3()
    const normal = new Vector3()
    const up = new Vector3(0, 0, 1)

    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments
      current.copy(curvePoint(options, t))

      // Forward difference for the tangent; the last sample reuses the previous.
      if (i < segments) {
        tangent.copy(curvePoint(options, (i + 1) / segments)).sub(current).normalize()
      } else {
        tangent.copy(current).sub(previous).normalize()
      }

      side.crossVectors(tangent, up).normalize()
      normal.crossVectors(side, tangent).normalize()

      // Taper to nothing at both ends: a ribbon that stops abruptly reads as
      // clipped geometry rather than as a stroke of light.
      const taper = Math.sin(t * Math.PI) ** 0.6
      const halfWidth = (width * taper) / 2

      positions.push(
        current.x + side.x * halfWidth,
        current.y + side.y * halfWidth,
        current.z + side.z * halfWidth,
        current.x - side.x * halfWidth,
        current.y - side.y * halfWidth,
        current.z - side.z * halfWidth,
      )
      normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
      uvs.push(t, 0, t, 1)

      if (i < segments) {
        const a = i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }

      previous.copy(current)
    }

    this.geometry = new BufferGeometry()
    this.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    this.geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
    this.geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
    this.geometry.setIndex(indices)

    this.baseOpacity = options.opacity
    this.material = createSurfaceMaterial(sun)
    this.material.uniforms.uRimStrength!.value = options.rimStrength ?? 1.1

    this.mesh = new Mesh(this.geometry, this.material)
    this.mesh.frustumCulled = false
  }

  setPalette(colour: RGB, shadow: RGB, rim: RGB): void {
    const u = this.material.uniforms
    ;(u.uColor!.value as Color).setRGB(colour[0], colour[1], colour[2])
    ;(u.uShadow!.value as Color).setRGB(shadow[0], shadow[1], shadow[2])
    ;(u.uRim!.value as Color).setRGB(rim[0], rim[1], rim[2])
  }

  setOpacity(factor: number): void {
    this.material.uniforms.uOpacity!.value = this.baseOpacity * factor
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
