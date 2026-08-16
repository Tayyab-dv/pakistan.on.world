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
 * Faceted planes — Lahore's sandstone, Gwadar's wind-carved cliffs, Skardu's
 * glacial-lake surface.
 *
 * A displaced grid with flat shading: each triangle keeps its own normal, so
 * the surface catches the sun as a mosaic of discrete planes rather than a
 * smooth sheet. Flat shading is the whole effect — smoothed normals turn the
 * same geometry into an unremarkable rippled plane.
 */

export interface FacetsOptions {
  /** Grid divisions. Low numbers give large, legible planes. */
  readonly divisions: number
  readonly width: number
  readonly height: number
  /** Vertical displacement amplitude. */
  readonly relief: number
  /**
   * Bias toward horizontal (0) or jagged (1).
   * A glacial lake wants ~0.15; a cliff face wants ~0.8.
   */
  readonly roughness: number
  readonly seed: number
  readonly opacity: number
  readonly rimStrength?: number
}

function rng(seed: number): () => number {
  let state = Math.floor(seed * 2 ** 31) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

export class Facets {
  readonly mesh: Mesh
  private readonly geometry = new BufferGeometry()
  private readonly material: ShaderMaterial
  private readonly baseOpacity: number

  constructor(options: FacetsOptions, sun: Vector3) {
    const { divisions, width, height, relief, roughness } = options
    const random = rng(options.seed)

    // Height field first, so adjacent triangles share corner displacements and
    // the surface stays continuous even though its shading is faceted.
    const field: number[][] = []
    for (let r = 0; r <= divisions; r += 1) {
      const row: number[] = []
      for (let c = 0; c <= divisions; c += 1) {
        const u = c / divisions
        const v = r / divisions
        // A smooth base swell plus scattered sharp displacement.
        const swell = Math.sin(u * Math.PI * 1.7) * Math.cos(v * Math.PI * 1.3) * 0.5
        const jagged = (random() - 0.5) * 2
        row.push((swell * (1 - roughness) + jagged * roughness) * relief)
      }
      field.push(row)
    }

    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []

    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()
    const ab = new Vector3()
    const ac = new Vector3()
    const normal = new Vector3()

    const vertexAt = (col: number, row: number, out: Vector3): Vector3 =>
      out.set(
        (col / divisions - 0.5) * width,
        field[row]![col]!,
        (row / divisions - 0.5) * height,
      )

    const emit = (p: Vector3, n: Vector3, col: number, row: number) => {
      positions.push(p.x, p.y, p.z)
      normals.push(n.x, n.y, n.z)
      uvs.push(col / divisions, row / divisions)
    }

    for (let r = 0; r < divisions; r += 1) {
      for (let col = 0; col < divisions; col += 1) {
        for (const [p, q, s] of [
          [
            [col, r],
            [col + 1, r],
            [col, r + 1],
          ],
          [
            [col + 1, r],
            [col + 1, r + 1],
            [col, r + 1],
          ],
        ] as Array<[number[], number[], number[]]>) {
          vertexAt(p[0]!, p[1]!, a)
          vertexAt(q[0]!, q[1]!, b)
          vertexAt(s[0]!, s[1]!, c)

          // One normal per triangle — this is what makes the facets read.
          ab.subVectors(b, a)
          ac.subVectors(c, a)
          normal.crossVectors(ab, ac).normalize()

          emit(a, normal, p[0]!, p[1]!)
          emit(b, normal, q[0]!, q[1]!)
          emit(c, normal, s[0]!, s[1]!)
        }
      }
    }

    this.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    this.geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
    this.geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))

    this.baseOpacity = options.opacity
    this.material = createSurfaceMaterial(sun)
    this.material.uniforms.uRimStrength!.value = options.rimStrength ?? 0.9
    // Dissolve the grid's rectangular border so the terrain reads as ground
    // continuing out of frame rather than as a card floating in space.
    this.material.uniforms.uEdgeFade!.value = 0.28

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
