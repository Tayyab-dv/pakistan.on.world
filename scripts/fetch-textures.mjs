/**
 * Fetch and process the Earth textures.
 *
 * Sources are NASA Visible Earth and Black Marble imagery, which is in the
 * public domain (NASA media usage guidelines: not copyrighted, free to use).
 * Originals are cached under `public/textures/earth/_source/`, which is
 * gitignored — only the processed, web-sized tiers are committed.
 *
 * Two of the five maps are *derived* rather than downloaded:
 *   normal     Sobel gradient of the GEBCO elevation raster
 *   roughness  ocean mask inferred from the Blue Marble albedo, since NASA
 *              no longer serves the standalone water mask at a stable URL
 *
 * Run: npm run textures
 */

import { createWriteStream } from 'node:fs'
import { access, mkdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public/textures/earth')
const SRC = resolve(OUT, '_source')

/** Output tiers, matching `TierProfile.earthTexture`. */
const TIERS = [
  { name: '4k', width: 4096 },
  { name: '2k', width: 2048 },
  { name: '1k', width: 1024 },
]

const SOURCES = {
  albedo: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_8192.tif',
    file: 'land_shallow_topo_8192.tif',
    label: 'Blue Marble land + shallow topography (8192×4096)',
  },
  night: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg',
    file: 'black_marble_3600x1800.jpg',
    label: 'Black Marble city lights (3600×1800)',
  },
  clouds: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.tif',
    file: 'cloud_combined_2048.tif',
    label: 'Combined cloud cover (2048×1024)',
  },
  elevation: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73934/gebco_08_rev_elev_21600x10800.png',
    file: 'gebco_elevation.png',
    label: 'GEBCO elevation (21600×10800)',
  },
}

