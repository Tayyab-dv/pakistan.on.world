import type { LandmarkArt } from '../types'

/**
 * Faisal Mosque, Islamabad.
 *
 * The identifying form is the eight-faced folded tent — a Bedouin tent
 * abstracted into concrete — with four very tall, very slender minarets at its
 * corners. Both are essential: the tent alone could be any modernist roof, and
 * the minarets alone could be any mosque. Seen three-quarters on, three faces
 * of the tent are visible and the rear pair of minarets is partly occluded by
 * it, which is what gives the silhouette its depth.
 *
 * Layer order matters: rear minarets are painted first so the tent covers their
 * lower halves, and the front pair last so they stand clear of it.
 */
export const faisalMosque: LandmarkArt = {
  id: 'faisal-mosque',
  viewBox: { width: 1000, height: 800 },
  baseline: 0.955,
  layers: [
    // Rear pair of minarets, in shadow and partly hidden by the tent.
    {
      role: 'shade',
      path:
        'M 319 762 L 319 192 L 315 192 L 330 148 L 345 192 L 341 192 L 341 762 Z ' +
        'M 312 300 L 348 300 L 348 320 L 312 320 Z ' +
        'M 659 762 L 659 192 L 655 192 L 670 148 L 685 192 L 681 192 L 681 762 Z ' +
        'M 652 300 L 688 300 L 688 320 L 652 320 Z',
    },

    // The tent: overall mass first, then the individual folded faces on top.
    { role: 'silhouette', path: 'M 500 285 L 752 700 L 744 726 L 256 726 L 248 700 Z' },
    { role: 'highlight', path: 'M 500 285 L 248 700 L 256 726 L 400 726 Z', opacity: 0.85 },
    { role: 'shade', path: 'M 500 285 L 620 726 L 744 726 L 752 700 Z', opacity: 0.9 },

    // Fold seams. Narrow wedges rather than strokes, so they taper toward the
    // apex exactly as the real creases do.
    {
      role: 'detail',
      path:
        'M 500 285 L 404 726 L 396 726 Z ' +
        'M 500 285 L 624 726 L 616 726 Z ' +
        'M 500 285 L 254 706 L 246 694 Z ' +
        'M 500 285 L 746 694 L 754 706 Z',
      opacity: 0.55,
    },

    // Shadow line where the tent meets its platform.
    { role: 'detail', path: 'M 256 718 L 744 718 L 744 726 L 256 726 Z', opacity: 0.45 },

    // Platform and steps.
    { role: 'silhouette', path: 'M 200 726 L 800 726 L 814 766 L 186 766 Z' },
    { role: 'detail', path: 'M 210 744 L 790 744 L 792 752 L 208 752 Z', opacity: 0.4 },

    // Front pair of minarets, standing clear of the tent.
    {
      role: 'silhouette',
      path:
        'M 132 764 L 132 118 L 127 118 L 150 68 L 173 118 L 168 118 L 168 764 Z ' +
        'M 832 764 L 832 118 L 827 118 L 850 68 L 873 118 L 868 118 L 868 764 Z',
    },
    // Balconies.
    {
      role: 'detail',
      path:
        'M 124 250 L 176 250 L 176 272 L 124 272 Z ' +
        'M 824 250 L 876 250 L 876 272 L 824 272 Z',
      opacity: 0.6,
    },
    // Lit edge down the sunward side of each front minaret.
    {
      role: 'highlight',
      path: 'M 132 764 L 132 118 L 140 118 L 140 764 Z M 832 764 L 832 118 L 840 118 L 840 764 Z',
      opacity: 0.7,
    },

    // Finial at the apex of the tent.
    { role: 'accent', path: 'M 494 286 L 506 286 L 503 258 L 500 244 L 497 258 Z' },
  ],
}
