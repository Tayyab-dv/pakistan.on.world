# Pakistan on a Turning World

An immersive, scroll-driven editorial piece: one persistent Earth carries you
through six Pakistani cities across a single day and a single year.

**Live:** https://tayyab-dv.github.io/pakistan.on.world/

Islamabad at sunrise, Karachi in rising daylight, Lahore at the solar zenith,
Peshawar in winter light, Gwadar at a deep-winter sunset, and Skardu under the
last coral light and the first snow. Scrolling moves continuously through all
six — thirty scroll states in total — with no section breaks, no cards, and no
labels explaining what is happening. The animation is the narration.

---

## Running it

```bash
npm install
npm run textures   # downloads and processes the NASA imagery (~30MB source)
npm run dev
```

`npm run textures` is optional on a first look. Without it the globe falls back
to a procedurally generated Earth and everything else works — but you will not
be looking at the real planet, so run it before judging anything visual.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Production build to `dist/` |
| `npm run check` | Type-check, lint, and build |
| `npm run textures` | Fetch NASA imagery, emit 4k/2k/1k tiers |
| `npm run fonts` | Re-fetch the self-hosted font subset |
| `npm run check:visual` | Full visual verification (see below) |
| `node scripts/art-sheet.mjs` | Landmark art contact sheet at `/art.html` |

---

## How it works

**One number drives everything.** Scroll position becomes a continuous float in
`[0, 29]`. Camera, globe orientation, lighting, atmosphere, landmark orbits,
copy opacity and the solar stepper are all pure functions of it. Nothing is a
fired animation, which is why scrolling backwards retraces the identical path
instead of playing something different.

**The scroll is real.** A tall element provides an actual scrollbar and the
composition is painted on fixed canvases above it. Nothing hijacks the wheel or
the touch gesture, so native momentum, keyboard paging, browser scroll
restoration and find-in-page all keep working.

**Two canvases, one camera.** The rear scene holds the Earth, its atmosphere and
everything currently behind it; the front scene is transparent and holds
whatever has cleared the Earth's silhouette. Objects are reparented between them
as they orbit, with a hysteresis band so nothing flickers at the crossing plane.

**React never touches the scene.** The 3D world is a plain class instantiated
once. React mounts two canvases and hands them over, then only re-renders when
the integer city index changes.

**Landmarks are hand-authored vector art** — layered paths rasterised to
premultiplied-alpha textures and recoloured from the active city's palette, so
each is lit by the same sun as the globe behind it. There is no keyed alpha
anywhere, which means chroma fringes and matte halos are excluded by
construction rather than cleaned up afterwards.

```
src/
  core/      scroll engine, damping, perf tiers, motion preference
  three/     World singleton, globe, markers, orbits, layer routing, primitives
  art/       landmark path data and the rasteriser
  cities/    six cities, 30 keyframes, themes, per-city choreography
  ui/        solar stepper, editorial copy, grain
```

---

## Verification

`npm run check:visual` drives a real GPU-backed Chrome through the whole piece
at 390, 768, 1280 and 1440 px and asserts the things a screenshot cannot show:

- the globe, atmosphere included, is never clipped at any state or width
- no landmark from an inactive city is visible at any of the five boundaries
- landmark opacity only changes while the object is genuinely occluded
- scrolling backwards retraces the forward path
- every stepper dot and every globe marker lands inside its own city
- the stepper is a single tab stop with working arrow / Home / End / Enter
- dragging rotates the globe, and the offset decays back to zero
- under `prefers-reduced-motion` an idle frame is pixel-identical
- zero console errors **and** zero warnings

Screenshots land in `.visual/`.

---

## Attribution

**Earth imagery** — NASA Visible Earth (Blue Marble) and NASA Earth Observatory
(Black Marble, 2012), both public domain under
[NASA's media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
Elevation from GEBCO via NASA Earth Observatory. The normal and roughness maps
are derived from those sources by `scripts/fetch-textures.mjs`.

**Cormorant Garamond** — Copyright 2015 the Cormorant Project Authors, licensed
under the SIL Open Font License 1.1. Full text in
[`public/fonts/OFL.txt`](public/fonts/OFL.txt).

Landmark artwork is original vector work created for this project.