function bar(done, total) {
  if (!total) return ''
  const width = 24
  const filled = Math.round((done / total) * width)
  return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}] ${((done / total) * 100).toFixed(0)}%`
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function download(source) {
  const target = resolve(SRC, source.file)

  if (await exists(target)) {
    const { size } = await stat(target)
    console.log(`  · cached  ${source.file} (${(size / 1024 / 1024).toFixed(1)} MB)`)
    return target
  }

  console.log(`  ↓ ${source.label}`)
  const response = await fetch(source.url)
  if (!response.ok || !response.body) {
    throw new Error(`${source.url} -> ${response.status}`)
  }

  const total = Number(response.headers.get('content-length') ?? 0)
  let received = 0
  let lastPrint = 0

  const body = Readable.fromWeb(response.body)
  body.on('data', (chunk) => {
    received += chunk.length
    const now = Date.now()
    if (now - lastPrint > 400) {
      lastPrint = now
      process.stdout.write(`\r    ${bar(received, total)}`)
    }
  })

  await pipeline(body, createWriteStream(target))
  process.stdout.write(`\r    ${bar(1, 1)}\n`)
  return target
}

/** Straight resize to each tier, written as JPEG. */
async function emitTiers(input, prefix, options = {}) {
  const { quality = 86, greyscale = false } = options

  for (const tier of TIERS) {
    const output = resolve(OUT, `${prefix}_${tier.name}.jpg`)
    let pipe = sharp(input, { limitInputPixels: false, sequentialRead: true }).resize(
      tier.width,
      tier.width / 2,
      { fit: 'fill', kernel: 'lanczos3' },
    )
    if (greyscale) pipe = pipe.greyscale()
    await pipe.jpeg({ quality, mozjpeg: true }).toFile(output)
    console.log(`  ✓ ${prefix}_${tier.name}.jpg`)
  }
}

/**
 * Clouds need real transparency: the source is white cloud on black sky, so
 * luminance becomes alpha and the colour channels go flat white. A slight
 * curve on the alpha keeps thin haze from turning the whole globe milky.
 */
async function emitClouds(input) {
  for (const tier of TIERS) {
    const width = Math.min(tier.width, 2048)
    const height = width / 2

    const { data } = await sharp(input, { limitInputPixels: false })
      .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const rgba = Buffer.alloc(width * height * 4)
    for (let i = 0; i < data.length; i += 1) {
      const luminance = data[i] / 255
      // Lift the midtones, crush the near-black sky to fully transparent.
      const alpha = Math.max(0, Math.min(1, (luminance - 0.08) / 0.92)) ** 1.35
      const o = i * 4
      rgba[o] = 255
      rgba[o + 1] = 255
      rgba[o + 2] = 255
      rgba[o + 3] = Math.round(alpha * 255)
    }

    await sharp(rgba, { raw: { width, height, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(resolve(OUT, `clouds_${tier.name}.png`))
    console.log(`  ✓ clouds_${tier.name}.png`)
  }
}

/**
 * Normal map from the elevation raster.
 *
 * Central-difference gradient rather than a full Sobel: on an equirectangular
 * height field at this scale the two are visually identical, and the simpler
 * form is easier to reason about. Horizontal spacing is scaled by cos(latitude)
 * so the poles do not turn into a smear of extreme slopes.
 */
async function emitNormal(input) {
  const width = 2048
  const height = 1024

  const { data } = await sharp(input, { limitInputPixels: false, sequentialRead: true })
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgb = Buffer.alloc(width * height * 3)
  const STRENGTH = 2.6

  for (let y = 0; y < height; y += 1) {
    const latitude = ((y / height) * 2 - 1) * (Math.PI / 2)
    // Guard the poles: cos -> 0 would divide the gradient to infinity.
    const cosLat = Math.max(0.12, Math.cos(latitude))

    for (let x = 0; x < width; x += 1) {
      const left = data[y * width + ((x - 1 + width) % width)] / 255
      const right = data[y * width + ((x + 1) % width)] / 255
      const up = data[Math.max(0, y - 1) * width + x] / 255
      const down = data[Math.min(height - 1, y + 1) * width + x] / 255

      const dx = ((right - left) * STRENGTH) / cosLat
      const dy = (down - up) * STRENGTH

      // Normalise (-dx, -dy, 1) and pack into 0..255.
      const length = Math.hypot(dx, dy, 1)
      const o = (y * width + x) * 3
      rgb[o] = Math.round(((-dx / length) * 0.5 + 0.5) * 255)
      rgb[o + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255)
      rgb[o + 2] = Math.round((1 / length) * 0.5 * 255 + 127.5)
    }
  }

  const base = sharp(rgb, { raw: { width, height, channels: 3 } })
  for (const tier of TIERS) {
    await base
      .clone()
      .resize(tier.width, tier.width / 2, { fit: 'fill', kernel: 'lanczos3' })
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(resolve(OUT, `normal_${tier.name}.jpg`))
    console.log(`  ✓ normal_${tier.name}.jpg`)
  }
}

/**
 * Roughness from the albedo.
 *
 * NASA no longer serves the standalone water mask at a stable URL, so the ocean
 * is inferred from Blue Marble itself: sea water is the only large surface that
 * is simultaneously dark and blue-dominant. Water gets a low roughness so it
 * takes a specular highlight; land stays matte.
 */
async function emitRoughness(input) {
  const width = 2048
  const height = 1024

  const { data } = await sharp(input, { limitInputPixels: false, sequentialRead: true })
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const grey = Buffer.alloc(width * height)

  for (let i = 0, p = 0; i < data.length; i += 3, p += 1) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255

    const blueness = b - Math.max(r, g)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

    // Both conditions must hold: bright blue is ice or shallow reef, and dark
    // grey is mountain shadow — neither should read as open water.
    const isBlue = Math.max(0, Math.min(1, (blueness - 0.01) / 0.09))
    const isDark = Math.max(0, Math.min(1, (0.42 - luminance) / 0.3))
    const water = isBlue * isDark

    grey[p] = Math.round((0.94 - water * 0.86) * 255)
  }

  const base = sharp(grey, { raw: { width, height, channels: 1 } })
  for (const tier of TIERS) {
    await base
      .clone()
      .resize(tier.width, tier.width / 2, { fit: 'fill', kernel: 'lanczos3' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(resolve(OUT, `roughness_${tier.name}.jpg`))
    console.log(`  ✓ roughness_${tier.name}.jpg`)
  }
}

async function main() {
  await mkdir(SRC, { recursive: true })

  console.log('\nDownloading sources (NASA, public domain)…')
  const albedo = await download(SOURCES.albedo)
  const night = await download(SOURCES.night)
  const clouds = await download(SOURCES.clouds)
  const elevation = await download(SOURCES.elevation)

  console.log('\nAlbedo…')
  await emitTiers(albedo, 'albedo', { quality: 88 })

  console.log('\nNight lights…')
  await emitTiers(night, 'night', { quality: 82 })

  console.log('\nClouds…')
  await emitClouds(clouds)

  console.log('\nNormal (derived from elevation)…')
  await emitNormal(elevation)

  console.log('\nRoughness (ocean mask derived from albedo)…')
  await emitRoughness(albedo)

  console.log('\nDone. Processed tiers are in public/textures/earth/')
}

main().catch((error) => {
  console.error(`\n${error.message}`)
  console.error('The application falls back to procedural textures without these.')
  process.exitCode = 1
})
