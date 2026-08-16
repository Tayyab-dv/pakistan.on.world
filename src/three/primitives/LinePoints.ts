import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Points,
  ShaderMaterial,
} from 'three'
import type { RGB } from '../../cities/themes'
import { createLineMaterial } from './materials'

/**
 * Line-and-node forms — Karachi's port cranes, Peshawar's brass lanterns,
 * Skardu's apricot branches.
 *
 * A skeleton of line segments with a glowing point at each node. All three
 * motifs are the same idea at different scales: a jointed structure whose
 * joints catch light. Generating them from a shared recursive rule keeps the
 * motion language consistent between cities without making them look alike,
 * because the branching parameters differ sharply.
 */

export type LinePointsKind = 'crane' | 'lantern' | 'branch'

export interface LinePointsOptions {
  readonly kind: LinePointsKind
  readonly count: number
  readonly span: number
  readonly depth: number
  /** Vertical scatter. Without it a row of lanterns hangs on one flat line. */
  readonly rise?: number
  readonly scale: number
  readonly seed: number
  readonly opacity: number
  readonly nodeSize: number
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

interface Skeleton {
  segments: number[]
  nodes: number[]
}

/** A gantry crane: a mast, a counterweighted jib, and hanging cables. */
function crane(random: () => number): Skeleton {
  const segments: number[] = []
  const nodes: number[] = []
  const height = 0.7 + random() * 0.5
  const jib = 0.5 + random() * 0.35
  const back = jib * 0.4

  const push = (ax: number, ay: number, bx: number, by: number) => {
    segments.push(ax, ay, 0, bx, by, 0)
  }

  push(0, 0, 0, height) // mast
  push(-back, height, jib, height) // jib
  push(0, height, jib * 0.55, height + 0.22) // stay
  push(jib * 0.55, height + 0.22, jib, height)
  push(-back, height, jib * 0.55 * -0.4, height + 0.18)

  // Hoist cable and load block.
  const hoist = jib * (0.45 + random() * 0.45)
  push(hoist, height, hoist, height - 0.3 - random() * 0.2)

  nodes.push(0, height, 0, jib, height, 0, -back, height, 0)
  nodes.push(hoist, height - 0.3 - random() * 0.2, 0)
  return { segments, nodes }
}

/** A hanging lantern: a cord, a small frame, and a bright point inside. */
function lantern(random: () => number): Skeleton {
  const segments: number[] = []
  const nodes: number[] = []
  // A short cord and a substantial body. A long thin cord above a small frame
  // reads as an aerial, not a lamp.
  const drop = 0.06 + random() * 0.12
  const size = 0.11 + random() * 0.07

  segments.push(0, 0, 0, 0, -drop, 0)

  const top = -drop
  const bottom = -drop - size * 1.7
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2
    const b = ((i + 1) / 4) * Math.PI * 2
    const ax = Math.cos(a) * size
    const az = Math.sin(a) * size
    const bx = Math.cos(b) * size
    const bz = Math.sin(b) * size
    segments.push(ax, top, az, bx, top, bz)
    segments.push(ax, bottom, az, bx, bottom, bz)
    segments.push(ax, top, az, ax, bottom, az)
  }

  // A cap and a base taper, so the frame is a lantern rather than a cube.
  segments.push(-size, top, 0, 0, top + size * 0.5, 0)
  segments.push(size, top, 0, 0, top + size * 0.5, 0)
  segments.push(-size, bottom, 0, 0, bottom - size * 0.4, 0)
  segments.push(size, bottom, 0, 0, bottom - size * 0.4, 0)

  nodes.push(0, top - size * 0.85, 0)
  return { segments, nodes }
}

/** An apricot branch: a recursive fork with buds at the tips. */
function branch(random: () => number): Skeleton {
  const segments: number[] = []
  const nodes: number[] = []

  const grow = (
    x: number,
    y: number,
    angle: number,
    length: number,
    depth: number,
  ): void => {
    const ex = x + Math.cos(angle) * length
    const ey = y + Math.sin(angle) * length
    segments.push(x, y, 0, ex, ey, 0)

    if (depth <= 0 || length < 0.04) {
      nodes.push(ex, ey, 0)
      return
    }

    const spread = 0.4 + random() * 0.45
    grow(ex, ey, angle + spread, length * (0.6 + random() * 0.2), depth - 1)
    grow(ex, ey, angle - spread * (0.6 + random() * 0.6), length * (0.55 + random() * 0.25), depth - 1)
    // Occasional third shoot, so the branching never looks strictly binary.
    if (random() > 0.62) {
      grow(ex, ey, angle + (random() - 0.5) * 0.3, length * 0.5, depth - 1)
    }
  }

  grow(0, 0, Math.PI / 2 + (random() - 0.5) * 0.6, 0.3 + random() * 0.16, 3)
  return { segments, nodes }
}

