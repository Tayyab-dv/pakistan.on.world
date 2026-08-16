import type { LandmarkArt } from '../types'

/**
 * Merewether Clock Tower, Karachi.
 *
 * Gothic Revival in yellow Karachi stone: a stepped base, a tapering shaft
 * broken by string courses, a clock stage, an open belfry with pointed arches,
 * and a steep spire with corner pinnacles. Tall and narrow, so it is authored
 * in a portrait frame rather than the square one the other landmarks use.
 */
export const merewetherClock: LandmarkArt = {
  id: 'merewether-clock',
  viewBox: { width: 600, height: 1000 },
  baseline: 0.965,
  layers: [
    // Spire, with a lit face and a shaded one.
    { role: 'silhouette', path: 'M 196 300 L 300 62 L 404 300 Z' },
    { role: 'shade', path: 'M 300 62 L 404 300 L 300 300 Z' },
    { role: 'highlight', path: 'M 300 62 L 232 300 L 300 300 Z', opacity: 0.6 },

    // Corner pinnacles flanking the spire.
    {
      role: 'shade',
      path:
        'M 172 300 L 172 236 L 184 210 L 196 236 L 196 300 Z ' +
        'M 404 300 L 404 236 L 416 210 L 428 236 L 428 300 Z',
    },

    // Belfry: two pointed openings under a cornice.
    { role: 'silhouette', path: 'M 186 300 L 414 300 L 414 470 L 186 470 Z' },
    {
      role: 'detail',
      path:
        'M 214 470 L 214 372 Q 214 340 244 332 Q 274 340 274 372 L 274 470 Z ' +
        'M 326 470 L 326 372 Q 326 340 356 332 Q 386 340 386 372 L 386 470 Z',
    },
    { role: 'highlight', path: 'M 180 294 L 420 294 L 420 312 L 180 312 Z', opacity: 0.85 },

    // Clock stage. The dial is the single most identifying element, so it is
    // given the accent rather than being left as another stone-toned circle.
    { role: 'silhouette', path: 'M 180 470 L 420 470 L 420 620 L 180 620 Z' },
    { role: 'shade', path: 'M 348 470 L 420 470 L 420 620 L 348 620 Z', opacity: 0.9 },
    { role: 'detail', path: 'M 300 480 m -62 65 a 62 65 0 1 0 124 0 a 62 65 0 1 0 -124 0 Z' },
    { role: 'accent', path: 'M 300 490 m -50 55 a 50 55 0 1 0 100 0 a 50 55 0 1 0 -100 0 Z', opacity: 0.6 },
    {
      role: 'detail',
      path: 'M 296 512 L 304 512 L 304 548 L 296 548 Z M 300 540 L 336 540 L 336 548 L 300 548 Z',
    },
    { role: 'highlight', path: 'M 174 464 L 426 464 L 426 482 L 174 482 Z', opacity: 0.85 },

    // Tapering shaft with string courses.
    { role: 'silhouette', path: 'M 194 620 L 406 620 L 424 862 L 176 862 Z' },
    { role: 'shade', path: 'M 344 620 L 406 620 L 424 862 L 356 862 Z', opacity: 0.9 },
    { role: 'highlight', path: 'M 194 620 L 236 620 L 226 862 L 176 862 Z', opacity: 0.62 },
    {
      role: 'detail',
      path:
        'M 190 690 L 410 690 L 412 704 L 188 704 Z ' +
        'M 184 782 L 416 782 L 418 796 L 182 796 Z ' +
        'M 262 726 L 338 726 L 340 770 L 260 770 Z',
      opacity: 0.55,
    },

    // Base and steps.
    { role: 'silhouette', path: 'M 160 862 L 440 862 L 452 934 L 148 934 Z', opacity: 0.92 },
    { role: 'shade', path: 'M 124 934 L 476 934 L 492 970 L 108 970 Z' },
    { role: 'detail', path: 'M 134 948 L 466 948 L 468 956 L 132 956 Z', opacity: 0.4 },

    // Finial.
    { role: 'accent', path: 'M 296 64 L 304 64 L 302 36 L 300 22 L 298 36 Z' },
  ],
}
