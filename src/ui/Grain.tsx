/**
 * Film grain and the atmospheric vignette.
 *
 * The grain is a single inline SVG turbulence tile as a data URI — no raster
 * asset, no network request, and it tiles seamlessly at any viewport. Its
 * opacity is a theme token, so it thickens and thins with the city rather than
 * sitting at a constant value across the whole journey.
 *
 * It is deliberately *static*. An animated grain is autonomous motion, which
 * `prefers-reduced-motion` asks us to remove, and a still grain reads as film
 * stock rather than television noise anyway.
 */

const GRAIN_TILE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="180" height="180" filter="url(#n)"/>
    </svg>`,
  )

export function Grain() {
  return (
    <>
      <div className="vignette" aria-hidden="true" />
      <div
        className="grain"
        aria-hidden="true"
        style={{ backgroundImage: `url("${GRAIN_TILE}")`, backgroundSize: '180px 180px' }}
      />
    </>
  )
}
