import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  type ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three'
import type { RGB } from '../../cities/themes'
import { createSurfaceMaterial } from './materials'

/**
 * Parametric silhouettes — pine and poplar stands, palms, bazaar archways,
 * Karakoram ridge lines.
 *
 * Every shape is generated from a handful of numbers rather than authored, so a
 * stand of trees is never a repeated stamp: each instance gets its own
 * proportions from the seeded generator. These stay procedural even in cities
 * that gained a landmark, because they are atmosphere rather than architecture.
 */

export type SilhouetteKind = 'pine' | 'poplar' | 'palm' | 'arch' | 'ridge'

export interface SilhouetteOptions {
  readonly kind: SilhouetteKind
  readonly count: number
  /** Horizontal span the instances are distributed across, in globe radii. */
  readonly span: number
  /** Depth spread, so the stand has parallax rather than sitting on one plane. */
  readonly depth: number
  readonly minHeight: number
  readonly maxHeight: number
  readonly seed: number
  readonly opacity: number
}

/** Deterministic per-instance randomness, so a reload gives the same stand. */
function rng(seed: number): () => number {
  let state = Math.floor(seed * 2 ** 31) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

function pineShape(random: () => number): Shape {
  const shape = new Shape()
  const tiers = 3 + Math.floor(random() * 3)
  const trunk = 0.055 + random() * 0.03

  shape.moveTo(-trunk, 0)
  shape.lineTo(-trunk, 0.18)

  // Left side: stepped skirts, each narrower and higher than the last.
  for (let i = 0; i < tiers; i += 1) {
    const t = i / tiers
    const width = (0.42 - t * 0.3) * (0.85 + random() * 0.3)
    const base = 0.18 + t * ((1 - 0.18) / tiers)
    const top = 0.18 + (t + 1) * ((1 - 0.18) / tiers)
    shape.lineTo(-width, base)
    shape.lineTo(-width * 0.42, top - 0.02)
  }

  shape.lineTo(0, 1)

  for (let i = tiers - 1; i >= 0; i -= 1) {
    const t = i / tiers
    const width = (0.42 - t * 0.3) * (0.85 + random() * 0.3)
    const base = 0.18 + t * ((1 - 0.18) / tiers)
    const top = 0.18 + (t + 1) * ((1 - 0.18) / tiers)
    shape.lineTo(width * 0.42, top - 0.02)
    shape.lineTo(width, base)
  }

  shape.lineTo(trunk, 0.18)
  shape.lineTo(trunk, 0)
  shape.closePath()
  return shape
}

function poplarShape(random: () => number): Shape {
  // Tall, narrow, slightly asymmetric — the Skardu valley silhouette.
  const shape = new Shape()
  const width = 0.1 + random() * 0.05
  const lean = (random() - 0.5) * 0.06

  shape.moveTo(-0.02, 0)
  shape.lineTo(-width * 0.5, 0.14)
  shape.quadraticCurveTo(-width, 0.55, lean - width * 0.25, 1)
  shape.quadraticCurveTo(lean + width * 0.3, 0.6, width * 0.5, 0.14)
  shape.lineTo(0.02, 0)
  shape.closePath()
  return shape
}

function palmShape(random: () => number): Shape {
  const shape = new Shape()
  const lean = (random() - 0.5) * 0.28
  const trunk = 0.03

  shape.moveTo(-trunk, 0)
  shape.quadraticCurveTo(lean * 0.4 - trunk, 0.5, lean - trunk, 0.72)

  // Fronds: a fan of tapered arcs from the crown.
  const fronds = 5 + Math.floor(random() * 3)
  for (let i = 0; i < fronds; i += 1) {
    const t = i / (fronds - 1)
    const angle = Math.PI * (0.12 + t * 0.76)
    const reach = 0.26 + random() * 0.16
    const tipX = lean + Math.cos(angle) * reach
    const tipY = 0.72 + Math.sin(angle) * reach * 0.7
    shape.quadraticCurveTo(lean + Math.cos(angle) * reach * 0.5, tipY + 0.06, tipX, tipY)
    shape.quadraticCurveTo(lean + Math.cos(angle) * reach * 0.45, tipY - 0.03, lean, 0.74)
  }

  shape.quadraticCurveTo(lean * 0.4 + trunk, 0.5, trunk, 0)
  shape.closePath()
  return shape
}

function archShape(random: () => number): Shape {
  // A pointed bazaar archway: pier, pier, and the ogee between them.
  const shape = new Shape()
  const width = 0.34 + random() * 0.12
  const pier = width * 0.26
  const spring = 0.42 + random() * 0.1

  shape.moveTo(-width, 0)
  shape.lineTo(-width, 1)
  shape.lineTo(width, 1)
  shape.lineTo(width, 0)
  shape.lineTo(width - pier, 0)
  shape.lineTo(width - pier, spring)
  shape.quadraticCurveTo(width - pier, 0.9, 0, 0.94)
  shape.quadraticCurveTo(-(width - pier), 0.9, -(width - pier), spring)
  shape.lineTo(-(width - pier), 0)
  shape.closePath()
  return shape
}

function ridgeShape(random: () => number): Shape {
  // A jagged skyline: a run of peaks of falling height with a flat base.
  const shape = new Shape()
  const peaks = 3 + Math.floor(random() * 3)
  const width = 0.9

  shape.moveTo(-width, 0)

  let x = -width
  for (let i = 0; i < peaks; i += 1) {
    const step = (width * 2) / peaks
    const height = 0.45 + random() * 0.55
    const skew = (random() - 0.5) * step * 0.4
    shape.lineTo(x + step * 0.5 + skew, height)
    x += step
    shape.lineTo(x, height * (0.2 + random() * 0.3))
  }

  shape.lineTo(width, 0)
  shape.closePath()
  return shape
}

const GENERATORS: Record<SilhouetteKind, (random: () => number) => Shape> = {
  pine: pineShape,
  poplar: poplarShape,
  palm: palmShape,
  arch: archShape,
  ridge: ridgeShape,
}

export class Silhouette {
  readonly group = new Group()
  private readonly material: ShaderMaterial
  private readonly geometries: BufferGeometry[] = []
  private readonly baseOpacity: number

  constructor(options: SilhouetteOptions, sun: Vector3) {
    const random = rng(options.seed)
    const generate = GENERATORS[options.kind]

    this.baseOpacity = options.opacity
    this.material = createSurfaceMaterial(sun)
    this.material.uniforms.uRimStrength!.value = 0.55

    for (let i = 0; i < options.count; i += 1) {
      const shape = generate(random)
      const geometry = new ShapeGeometry(shape, 8)

      // ShapeGeometry has no normals worth speaking of; a flat +Z normal is
      // correct for a shape in the XY plane and lets the surface shader work.
      const count = geometry.getAttribute('position').count
      const normals = new Float32Array(count * 3)
      for (let n = 0; n < count; n += 1) normals[n * 3 + 2] = 1
      geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))

      const mesh = new Mesh(geometry, this.material)
      const height =
        options.minHeight + random() * (options.maxHeight - options.minHeight)

      mesh.scale.setScalar(height)
      mesh.position.set(
        (random() * 2 - 1) * options.span,
        0,
        (random() * 2 - 1) * options.depth,
      )
      // A little yaw keeps the stand from reading as a flat cardboard row.
      mesh.rotation.y = (random() - 0.5) * 0.5

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
