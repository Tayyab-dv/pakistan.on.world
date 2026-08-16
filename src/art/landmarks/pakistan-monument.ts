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
    // Outer pair: broad crescents sweeping out and back, set behind the inner
    // pair. Width is what makes these read as petals — as narrow blades the
    // whole thing looks like a bundle of sticks rather than a flower.
    {
      role: 'shade',
      path:
        'M 402 730 Q 300 500 116 236 Q 150 186 214 202 Q 344 486 470 730 Z ' +
        'M 598 730 Q 700 500 884 236 Q 850 186 786 202 Q 656 486 530 730 Z',
    },

    // Inner pair: taller, more upright, and catching the most light. They open
    // outward at the tip, which is the gesture of the flower unfolding.
    {
      role: 'silhouette',
      path:
        'M 448 732 Q 402 430 300 96 Q 352 62 412 86 Q 462 424 518 732 Z ' +
        'M 552 732 Q 598 430 700 96 Q 648 62 588 86 Q 538 424 482 732 Z',
    },

    // Carved panel running the length of each inner petal, following its curve.
    {
      role: 'detail',
      path:
        'M 470 730 Q 424 434 336 108 Q 352 100 368 104 Q 448 432 494 730 Z ' +
        'M 530 730 Q 576 434 664 108 Q 648 100 632 104 Q 552 432 506 730 Z',
      opacity: 0.55,
    },

    // Recessed inner face of each outer petal, turning away from the light.
    {
      role: 'detail',
      path:
        'M 440 728 Q 344 508 168 250 Q 182 232 202 226 Q 366 496 486 728 Z ' +
        'M 560 728 Q 656 508 832 250 Q 818 232 798 226 Q 634 496 514 728 Z',
      opacity: 0.45,
    },

    // Lit sunward flank of the left inner petal, and the crown of the right.
    {
      role: 'highlight',
      path:
        'M 448 732 Q 402 430 300 96 Q 326 78 356 74 Q 428 424 476 732 Z ' +
        'M 700 96 Q 648 62 588 86 Q 620 74 668 84 Z',
    },

    // Star-shaped base: an upper tier and the broad plinth below it.
    { role: 'shade', path: 'M 344 702 L 656 702 L 672 730 L 328 730 Z' },
    { role: 'silhouette', path: 'M 286 730 L 714 730 L 742 768 L 258 768 Z', opacity: 0.92 },
    { role: 'detail', path: 'M 278 746 L 722 746 L 724 754 L 276 754 Z', opacity: 0.4 },

    // The central emblem sitting in the mouth of the flower.
    {
      role: 'accent',
      path: 'M 500 570 L 516 610 L 556 626 L 516 642 L 500 682 L 484 642 L 444 626 L 484 610 Z',
    },
  ],
}
