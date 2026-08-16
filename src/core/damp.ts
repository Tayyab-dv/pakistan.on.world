/**
 * Frame-rate-independent damping and the easing helpers built on it.
 *
 * Every smoothed value in the application goes through `damp`. The naive
 * `cur += (target - cur) * 0.1` form is frame-*count* based: it converges twice
 * as fast at 120fps as at 60fps, which is exactly the stutter the brief rules
 * out. The exponential form below converges at the same rate in wall-clock time
 * regardless of frame rate.
 */

/** Largest delta we will integrate in one step (~30fps). */
export const MAX_DT = 1 / 30

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

export function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function invLerp(a: number, b: number, v: number): number {
  return a === b ? 0 : clamp01((v - a) / (b - a))
}

/** Hermite smoothstep between two edges. */
export function smoothstep(edge0: number, edge1: number, v: number): number {
  const t = invLerp(edge0, edge1, v)
  return t * t * (3 - 2 * t)
}

/** Smootherstep — zero first *and* second derivative at both ends. */
export function smootherstep(edge0: number, edge1: number, v: number): number {
  const t = invLerp(edge0, edge1, v)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/**
 * Exponential damping toward a target.
 *
 * `lambda` is a rate, not a fraction: higher converges faster. Useful range is
 * roughly 1 (very heavy) to 30 (near-instant, which is what reduced-motion uses).
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(target, current, Math.exp(-lambda * dt))
}

/**
 * Damping for angles in radians, taking the shortest way round.
 *
 * Without the wrap, dragging the globe past ±180° makes it spin the long way
 * back when auto-recentering takes over.
 */
export function dampAngle(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  return current + shortestAngle(current, target) * (1 - Math.exp(-lambda * dt))
}

/** Signed shortest angular distance from `a` to `b`, in radians. */
export function shortestAngle(a: number, b: number): number {
  const TAU = Math.PI * 2
  let d = (b - a) % TAU
  if (d > Math.PI) d -= TAU
  if (d < -Math.PI) d += TAU
  return d
}

export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI
