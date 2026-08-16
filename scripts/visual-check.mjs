/**
 * Visual verification harness.
 *
 * Headed Chromium with real GPU rendering, driven by Playwright. Headless
 * Chromium falls back to SwiftShader software rasterisation, which is fine for
 * layout but unreliable for exactly the things this project has to get right:
 * alpha edges on the landmarks, additive blending in the particle fields, and
 * subtle colour across the theme transitions.
 *
 * Captures a screenshot matrix and asserts the invariants a screenshot cannot
 * show. Run: npm run check:visual [-- --url http://localhost:5173] [--states 0,5,10]
 */

import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, '.visual')

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 720 },
  { name: '1440', width: 1440, height: 900 },
]

/** Beginning, middle and end of every city, per the brief's validation list. */
const CITY_STATES = []
for (let city = 0; city < 6; city += 1) {
  CITY_STATES.push(
    { label: `c${city}-begin`, state: city * 5 + 0.2 },
    { label: `c${city}-mid`, state: city * 5 + 2.5 },
    { label: `c${city}-end`, state: city * 5 + 4.8 },
  )
}

/** The five interior boundaries, where city ownership must hand over cleanly. */
const BOUNDARIES = [5, 10, 15, 20, 25]

/**
 * `--quick` captures the screenshot matrix and the cheap per-state assertions
 * but skips the slow sweeps (fade-in-the-open, reverse symmetry, dot landing,
 * reduced motion). It is the iteration loop; the full run is the gate.
 */
