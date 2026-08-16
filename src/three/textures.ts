import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'
import type { TierProfile } from '../core/tier'

/**
 * Earth texture loading, with a procedural fallback.
 *
 * The raster imagery is public-domain NASA Visible Earth / Black Marble,
 * fetched and resized by `scripts/fetch-textures.mjs`. It is deliberately not
 * committed, so a fresh clone — or a machine that could not reach NASA's
 * servers — still runs. When a file is absent the loader substitutes a
 * generated stand-in rather than failing: development never blocks on an asset,
 * and the geometry, lighting and choreography can all be judged without it.
 */

export interface EarthTextures {
  albedo: Texture
  night: Texture
  clouds: Texture | null
  normal: Texture | null
  roughness: Texture | null
  /** False when any raster was substituted, so the UI can say so if it wants. */
  complete: boolean
}

const BASE = '/textures/earth'

function tryLoad(url: string): Promise<Texture | null> {
  return new Promise((resolve) => {
    new TextureLoader().load(
      url,
      (texture) => resolve(texture),
      undefined,
      () => resolve(null),
    )
  })
}

function configure(texture: Texture, srgb: boolean): Texture {
  texture.wrapS = RepeatWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = 4
  if (srgb) texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/* -----------------------------------------------------------------------------
   Procedural fallbacks.

   These exist to keep the scene renderable, not to impersonate satellite
   imagery. Value-noise fbm thresholded into landmasses, with ice toward the
   poles and a depth gradient in the oceans.
   -------------------------------------------------------------------------- */

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number, octaves = 5): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise(x * frequency, y * frequency) * amplitude
    frequency *= 2.07
    amplitude *= 0.5
  }
  return value
}

function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return { canvas, ctx }
}

function proceduralAlbedo(width = 1024): Texture {
  const height = width / 2
  const { canvas, ctx } = makeCanvas(width, height)
  const image = ctx.createImageData(width, height)
  const data = image.data

  for (let y = 0; y < height; y += 1) {
    // Latitude in -1..1, used for ice caps and for compressing noise toward
    // the poles so the equirectangular projection does not smear.
    const lat = (y / height) * 2 - 1
    const compress = Math.cos(lat * Math.PI * 0.5) * 0.85 + 0.15

    for (let x = 0; x < width; x += 1) {
      const u = (x / width) * 9 * compress
      const v = (y / height) * 9
      const elevation = fbm(u, v) - Math.abs(lat) * 0.22

      const index = (y * width + x) * 4
      const polar = Math.max(0, (Math.abs(lat) - 0.78) / 0.22)

      let r: number
      let g: number
      let b: number

      if (elevation > 0.52) {
        const t = Math.min(1, (elevation - 0.52) / 0.28)
        r = 96 + t * 58
        g = 108 + t * 44
        b = 76 + t * 40
      } else {
        const depth = Math.min(1, (0.52 - elevation) / 0.5)
        r = 18 - depth * 8
        g = 38 - depth * 16
        b = 66 - depth * 22
      }

      if (polar > 0) {
        r += (238 - r) * polar
        g += (242 - g) * polar
        b += (246 - b) * polar
      }

      data[index] = r
      data[index + 1] = g
      data[index + 2] = b
      data[index + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)
  return configure(new CanvasTexture(canvas), true)
}

function proceduralNight(width = 512): Texture {
  const height = width / 2
  const { canvas, ctx } = makeCanvas(width, height)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  // Scattered warm points standing in for city lights, clustered by the same
  // noise field so they land on the fallback landmasses rather than the sea.
  for (let i = 0; i < 2600; i += 1) {
    const x = Math.random() * width
    const y = height * 0.5 + (Math.random() - 0.5) * height * 0.78
    const lat = (y / height) * 2 - 1
    const compress = Math.cos(lat * Math.PI * 0.5) * 0.85 + 0.15
    const elevation = fbm((x / width) * 9 * compress, (y / height) * 9) - Math.abs(lat) * 0.22
    if (elevation <= 0.54) continue

    const intensity = 0.35 + Math.random() * 0.65
    ctx.fillStyle = `rgba(255, 214, 150, ${intensity})`
    ctx.fillRect(x, y, 1, 1)
  }

  return configure(new CanvasTexture(canvas), true)
}

function proceduralClouds(width = 1024): Texture {
  const height = width / 2
  const { canvas, ctx } = makeCanvas(width, height)
  const image = ctx.createImageData(width, height)
  const data = image.data

  for (let y = 0; y < height; y += 1) {
    const lat = (y / height) * 2 - 1
    const compress = Math.cos(lat * Math.PI * 0.5) * 0.85 + 0.15
    // Banding by latitude approximates the equatorial and mid-latitude bands.
    const band = 0.5 + 0.5 * Math.cos(lat * Math.PI * 3.1)

    for (let x = 0; x < width; x += 1) {
      const n = fbm((x / width) * 14 * compress, (y / height) * 14, 6)
      const alpha = Math.max(0, Math.min(1, (n * band - 0.34) * 2.6))
      const index = (y * width + x) * 4
      data[index] = 255
      data[index + 1] = 255
      data[index + 2] = 255
      data[index + 3] = alpha * 255
    }
  }

  ctx.putImageData(image, 0, 0)
  return configure(new CanvasTexture(canvas), true)
}

export async function loadEarthTextures(profile: TierProfile): Promise<EarthTextures> {
  const size = profile.earthTexture

  const [albedo, night, clouds, normal, roughness] = await Promise.all([
    tryLoad(`${BASE}/albedo_${size}.jpg`),
    tryLoad(`${BASE}/night_${size}.jpg`),
    profile.clouds ? tryLoad(`${BASE}/clouds_${size}.png`) : Promise.resolve(null),
    tryLoad(`${BASE}/normal_${size}.jpg`),
    tryLoad(`${BASE}/roughness_${size}.jpg`),
  ])

  const missing: string[] = []
  if (!albedo) missing.push('albedo')
  if (!night) missing.push('night')
  if (profile.clouds && !clouds) missing.push('clouds')

  if (missing.length > 0) {
    console.info(
      `[earth] Using procedural stand-ins for: ${missing.join(', ')}. ` +
        'Run `npm run textures` to fetch the NASA imagery.',
    )
  }

  return {
    albedo: albedo ? configure(albedo, true) : proceduralAlbedo(),
    night: night ? configure(night, true) : proceduralNight(),
    clouds: profile.clouds ? (clouds ? configure(clouds, true) : proceduralClouds()) : null,
    normal: normal ? configure(normal, false) : null,
    roughness: roughness ? configure(roughness, false) : null,
    complete: missing.length === 0,
  }
}
