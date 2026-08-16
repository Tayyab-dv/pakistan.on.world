Build an immersive, scroll-driven editorial Vite application called “Pakistan on Turning World” in the `Pk-project` folder.

Use React, TypeScript, Three.js, and Motion. The experience must be a single full-viewport, pinned spatial composition—not a conventional landing page made of sections, panels, cards, or columns.

CORE CONCEPT

Tell the story of one day and one year through Six cities:

1. Islamabad — Spring / sunrise
2. Karachi — Summer / rising daylight
3. Lahore — Autumn / solar zenith
4. Peshawer — Winter / cold breeze
5. Gawader — Deep Winter / sunset
6. Sakardu - Late Autumn / descending coral light / Snow fall

Scrolling moves continuously through all six cities. Each city lasts five substantial scroll states, for 30 states total. The transition from one city to the next happens automatically through scrolling.

Do not display scene names, state counters, “1 of 6” labels, or explanatory captions for individual moments. The animation itself should communicate progression.

VISUAL COMPOSITION

Keep the interactive Earth centered and make it the hero of the experience.

- The scene fills the viewport.
- The globe remains the same persistent Three.js instance for the entire journey.
- It must never be cropped or clipped by the viewport.
- It can be dragged or rotated by the user.
- When a city becomes active, smoothly recenter the globe on its real geographic coordinates.
- Keep markers for all six cities visible.
- Give the current city marker a precise glow.
- Every marker is clickable and scrolls directly to that city.
- The globe changes lighting, atmosphere, clouds, city lights, and color treatment for each city, but never remounts or visually becomes a different object.
- Use realistic Earth textures; these are the only raster textures allowed in this initial version.

Place the current city name and one short editorial sentence in the lower-left area:

Islamabad:
"A green capital wakes slowly under morning hills."

Karachi:
"Pakistan's coastal heart — sea air, heat, and constant motion."

Lahore:
"Midday sun on red sandstone, in a city built on centuries."

Peshawar:
"One of the oldest cities in South Asia, still trading at its old bazaars."

Gwadar:
"A fishing port on the Arabian Sea, lit by a deep winter sunset."

Skardu:
"Mountains and glacial lakes, where autumn gold meets early snow."

Use elegant high-contrast editorial typography such as Cormorant Garamond. The interface should feel cinematic, abstract, futuristic, restrained, and museum-like. Use subtle grain and atmospheric light, but no generic glass panels, pills, badges, cards, or conventional navigation bar.

THREE.JS CHOREOGRAPHY

Create a separate abstract Three.js choreography surrounding the globe. Do not use generated landmark images, DOM images, billboards, or raster sprites in this version.

Use procedural geometry, physical materials, particles, ribbons, and light:

Use procedural geometry, physical materials, particles, ribbons, and light:

- Islamabad: tent-fold mosque geometry, ridge-line ribbons, tulip and blossom particles, morning haze, pine silhouettes.
- Karachi: coastal ribbon waves, port-crane line forms, palm silhouettes, heat-shimmer particles, sea-spray mist.
- Lahore: jaali lattice fragments, minaret slivers, marble-inlay ribbons, sandstone facets, autumn leaf particles.
- Peshawar: carved-wood lattice forms, old bazaar archway silhouettes, brass lantern points, dust-mote particles, warm stone geometry.
- Gwadar: wind-carved cliff facets, abstract dhow-sail ribbons, dune particles, coral-to-violet sunset gradients.
- Skardu: glacial-lake facet planes, Karakoram peak silhouettes, poplar-leaf particles, first snow volume, apricot-branch line forms.

Each city must feel like a six-part abstract dance. Scrolling changes which group is central, its scale, depth, orientation, and relationship to the globe. Objects should move spatially rather than changing through illustration crossfades.

Use a persistent scene and frame-rate-independent time damping. Avoid remounting a complete Three.js scene on every city change.

For Islamabad and Skardu, use synchronized rear and foreground WebGL canvases so their native 3D motifs can genuinely move from behind the globe to in front of it. Use depth-based layer switching with hysteresis to avoid flicker. Keep atmospheric orbital lines in the rear layer so they wrap visually behind the Earth rather than drawing over its surface.

Only the active city’s choreography root should be visible. Objects from adjacent cities must not leak into the current composition.

SOLAR NAVIGATION

Create an elegant solar-course stepper overlaid along the bottom of the viewport.

Use an SVG quadratic Bézier path with approximately this geometry:

- ViewBox: 0 0 1000 126
- Path: M 52 106 Q 500 -76 948 106
- City solar positions: [0.015, 0.25, 0.5, 0.75, 0.985]

Calculate every city marker from the actual Bézier equation so the dots sit exactly on the curve.

The stepper must include:

- A visible sunrise half-sun at Islamabad.
- A full radiant sun at the Lahore zenith.
- A visible sunset treatment at Gwadar.
- One active sun that moves continuously along the curve with scrolling.
- Clickable dots for every city.
- City names always visible.
- Season names revealed on hover or keyboard focus; keep the active season visible on touch layouts.
- A subtle glow on the travelled section of the arc.
- A very subtle bottom-edge progress line for the entire journey.

Clicking a city must land just inside that city’s section, not on the floating-point boundary belonging to the previous city.

RESPONSIVE BEHAVIOR

On desktop and tablet, keep the globe centered and dominant. Do not return to a left-panel/right-panel layout.

On mobile:

- Preserve the globe as the central hero.
- Keep the compact solar stepper overlaid along the bottom.
- Keep all city names readable.
- Keep the city copy below the globe without covering the stepper.
- Let the choreography use the available edges of the viewport.
- Do not hide the main navigation in a drawer.

QUALITY REQUIREMENTS

- Smooth forward and reverse scrolling.
- Smooth city recentering and theme transitions.
- Delta-time-based damping instead of frame-count-based interpolation.
- No sudden jumps or stuttering when changing cities.
- No globe clipping at 390px, 768px, 1280px, or 1440px widths.
- Keyboard-accessible city navigation.
- Respect prefers-reduced-motion.
- Clean browser console.
- Production build must pass.

Visually inspect the actual experience at desktop and mobile sizes. Do not consider the task complete based only on compilation or source inspection.