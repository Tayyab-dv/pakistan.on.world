import type { CityChoreography } from './motifs'

/**
 * Peshawar — winter.
 *
 * The one city with no landmark. Everything here is procedural, by explicit
 * instruction, which means the carved wood, the archways, the lanterns and the
 * air itself have to carry the city on their own. They are given more presence
 * than their equivalents elsewhere for that reason: more lattice, more arches,
 * and the lanterns are the brightest points in the whole journey.
 *
 * Two atmospheres at once, per the final brief: dust hanging in the warm lamp
 * light of the bazaar, and cold snow falling through it.
 */
export const peshawar: CityChoreography = {
  motifs: [
    // Carved wooden screens: ogee openings rather than the star pattern used
    // for Lahore's marble, and warmer and heavier in feel.
    {
      kind: 'lattice',
      pattern: 'ogee',
      colour: 'accent',
      shadow: 'fog',
      rim: 'key',
      position: [-1.3, -0.15, -1.3],
      rotation: [0.08, 0.5, 0.04],
      fragments: 4,
      columns: 3,
      rows: 3,
      size: 0.58,
      scatter: 0.6,
      seed: 0.23,
      opacity: 0.95,
    },
    {
      kind: 'lattice',
      pattern: 'ogee',
      colour: 'surface',
      shadow: 'fog',
      rim: 'accent',
      position: [1.32, -0.5, -1.45],
      rotation: [-0.1, -0.58, -0.05],
      fragments: 3,
      columns: 3,
      rows: 3,
      size: 0.52,
      scatter: 0.56,
      seed: 0.66,
      opacity: 0.82,
    },

    // The old bazaar: a row of pointed archways, dark against the cold sky.
    {
      kind: 'silhouette',
      shape: 'arch',
      colour: 'fog',
      shadow: 'fog',
      rim: 'accent',
      position: [0, -1.18, -1.2],
      count: 11,
      span: 1.9,
      depth: 0.5,
      minHeight: 0.22,
      maxHeight: 0.42,
      seed: 0.49,
      opacity: 0.92,
    },

    // Brass lanterns hanging over the street — the warm heart of the city.
    {
      kind: 'linepoints',
      shape: 'lantern',
      colour: 'surface',
      node: 'accent',
      position: [-0.05, 0.3, -1.05],
      count: 16,
      span: 2.0,
      depth: 0.7,
      rise: 0.45,
      scaleFactor: 0.62,
      seed: 0.34,
      opacity: 0.8,
      nodeSize: 90,
    },

    // Warm stone: heavier relief than Lahore's sandstone, colder in tone.
    {
      kind: 'facets',
      colour: 'surface',
      shadow: 'fog',
      rim: 'rim',
      position: [0.1, -1.52, -0.7],
      rotation: [0.14, -0.22, 0],
      divisions: 6,
      width: 3.4,
      height: 1.7,
      relief: 0.22,
      roughness: 0.68,
      seed: 0.77,
      opacity: 0.32,
      rimStrength: 1.0,
    },

    // Dust motes, drifting in the lamp light.
    {
      kind: 'particles',
      colour: 'accent',
      behaviour: 'drift',
      position: [0, -0.1, 0.2],
      budget: 0.11,
      spread: [2.6, 1.5, 1.4],
      speed: 0.03,
      swirl: 0.06,
      size: 9,
      opacity: 0.4,
      additive: true,
    },

    // Snow over carved stone.
    {
      kind: 'particles',
      colour: 'ink',
      behaviour: 'fall',
      position: [0, 0.3, 0],
      budget: 0.17,
      spread: [3.2, 2.1, 1.8],
      speed: 0.16,
      swirl: 0.08,
      size: 12,
      opacity: 0.62,
      additive: false,
    },
  ],

  landmarks: [],
}
