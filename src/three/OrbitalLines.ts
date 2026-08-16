import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Line,
  type ShaderMaterial,
  Vector3,
} from 'three'
import type { RGB } from '../cities/themes'
import { GLOBE_RADIUS } from './Camera'
import { createLineMaterial } from './primitives/materials'

/**
 * Atmospheric orbital guide lines.
 *
 * These live in the *rear* scene, together with the Earth, and that placement
 * is the whole point: with the globe in the same scene writing depth, the far
 * half of each arc is correctly hidden by the sphere and only the near half is
 * drawn. Put the same lines in the transparent front canvas and they would be
 * composited over the entire Earth, painting across its surface — which is the
 * failure the brief calls out.
 *
 * The arcs are partial rather than closed loops. A closed loop needs its fade
 * to wrap, which always leaves a visible seam; an arc simply tapers to nothing
 * at both ends.
 */

interface ArcSpec {
  readonly radius: number
  /** Inclination of the arc's plane, radians. */
  readonly tilt: number
  /** Rotation of the plane about Y, radians. */
  readonly yaw: number
  /** Angular extent, radians. */
  readonly sweep: number
  readonly start: number
  /** Radians per second. Signed, so arcs counter-rotate. */
  readonly speed: number
  readonly opacity: number
}

const ARCS: readonly ArcSpec[] = [
  { radius: 1.26, tilt: 0.42, yaw: 0.0, sweep: 4.9, start: 0.2, speed: 0.021, opacity: 0.5 },
  { radius: 1.44, tilt: -0.28, yaw: 1.1, sweep: 4.2, start: 2.1, speed: -0.014, opacity: 0.36 },
  { radius: 1.62, tilt: 0.66, yaw: 2.4, sweep: 3.6, start: 4.0, speed: 0.009, opacity: 0.26 },
]

const SEGMENTS = 220

function buildArc(spec: ArcSpec): BufferGeometry {
  const positions: number[] = []
  const runs: number[] = []

  const point = new Vector3()

  for (let i = 0; i <= SEGMENTS; i += 1) {
    const t = i / SEGMENTS
    const angle = spec.start + t * spec.sweep

    point.set(Math.cos(angle) * spec.radius, 0, Math.sin(angle) * spec.radius)
    // Tilt about X, then yaw about Y.
    point.applyAxisAngle(_x, spec.tilt)
    point.applyAxisAngle(_y, spec.yaw)

    positions.push(point.x, point.y, point.z)
    runs.push(t)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aRun', new Float32BufferAttribute(runs, 1))
  return geometry
}

const _x = new Vector3(1, 0, 0)
const _y = new Vector3(0, 1, 0)

export class OrbitalLines {
  readonly group = new Group()

  private readonly lines: Line[] = []
  private readonly materials: ShaderMaterial[] = []
  private readonly geometries: BufferGeometry[] = []
  private readonly speeds: number[] = []
  private readonly opacities: number[] = []

  constructor() {
    for (const spec of ARCS) {
      const geometry = buildArc(spec)
      const material = createLineMaterial()
      material.uniforms.uOpacity!.value = spec.opacity
      // Fully drawn: the head fade is not used here, only the end tapers.
      material.uniforms.uHead!.value = 1.2
      material.uniforms.uSoftness!.value = 0.4

      // Depth testing against the Earth is what makes the far half disappear.
      material.depthTest = true

      const line = new Line(geometry, material)
      line.frustumCulled = false

      this.geometries.push(geometry)
      this.materials.push(material)
      this.lines.push(line)
      this.speeds.push(spec.speed)
      this.opacities.push(spec.opacity)
      this.group.add(line)
    }

    // Sit just outside the sphere so the arcs read as orbits rather than as
    // markings on the surface.
    this.group.scale.setScalar(GLOBE_RADIUS)
  }

  /**
   * Rotate continuously and subtly.
   *
   * Delta-time driven, so the drift rate is identical at 60 and 144 Hz — the
   * brief asks specifically for no stepping and no blunt rotation increments.
   */
  update(dt: number, colour: RGB, intensity: number, reduced: boolean): void {
    for (let i = 0; i < this.lines.length; i += 1) {
      if (!reduced) this.lines[i]!.rotation.y += this.speeds[i]! * dt
      const material = this.materials[i]!
      ;(material.uniforms.uColor!.value as Color).setRGB(colour[0], colour[1], colour[2])
      material.uniforms.uOpacity!.value = this.opacities[i]! * intensity
    }
  }

  dispose(): void {
    for (const geometry of this.geometries) geometry.dispose()
    for (const material of this.materials) material.dispose()
  }
}
