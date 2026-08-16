import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  Path,
  type ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three'
import type { RGB } from '../../cities/themes'
import { createSurfaceMaterial } from './materials'

/**
 * Pierced screens — Lahore's marble jaali and Peshawar's carved wood.
 *
 * A solid panel with an array of holes cut through it, rather than a grid of
 * lines. The distinction matters: light passing through a screen is the whole
 * point of a jaali, and only a real panel with real openings gives you the
 * alternation of solid and void that reads as one.
 *
 * Panels are generated as fragments — a screen broken into pieces drifting
 * apart — because the brief asks for lattice *fragments*, not an intact wall.
 */

export type LatticeMotifKind = 'star' | 'ogee'

export interface LatticeOptions {
  readonly pattern: LatticeMotifKind
  /** Number of separate panel fragments. */
  readonly fragments: number
  /** Openings across and down within one fragment. */
  readonly columns: number
  readonly rows: number
  /** Size of one fragment, in globe radii. */
  readonly size: number
  /** How far fragments scatter from the group origin. */
  readonly scatter: number
  readonly seed: number
  readonly opacity: number
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

/** An eight-pointed star — the girih figure at the heart of most jaali work. */
function starHole(cx: number, cy: number, radius: number): Path {
  const path = new Path()
  const points = 8
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? radius : radius * 0.46
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  }
  path.closePath()
  return path
}

/** A pointed arch opening, as found in carved wooden screens. */
function ogeeHole(cx: number, cy: number, radius: number): Path {
  const path = new Path()
  const w = radius * 0.62
  const h = radius
  path.moveTo(cx - w, cy - h * 0.7)
  path.lineTo(cx - w, cy + h * 0.1)
  path.quadraticCurveTo(cx - w, cy + h * 0.75, cx, cy + h)
  path.quadraticCurveTo(cx + w, cy + h * 0.75, cx + w, cy + h * 0.1)
  path.lineTo(cx + w, cy - h * 0.7)
  path.closePath()
  return path
}

export class Lattice {
  readonly group = new Group()
  private readonly material: ShaderMaterial
  private readonly geometries: BufferGeometry[] = []
  private readonly baseOpacity: number

  constructor(options: LatticeOptions, sun: Vector3) {
    const random = rng(options.seed)
    const cut = options.pattern === 'star' ? starHole : ogeeHole

    this.baseOpacity = options.opacity
    this.material = createSurfaceMaterial(sun)
    this.material.uniforms.uRimStrength!.value = 1.4

    for (let f = 0; f < options.fragments; f += 1) {
      const { columns, rows, size } = options
      const shape = new Shape()
      shape.moveTo(-size / 2, -size / 2)
      shape.lineTo(size / 2, -size / 2)
      shape.lineTo(size / 2, size / 2)
      shape.lineTo(-size / 2, size / 2)
      shape.closePath()

      const cellW = size / columns
      const cellH = size / rows
      // Generous openings with thin webs between them. A screen has to be
      // mostly void — tighten this much below 0.45 and the panel stops reading
      // as pierced stonework and starts reading as a perforated plate.
      const radius = Math.min(cellW, cellH) * 0.47

      for (let c = 0; c < columns; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const cx = -size / 2 + cellW * (c + 0.5)
          const cy = -size / 2 + cellH * (r + 0.5)
          shape.holes.push(cut(cx, cy, radius))
        }
      }

      const geometry = new ShapeGeometry(shape, 6)
      const count = geometry.getAttribute('position').count
      const normals = new Float32Array(count * 3)
      for (let n = 0; n < count; n += 1) normals[n * 3 + 2] = 1
      geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))

      const mesh = new Mesh(geometry, this.material)
      mesh.position.set(
        (random() * 2 - 1) * options.scatter,
        (random() * 2 - 1) * options.scatter * 0.7,
        (random() * 2 - 1) * options.scatter,
      )
      mesh.rotation.set(
        (random() - 0.5) * 0.7,
        (random() - 0.5) * 1.4,
        (random() - 0.5) * 0.4,
      )
      mesh.scale.setScalar(0.6 + random() * 0.8)

      this.geometries.push(geometry)
      this.group.add(mesh)
    }

    this.group.frustumCulled = false
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
    for (const geometry of this.geometries) geometry.dispose()
    this.material.dispose()
  }
}
