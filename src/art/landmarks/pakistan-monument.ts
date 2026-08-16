import type { LandmarkArt } from '../types'

/**
 * Pakistan Monument, Islamabad.
 *
 * Four large granite petals unfolding from a star-shaped base — the form is a
 * flower opening, and the reading depends entirely on the petals being *curved
 * blades* rather than flat triangles: each is thick at the base, tapers toward
 * its tip, and leans outward along an arc.
 *
 * The outer pair sit behind the inner pair, so they are painted first and in
 * shadow. That overlap is what stops the four blades from reading as a flat
 * fan.
 */
export const pakistanMonument: LandmarkArt = {
  id: 'pakistan-monument',
  viewBox: { width: 1000, height: 800 },
  baseline: 0.95,
  layers: [
    // Outer pair, leaning furthest out and set back in depth.
    {
      role: 'shade',
      path:
        'M 395 728 Q 250 540 140 196 Q 168 176 200 184 Q 320 500 455 728 Z ' +
        'M 605 728 Q 750 540 860 196 Q 832 176 800 184 Q 680 500 545 728 Z',
    },

    // Inner pair, nearly upright and catching the most light.
    {
      role: 'silhouette',
      path:
        'M 462 728 Q 400 420 326 108 Q 356 92 386 104 Q 470 430 516 728 Z ' +
        'M 538 728 Q 600 420 674 108 Q 644 92 614 104 Q 530 430 484 728 Z',
    },

    // Carved panel lines running the length of each inner petal.
    {
      role: 'detail',
      path:
        'M 478 726 Q 424 428 352 120 Q 358 116 366 116 Q 438 430 492 726 Z ' +
        'M 522 726 Q 576 428 648 120 Q 642 116 634 116 Q 562 430 508 726 Z',
      opacity: 0.5,
    },

    // Inner edge of each outer petal, where it turns away from the light.
    {
      role: 'detail',
      path:
        'M 430 726 Q 300 520 186 200 Q 192 194 200 192 Q 316 508 448 726 Z ' +
        'M 570 726 Q 700 520 814 200 Q 808 194 800 192 Q 684 508 552 726 Z',
      opacity: 0.42,
    },

    // Lit edge along the sunward flank of the inner petals.
    {
      role: 'highlight',
      path: 'M 462 728 Q 400 420 326 108 Q 338 100 350 100 Q 424 424 480 728 Z',
      opacity: 0.75,
    },

    // Star-shaped base: an upper tier and the broad plinth below it.
    { role: 'silhouette', path: 'M 350 700 L 650 700 L 664 728 L 336 728 Z' },
    { role: 'silhouette', path: 'M 296 728 L 704 728 L 730 766 L 270 766 Z' },
    { role: 'detail', path: 'M 288 744 L 712 744 L 714 752 L 286 752 Z', opacity: 0.4 },

    // The central emblem sitting in the mouth of the flower.
    {
      role: 'accent',
      path: 'M 500 556 L 514 592 L 552 606 L 514 620 L 500 656 L 486 620 L 448 606 L 486 592 Z',
    },
  ],
}
