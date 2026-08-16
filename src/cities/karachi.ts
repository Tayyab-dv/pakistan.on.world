import { mazarEQuaid } from '../art/landmarks/mazar-e-quaid'
import { merewetherClock } from '../art/landmarks/merewether-clock'
import type { CityChoreography } from './motifs'

/**
 * Karachi — summer, rising daylight.
 *
 * Sea air, heat and constant motion. Long coastal swells below the globe, the
 * skeletal geometry of the port above them, palms close to camera, and two
 * particle systems doing different jobs: a hard shimmer for the heat coming off
 * the city, and a soft mist for the spray off the water.
 */
export const karachi: CityChoreography = {
  motifs: [
    // Coastal swell: two long ribbons at slightly different frequencies, so
    // they beat against each other rather than moving as one.
    {
      kind: 'ribbon',
      colour: 'atmo',
      rim: 'key',
      position: [-0.1, -1.24, -0.9],
      rotation: [0.05, 0.16, -0.03],
      segments: 200,
      length: 4.0,
      width: 0.075,
      amplitude: 0.13,
      frequency: 2.4,
      depth: 0.26,
      seed: 0.19,
      opacity: 0.26,
      rimStrength: 1.7,
    },
    {
      kind: 'ribbon',
      colour: 'cloud',
      rim: 'accent',
      position: [0.15, -1.4, -1.35],
      rotation: [-0.03, -0.24, 0.02],
      segments: 180,
      length: 3.6,
      width: 0.055,
      amplitude: 0.1,
      frequency: 3.1,
      depth: 0.22,
      seed: 0.63,
      opacity: 0.18,
      rimStrength: 1.4,
    },

    // Port cranes: kept procedural. They are line forms, not architecture, and
    // the brief only replaced the structural approximations with landmarks.
    {
      kind: 'linepoints',
      shape: 'crane',
      colour: 'ink',
      node: 'accent',
      position: [1.05, -0.95, -1.5],
      count: 5,
      span: 1.1,
      depth: 0.45,
      rise: 0.2,
      scaleFactor: 0.55,
      seed: 0.28,
      opacity: 0.75,
      nodeSize: 40,
    },

    // Palms, close and low.
    // Palms. Not pure fog like Islamabad's pines: Karachi's night side is dark
    // where they sit, and a black silhouette against a black sky is nothing at
    // all. Lit side takes the rim colour so they read as shapes.
    {
      kind: 'silhouette',
      shape: 'palm',
      colour: 'rim',
      shadow: 'fog',
      rim: 'accent',
      position: [-0.95, -1.1, -1.0],
      count: 10,
      span: 1.3,
      depth: 0.4,
      minHeight: 0.14,
      maxHeight: 0.3,
      seed: 0.71,
      opacity: 0.62,
    },

    // Heat shimmer: agitated, no net travel, tight to the globe.
    {
      kind: 'particles',
      colour: 'key',
      behaviour: 'shimmer',
      position: [0, -0.35, 0.1],
      budget: 0.12,
      spread: [2.6, 1.2, 1.5],
      speed: 0.02,
      swirl: 0.07,
      size: 26,
      opacity: 0.13,
      additive: true,
    },

    // Sea spray: rising, soft, and cooler than the heat above it.
    {
      kind: 'particles',
      colour: 'cloud',
      behaviour: 'rise',
      position: [0, -0.8, 0],
      budget: 0.1,
      spread: [3.0, 1.4, 1.6],
      speed: 0.07,
      swirl: 0.09,
      size: 17,
      opacity: 0.3,
      additive: false,
    },
  ],

  landmarks: [
    {
      art: mazarEQuaid,
      height: 0.7,
      orbitRadius: 1.82,
      orbitTilt: 0.12,
      orbitY: -0.1,
      direction: 1,
      phase: 0,
      anchored: true,
      slot: 'first',
    },
    {
      art: merewetherClock,
      height: 0.78,
      orbitRadius: 1.7,
      orbitTilt: -0.14,
      orbitY: -0.06,
      direction: -1,
      phase: 0.3,
      anchored: true,
      slot: 'second',
    },
  ],
}
