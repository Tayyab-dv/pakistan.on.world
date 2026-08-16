/**
 * Performance tiering.
 *
 * An initial guess from device characteristics, then a one-way adaptive
 * downgrade if measured frame time stays over budget. Downgrades are permanent
 * for the session: a tier that oscillates produces visible pops in particle
 * density, which is worse than simply running at the lower tier.
 */

export type Tier = 'high' | 'mid' | 'low'

export interface TierProfile {
  readonly tier: Tier
  /** Particles per field, before per-motif scaling. */
  readonly particles: number
  /** Longest edge of a rasterised landmark texture, in pixels. */
  readonly landmarkTexture: number
  /** Which Earth texture tier to request. */
  readonly earthTexture: '4k' | '2k' | '1k'
  /** Segments per axis on the globe sphere. */
  readonly globeSegments: number
  /** Whether the separate cloud shell is rendered. */
  readonly clouds: boolean
}

const PROFILES: Record<Tier, TierProfile> = {
  high: {
    tier: 'high',
    particles: 12000,
    landmarkTexture: 2048,
    earthTexture: '4k',
    globeSegments: 96,
    clouds: true,
  },
  mid: {
    tier: 'mid',
    particles: 6000,
    landmarkTexture: 1024,
    earthTexture: '2k',
    globeSegments: 64,
    clouds: true,
  },
  low: {
    tier: 'low',
    particles: 2500,
    landmarkTexture: 512,
    earthTexture: '1k',
    globeSegments: 48,
    clouds: false,
  },
}

const ORDER: readonly Tier[] = ['high', 'mid', 'low']

export function isCoarsePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

/** Device-pixel-ratio cap. Uncapped DPR on a 3x phone is the single most
 *  expensive mistake available in a fullscreen WebGL scene. */
export function pixelRatioCap(): number {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.min(dpr, isCoarsePointer() ? 1.5 : 2)
}

function guessTier(): Tier {
  if (typeof navigator === 'undefined') return 'mid'

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency ?? 4

  if (isCoarsePointer()) {
    if ((memory !== undefined && memory <= 4) || cores <= 4) return 'low'
    return 'mid'
  }

  if ((memory !== undefined && memory <= 4) || cores <= 2) return 'low'
  if (cores <= 4) return 'mid'
  return 'high'
}

type TierListener = (profile: TierProfile) => void

/**
 * Watches frame time and steps the tier down when the budget is missed for a
 * sustained stretch. Never steps back up.
 */
export class TierMonitor {
  private index: number
  private accumulated = 0
  private frames = 0
  private readonly listeners = new Set<TierListener>()

  /** Frame-time budget in seconds; 22ms leaves headroom under a 16.7ms target. */
  private static readonly BUDGET = 0.022
  /** Frames of sustained overrun before downgrading. */
  private static readonly WINDOW = 120

  constructor(initial: Tier = guessTier()) {
    this.index = ORDER.indexOf(initial)
    if (this.index < 0) this.index = 1
  }

  get profile(): TierProfile {
    return PROFILES[ORDER[this.index]!]
  }

  onChange(listener: TierListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Call once per rendered frame with the frame's delta in seconds. */
  sample(dt: number): void {
    if (this.index >= ORDER.length - 1) return

    this.accumulated += dt
    this.frames += 1
    if (this.frames < TierMonitor.WINDOW) return

    const average = this.accumulated / this.frames
    this.accumulated = 0
    this.frames = 0

    if (average > TierMonitor.BUDGET) {
      this.index += 1
      const next = this.profile
      for (const listener of this.listeners) listener(next)
    }
  }
}

export function profileFor(tier: Tier): TierProfile {
  return PROFILES[tier]
}
