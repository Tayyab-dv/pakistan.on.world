/**
 * The solar course: a single quadratic Bézier that every element of the
 * navigation is derived from.
 *
 * Nothing here is hardcoded to a pixel position. City dots, the travelling sun,
 * the sunrise and sunset glyphs and the glow on the travelled arc are all
 * evaluated from the same curve, so they sit exactly on it at any viewport.
 */

export const VIEWBOX_WIDTH = 1000
export const VIEWBOX_HEIGHT = 126

/** M 52 106 Q 500 -76 948 106 */
export const P0 = { x: 52, y: 106 } as const
export const P1 = { x: 500, y: -76 } as const
export const P2 = { x: 948, y: 106 } as const

export const PATH_D = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`

export interface Point {
  x: number
  y: number
}

/** B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2 */
export function pointAt(t: number): Point {
  const u = 1 - t
  const a = u * u
  const b = 2 * u * t
  const c = t * t
  return {
    x: a * P0.x + b * P1.x + c * P2.x,
    y: a * P0.y + b * P1.y + c * P2.y,
  }
}

/** B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1). Used to orient glyphs along the curve. */
export function tangentAt(t: number): Point {
  const u = 1 - t
  return {
    x: 2 * u * (P1.x - P0.x) + 2 * t * (P2.x - P1.x),
    y: 2 * u * (P1.y - P0.y) + 2 * t * (P2.y - P1.y),
  }
}

/** Angle of the curve at `t`, in degrees, for SVG `rotate()`. */
export function angleAt(t: number): number {
  const d = tangentAt(t)
  return (Math.atan2(d.y, d.x) * 180) / Math.PI
}

/* -----------------------------------------------------------------------------
   Arc-length lookup.

   The travelled-arc glow is drawn with stroke-dasharray, which works in arc
   length, while progress is expressed in the curve's parameter t. Those are not
   the same quantity — this curve is far steeper near its ends than at its apex,
   so using t directly makes the glow visibly lead and then lag the sun. A small
   cumulative-length table fixes it.
   -------------------------------------------------------------------------- */

const SAMPLES = 256
const lut: number[] = new Array<number>(SAMPLES + 1)

;(function buildLUT() {
  let total = 0
  let prev = pointAt(0)
  lut[0] = 0
  for (let i = 1; i <= SAMPLES; i += 1) {
    const p = pointAt(i / SAMPLES)
    total += Math.hypot(p.x - prev.x, p.y - prev.y)
    lut[i] = total
    prev = p
  }
})()

/** Total arc length of the curve in viewBox units. */
export const TOTAL_LENGTH = lut[SAMPLES]!

/** Arc length from the start of the curve to parameter `t`. */
export function lengthAt(t: number): number {
  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t
  const scaled = clamped * SAMPLES
  const i = Math.floor(scaled)
  if (i >= SAMPLES) return TOTAL_LENGTH
  const frac = scaled - i
  return lut[i]! + (lut[i + 1]! - lut[i]!) * frac
}
