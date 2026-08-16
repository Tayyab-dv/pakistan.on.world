/**
 * Per-city colour and light.
 *
 * One object per city describes the entire look: the Three.js lighting rig, the
 * atmosphere, the globe surface tint, *and* the DOM's colour tokens. Both
 * consumers read the same interpolated result every frame, so the interface and
 * the render can never drift apart mid-transition.
 *
 * Seasonal intent, per the brief:
 *   Islamabad  spring bloom, soft morning rose
 *   Karachi    dry summer gold, heat shimmer, coastal haze
 *   Lahore     bronze autumn, full zenith brightness
 *   Peshawar   cold winter light, snow over carved stone
 *   Gwadar     deep-winter coastal, warm sunset over cliffs and sea
 *   Skardu     late-autumn poplar gold giving way to first snow
 */

import { clamp01, lerp } from '../core/damp'
import type { CityId } from './index'

export type RGB = readonly [number, number, number]
export type MutableRGB = [number, number, number]

export interface Theme {
  /** Primary directional light — the sun. */
  key: RGB
  keyIntensity: number
  /** Back/rim light separating the globe from the void. */
  rim: RGB
  rimIntensity: number
  ambient: RGB
  ambientIntensity: number
  /** Atmospheric scatter colour at the limb. */
  atmo: RGB
  atmoIntensity: number
  /** Scene and page background. */
  fog: RGB
  /** Multiplicative tint over the Earth albedo. */
  surfaceTint: RGB
  cloudTint: RGB
  /** Editorial text. */
  ink: RGB
  /** Active marker, stepper sun, travelled arc. */
  accent: RGB
  exposure: number
  grain: number
}

