import type { LandmarkArt } from '../types'

/**
 * Faisal Mosque, Islamabad.
 *
 * Two features carry the recognition and both have to be explicit:
 *
 *   The folded tent. An eight-sided pyramid of flat planes, not a cone. Drawn
 *   as five separate facets stepping from light on the sunward side through to
 *   deep shadow, with a dark seam between each pair. Rendered as a single
 *   smooth triangle — as an earlier version was — it reads as a generic pyramid
 *   and the building disappears.
 *
 *   The minarets. Four of them, extremely slender, and much taller than the
 *   tent. The brief mentions one, but Faisal Mosque without its minarets is not
 *   identifiable as Faisal Mosque, so all four are here: the front pair clear
 *   of the tent, the rear pair partly behind it for depth.
 */
export const faisalMosque: LandmarkArt = {
  id: 'faisal-mosque',
  viewBox: { width: 1000, height: 800 },
  baseline: 0.955,
  layers: [
    // Rear pair of minarets. Painted first so the tent occludes their lower
    // halves, which is what gives the group depth.
    {
      role: 'detail',
      path:
        'M 322 762 L 322 196 L 318 196 L 326 176 L 330 150 L 334 176 L 342 196 L 338 196 L 338 762 Z ' +
        'M 314 306 L 346 306 L 346 322 L 314 322 Z ' +
        'M 662 762 L 662 196 L 658 196 L 666 176 L 670 150 L 674 176 L 682 196 L 678 196 L 678 762 Z ' +
        'M 654 306 L 686 306 L 686 322 L 654 322 Z',
    },

    // The tent, facet by facet, sunward side first. The five planes read as
    // folds because their tones step, not because of any outline.
    { role: 'shade', path: 'M 500 282 L 248 700 L 256 726 L 352 726 Z' },
    { role: 'silhouette', path: 'M 500 282 L 352 726 L 452 728 Z' },
    { role: 'highlight', path: 'M 500 282 L 452 728 L 552 728 Z' },
    { role: 'shade', path: 'M 500 282 L 552 728 L 652 726 Z', opacity: 0.85 },
    { role: 'detail', path: 'M 500 282 L 652 726 L 744 726 L 752 700 Z' },

    // Seams. Narrow wedges converging on the apex, so they taper exactly as the
    // real creases do rather than sitting at constant width.
    {
      role: 'detail',
      path:
        'M 500 282 L 348 726 L 356 726 Z ' +
        'M 500 282 L 448 728 L 456 728 Z ' +
        'M 500 282 L 548 728 L 556 728 Z ' +
        'M 500 282 L 648 726 L 656 726 Z',
      opacity: 0.75,
    },

    // Shadow where the tent meets its platform.
    { role: 'detail', path: 'M 256 716 L 744 716 L 744 728 L 256 728 Z', opacity: 0.5 },

    // Platform and steps.
    { role: 'silhouette', path: 'M 200 728 L 800 728 L 814 766 L 186 766 Z', opacity: 0.9 },
    { role: 'detail', path: 'M 210 746 L 790 746 L 792 754 L 208 754 Z', opacity: 0.45 },

    // Front pair. Narrow shafts, a balcony, and a tapered cap with a finial.
    {
      role: 'silhouette',
      path:
        'M 132 764 L 132 122 L 125 122 L 138 94 L 150 58 L 162 94 L 175 122 L 168 122 L 168 764 Z ' +
        'M 832 764 L 832 122 L 825 122 L 838 94 L 850 58 L 862 94 L 875 122 L 868 122 L 868 764 Z',
    },
    // Balconies.
    {
      role: 'shade',
      path:
        'M 120 256 L 180 256 L 180 280 L 120 280 Z ' +
        'M 820 256 L 880 256 L 880 280 L 820 280 Z',
    },
    // Lit edge down the sunward flank of each front minaret, and the shaded
    // flank opposite — the pair is what gives a slim cylinder its roundness.
    {
      role: 'highlight',
      path:
        'M 132 764 L 132 122 L 143 122 L 143 764 Z ' +
        'M 832 764 L 832 122 L 843 122 L 843 764 Z',
    },
    {
      role: 'shade',
      path:
        'M 161 764 L 161 122 L 168 122 L 168 764 Z ' +
        'M 861 764 L 861 122 L 868 122 L 868 764 Z',
    },

    // Finials: the minaret tips and the crown of the tent.
    {
      role: 'accent',
      path:
        'M 494 284 L 506 284 L 503 254 L 500 238 L 497 254 Z ' +
        'M 146 60 L 154 60 L 153 38 L 150 28 L 147 38 Z ' +
        'M 846 60 L 854 60 L 853 38 L 850 28 L 847 38 Z',
    },
  ],
}
