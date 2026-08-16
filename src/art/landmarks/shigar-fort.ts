import type { LandmarkArt } from '../types'

/**
 * Shigar Fort, Skardu.
 *
 * Balti architecture: dry stone below, cribbed timber above, flat roofs, and a
 * stepped massing that climbs a rock outcrop rather than standing on level
 * ground. The tell is the projecting wooden balcony band running across the
 * upper floor, dark against the pale stone, and the small deep-set windows —
 * the fort is defensive, so the openings are few and narrow.
 */
export const shigarFort: LandmarkArt = {
  id: 'shigar-fort',
  viewBox: { width: 1000, height: 800 },
  baseline: 0.96,
  layers: [
    // The rock the fort is built onto — Shigar's "Fong-Khar", palace on the rock.
    { role: 'shade', path: 'M 60 770 L 168 634 L 300 596 L 700 604 L 858 660 L 940 770 Z' },
    {
      role: 'detail',
      path: 'M 176 770 L 250 646 L 286 650 L 236 770 Z M 740 770 L 792 654 L 826 668 L 830 770 Z',
      opacity: 0.4,
    },

    // Lower wing, stepping down to the left.
    { role: 'silhouette', path: 'M 196 640 L 386 640 L 386 470 L 196 470 Z' },
    { role: 'shade', path: 'M 340 640 L 386 640 L 386 470 L 340 470 Z', opacity: 0.9 },
    { role: 'detail', path: 'M 188 470 L 394 470 L 394 452 L 188 452 Z' },

    // Main block.
    { role: 'silhouette', path: 'M 356 640 L 660 640 L 660 306 L 356 306 Z' },
    { role: 'shade', path: 'M 588 640 L 660 640 L 660 306 L 588 306 Z', opacity: 0.9 },
    { role: 'highlight', path: 'M 356 640 L 404 640 L 404 306 L 356 306 Z', opacity: 0.6 },

    // Tower, the tallest element, set to the right.
    { role: 'silhouette', path: 'M 630 640 L 796 640 L 796 224 L 630 224 Z' },
    { role: 'shade', path: 'M 740 640 L 796 640 L 796 224 L 740 224 Z', opacity: 0.92 },
    { role: 'highlight', path: 'M 630 640 L 662 640 L 662 224 L 630 224 Z', opacity: 0.55 },

    // Projecting flat roofs with their timber overhangs.
    { role: 'detail', path: 'M 344 306 L 672 306 L 672 284 L 344 284 Z' },
    { role: 'detail', path: 'M 618 224 L 808 224 L 808 202 L 618 202 Z' },
    // Roof beam ends, the row of dark dots under every Balti eave.
    {
      role: 'detail',
      path:
        'M 366 284 L 380 284 L 380 296 L 366 296 Z M 406 284 L 420 284 L 420 296 L 406 296 Z ' +
        'M 446 284 L 460 284 L 460 296 L 446 296 Z M 486 284 L 500 284 L 500 296 L 486 296 Z ' +
        'M 526 284 L 540 284 L 540 296 L 526 296 Z M 566 284 L 580 284 L 580 296 L 566 296 Z ' +
        'M 606 284 L 620 284 L 620 296 L 606 296 Z',
      opacity: 0.75,
    },

    // The projecting timber balcony — the single most Balti thing here.
    { role: 'shade', path: 'M 336 434 L 680 434 L 680 372 L 336 372 Z' },
    { role: 'detail', path: 'M 330 372 L 686 372 L 686 386 L 330 386 Z' },
    {
      role: 'accent',
      path:
        'M 356 428 L 366 428 L 366 386 L 356 386 Z M 396 428 L 406 428 L 406 386 L 396 386 Z ' +
        'M 436 428 L 446 428 L 446 386 L 436 386 Z M 476 428 L 486 428 L 486 386 L 476 386 Z ' +
        'M 516 428 L 526 428 L 526 386 L 516 386 Z M 556 428 L 566 428 L 566 386 L 556 386 Z ' +
        'M 596 428 L 606 428 L 606 386 L 596 386 Z M 636 428 L 646 428 L 646 386 L 636 386 Z',
      opacity: 0.45,
    },
    { role: 'shade', path: 'M 620 340 L 800 340 L 800 296 L 620 296 Z', opacity: 0.85 },

    // Small deep-set windows.
    {
      role: 'detail',
      path:
        'M 424 574 L 456 574 L 456 522 L 424 522 Z M 512 574 L 544 574 L 544 522 L 512 522 Z ' +
        'M 240 596 L 268 596 L 268 550 L 240 550 Z M 306 596 L 334 596 L 334 550 L 306 550 Z ' +
        'M 676 574 L 704 574 L 704 526 L 676 526 Z M 738 574 L 766 574 L 766 526 L 738 526 Z ' +
        'M 676 274 L 700 274 L 700 240 L 676 240 Z M 730 274 L 754 274 L 754 240 L 730 240 Z',
    },
    // Lamplight in two of them.
    {
      role: 'accent',
      path: 'M 428 570 L 452 570 L 452 526 L 428 526 Z M 680 570 L 700 570 L 700 530 L 680 530 Z',
      opacity: 0.55,
    },

    // Stone coursing on the lower walls.
    {
      role: 'detail',
      path: 'M 356 640 L 660 640 L 660 632 L 356 632 Z M 196 640 L 386 640 L 386 632 L 196 632 Z',
      opacity: 0.35,
    },
  ],
}