const GENERATORS: Record<LinePointsKind, (random: () => number) => Skeleton> = {
  crane,
  lantern,
  branch,
}

const NODE_VERTEX = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * uPixelRatio / max(0.001, -mvPosition.z);
  }
`

const NODE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    // A tight core with a wide soft falloff reads as a lamp rather than a dot.
    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.18, d);
    if (core <= 0.002) discard;
    gl_FragColor = vec4(uColor, (core * 0.35 + glow * 0.65) * uOpacity);
  }
`

export class LinePoints {
  readonly group = new Group()

  private readonly lineGeometry = new BufferGeometry()
  private readonly nodeGeometry = new BufferGeometry()
  private readonly lineMaterial: ShaderMaterial
  private readonly nodeMaterial: ShaderMaterial
  private readonly baseOpacity: number

  constructor(options: LinePointsOptions, pixelRatio: number) {
    const random = rng(options.seed)
    const generate = GENERATORS[options.kind]

    const segments: number[] = []
    const runs: number[] = []
    const nodes: number[] = []

    for (let i = 0; i < options.count; i += 1) {
      const skeleton = generate(random)
      const ox = (random() * 2 - 1) * options.span
      const oz = (random() * 2 - 1) * options.depth
      const oy = (random() * 2 - 1) * (options.rise ?? 0)
      const s = options.scale * (0.7 + random() * 0.6)

      for (let v = 0; v < skeleton.segments.length; v += 3) {
        segments.push(
          skeleton.segments[v]! * s + ox,
          skeleton.segments[v + 1]! * s + oy,
          skeleton.segments[v + 2]! * s + oz,
        )
        // Every segment is fully drawn; the run attribute exists so the shared
        // line material's end tapers have something to work with.
        runs.push(0.5)
      }
      for (let v = 0; v < skeleton.nodes.length; v += 3) {
        nodes.push(
          skeleton.nodes[v]! * s + ox,
          skeleton.nodes[v + 1]! * s,
          skeleton.nodes[v + 2]! * s + oz,
        )
      }
    }

    this.lineGeometry.setAttribute('position', new Float32BufferAttribute(segments, 3))
    this.lineGeometry.setAttribute('aRun', new Float32BufferAttribute(runs, 1))
    this.nodeGeometry.setAttribute('position', new Float32BufferAttribute(nodes, 3))

    this.baseOpacity = options.opacity

    this.lineMaterial = createLineMaterial()
    this.lineMaterial.uniforms.uOpacity!.value = options.opacity
    this.lineMaterial.uniforms.uHead!.value = 2
    this.lineMaterial.uniforms.uSoftness!.value = 0.1

    this.nodeMaterial = new ShaderMaterial({
      vertexShader: NODE_VERTEX,
      fragmentShader: NODE_FRAGMENT,
      uniforms: {
        uSize: { value: options.nodeSize },
        uPixelRatio: { value: pixelRatio },
        uColor: { value: new Color(1, 1, 1) },
        uOpacity: { value: options.opacity },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    const lines = new LineSegments(this.lineGeometry, this.lineMaterial)
    const points = new Points(this.nodeGeometry, this.nodeMaterial)
    lines.frustumCulled = false
    points.frustumCulled = false

    this.group.add(lines, points)
  }

  setPalette(structure: RGB, node: RGB): void {
    ;(this.lineMaterial.uniforms.uColor!.value as Color).setRGB(
      structure[0],
      structure[1],
      structure[2],
    )
    ;(this.nodeMaterial.uniforms.uColor!.value as Color).setRGB(node[0], node[1], node[2])
  }

  setOpacity(factor: number): void {
    this.lineMaterial.uniforms.uOpacity!.value = this.baseOpacity * factor
    this.nodeMaterial.uniforms.uOpacity!.value = this.baseOpacity * factor
  }

  setPixelRatio(ratio: number): void {
    this.nodeMaterial.uniforms.uPixelRatio!.value = ratio
  }

  dispose(): void {
    this.lineGeometry.dispose()
    this.nodeGeometry.dispose()
    this.lineMaterial.dispose()
    this.nodeMaterial.dispose()
  }
}
