import type { LandmarkArt } from '../types'

/**
 * Minar-e-Pakistan, Lahore.
 *
 * A tapering fluted tower rising from a base of four curved petal walls, in
 * distinct stacked tiers that step inward as they climb. The tiers are the
 * identifying feature — without them it is simply a spike — so each is drawn as
 * its own band with a shadow line beneath, and each is slightly narrower than
 * the one below.
 */
export const minarEPakistan: LandmarkArt = {
  id: 'minar-e-pakistan',
  viewBox: { width: 600, height: 1000 },
  baseline: 0.965,
  layers: [
    // Curved petal walls at the base — the flower the tower grows out of.
    {
      role: 'shade',
      path:
        'M 118 900 Q 132 762 214 700 L 244 726 Q 176 786 166 900 Z ' +
        'M 482 900 Q 468 762 386 700 L 356 726 Q 424 786 434 900 Z',
    },
    {
      role: 'detail',
      path:
        'M 182 900 Q 196 796 258 748 L 276 766 Q 224 812 214 900 Z ' +
        'M 418 900 Q 404 796 342 748 L 324 766 Q 376 812 386 900 Z',
      opacity: 0.65,
    },

    // The shaft, tier by tier, each stepping inward.
    { role: 'silhouette', path: 'M 236 900 L 364 900 L 356 742 L 244 742 Z' },
    { role: 'silhouette', path: 'M 246 742 L 354 742 L 348 566 L 252 566 Z' },
    { role: 'silhouette', path: 'M 254 566 L 346 566 L 340 396 L 260 396 Z' },
    { role: 'silhouette', path: 'M 262 396 L 338 396 L 332 244 L 268 244 Z' },
    { role: 'silhouette', path: 'M 270 244 L 330 244 L 326 148 L 274 148 Z' },

    // Shadowed side of every tier, so the tower reads as round rather than flat.
    {
      role: 'shade',
      path:
        'M 320 900 L 364 900 L 356 742 L 318 742 Z ' +
        'M 318 742 L 354 742 L 348 566 L 316 566 Z ' +
        'M 316 566 L 346 566 L 340 396 L 314 396 Z ' +
        'M 314 396 L 338 396 L 332 244 L 312 244 Z ' +
        'M 312 244 L 330 244 L 326 148 L 310 148 Z',
      opacity: 0.92,
    },
    // Lit flank.
    {
      role: 'highlight',
      path:
        'M 236 900 L 264 900 L 270 742 L 244 742 Z ' +
        'M 246 742 L 270 742 L 274 566 L 252 566 Z ' +
        'M 254 566 L 274 566 L 278 396 L 260 396 Z ' +
        'M 262 396 L 278 396 L 282 244 L 268 244 Z',
      opacity: 0.7,
    },

    // Cornice under each tier break.
    {
      role: 'detail',
      path:
        'M 232 730 L 368 730 L 368 748 L 232 748 Z ' +
        'M 242 554 L 358 554 L 358 572 L 242 572 Z ' +
        'M 250 384 L 350 384 L 350 402 L 250 402 Z ' +
        'M 258 232 L 342 232 L 342 250 L 258 250 Z',
    },

    // Fluting on the tallest tier.
    {
      role: 'detail',
      path:
        'M 268 736 L 274 736 L 268 570 L 262 570 Z ' +
        'M 296 736 L 302 736 L 300 570 L 294 570 Z ' +
        'M 324 736 L 330 736 L 332 570 L 326 570 Z',
      opacity: 0.5,
    },

    // Crown and finial.
    { role: 'shade', path: 'M 266 148 L 334 148 L 334 128 L 266 128 Z' },
    { role: 'accent', path: 'M 292 128 L 308 128 L 304 86 L 300 56 L 296 86 Z' },

    // Star-shaped plinth.
    { role: 'silhouette', path: 'M 96 900 L 504 900 L 528 942 L 72 942 Z', opacity: 0.9 },
    { role: 'shade', path: 'M 56 942 L 544 942 L 566 976 L 34 976 Z' },
    { role: 'detail', path: 'M 66 956 L 534 956 L 536 964 L 64 964 Z', opacity: 0.4 },
  ],
}
