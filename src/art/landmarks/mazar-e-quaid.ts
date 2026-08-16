import type { LandmarkArt } from '../types'

/**
 * Mazar-e-Quaid — Jinnah's Mausoleum, Karachi.
 *
 * A white marble cube with chamfered corners under a single large dome,
 * pierced on every face by tall pointed Moorish arches, standing on a broad
 * raised platform. The proportion is the recognition: the dome is nearly as
 * wide as the cube it sits on, and the arches run almost the full height of
 * the wall.
 */
export const mazarEQuaid: LandmarkArt = {
  id: 'mazar-e-quaid',
  viewBox: { width: 1000, height: 800 },
  baseline: 0.96,
  layers: [
    // Dome, drum, then the cube — painted back to front so the drum reads as
    // tucked under the dome's spring line.
    { role: 'silhouette', path: 'M 344 408 C 336 292 400 228 500 224 C 600 228 664 292 656 408 Z' },
    {
      role: 'shade',
      path: 'M 560 408 C 592 320 588 260 540 230 C 600 236 664 292 656 408 Z',
      opacity: 0.9,
    },
    { role: 'highlight', path: 'M 344 408 C 336 300 388 240 462 228 C 410 268 380 330 386 408 Z' },

    { role: 'shade', path: 'M 340 408 L 660 408 L 660 448 L 340 448 Z' },

    // Cube with chamfered corners.
    { role: 'silhouette', path: 'M 300 448 L 700 448 L 700 682 L 660 706 L 340 706 L 300 682 Z' },
    { role: 'shade', path: 'M 596 448 L 700 448 L 700 682 L 660 706 L 596 706 Z', opacity: 0.92 },
    { role: 'highlight', path: 'M 300 448 L 372 448 L 372 706 L 340 706 L 300 682 Z', opacity: 0.7 },

    // Pointed arches: one tall central opening flanked by two narrower ones.
    {
      role: 'detail',
      path:
        'M 442 706 L 442 560 Q 442 486 500 470 Q 558 486 558 560 L 558 706 Z ' +
        'M 368 706 L 368 588 Q 368 536 404 526 Q 440 536 440 588 L 440 706 Z ' +
        'M 560 706 L 560 588 Q 560 536 596 526 Q 632 536 632 588 L 632 706 Z',
    },

    // Cornice above the arches and the band at the dome's base.
    { role: 'highlight', path: 'M 300 448 L 700 448 L 700 464 L 300 464 Z', opacity: 0.8 },
    { role: 'accent', path: 'M 338 400 L 662 400 L 662 412 L 338 412 Z', opacity: 0.55 },

    // Platform and steps.
    { role: 'silhouette', path: 'M 230 706 L 770 706 L 786 740 L 214 740 Z', opacity: 0.9 },
    { role: 'shade', path: 'M 176 740 L 824 740 L 844 772 L 156 772 Z' },
    { role: 'detail', path: 'M 186 754 L 814 754 L 816 762 L 184 762 Z', opacity: 0.4 },

    // Finial crowning the dome.
    { role: 'accent', path: 'M 494 226 L 506 226 L 504 196 L 500 178 L 496 196 Z' },
  ],
}
