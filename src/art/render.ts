import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three'
import { clamp01, lerp } from '../core/damp'
import type { RGB, Theme } from '../cities/themes'
import type { ArtLayer, LandmarkArt, LayerRole } from './types'

/**
 * Rasterise layered vector art into a texture.
 *
 * Called once per landmark at load time (and again only if the performance tier
 * drops), not per frame: within a city the sun does not move, so the lighting
 * baked into the texture stays correct for as long as the landmark is on screen.
 */

interface RoleStyle {
  /** Position between full shadow (0) and full sunlight (1). */
  readonly tone: number
  readonly opacity: number
}

/**
 * Tonal separation is what makes a flat cutout read as a solid object. These
 * values are spread deliberately wide — a mosque rendered across a narrow band
 * of greys looks like a sticker no matter how good the silhouette is.
 */
const ROLE_STYLES: Record<LayerRole, RoleStyle> = {
  silhouette: { tone: 0.52, opacity: 1 },
  shade: { tone: 0.2, opacity: 1 },
  detail: { tone: 0.05, opacity: 0.92 },
  highlight: { tone: 0.95, opacity: 1 },
  accent: { tone: 0.8, opacity: 0.95 },
}

function mix(a: RGB, b: RGB, t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function css(c: readonly [number, number, number], alpha = 1): string {
  const to255 = (v: number) => Math.round(clamp01(v) * 255)
  return `rgba(${to255(c[0])}, ${to255(c[1])}, ${to255(c[2])}, ${clamp01(alpha)})`
}

/**
 * Resolve a role to a colour in the city's palette.
 *
 * Two anchors are established first — masonry in full sun, and masonry in
 * shadow — and every role is a point between them. The lit anchor is pulled
 * toward the city's key light and the shadow anchor toward its ambient and fog,
 * so a landmark is lit by the same sun as the globe behind it. Deriving the
 * base from ambient alone, as an earlier version did, produced flat grey
 * buildings under a sunrise.
 */
function colourFor(role: LayerRole, theme: Theme): [number, number, number] {
  const style = ROLE_STYLES[role]

  const masonry: [number, number, number] = [0.8, 0.76, 0.7]
  const lit = mix(masonry, theme.key, 0.5)
  const shadow = mix(mix(theme.fog, theme.ambient, 0.55), masonry, 0.14)

  if (role === 'accent') return mix(mix(shadow, lit, style.tone), theme.accent, 0.8)
  return mix(shadow, lit, style.tone)
}

export interface LandmarkTexture {
  readonly texture: CanvasTexture
  readonly aspect: number
  readonly baseline: number
  dispose(): void
}

/**
 * @param lightX  Screen-space direction of the sun, -1 (from the left) to
 *                +1 (from the right). Drives the directional gradient so the
 *                landmark's lit side agrees with the globe's terminator.
 */
export function renderLandmark(
  art: LandmarkArt,
  theme: Theme,
  lightX: number,
  longEdge: number,
): LandmarkTexture {
  const aspect = art.viewBox.width / art.viewBox.height
  const width = aspect >= 1 ? longEdge : Math.round(longEdge * aspect)
  const height = aspect >= 1 ? Math.round(longEdge / aspect) : longEdge

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  ctx.scale(width / art.viewBox.width, height / art.viewBox.height)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  for (const layer of art.layers) {
    paintLayer(ctx, layer, theme)
  }

  applyDirectionalLight(ctx, art, lightX, theme)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = 4
  // Premultiplied alpha is the fix for dark edge halos: without it, the RGB
  // under fully transparent canvas pixels is black and bleeds into the
  // silhouette wherever the texture is filtered.
  texture.premultiplyAlpha = true
  texture.needsUpdate = true

  return {
    texture,
    aspect,
    baseline: art.baseline,
    dispose: () => texture.dispose(),
  }
}

function paintLayer(ctx: CanvasRenderingContext2D, layer: ArtLayer, theme: Theme): void {
  const style = ROLE_STYLES[layer.role]
  const colour = colourFor(layer.role, theme)

  ctx.fillStyle = css(colour, style.opacity * (layer.opacity ?? 1))
  ctx.fill(new Path2D(layer.path))
}

/**
 * Overlay a light-to-shadow gradient across the silhouette.
 *
 * Composited with `source-atop` so it affects only pixels the art already
 * painted — the transparent surround stays perfectly transparent, which is what
 * keeps the cutout clean at the edges.
 */
function applyDirectionalLight(
  ctx: CanvasRenderingContext2D,
  art: LandmarkArt,
  lightX: number,
  theme: Theme,
): void {
  const { width, height } = art.viewBox
  const direction = clamp01((lightX + 1) / 2)

  const gradient = ctx.createLinearGradient(
    lerp(width, 0, direction),
    0,
    lerp(0, width, direction),
    height * 0.35,
  )
  gradient.addColorStop(0, css(theme.fog, 0.34))
  gradient.addColorStop(0.5, css(theme.key, 0.0))
  gradient.addColorStop(1, css(theme.key, 0.26))

  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // A soft darkening toward the base seats the object rather than letting it
  // float — a gradient, not a cast shadow, so nothing is baked in that would
  // contradict the scene's own lighting.
  const grounding = ctx.createLinearGradient(0, height * 0.62, 0, height)
  grounding.addColorStop(0, css(theme.fog, 0))
  grounding.addColorStop(1, css(theme.fog, 0.24))
  ctx.fillStyle = grounding
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}