function hex(value: string): RGB {
  const n = parseInt(value.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const THEMES: Record<CityId, Theme> = {
  islamabad: {
    key: hex('#ffd2b0'),
    keyIntensity: 2.1,
    rim: hex('#8fb6ff'),
    rimIntensity: 0.85,
    ambient: hex('#2b3550'),
    ambientIntensity: 0.5,
    atmo: hex('#a9c8ff'),
    atmoIntensity: 1.15,
    fog: hex('#0a0f1a'),
    surfaceTint: hex('#e8e2d8'),
    cloudTint: hex('#ffe6d6'),
    ink: hex('#f6efe6'),
    accent: hex('#f0b98a'),
    exposure: 1.02,
    grain: 0.055,
  },
  karachi: {
    key: hex('#ffd98a'),
    keyIntensity: 2.7,
    rim: hex('#7fc4d8'),
    rimIntensity: 0.7,
    ambient: hex('#33384a'),
    ambientIntensity: 0.58,
    atmo: hex('#bcd9e8'),
    atmoIntensity: 1.05,
    fog: hex('#0d1218'),
    surfaceTint: hex('#f0e4c8'),
    cloudTint: hex('#fff2d9'),
    ink: hex('#f7f1e4'),
    accent: hex('#e8c063'),
    exposure: 1.1,
    grain: 0.05,
  },
  lahore: {
    key: hex('#fff0cf'),
    keyIntensity: 3.2,
    rim: hex('#c79a63'),
    rimIntensity: 0.62,
    ambient: hex('#3d3a3a'),
    ambientIntensity: 0.66,
    atmo: hex('#d9c9a8'),
    atmoIntensity: 0.92,
    fog: hex('#12100e'),
    surfaceTint: hex('#f3e0c2'),
    cloudTint: hex('#fff6e4'),
    ink: hex('#f8f2e6'),
    accent: hex('#cf9450'),
    exposure: 1.16,
    grain: 0.048,
  },
  peshawar: {
    key: hex('#dfe8f5'),
    keyIntensity: 1.85,
    rim: hex('#93a8c4'),
    rimIntensity: 0.9,
    ambient: hex('#2a3140'),
    ambientIntensity: 0.52,
    atmo: hex('#c3d4e8'),
    atmoIntensity: 1.0,
    fog: hex('#0b0f15'),
    surfaceTint: hex('#dfe0e2'),
    cloudTint: hex('#eef3fa'),
    ink: hex('#f0f2f5'),
    accent: hex('#c08a4e'),
    exposure: 0.98,
    grain: 0.06,
  },
  gwadar: {
    key: hex('#ff9a5c'),
    keyIntensity: 2.4,
    rim: hex('#8f6bd0'),
    rimIntensity: 1.05,
    ambient: hex('#3a2a3e'),
    ambientIntensity: 0.48,
    atmo: hex('#e88a72'),
    atmoIntensity: 1.28,
    fog: hex('#140d16'),
    surfaceTint: hex('#e6c4a8'),
    cloudTint: hex('#ffc9a0'),
    ink: hex('#f7e9e0'),
    accent: hex('#ff8f5e'),
    exposure: 1.06,
    grain: 0.058,
  },
  skardu: {
    key: hex('#ffc98e'),
    keyIntensity: 1.7,
    rim: hex('#a9c6e8'),
    rimIntensity: 1.15,
    ambient: hex('#28303f'),
    ambientIntensity: 0.46,
    atmo: hex('#cbb9d8'),
    atmoIntensity: 1.1,
    fog: hex('#0a0d14'),
    surfaceTint: hex('#e4e6ea'),
    cloudTint: hex('#f2e2d0'),
    ink: hex('#f4f0ea'),
    accent: hex('#d9a866'),
    exposure: 1.0,
    grain: 0.062,
  },
}

/** A reusable working theme, mutated in place each frame to avoid allocation. */
export function createWorkingTheme(): Theme {
  return structuredClone(THEMES.islamabad) as Theme
}

function lerpRGB(out: MutableRGB, a: RGB, b: RGB, t: number): void {
  out[0] = lerp(a[0], b[0], t)
  out[1] = lerp(a[1], b[1], t)
  out[2] = lerp(a[2], b[2], t)
}

/** Interpolate two themes into `out`. */
export function lerpTheme(out: Theme, a: Theme, b: Theme, t: number): Theme {
  const k = clamp01(t)
  lerpRGB(out.key as MutableRGB, a.key, b.key, k)
  lerpRGB(out.rim as MutableRGB, a.rim, b.rim, k)
  lerpRGB(out.ambient as MutableRGB, a.ambient, b.ambient, k)
  lerpRGB(out.atmo as MutableRGB, a.atmo, b.atmo, k)
  lerpRGB(out.fog as MutableRGB, a.fog, b.fog, k)
  lerpRGB(out.surfaceTint as MutableRGB, a.surfaceTint, b.surfaceTint, k)
  lerpRGB(out.cloudTint as MutableRGB, a.cloudTint, b.cloudTint, k)
  lerpRGB(out.ink as MutableRGB, a.ink, b.ink, k)
  lerpRGB(out.accent as MutableRGB, a.accent, b.accent, k)
  out.keyIntensity = lerp(a.keyIntensity, b.keyIntensity, k)
  out.rimIntensity = lerp(a.rimIntensity, b.rimIntensity, k)
  out.ambientIntensity = lerp(a.ambientIntensity, b.ambientIntensity, k)
  out.atmoIntensity = lerp(a.atmoIntensity, b.atmoIntensity, k)
  out.exposure = lerp(a.exposure, b.exposure, k)
  out.grain = lerp(a.grain, b.grain, k)
  return out
}

export function rgbToCSS(c: RGB): string {
  const to255 = (v: number) => Math.round(clamp01(v) * 255)
  return `rgb(${to255(c[0])} ${to255(c[1])} ${to255(c[2])})`
}

export function rgbToCSSAlpha(c: RGB, alpha: number): string {
  const to255 = (v: number) => Math.round(clamp01(v) * 255)
  return `rgb(${to255(c[0])} ${to255(c[1])} ${to255(c[2])} / ${clamp01(alpha)})`
}

/**
 * Push the current theme into CSS custom properties.
 *
 * Called once per frame. Writing a custom property whose value has not changed
 * is cheap, and it keeps the DOM in exact lockstep with the render rather than
 * approximately in step via a CSS transition.
 */
export function applyThemeToCSS(theme: Theme): void {
  const root = document.documentElement.style
  root.setProperty('--ink', rgbToCSS(theme.ink))
  root.setProperty('--ink-dim', rgbToCSSAlpha(theme.ink, 0.52))
  root.setProperty('--accent', rgbToCSS(theme.accent))
  root.setProperty('--fog', rgbToCSS(theme.fog))
  root.setProperty('--atmo', rgbToCSS(theme.atmo))
  root.setProperty('--grain-opacity', theme.grain.toFixed(3))
}
