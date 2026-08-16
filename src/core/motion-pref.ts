/**
 * `prefers-reduced-motion` as a live, subscribable value.
 *
 * The interpretation used throughout this application: motion the user directly
 * causes is kept, motion that happens on its own is removed. Scrolling still
 * turns the globe — that is causation, not decoration, and removing it would
 * leave nothing behind. What stops is idle rotation, particle drift, shimmer,
 * pulsing glows and ribbon undulation; damping is stiffened so transitions
 * settle almost immediately; click-to-jump becomes an instant scroll.
 */

const QUERY = '(prefers-reduced-motion: reduce)'

type Listener = (reduced: boolean) => void

const listeners = new Set<Listener>()
let mql: MediaQueryList | null = null
let current = false

function handleChange(event: MediaQueryListEvent | MediaQueryList): void {
  current = event.matches
  for (const listener of listeners) listener(current)
}

function ensureInit(): void {
  if (mql || typeof window === 'undefined') return
  mql = window.matchMedia(QUERY)
  current = mql.matches
  mql.addEventListener('change', handleChange)
}

export function prefersReducedMotion(): boolean {
  ensureInit()
  return current
}

/** Subscribe to changes. Returns an unsubscribe function. */
export function onReducedMotionChange(listener: Listener): () => void {
  ensureInit()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Damping rates, in one place so the reduced-motion variant cannot drift out of
 * sync with the normal one.
 *
 * `SETTLE` is high enough that a transition completes inside a couple of frames
 * without being a hard cut, which would read as a glitch against the globe.
 */
export const LAMBDA = {
  /** Scroll progress -> rendered progress. */
  progress: 6.5,
  progressReduced: 30,
  /** Globe orientation toward the active city. */
  globe: 3.2,
  globeReduced: 30,
  /** User drag offset decaying back to zero. */
  dragDecay: 0.9,
  /** Lighting, atmosphere, and theme colour. */
  theme: 4.0,
  themeReduced: 30,
} as const

export function progressLambda(reduced: boolean): number {
  return reduced ? LAMBDA.progressReduced : LAMBDA.progress
}

export function globeLambda(reduced: boolean): number {
  return reduced ? LAMBDA.globeReduced : LAMBDA.globe
}

export function themeLambda(reduced: boolean): number {
  return reduced ? LAMBDA.themeReduced : LAMBDA.theme
}
