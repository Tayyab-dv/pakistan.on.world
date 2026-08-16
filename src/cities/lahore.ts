import { badshahiMosque } from '../art/landmarks/badshahi-mosque'
import { minarEPakistan } from '../art/landmarks/minar-e-pakistan'
import type { CityChoreography } from './motifs'

/**
 * Lahore — autumn, solar zenith.
 *
 * The brightest state of the journey. Midday sun on red sandstone: pierced
 * marble jaali turning in the light, inlay ribbons, faceted sandstone, and
 * autumn leaves coming down.
 *
 * The minaret slivers from the original brief are not built — Badshahi Mosque
 * and Minar-e-Pakistan supersede them.
 */
export const lahore: CityChoreography = {
  motifs: [
    // Jaali fragments: real pierced panels, scattered and turning. At the
    // zenith the sun passes through them, which is the entire point of a jaali.
    {
      kind: 'lattice',
      pattern: 'star',
      colour: 'cloud',
      shadow: 'surface',
      rim: 'key',
      // Turned well off axis and kept translucent: seen flat-on and opaque, a
      // pierced panel reads as a stamped card rather than as marble with light
      // coming through it.
      position: [-1.15, 0.3, -1.5],
      rotation: [0.16, 0.95, 0.08],
      fragments: 3,
      columns: 3,
      rows: 3,
      size: 0.56,
      scatter: 0.5,
      seed: 0.37,
      opacity: 0.34,
    },
    {
      kind: 'lattice',
      pattern: 'star',
      colour: 'surface',
      shadow: 'fog',
      rim: 'accent',
      position: [1.2, -0.4, -1.7],
      rotation: [-0.2, -1.05, -0.1],
      fragments: 3,
      columns: 3,
      rows: 3,
      size: 0.5,
      scatter: 0.48,
      seed: 0.82,
      opacity: 0.28,
    },

    // Marble inlay: a thin bright ribbon, tighter and more ornamental than the
    // landscape ribbons elsewhere in the journey.
    {
      kind: 'ribbon',
      colour: 'key',
      rim: 'accent',
      position: [0.05, -1.26, -1.0],
      rotation: [0.04, 0.2, -0.03],
      segments: 200,
      length: 3.7,
      width: 0.03,
      amplitude: 0.11,
      frequency: 3.4,
      depth: 0.2,
      seed: 0.44,
      opacity: 0.42,
      rimStrength: 2.0,
    },

    // Sandstone: broad, shallow facets catching the overhead light.
    {
      kind: 'facets',
      colour: 'accent',
      shadow: 'fog',
      rim: 'key',
      position: [0, -1.5, -0.6],
      rotation: [0.12, 0.3, 0],
      divisions: 7,
      width: 3.2,
      height: 1.7,
      relief: 0.18,
      roughness: 0.55,
      seed: 0.53,
      opacity: 0.2,
      rimStrength: 1.2,
    },

    // Autumn leaves, falling and stretched along their fall.
    {
      kind: 'particles',
      colour: 'accent',
      behaviour: 'fall',
      position: [0, 0.2, 0],
      budget: 0.16,
      spread: [3.0, 2.0, 1.7],
      speed: 0.13,
      swirl: 0.14,
      size: 15,
      opacity: 0.55,
      additive: false,
      stretch: 1.8,
    },
  ],

  landmarks: [
    {
      art: badshahiMosque,
      height: 0.56,
      orbitRadius: 1.92,
      orbitTilt: 0.1,
      orbitY: -0.14,
      direction: 1,
      phase: 0,
      anchored: true,
      slot: 'first',
    },
    {
      art: minarEPakistan,
      height: 0.86,
      orbitRadius: 1.72,
      orbitTilt: -0.16,
      orbitY: -0.04,
      direction: -1,
      phase: 0.32,
      anchored: true,
      slot: 'second',
    },
  ],
}