function parseArgs(argv) {
  const args = { url: null, states: null, quick: false, only: null }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--url') args.url = argv[++i]
    else if (argv[i] === '--states') args.states = argv[++i].split(',').map(Number)
    else if (argv[i] === '--viewport') args.only = argv[++i]
    else if (argv[i] === '--quick') args.quick = true
  }
  return args
}

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Server did not start at ${url}`)
}

function startDevServer() {
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return child
}

/**
 * Count pixels that differ between two PNG buffers.
 *
 * A small per-channel threshold absorbs the last bit of antialiasing and
 * tone-mapping noise, which is not motion.
 */
async function pixelDelta(a, b) {
  const [rawA, rawB] = await Promise.all([
    sharp(a).raw().toBuffer({ resolveWithObject: true }),
    sharp(b).raw().toBuffer({ resolveWithObject: true }),
  ])

  const pixels = Math.min(rawA.data.length, rawB.data.length)
  const channels = rawA.info.channels
  let changed = 0

  for (let i = 0; i < pixels; i += channels) {
    for (let c = 0; c < Math.min(channels, 3); c += 1) {
      if (Math.abs(rawA.data[i + c] - rawB.data[i + c]) > 3) {
        changed += 1
        break
      }
    }
  }

  return { changed, total: pixels / channels }
}

/** Settle: let damping converge and a couple of frames actually render. */
async function settle(page, frames = 6) {
  await page.evaluate(
    (n) =>
      new Promise((done) => {
        let i = 0
        const tick = () => (i++ < n ? requestAnimationFrame(tick) : done())
        requestAnimationFrame(tick)
      }),
    frames,
  )
}

async function snapTo(page, state) {
  await page.evaluate((s) => window.__turningWorld.snapToState(s), state)
  await settle(page)
}

const failures = []
const notes = []

function check(condition, message) {
  if (!condition) failures.push(message)
}

async function runViewport(browser, viewport, states) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  const consoleIssues = []
  page.on('console', (message) => {
    const type = message.type()
    if (type === 'error' || type === 'warning') {
      consoleIssues.push(`[${type}] ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => consoleIssues.push(`[pageerror] ${error.message}`))

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__turningWorld?.ready?.() === true, null, {
    timeout: 45000,
  })
  await settle(page, 12)

  // --- Screenshot matrix + per-state assertions -----------------------------

  for (const entry of states) {
    await snapTo(page, entry.state)

    const info = await page.evaluate(() => window.__turningWorld.inspect())

    // The globe, atmosphere included, must fit inside the viewport at every
    // state and every width. This is measured, not eyeballed.
    check(
      info.globeScreenRadius <= info.viewportLimit,
      `${viewport.name}px @ ${entry.label}: globe clipped ` +
        `(radius ${info.globeScreenRadius.toFixed(1)}px > limit ${info.viewportLimit.toFixed(1)}px)`,
    )

    // No landmark belonging to an inactive city may be in the foreground.
    for (const city of info.cities) {
      if (city.presence > 0.02) continue
      for (const landmark of city.landmarks) {
        check(
          landmark.opacity < 0.02,
          `${viewport.name}px @ ${entry.label}: ${landmark.id} visible ` +
            `(opacity ${landmark.opacity.toFixed(2)}) while ${city.city} is inactive`,
        )
      }
    }

    if (args.quick) {
      const active = info.cities.filter((c) => c.presence > 0.01 || c.landmarks.some((l) => l.opacity > 0.01))
      console.log(
        `    ${entry.label} p=${info.progress.toFixed(2)} ` +
          `globe=${info.globeScreenRadius.toFixed(0)}/${info.viewportLimit.toFixed(0)} ` +
          active
            .map(
              (c) =>
                `${c.city}(${c.presence.toFixed(2)})[` +
                c.landmarks.map((l) => `${l.id}:${l.opacity.toFixed(2)}/${l.layer}`).join(' ') +
                ']',
            )
            .join(' '),
      )
    }

    await page.screenshot({ path: resolve(OUT, `${viewport.name}-${entry.label}.png`) })
  }

  if (args.quick) {
    reportConsole(viewport, consoleIssues)
    await context.close()
    return
  }

  // --- City ownership at each boundary --------------------------------------

  for (const boundary of BOUNDARIES) {
    await snapTo(page, boundary)
    const info = await page.evaluate(() => window.__turningWorld.inspect())
    const outgoing = info.cities[boundary / 5 - 1]

    for (const landmark of outgoing.landmarks) {
      check(
        landmark.opacity < 0.02 || landmark.layer === 'rear',
        `${viewport.name}px @ boundary ${boundary}: ${landmark.id} from ${outgoing.city} ` +
          `still in the front layer at opacity ${landmark.opacity.toFixed(2)}`,
      )
    }
  }

  // --- No fade in the open --------------------------------------------------
  //
  // Walk a city in small steps and record opacity together with the layer. A
  // change of more than a hair while an object is in the front layer means a
  // crossfade happened where the viewer could see it.

  {
    await snapTo(page, 0)
    const previous = new Map()
    let violations = 0

    for (let state = 0; state <= 5; state += 0.08) {
      await page.evaluate((s) => window.__turningWorld.snapToState(s), state)
      await settle(page, 2)
      const info = await page.evaluate(() => window.__turningWorld.inspect())

      for (const city of info.cities) {
        for (const landmark of city.landmarks) {
          const last = previous.get(landmark.id)
          // A change is only legitimate if the object was out of sight for it.
          if (last && Math.abs(landmark.opacity - last.opacity) > 0.02) {
            if (!landmark.occluded && !last.occluded) violations += 1
          }
          previous.set(landmark.id, {
            opacity: landmark.opacity,
            occluded: landmark.occluded,
          })
        }
      }
    }

    check(
      violations === 0,
      `${viewport.name}px: landmark opacity changed ${violations}× while in the front layer`,
    )
  }

  // --- Reverse symmetry -----------------------------------------------------

  {
    const forward = []
    for (let state = 0; state <= 5; state += 0.5) {
      await snapTo(page, state)
      forward.push(await page.evaluate(() => window.__turningWorld.inspect()))
    }

    const backward = []
    for (let state = 5; state >= 0; state -= 0.5) {
      await snapTo(page, state)
      backward.unshift(await page.evaluate(() => window.__turningWorld.inspect()))
    }

    let drift = 0
    for (let i = 0; i < forward.length; i += 1) {
      const a = forward[i].cities[0].landmarks
      const b = backward[i].cities[0].landmarks
      for (let j = 0; j < a.length; j += 1) {
        drift = Math.max(drift, Math.abs(a[j].opacity - b[j].opacity))
      }
    }

    check(
      drift < 0.02,
      `${viewport.name}px: reverse scroll diverged from forward by ${drift.toFixed(3)}`,
    )
  }

  // --- Stepper dots land inside their own city ------------------------------

  {
    const dots = await page.locator('.solar__dot').all()
    check(dots.length === 6, `${viewport.name}px: expected 6 stepper dots, found ${dots.length}`)

    for (let i = 0; i < dots.length; i += 1) {
      await snapTo(page, 0)
      await dots[i].click()
      // The jump is an eased 1.1s scroll, and the rendered progress is damped
      // behind it. Two separate things are being checked here: that the scroll
      // landed on exactly the right state, and that the render then converges.
      await page.waitForTimeout(1400)
      await settle(page, 4)

      const landed = await page.evaluate(() => window.__turningWorld.inspect())
      const expected = i * 5 + 0.5

      check(
        Math.abs(landed.targetProgress - expected) < 0.02,
        `${viewport.name}px: dot ${i} scrolled to ${landed.targetProgress.toFixed(3)}, ` +
          `expected ${expected}`,
      )

      await page.waitForTimeout(900)
      await settle(page, 4)
      const settled = await page.evaluate(() => window.__turningWorld.inspect().progress)
      check(
        Math.abs(settled - expected) < 0.1,
        `${viewport.name}px: dot ${i} still settling after 2.3s — at ${settled.toFixed(2)}, ` +
          `expected ${expected}`,
      )
    }
  }

  // --- Keyboard navigation --------------------------------------------------
  //
  // The stepper is a composite widget, so it must be a *single* tab stop with
  // arrow keys moving within it — six separate stops in a page that has almost
  // no other focusable content would be the wrong pattern.

  {
    // Start from a clean focus state. The dot-click pass above leaves focus on
    // the button it clicked, and the roving tab stop deliberately stays put
    // while the user has focus inside the widget — correct behaviour, but not
    // the state this test means to exercise.
    await page.evaluate(() => document.activeElement?.blur())
    await snapTo(page, 0)

    const tabStops = await page.evaluate(
      () =>
        document.querySelectorAll('.solar__dot[tabindex="0"]').length,
    )
    check(
      tabStops === 1,
      `${viewport.name}px: stepper exposes ${tabStops} tab stops, expected exactly 1`,
    )

    const roles = await page.evaluate(() => ({
      tablist: document.querySelectorAll('[role="tablist"]').length,
      tabs: document.querySelectorAll('[role="tab"]').length,
      selected: document.querySelectorAll('[role="tab"][aria-selected="true"]').length,
      live: document.querySelectorAll('[aria-live="polite"]').length,
    }))
    check(roles.tablist === 1, `${viewport.name}px: expected one tablist, found ${roles.tablist}`)
    check(roles.tabs === 6, `${viewport.name}px: expected six tabs, found ${roles.tabs}`)
    check(
      roles.selected === 1,
      `${viewport.name}px: expected exactly one selected tab, found ${roles.selected}`,
    )
    check(roles.live >= 1, `${viewport.name}px: no aria-live region announcing the city`)

    // Focus the stepper, walk right twice, and activate.
    await page.locator('.solar__dot[tabindex="0"]').focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    const focused = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.solar__dot')).indexOf(document.activeElement),
    )
    check(
      focused === 2,
      `${viewport.name}px: two ArrowRight presses left focus on dot ${focused}, expected 2`,
    )

    await page.keyboard.press('Enter')
    await page.waitForTimeout(1400)
    await settle(page, 4)

    const afterEnter = await page.evaluate(() => window.__turningWorld.inspect().targetProgress)
    check(
      Math.abs(afterEnter - 10.5) < 0.02,
      `${viewport.name}px: Enter on dot 2 scrolled to ${afterEnter.toFixed(2)}, expected 10.5`,
    )

    await page.keyboard.press('End')
    const atEnd = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.solar__dot')).indexOf(document.activeElement),
    )
    check(atEnd === 5, `${viewport.name}px: End left focus on dot ${atEnd}, expected 5`)

    await page.keyboard.press('Home')
    const atHome = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.solar__dot')).indexOf(document.activeElement),
    )
    check(atHome === 0, `${viewport.name}px: Home left focus on dot ${atHome}, expected 0`)
  }

  // --- Globe markers land inside their own city -----------------------------
  //
  // Distinct from the stepper dots: these are 3D objects hit-tested by
  // raycasting, and a marker on the far side of the Earth must correctly do
  // nothing rather than scrolling somewhere unexpected.

  {
    for (let city = 0; city < 6; city += 1) {
      // Park somewhere the target marker is on the near side. Its own city is
      // the reliable choice, since the globe recentres on it there.
      await snapTo(page, city * 5 + 2.5)

      const marker = (await page.evaluate(() => window.__turningWorld.inspect())).markers[city]
      if (!marker?.visible) continue

      await page.mouse.click(marker.x, marker.y)
      await page.waitForTimeout(1500)
      await settle(page, 4)

      const progress = await page.evaluate(() => window.__turningWorld.inspect().progress)
      const expected = city * 5 + 0.5
      check(
        Math.abs(progress - expected) < 0.25,
        `${viewport.name}px: globe marker ${city} landed at ${progress.toFixed(2)}, ` +
          `expected ${expected}`,
      )
    }
  }

  // --- Drag to rotate, and the decay back ------------------------------------
  //
  // The brief asks that the globe can be dragged. The contract has two halves:
  // the drag must actually turn it, and the offset must then decay so scroll
  // regains control before the next city — otherwise a user who spun the globe
  // once would leave the composition wrong for the rest of the journey.

  {
    await snapTo(page, 7.5)
    const before = await page.evaluate(() => window.__turningWorld.inspect().globe)

    const cx = viewport.width / 2
    const cy = viewport.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    for (let step = 1; step <= 10; step += 1) {
      await page.mouse.move(cx + step * 14, cy)
      await settle(page, 1)
    }
    await page.mouse.up()
    await settle(page, 3)

    const during = await page.evaluate(() => window.__turningWorld.inspect().globe)
    check(
      during.dragOffset > 0.05,
      `${viewport.name}px: dragging 140px produced a globe offset of only ` +
        `${during.dragOffset.toFixed(4)} rad`,
    )
    check(
      Math.abs(during.y - before.y) > 0.02,
      `${viewport.name}px: globe did not rotate on drag ` +
        `(${before.y.toFixed(3)} -> ${during.y.toFixed(3)})`,
    )

    // Decay runs at lambda 0.9, so ~5s takes the offset down by about 99%.
    await page.waitForTimeout(5000)
    await settle(page, 3)
    const after = await page.evaluate(() => window.__turningWorld.inspect().globe)
    check(
      after.dragOffset < during.dragOffset * 0.15,
      `${viewport.name}px: drag offset did not decay — ` +
        `${during.dragOffset.toFixed(3)} -> ${after.dragOffset.toFixed(3)} rad after 5s`,
    )
  }

  // --- Reduced motion: nothing moves on its own -----------------------------

  {
    await context.close()
    const reducedContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const reducedPage = await reducedContext.newPage()
    await reducedPage.goto(TARGET_URL, { waitUntil: 'domcontentloaded' })
    await reducedPage.waitForFunction(() => window.__turningWorld?.ready?.() === true, null, {
      timeout: 45000,
    })
    await snapTo(reducedPage, 7.5)
    await reducedPage.waitForTimeout(400)

    const first = await reducedPage.screenshot()
    await reducedPage.waitForTimeout(600)
    const second = await reducedPage.screenshot()

    // Compared as decoded pixels rather than PNG bytes. Byte equality is
    // all-or-nothing and tells you nothing about scale — a single pixel of
    // antialiasing jitter and a globe still spinning look identical. A count
    // distinguishes them.
    const { changed, total } = await pixelDelta(first, second)
    const fraction = changed / total

    check(
      fraction < 0.0005,
      `${viewport.name}px: ${(fraction * 100).toFixed(3)}% of pixels changed while idle ` +
        `under prefers-reduced-motion (${changed} of ${total})`,
    )
    // Reported even on success: a pass with the figure creeping upward is worth
    // seeing before it becomes a failure.
    notes.push(
      `${viewport.name}px: reduced-motion idle drift ${(fraction * 100).toFixed(4)}% ` +
        `(${changed} px)`,
    )

    await reducedContext.close()
  }

  reportConsole(viewport, consoleIssues)
}

