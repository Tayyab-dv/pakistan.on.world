/**
 * Download the self-hosted Cormorant Garamond subset.
 *
 * Google Fonts is used as the *source* only; nothing at runtime touches a third
 * party. We take just the `latin` subset of the three faces the composition
 * actually uses, which keeps the payload to a few tens of kilobytes and removes
 * the flash of fallback serif on a cold load.
 *
 * Run: npm run fonts
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(ROOT, 'public/fonts')

// A modern desktop UA is required or the API serves legacy TTF instead of woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap'

/** style|weight -> output filename, matching the @font-face rules in type.css. */
const WANTED = new Map([
  ['normal|300', 'cormorant-garamond-light.woff2'],
  ['normal|400', 'cormorant-garamond-regular.woff2'],
  ['italic|300', 'cormorant-garamond-light-italic.woff2'],
])

/** The latin subset is identified by its unicode-range starting at U+0000-00FF. */
const LATIN_MARKER = 'U+0000-00FF'

function parseFontFaces(css) {
  const faces = []
  const blocks = css.split('@font-face').slice(1)

  for (const block of blocks) {
    const style = /font-style:\s*([a-z]+)/.exec(block)?.[1]
    const weight = /font-weight:\s*(\d+)/.exec(block)?.[1]
    const url = /src:\s*url\(([^)]+)\)/.exec(block)?.[1]
    const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1]
    if (!style || !weight || !url || !range) continue
    faces.push({ style, weight, url, range })
  }

  return faces
}

async function main() {
  console.log('Fetching font CSS…')
  const response = await fetch(CSS_URL, { headers: { 'User-Agent': UA } })
  if (!response.ok) throw new Error(`Font CSS request failed: ${response.status}`)

  const faces = parseFontFaces(await response.text())
  await mkdir(OUT_DIR, { recursive: true })

  let written = 0

  for (const [key, filename] of WANTED) {
    const [style, weight] = key.split('|')
    const match = faces.find(
      (face) =>
        face.style === style && face.weight === weight && face.range.includes(LATIN_MARKER),
    )

    if (!match) {
      console.error(`  ✗ no latin subset found for ${style} ${weight}`)
      continue
    }

    const font = await fetch(match.url, { headers: { 'User-Agent': UA } })
    if (!font.ok) {
      console.error(`  ✗ ${filename}: ${font.status}`)
      continue
    }

    const bytes = Buffer.from(await font.arrayBuffer())
    await writeFile(resolve(OUT_DIR, filename), bytes)
    console.log(`  ✓ ${filename} (${(bytes.length / 1024).toFixed(1)} KB)`)
    written += 1
  }

  if (written !== WANTED.size) {
    throw new Error(`Expected ${WANTED.size} fonts, wrote ${written}`)
  }
  console.log(`\nWrote ${written} fonts to public/fonts`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
