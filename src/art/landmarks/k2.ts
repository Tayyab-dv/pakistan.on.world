import type { LandmarkArt } from '../types'

/**
 * K2, Skardu.
 *
 * The Savage Mountain reads as one thing above all: an almost perfect pyramid,
 * steeper than any peak around it, rising clear of its neighbours on every
 * side. Three features carry it — the near-symmetrical summit pyramid, the
 * sharp Abruzzi ridge running down the right flank as a lit edge against a
 * shadowed face, and the snow that clings only to the upper third while the
 * lower rock stays bare.
 *
 * Treated as a backdrop rather than a foreground object: authored wide, with
 * subsidiary peaks and a glacier base, so it can sit high and far behind the
 * globe at a scale no piece of architecture would take.
 */
export const k2: LandmarkArt = {
  id: 'k2',
  viewBox: { width: 1400, height: 900 },
  baseline: 0.98,
  layers: [
    // Subsidiary peaks, well below the summit and far back in the haze.
    { role: 'detail', path: 'M 60 880 L 236 470 L 330 604 L 412 512 L 566 880 Z', opacity: 0.55 },
    { role: 'detail', path: 'M 940 880 L 1090 496 L 1178 620 L 1256 540 L 1372 880 Z', opacity: 0.5 },

    // The summit pyramid: the whole mass, then its two faces.
    { role: 'silhouette', path: 'M 700 62 L 1146 880 L 254 880 Z' },
    // South-east face, turned away from the sun.
    { role: 'shade', path: 'M 700 62 L 1146 880 L 690 880 Z' },
    // Sunlit west face.
    { role: 'highlight', path: 'M 700 62 L 254 880 L 486 880 Z', opacity: 0.55 },

    // The Abruzzi ridge: a hard lit line separating the two faces.
    { role: 'highlight', path: 'M 700 62 L 918 462 L 890 470 L 692 96 Z' },
    { role: 'detail', path: 'M 918 462 L 1146 880 L 1104 880 L 890 470 Z', opacity: 0.6 },

    // Rock ribs and couloirs on the shaded face.
    {
      role: 'detail',
      path:
        'M 760 880 L 700 300 L 722 300 L 800 880 Z ' +
        'M 880 880 L 790 420 L 810 418 L 926 880 Z ' +
        'M 1000 880 L 900 570 L 918 566 L 1046 880 Z',
      opacity: 0.42,
    },
    {
      role: 'shade',
      path: 'M 470 880 L 632 320 L 652 322 L 540 880 Z',
      opacity: 0.5,
    },

    // Summit snow: only the upper third, following the pyramid's taper.
    { role: 'accent', path: 'M 700 62 L 828 296 L 780 320 L 700 262 L 622 322 L 574 298 Z', opacity: 0.5 },
    {
      role: 'highlight',
      path: 'M 700 62 L 826 294 L 776 316 L 700 258 L 624 318 L 576 296 Z',
    },
    // Snow reaching a little way down the gullies below the snow line. Kept
    // short and faint: run further and they read as painted stripes across the
    // face rather than as snow lying in the couloirs.
    {
      role: 'highlight',
      path:
        'M 662 330 L 674 330 L 668 392 L 656 390 Z ' +
        'M 744 336 L 756 338 L 766 400 L 752 400 Z',
      opacity: 0.28,
    },

    // Glacier and moraine at the foot.
    { role: 'shade', path: 'M 120 880 L 1300 880 L 1330 898 L 90 898 Z' },
    { role: 'detail', path: 'M 300 884 L 1120 884 L 1122 892 L 298 892 Z', opacity: 0.4 },
  ],
}