function reportConsole(viewport, consoleIssues) {
  if (consoleIssues.length > 0) {
    failures.push(
      `${viewport.name}px: ${consoleIssues.length} console issue(s):\n    ` +
        [...new Set(consoleIssues)].slice(0, 10).join('\n    '),
    )
  } else {
    notes.push(`${viewport.name}px: console clean`)
  }
}

/**
 * Launch a real, GPU-backed browser.
 *
 * Headed, and on the locally installed Chrome by preference: Playwright's own
 * Chromium build is downloaded from a CDN that is not reachable here, and a
 * headless fallback would rasterise through SwiftShader — which would make the
 * alpha-edge, additive-blending and colour judgements this harness exists to
 * make completely meaningless.
 */
async function launchBrowser() {
  const options = {
    headless: false,
    args: [
      '--use-angle=d3d11',
      '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist',
      '--hide-scrollbars',
    ],
  }

  const channels = ['chrome', 'msedge']
  for (const channel of channels) {
    try {
      const browser = await chromium.launch({ ...options, channel })
      console.log(`Using installed ${channel}.`)
      return browser
    } catch {
      // Try the next one.
    }
  }

  console.log('Falling back to the bundled Chromium.')
  return chromium.launch(options)
}

const args = parseArgs(process.argv.slice(2))
const TARGET_URL = args.url ?? 'http://127.0.0.1:5173/'

