import { fishingDhow } from '../art/landmarks/fishing-dhow'
import { kohEBatilLighthouse } from '../art/landmarks/koh-e-batil-lighthouse'
import type { CityChoreography } from './motifs'

/**
 * Gwadar — deep winter, sunset.
 *
 * The lowest sun of the journey. Wind-carved cliff facets take the last warm
 * light on their upper planes while everything below them falls into violet;
 * dune sand streams off the headland; a coastal haze sits along the water.
 *
 * The abstract dhow-sail ribbons from the original brief are not built — the
 * fishing dhow landmark supersedes them.
 */
export const gwadar: CityChoreography = {
  motifs: [
    // Wind-carved cliffs: the roughest facets in the journey, and the largest.
    {
      kind: 'facets',
      colour: 'accent',
      shadow: 'fog',
      rim: 'key',
      position: [-0.4, -1.3, -0.7],
      rotation: [0.42, 0.34, 0.04],
      divisions: 8,
      width: 3.0,
      height: 1.7,
      relief: 0.4,
      roughness: 0.82,
      seed: 0.41,
      opacity: 0.6,
      rimStrength: 2.4,
    },
    {
      kind: 'facets',
      colour: 'rim',
      shadow: 'fog',
      rim: 'accent',
      position: [1.28, -0.95, -1.6],
      rotation: [0.24, -0.5, -0.06],
      divisions: 6,
      width: 1.7,
      height: 1.3,
      relief: 0.44,
      roughness: 0.88,
      seed: 0.86,
      opacity: 0.5,
      rimStrength: 2.0,
    },

    // A long low swell, catching the sunset along its crest.
    {
      kind: 'ribbon',
      colour: 'key',
      rim: 'accent',
      position: [0.1, -1.3, -1.15],
      rotation: [0.03, 0.18, -0.02],
      segments: 200,
      length: 4.2,
      width: 0.06,
      amplitude: 0.1,
      frequency: 2.0,
      depth: 0.24,
      seed: 0.57,
      opacity: 0.34,
      rimStrength: 2.2,
    },

    // Dune sand streaming off the headland: fast, low, and nearly horizontal.
    {
      kind: 'particles',
      colour: 'accent',
      behaviour: 'drift',
      position: [0, -0.85, 0],
      budget: 0.14,
      spread: [3.2, 1.1, 1.5],
      speed: 0.22,
      swirl: 0.05,
      size: 10,
      opacity: 0.42,
      additive: false,
      stretch: 2.4,
    },

    // Coastal haze, lit from behind by the setting sun.
    {
      kind: 'particles',
      colour: 'key',
      behaviour: 'rise',
      position: [0, -0.5, -0.4],
      budget: 0.06,
      spread: [3.4, 1.5, 1.4],
      speed: 0.016,
      swirl: 0.04,
      size: 250,
      opacity: 0.028,
      additive: true,
    },
  ],

  landmarks: [
    {
      art: kohEBatilLighthouse,
      height: 0.66,
      orbitRadius: 1.84,
      orbitTilt: 0.13,
      orbitY: -0.12,
      direction: 1,
      phase: 0,
      anchored: true,
      slot: 'first',
    },
    {
      art: fishingDhow,
      height: 0.5,
      orbitRadius: 1.7,
      orbitTilt: -0.12,
      orbitY: -0.16,
      direction: -1,
      phase: 0.34,
      anchored: true,
      slot: 'second',
    },
  ],
}
