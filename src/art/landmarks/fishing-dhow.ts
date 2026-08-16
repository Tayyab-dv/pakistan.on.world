import type { LandmarkArt } from '../types'

/**
 * A traditional wooden fishing dhow, Gwadar.
 *
 * The recognition rests on two things: a hull with a high, sharply raked stem
 * rising well above the sheer line, and a single mast raked *forward* carrying
 * a long lateen yard. A vertical mast and a triangular sail would read as a
 * generic sailing dinghy; the forward rake and the yard extending past the bow
 * are what make it a dhow.
 */
export const fishingDhow: LandmarkArt = {
  id: 'fishing-dhow',
  viewBox: { width: 1200, height: 800 },
  baseline: 0.86,
  layers: [
    // Lateen sail, hung from a yard that runs from low aft to high forward.
    {
      role: 'highlight',
      path: 'M 872 152 Q 690 330 566 566 L 388 596 Q 560 380 838 150 Z',
    },
    // The sail's leeward half, in shadow, with the belly of the curve.
    {
      role: 'shade',
      path: 'M 872 152 Q 754 336 700 566 L 566 566 Q 690 330 872 152 Z',
      opacity: 0.85,
    },
    // Seams between the sail's cloths.
    {
      role: 'detail',
      path:
        'M 800 222 Q 660 388 596 566 L 578 566 Q 646 380 790 214 Z ' +
        'M 720 296 Q 604 428 548 578 L 496 584 Q 566 424 706 288 Z',
      opacity: 0.4,
    },

    // The yard, and the mast raked forward beneath it.
    { role: 'detail', path: 'M 880 142 L 894 158 L 392 606 L 376 592 Z' },
    { role: 'shade', path: 'M 548 588 L 570 588 L 660 264 L 642 260 Z' },

    // Hull: a long low sheer with the high raked stem forward.
    {
      role: 'silhouette',
      path:
        'M 214 596 L 1020 566 L 1052 470 L 1074 456 L 1064 556 Q 1050 654 936 686 ' +
        'L 372 700 Q 262 676 214 596 Z',
    },
    // Waterline shadow along the hull.
    {
      role: 'detail',
      path: 'M 246 646 Q 320 692 396 698 L 936 686 Q 1006 664 1038 618 L 1032 664 Q 986 700 928 706 L 372 700 Q 282 682 246 646 Z',
      opacity: 0.55,
    },
    // Lit sheer strake.
    { role: 'highlight', path: 'M 214 596 L 1020 566 L 1018 590 L 220 618 Z', opacity: 0.8 },
    // Planking lines.
    {
      role: 'detail',
      path:
        'M 236 626 L 1026 598 L 1026 608 L 240 636 Z ' +
        'M 268 668 L 1006 646 L 1006 654 L 272 676 Z',
      opacity: 0.35,
    },

    // Stem-head ornament and a lamp at the stern.
    { role: 'accent', path: 'M 1048 470 L 1060 464 L 1078 446 L 1070 442 L 1050 458 Z' },
    { role: 'accent', path: 'M 268 586 L 288 586 L 288 562 L 268 562 Z', opacity: 0.7 },
  ],
}
