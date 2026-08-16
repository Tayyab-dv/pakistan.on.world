/**
 * The six cities, in journey order, and the arithmetic that maps scroll
 * progress onto them.
 *
 * Progress is a single continuous float in [0, MAX_STATE]. Everything else in
 * the application — camera, globe orientation, choreography, landmark orbits,
 * copy opacity, the solar stepper — is a pure function of that one number.
 */

export interface City {
  readonly id: CityId
  readonly name: string
  /** Revealed on hover / keyboard focus in the solar stepper. */
  readonly season: string
  /** The single editorial sentence shown in the lower-left. */
  readonly copy: string
  /** Real geographic coordinates, degrees. */
  readonly lat: number
  readonly lon: number
  /**
   * Position along the solar Bézier, 0..1.
   *
   * The source brief listed five values for six cities. The three that carry
   * meaning are preserved exactly — Islamabad at sunrise, Lahore at the 0.5
   * apex where the full radiant sun belongs, Skardu at the far end — and the
   * remainder are distributed so Gwadar lands on the descending arc.
   */
  readonly solarT: number
}

export type CityId =
  | 'islamabad'
  | 'karachi'
  | 'lahore'
  | 'peshawar'
  | 'gwadar'
  | 'skardu'

/** Scroll states per city. Their choreographic roles are fixed; see keyframes.ts. */
export const STATES_PER_CITY = 5

export const CITIES: readonly City[] = [
  {
    id: 'islamabad',
    name: 'Islamabad',
    season: 'Spring',
    copy: 'A green capital wakes slowly under morning hills.',
    lat: 33.6844,
    lon: 73.0479,
    solarT: 0.015,
  },
  {
    id: 'karachi',
    name: 'Karachi',
    season: 'Summer',
    copy: "Pakistan's coastal heart — sea air, heat, and constant motion.",
    lat: 24.8607,
    lon: 67.0011,
    solarT: 0.25,
  },
  {
    id: 'lahore',
    name: 'Lahore',
    season: 'Autumn',
    copy: 'Midday sun on red sandstone, in a city built on centuries.',
    lat: 31.5204,
    lon: 74.3587,
    solarT: 0.5,
  },
  {
    id: 'peshawar',
    name: 'Peshawar',
    season: 'Winter',
    copy: 'One of the oldest cities in South Asia, still trading at its old bazaars.',
    lat: 34.0151,
    lon: 71.5249,
    solarT: 0.68,
  },
  {
    id: 'gwadar',
    name: 'Gwadar',
    season: 'Deep Winter',
    copy: 'A fishing port on the Arabian Sea, lit by a deep winter sunset.',
    lat: 25.1264,
    lon: 62.3225,
    solarT: 0.86,
  },
  {
    id: 'skardu',
    name: 'Skardu',
    season: 'Late Autumn',
    copy: 'Mountains and glacial lakes, where autumn gold meets early snow.',
    lat: 35.2971,
    lon: 75.6333,
    solarT: 0.985,
  },
] as const

export const CITY_COUNT = CITIES.length

/** Total discrete states across the journey (30). */
export const TOTAL_STATES = CITY_COUNT * STATES_PER_CITY

/** Highest reachable progress value (29). Progress is clamped to [0, MAX_STATE]. */
export const MAX_STATE = TOTAL_STATES - 1

/**
 * Indexed access under `noUncheckedIndexedAccess`. Clamps rather than throwing:
 * a rounding error at the end of the track should never take the scene down.
 */
export function cityAt(index: number): City {
  const i = Math.min(CITY_COUNT - 1, Math.max(0, Math.floor(index)))
  return CITIES[i]!
}

/** Which city owns a given progress value. */
export function cityIndexForProgress(progress: number): number {
  const i = Math.floor(progress / STATES_PER_CITY)
  return Math.min(CITY_COUNT - 1, Math.max(0, i))
}

/** Progress within the owning city, 0..1. */
export function localProgress(progress: number): number {
  const city = cityIndexForProgress(progress)
  const local = (progress - city * STATES_PER_CITY) / STATES_PER_CITY
  return Math.min(1, Math.max(0, local))
}

/**
 * Where a stepper dot or globe marker should land.
 *
 * Deliberately half a state *inside* the city rather than on its boundary: at
 * exactly `city * 5` a floating-point rounding error downward puts you in the
 * previous city, which is the bug the brief calls out by name.
 */
export function landingStateFor(cityIndex: number): number {
  const i = Math.min(CITY_COUNT - 1, Math.max(0, cityIndex))
  return Math.min(MAX_STATE, i * STATES_PER_CITY + 0.5)
}
