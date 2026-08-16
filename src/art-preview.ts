/**
 * Landmark art contact sheet — development tool, not part of the application.
 *
 * Served at /art.html. Renders every landmark through the same pipeline the
 * scene uses, at its own city's theme and sun angle, over a checkerboard so
 * stray fills and edge halos are obvious. Authoring a landmark against the full
 * 3D scene means a slow loop and an object that might be small, occluded, or
 * off-frame; this shows the art itself.
 */

import { badshahiMosque } from './art/landmarks/badshahi-mosque'
import { faisalMosque } from './art/landmarks/faisal-mosque'
import { fishingDhow } from './art/landmarks/fishing-dhow'
import { k2 } from './art/landmarks/k2'
import { kohEBatilLighthouse } from './art/landmarks/koh-e-batil-lighthouse'
import { mazarEQuaid } from './art/landmarks/mazar-e-quaid'
import { merewetherClock } from './art/landmarks/merewether-clock'
import { minarEPakistan } from './art/landmarks/minar-e-pakistan'
import { pakistanMonument } from './art/landmarks/pakistan-monument'
import { shigarFort } from './art/landmarks/shigar-fort'
import { renderLandmark } from './art/render'
import type { LandmarkArt } from './art/types'
import { KEYFRAMES } from './cities/keyframes'
import { CITIES, STATES_PER_CITY } from './cities'
import type { CityId } from './cities'
import { THEMES } from './cities/themes'

const ENTRIES: ReadonlyArray<{ art: LandmarkArt; city: CityId }> = [
  { art: faisalMosque, city: 'islamabad' },
  { art: pakistanMonument, city: 'islamabad' },
  { art: mazarEQuaid, city: 'karachi' },
  { art: merewetherClock, city: 'karachi' },
  { art: badshahiMosque, city: 'lahore' },
  { art: minarEPakistan, city: 'lahore' },
  // Peshawar is deliberately absent: it stays entirely procedural.
  { art: kohEBatilLighthouse, city: 'gwadar' },
  { art: fishingDhow, city: 'gwadar' },
  { art: k2, city: 'skardu' },
  { art: shigarFort, city: 'skardu' },
]

function lightXFor(city: CityId): number {
  const index = CITIES.findIndex((c) => c.id === city)
  const keyframe = KEYFRAMES[Math.max(0, index) * STATES_PER_CITY]!
  return Math.sin(keyframe.sunAz) * Math.cos(keyframe.sunEl)
}

/** Proportion of non-transparent pixels — a blank result means broken paths. */
function coverage(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let painted = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! > 8) painted += 1
  }
  return painted / (canvas.width * canvas.height)
}

const grid = document.getElementById('grid')!

for (const entry of ENTRIES) {
  const theme = THEMES[entry.city]
  const { texture } = renderLandmark(entry.art, theme, lightXFor(entry.city), 640)
  const source = texture.image as HTMLCanvasElement

  const figure = document.createElement('figure')
  const frame = document.createElement('div')
  frame.className = 'frame'
  frame.appendChild(source)

  const filled = coverage(source)
  const caption = document.createElement('figcaption')
  caption.textContent =
    `${entry.art.id} · ${entry.city} · ${source.width}×${source.height} · ` +
    `${(filled * 100).toFixed(1)}% painted · ${entry.art.layers.length} layers`
  if (filled < 0.02) {
    caption.classList.add('bad')
    caption.textContent += '  ← essentially blank'
  }

  figure.append(frame, caption)
  grid.appendChild(figure)
}
