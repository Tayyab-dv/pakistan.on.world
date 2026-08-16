import type { LandmarkArt } from '../types'

/**
 * Koh-e-Batil lighthouse, Gwadar.
 *
 * A small white tower on the flat-topped hammerhead cliff that shelters Gwadar
 * harbour. The cliff is as much of the identification as the tower — Koh-e-Batil
 * is a mesa, sheer-sided and level on top, so the profile is a hard horizontal
 * shelf rather than a rounded headland.
 */
export const kohEBatilLighthouse: LandmarkArt = {
  id: 'koh-e-batil-lighthouse',
  viewBox: { width: 1000, height: 800 },
  baseline: 0.94,
  layers: [
    // The mesa: a level top with sheer, faceted flanks falling to the sea.
    { role: 'shade', path: 'M 96 752 L 168 470 L 828 452 L 918 752 Z' },
    {
      role: 'silhouette',
      path: 'M 168 470 L 828 452 L 836 486 L 176 502 Z',
      opacity: 0.85,
    },
    // Wind-cut facets down the cliff face.
    {
      role: 'detail',
      path:
        'M 232 752 L 268 490 L 300 492 L 286 752 Z ' +
        'M 470 752 L 480 486 L 512 486 L 512 752 Z ' +
        'M 690 752 L 672 466 L 704 464 L 736 752 Z',
      opacity: 0.45,
    },
    { role: 'highlight', path: 'M 168 470 L 232 470 L 190 752 L 96 752 Z', opacity: 0.35 },

    // Tower: tapering, banded, with a gallery and lantern room.
    { role: 'silhouette', path: 'M 466 470 L 534 470 L 524 214 L 476 214 Z' },
    { role: 'shade', path: 'M 508 470 L 534 470 L 524 214 L 506 214 Z', opacity: 0.9 },
    { role: 'highlight', path: 'M 466 470 L 486 470 L 490 214 L 476 214 Z' },
    // The characteristic painted bands.
    {
      role: 'detail',
      path:
        'M 470 396 L 530 396 L 530 428 L 470 428 Z ' +
        'M 476 292 L 524 292 L 524 322 L 476 322 Z',
      opacity: 0.6,
    },

    // Gallery, lantern room, and cap.
    { role: 'shade', path: 'M 462 214 L 538 214 L 538 196 L 462 196 Z' },
    { role: 'detail', path: 'M 476 196 L 524 196 L 524 146 L 476 146 Z' },
    { role: 'shade', path: 'M 466 146 L 534 146 L 500 108 Z' },

    // The light itself — the one thing on this cliff that should glow.
    { role: 'accent', path: 'M 484 190 L 516 190 L 516 152 L 484 152 Z' },
    { role: 'accent', path: 'M 496 108 L 504 108 L 502 84 L 500 74 L 498 84 Z' },

    // A small keeper's outbuilding, for scale.
    { role: 'shade', path: 'M 596 470 L 682 470 L 682 424 L 639 404 L 596 424 Z' },
    { role: 'detail', path: 'M 620 470 L 640 470 L 640 440 L 620 440 Z', opacity: 0.7 },
  ],
}
