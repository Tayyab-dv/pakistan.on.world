import type { LandmarkArt } from '../types'

/**
 * Badshahi Mosque, Lahore.
 *
 * Red sandstone with white marble: three bulbous onion domes over a broad
 * arcaded facade, a tall central iwan, and four corner minarets. The building
 * is far wider than it is tall, so it is authored in a wide frame — squeezing
 * it into a square one would either shrink the domes to nothing or crop the
 * minarets, and both are load-bearing for recognition.
 *
 * The onion profile matters: each dome must bulge *wider* than the drum it
 * stands on before narrowing to its finial. A plain hemisphere reads as a
 * different building entirely.
 */
export const badshahiMosque: LandmarkArt = {
  id: 'badshahi-mosque',
  viewBox: { width: 1400, height: 800 },
  baseline: 0.955,
  layers: [
    // Corner minarets, outer pair behind the facade line.
    {
      role: 'shade',
      path:
        'M 96 748 L 96 214 L 88 214 L 108 178 L 122 148 L 136 178 L 156 214 L 148 214 L 148 748 Z ' +
        'M 1252 748 L 1252 214 L 1244 214 L 1264 178 L 1278 148 L 1292 178 L 1312 214 L 1304 214 L 1304 748 Z',
    },
    // Small pavilions crowning the minarets.
    {
      role: 'detail',
      path:
        'M 84 218 L 160 218 L 160 236 L 84 236 Z ' +
        'M 1240 218 L 1316 218 L 1316 236 L 1240 236 Z',
      opacity: 0.7,
    },

    // Side domes: onion profile on a narrow drum.
    { role: 'shade', path: 'M 386 466 C 344 400 366 322 434 312 C 502 322 524 400 482 466 Z' },
    { role: 'shade', path: 'M 918 466 C 876 400 898 322 966 312 C 1034 322 1056 400 1014 466 Z' },
    { role: 'detail', path: 'M 396 458 L 472 458 L 472 478 L 396 478 Z M 928 458 L 1004 458 L 1004 478 L 928 478 Z' },

    // Central dome: larger, taller, and the brightest thing in the composition.
    { role: 'silhouette', path: 'M 610 456 C 550 366 584 262 700 250 C 816 262 850 366 790 456 Z' },
    {
      role: 'highlight',
      path: 'M 610 456 C 556 372 580 274 674 254 C 616 300 590 380 630 456 Z',
    },
    { role: 'shade', path: 'M 754 456 C 800 378 782 300 726 254 C 820 274 850 366 790 456 Z', opacity: 0.9 },
    { role: 'detail', path: 'M 620 448 L 780 448 L 780 470 L 620 470 Z' },

    // Facade: a long arcade with the taller iwan at its centre.
    { role: 'silhouette', path: 'M 180 470 L 1220 470 L 1220 748 L 180 748 Z' },
    { role: 'shade', path: 'M 940 470 L 1220 470 L 1220 748 L 940 748 Z', opacity: 0.88 },

    // Central iwan: the great pointed recess, rising above the arcade line.
    { role: 'silhouette', path: 'M 592 748 L 592 400 L 808 400 L 808 748 Z' },
    {
      role: 'detail',
      path: 'M 624 748 L 624 556 Q 624 452 700 430 Q 776 452 776 556 L 776 748 Z',
    },
    { role: 'highlight', path: 'M 592 400 L 808 400 L 808 420 L 592 420 Z', opacity: 0.8 },

    // Arcade of smaller pointed arches either side of the iwan.
    {
      role: 'detail',
      path:
        'M 236 748 L 236 604 Q 236 552 274 542 Q 312 552 312 604 L 312 748 Z ' +
        'M 344 748 L 344 604 Q 344 552 382 542 Q 420 552 420 604 L 420 748 Z ' +
        'M 452 748 L 452 604 Q 452 552 490 542 Q 528 552 528 604 L 528 748 Z ' +
        'M 872 748 L 872 604 Q 872 552 910 542 Q 948 552 948 604 L 948 748 Z ' +
        'M 980 748 L 980 604 Q 980 552 1018 542 Q 1056 552 1056 604 L 1056 748 Z ' +
        'M 1088 748 L 1088 604 Q 1088 552 1126 542 Q 1164 552 1164 604 L 1164 748 Z',
      opacity: 0.9,
    },

    // Parapet.
    { role: 'highlight', path: 'M 180 470 L 1220 470 L 1220 490 L 180 490 Z', opacity: 0.72 },

    // Platform.
    { role: 'silhouette', path: 'M 120 748 L 1280 748 L 1300 780 L 100 780 Z', opacity: 0.9 },
    { role: 'detail', path: 'M 112 762 L 1288 762 L 1290 770 L 110 770 Z', opacity: 0.4 },

    // Finials on all three domes and both minarets.
    {
      role: 'accent',
      path:
        'M 694 252 L 706 252 L 704 218 L 700 200 L 696 218 Z ' +
        'M 429 314 L 439 314 L 437 288 L 434 274 L 431 288 Z ' +
        'M 961 314 L 971 314 L 969 288 L 966 274 L 963 288 Z ' +
        'M 118 150 L 126 150 L 125 126 L 122 114 L 119 126 Z ' +
        'M 1274 150 L 1282 150 L 1281 126 L 1278 114 L 1275 126 Z',
    },
  ],
}
