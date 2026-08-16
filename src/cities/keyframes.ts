/**
 * The 30 scroll states.
 *
 * Progress is continuous, so these are keyframes rather than stops: the renderer
 * samples between `floor(p)` and `ceil(p)` every frame. Because sampling is a
 * pure function of progress with no fired transitions anywhere, scrolling
 * backward retraces exactly the same path forward — which is what the brief
 * means by "same physical path, not a different animation".
 *
 * The five states inside each city have fixed choreographic roles, dictated by
 * the requirement that no landmark may still be in the open when the next city
 * takes over:
 *
 *   0  landmark A enters from behind the globe, approaching a limb
 *   1  A clears the silhouette and becomes the foreground focus
 *   2  A yields laterally; B rises on the opposite limb
 *   3  B holds the foreground focus
 *   4  both return around the limbs and switch to the rear layer
 *
 * The table below is generated from a compact per-city arc plus a shared
 * per-state profile, then hand-overridable per state. Authoring 30 objects by
 * hand invites inconsistency; generating them and overriding the few that need
 * art direction keeps both precision and coherence.
 */

import { DEG2RAD, lerp, smootherstep } from '../core/damp'
import { CITIES, MAX_STATE, STATES_PER_CITY, TOTAL_STATES, cityAt } from './index'
import type { CityId } from './index'

export interface Keyframe {
  /** Sub-solar point the globe rotates to present, degrees. */
  camLat: number
  camLon: number
  /** Multiplier on the aspect-solved fit distance. */
  camDist: number
  /** Sun direction, radians. */
  sunAz: number
  sunEl: number
  cloudOpacity: number
  /** How strongly the city-lights layer shows through. */
  nightMix: number
  atmoIntensity: number
  /** Choreography root scale, spin, and depth offset along the view axis. */
  choreoScale: number
  choreoSpin: number
  choreoDepth: number
  /** 0..1 multiplier on particle emission. */
  particleRate: number
}

interface CityArc {
  /** Degrees. Azimuth advances through the day across the journey. */
  sunAz: number
  sunEl: number
  cloudOpacity: number
  nightMix: number
  atmoBias: number
  /** Total longitude travelled while inside the city, degrees. */
  lonDrift: number
  latDrift: number
  distBias: number
}

const ARCS: Record<CityId, CityArc> = {
  // Sunrise: a very low sun from the east, city lights still fading out.
  islamabad: {
    sunAz: 95,
    sunEl: 6,
    cloudOpacity: 0.42,
    nightMix: 0.34,
    atmoBias: 1.0,
    lonDrift: 12,
    latDrift: 3,
    distBias: 1.0,
  },
  // Rising daylight over the coast; haze thickens the atmosphere.
  karachi: {
    sunAz: 122,
    sunEl: 38,
    cloudOpacity: 0.3,
    nightMix: 0.08,
    atmoBias: 1.06,
    lonDrift: 14,
    latDrift: -3.5,
    distBias: 0.98,
  },
  // Solar zenith. Brightest state of the journey, thinnest atmosphere.
  lahore: {
    sunAz: 178,
    sunEl: 82,
    cloudOpacity: 0.22,
    nightMix: 0.0,
    atmoBias: 0.9,
    lonDrift: 11,
    latDrift: 2.5,
    distBias: 0.96,
  },
  // Cold winter light, sun past the meridian, heavier cloud.
  peshawar: {
    sunAz: 226,
    sunEl: 44,
    cloudOpacity: 0.5,
    nightMix: 0.12,
    atmoBias: 1.02,
    lonDrift: -10,
    latDrift: 2,
    distBias: 1.0,
  },
  // Deep-winter sunset on the Arabian Sea.
  gwadar: {
    sunAz: 264,
    sunEl: 6,
    cloudOpacity: 0.34,
    nightMix: 0.44,
    atmoBias: 1.22,
    lonDrift: -13,
    latDrift: -2.5,
    distBias: 1.02,
  },
  // The last of the descending coral light on the Karakoram, first snow.
  skardu: {
    sunAz: 282,
    sunEl: 3,
    cloudOpacity: 0.4,
    nightMix: 0.56,
    atmoBias: 1.12,
    lonDrift: 9,
    latDrift: 3,
    distBias: 1.05,
  },
}

interface StateProfile {
  choreoScale: number
  choreoSpin: number
  choreoDepth: number
  particleRate: number
  distMul: number
}