async function main() {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  let server = null
  if (!args.url) {
    console.log('Starting dev server…')
    server = startDevServer()
  }
  await waitForServer(TARGET_URL)

  const states = args.states
    ? args.states.map((s) => ({ label: `s${s}`, state: s }))
    : CITY_STATES

  const browser = await launchBrowser()

  const targets = args.only
    ? VIEWPORTS.filter((viewport) => viewport.name === args.only)
    : VIEWPORTS

  try {
    for (const viewport of targets) {
      console.log(`\n▸ ${viewport.name}px (${viewport.width}×${viewport.height})`)
      await runViewport(browser, viewport, states)
    }
  } finally {
    await browser.close()
    if (server) server.kill()
  }

  const report = {
    when: new Date().toISOString(),
    url: TARGET_URL,
    passed: failures.length === 0,
    notes,
    failures,
  }
  await writeFile(resolve(OUT, 'report.json'), JSON.stringify(report, null, 2))

  console.log('\n' + '─'.repeat(60))
  for (const note of notes) console.log(`  ✓ ${note}`)
  for (const failure of failures) console.log(`  ✗ ${failure}`)

  if (failures.length > 0) {
    console.log(`\n${failures.length} failure(s). Screenshots in .visual/`)
    process.exitCode = 1
  } else {
    console.log(`\nAll checks passed. Screenshots in .visual/`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
