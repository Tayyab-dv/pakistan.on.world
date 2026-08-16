GOAL

Bring "One Turning World: Pakistan" to a final, exhibition-quality state. This is the last polish pass — preserve the full-page composition, persistent globe, six-city sequence, solar navigation, typography, city copy, and abstract choreography exactly as established. No redesigns, no new sections, no new cities.

Continue iterating through real browser inspection until every landmark and every transition feels physically integrated into the globe-centered scene, with zero visible seams between procedural motion and generated sprites.

SPATIAL MOTION

Every landmark follows a continuous globe-centered 3D orbit:

1. Begins small, genuinely behind the globe.
2. Approaches one outer limb of the Earth.
3. Clears the globe's silhouette before switching to the foreground layer.
4. Crosses the foreground as the visual focus.
5. Moves laterally, yielding focus to the next object.
6. Returns around the opposite limb.
7. Switches back to the rear layer.
8. Softens opacity only once safely hidden behind the Earth.

No opacity crossfades as a primary transition. Nothing disappears while centered over the globe or in the foreground.

Limb clearance is calculated from the globe's rendered radius against each asset's actual displayed size — K2 needs a materially wider orbit and different vertical placement than a compact object like the Koh-e-Batil lighthouse or Merewether Clock Tower. Treat K2 as a towering backdrop presence, not a low architectural anchor.

Rear and foreground layers use depth hysteresis so nothing flickers at the switching threshold. Motion reverses cleanly on reverse scroll — same physical path, not a different animation.

CITY OWNERSHIP

Only the active city's landmarks and procedural root render at any time. Before a new city activates, every landmark from the previous city must already be off-composition or behind the globe. This applies to all six consecutive pairs: Islamabad→Karachi, Karachi→Lahore, Lahore→Peshawar, Peshawar→Gwadar, Gwadar→Skardu.

One persistent globe instance throughout; only city roots swap.

ASSET QUALITY AND COMPOSITION

- Islamabad: Faisal Mosque and Pakistan Monument read as credible architectural monuments, not abstract folds.
- Karachi: Mazar-e-Quaid's dome and Merewether Clock Tower are both recognizable, positioned low in the composition.
- Lahore: Badshahi Mosque and Minar-e-Pakistan both read as monumental stone and stacked masonry.
- Peshawar: procedural only, no sprite — carved-wood lattice, archway silhouettes, lantern points, dust-mote particles must carry the city on their own.
- Gwadar: coastal deep-winter sunset — lighthouse, fishing dhow, cliffs, warm dune light, all unmistakable.
- Skardu: K2 as a monumental snow-capped pyramidal peak, Shigar Fort in traditional Balti timber-and-stone, glacial-lake facets, poplar gold, first snow.
- No generic floating planets, unexplained colored orbs, arbitrary icons, or structures foreign to the active city.
- Domes, forts, and towers anchor near the lower edge of the globe as credible architecture, not flat floating cutouts; K2 is the one exception as a scaled backdrop peak.
- Reserve procedural 3D geometry strictly for texture and atmosphere, never as a stand-in for a missing sprite.
- Remove chroma fringes, matte halos, rectangular backgrounds, compression artifacts, and baked-in shadows from every transparent asset. Regenerate any asset whose silhouette or proportions can't be fixed by placement alone.

MOTION QUALITY

Delta-time-based damping across city transitions, sprite movement, globe rotation/recentering, lighting changes, scale/depth, and ambient motion. Transitions stay smooth under rapid scrolling or non-adjacent city clicks — no snapping, saccades, or delayed catch-up.

Orbital guide lines stay behind the globe, moving continuously and subtly — no stepping, no blunt rotation increments, never painted over the Earth's surface.

THE GLOBE

Never clipped on either side at any viewport. On city change:

- Recenters smoothly on correct real-world coordinates.
- All six markers remain present.
- Active marker gets a distinct glow.
- Atmosphere, clouds, city lights, surface tint, and rim light interpolate smoothly.
- Every marker stays directly clickable.

SOLAR STEPPER

- Islamabad reads as sunrise, Lahore as full zenith, Gwadar as sunset — visually, with no explanatory copy needed.
- Active sun travels continuously with scroll.
- All six dots sit mathematically on the same solar curve.
- City names always visible; seasons on hover/keyboard focus, persistent on touch.
- Every dot clickable, landing just inside its own city's range.
- No scene names, state numbers, or extra progress labels.

SEASONAL CLARITY

- Islamabad: spring bloom, soft morning rose light.
- Karachi: dry summer gold, heat shimmer, coastal haze.
- Lahore: bronze autumn light, falling leaves, full zenith brightness.
- Peshawar: cold winter light, falling snow over carved stone.
- Gwadar: deep-winter coastal light, warm sunset over cliffs and sea.
- Skardu: late-autumn poplar gold giving way to first mountain snow.

FINAL VALIDATION LOOP

This is the last pass — nothing ships until every item below is confirmed by actually looking at it, not by reading source.

- Inspect each of the six cities at beginning, middle, and end, plus every transition between them, forward and reverse.
- Validate at 390×844, 768px tablet, 1280×720, and 1440×900.
- At every viewport: globe fully visible and uncropped; rear-to-front and front-to-rear sprite transitions clean; no sprite fading over the globe's center; no inactive-city assets bleeding through.
- Click every globe marker and every solar dot; confirm each lands correctly inside its own city.
- Confirm sunrise (Islamabad), zenith (Lahore), and sunset (Gwadar) are visually unambiguous.
- Confirm reduced-motion behavior and full keyboard focus/navigation.
- Confirm the browser console is clean — no errors, no warnings.
- Run the production build; confirm it passes with no regressions.

Use live scrolling and screenshots to refine scale, focal position, orbit clearance, pacing, lighting, and density until the experience feels fluid, coherent, physically plausible, and finished — not just functional.