/** Shared shape of a city's five states. */
const STATE_PROFILE: readonly StateProfile[] = [
  { choreoScale: 0.84, choreoSpin: 0.0, choreoDepth: -0.38, particleRate: 0.5, distMul: 1.06 },
  { choreoScale: 1.0, choreoSpin: 0.2, choreoDepth: 0.12, particleRate: 0.86, distMul: 1.0 },
  { choreoScale: 1.07, choreoSpin: 0.4, choreoDepth: 0.3, particleRate: 1.0, distMul: 0.97 },
  { choreoScale: 1.0, choreoSpin: 0.6, choreoDepth: 0.12, particleRate: 0.92, distMul: 1.0 },
  { choreoScale: 0.86, choreoSpin: 0.8, choreoDepth: -0.34, particleRate: 0.58, distMul: 1.07 },
]

/**
 * Hand tuning applied on top of the generated table, keyed by absolute state
 * index (0..29). Populated during the visual review passes; anything here wins.
 */
const OVERRIDES: Readonly<Record<number, Partial<Keyframe>>> = {
  // Lahore's zenith state is the brightest moment of the journey — pull the
  // camera in slightly so the full sun reads as an event.
  12: { camDist: 0.93, atmoIntensity: 0.86 },
}

function build(): Keyframe[] {
  const frames: Keyframe[] = []

  for (let cityIndex = 0; cityIndex < CITIES.length; cityIndex += 1) {
    const city = cityAt(cityIndex)
    const arc = ARCS[city.id]

    for (let state = 0; state < STATES_PER_CITY; state += 1) {
      const profile = STATE_PROFILE[state]!
      // -0.5..0.5 across the city, so the drift is centred on the real coordinates.
      const u = state / (STATES_PER_CITY - 1) - 0.5

      const frame: Keyframe = {
        camLat: city.lat + arc.latDrift * u,
        camLon: city.lon + arc.lonDrift * u,
        camDist: arc.distBias * profile.distMul,
        sunAz: arc.sunAz * DEG2RAD,
        sunEl: arc.sunEl * DEG2RAD,
        cloudOpacity: arc.cloudOpacity,
        nightMix: arc.nightMix,
        atmoIntensity: arc.atmoBias,
        choreoScale: profile.choreoScale,
        choreoSpin: profile.choreoSpin,
        choreoDepth: profile.choreoDepth,
        particleRate: profile.particleRate,
      }

      frames.push({ ...frame, ...OVERRIDES[frames.length] })
    }
  }

  return frames
}

export const KEYFRAMES: readonly Keyframe[] = build()

if (KEYFRAMES.length !== TOTAL_STATES) {
  throw new Error(`Expected ${TOTAL_STATES} keyframes, built ${KEYFRAMES.length}`)
}

export function createWorkingKeyframe(): Keyframe {
  return { ...KEYFRAMES[0]! }
}

/**
 * Sample the table at a continuous progress value into `out`.
 *
 * Smootherstep on the fraction rather than a raw lerp: it has zero first and
 * second derivative at each keyframe, so crossing a state boundary produces no
 * velocity discontinuity. A plain lerp is visible as a tiny kick at every one of
 * the 29 boundaries.
 */
export function sampleKeyframe(out: Keyframe, progress: number): Keyframe {
  const p = progress < 0 ? 0 : progress > MAX_STATE ? MAX_STATE : progress
  const i = Math.floor(p)
  const a = KEYFRAMES[i]!
  const b = KEYFRAMES[Math.min(MAX_STATE, i + 1)]!
  const t = smootherstep(0, 1, p - i)

  out.camLat = lerp(a.camLat, b.camLat, t)
  out.camLon = lerp(a.camLon, b.camLon, t)
  out.camDist = lerp(a.camDist, b.camDist, t)
  out.sunAz = lerp(a.sunAz, b.sunAz, t)
  out.sunEl = lerp(a.sunEl, b.sunEl, t)
  out.cloudOpacity = lerp(a.cloudOpacity, b.cloudOpacity, t)
  out.nightMix = lerp(a.nightMix, b.nightMix, t)
  out.atmoIntensity = lerp(a.atmoIntensity, b.atmoIntensity, t)
  out.choreoScale = lerp(a.choreoScale, b.choreoScale, t)
  out.choreoSpin = lerp(a.choreoSpin, b.choreoSpin, t)
  out.choreoDepth = lerp(a.choreoDepth, b.choreoDepth, t)
  out.particleRate = lerp(a.particleRate, b.particleRate, t)
  return out
}
