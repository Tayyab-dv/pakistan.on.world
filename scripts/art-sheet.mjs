/**
 * Screenshot the landmark art contact sheet.
 *
 * Authoring vector landmarks against the full 3D scene is a slow loop and an
 * unreliable one — the object may be small, occluded, or out of frame. This
 * renders the art on its own so a broken path is obvious immediately.
 *
 * Run: node scripts/art-sheet.mjs   (dev server must already be running)
 */

import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, '.visual')
const URL_ = process.argv[2] ?? 'http://127.0.0.1:5173/art.html'

await mkdir(OUT, { recursive: true })

let browser
for (const channel of ['chrome', 'msedge', undefined]) {
  try {
    browser = await chromium.launch({ headless: false, ...(channel ? { channel } : {}) })
    break
  } catch {
    // Try the next.
  }
}

const page = await browser.newPage({ viewport: { width: 1000, height: 900 } })
const issues = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') issues.push(`[${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => issues.push(`[pageerror] ${e.message}`))

await page.goto(URL_, { waitUntil: 'networkidle' })
await page.waitForSelector('figure', { timeout: 20000 })

for (const caption of await page.locator('figcaption').allTextContents()) {
  console.log(`  ${caption}`)
}

await page.screenshot({ path: resolve(OUT, 'art-sheet.png'), fullPage: true })
console.log(issues.length ? `\nconsole:\n  ${issues.join('\n  ')}` : '\nconsole clean')

await browser.close()
