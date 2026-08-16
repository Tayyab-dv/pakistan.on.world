/**
 * Landmark art.
 *
 * Landmarks are authored as layered vector paths rather than photographic
 * cutouts. Three consequences follow, all of them wanted:
 *
 *   1. There is no alpha to key, so chroma fringes, matte halos, rectangular
 *      backgrounds and compression artefacts cannot occur — they are excluded
 *      by construction rather than cleaned up afterwards.
 *   2. Every surface is recoloured from the active city theme, so a landmark is
 *      lit by the same sun as the globe behind it instead of carrying its own
 *      baked-in lighting into a scene that has moved on.
 *   3. They stay crisp at any device pixel ratio and cost a few kilobytes.
 *
 * Paths are authored in a coordinate space declared by `viewBox`, origin at the
 * top left, and are rasterised to a texture at load time.
 */

export type LayerRole =
  /** The base mass. Everything else sits on top of it. */
  | 'silhouette'
  /** Faces turned away from the sun. */
  | 'shade'
  /** Openings, seams, tier divisions — the marks that make a shape legible. */
  | 'detail'
  /** Sun-facing edges and crowns. */
  | 'highlight'
  /** Sparing use of the city accent: gilding, a lamp, a snow line. */
  | 'accent'

export interface ArtLayer {
  readonly path: string
  readonly role: LayerRole
  /** Multiplier on the role's base opacity. Defaults to 1. */
  readonly opacity?: number
}

export interface LandmarkArt {
  readonly id: string
  /** Authoring coordinate space. Aspect ratio is taken from these. */
  readonly viewBox: { readonly width: number; readonly height: number }
  readonly layers: readonly ArtLayer[]
  /**
   * Where the object meets the ground, as a fraction of the height.
   *
   * Used to seat architecture against the globe's limb. A mountain whose base
   * is the bottom of the image has 1; a dhow floating in its own waterline
   * sits slightly higher.
   */
  readonly baseline: number
}
