import { faisalMosque } from '../art/landmarks/faisal-mosque'
import { pakistanMonument } from '../art/landmarks/pakistan-monument'
import type { CityChoreography } from './motifs'

/**
 * Islamabad — spring, sunrise.
 *
 * A green capital under morning hills: long low ridge lines, blossom carried on
 * a slow drift, and a haze that the low sun lights from behind. The pine stand
 * sits close to the camera and low in frame, so the globe rises out of it.
 *
 * The tent-fold mosque geometry the original brief called for is not built
 * here: it is superseded by the Faisal Mosque landmark below, which does the
 * same job and is actually recognisable.
 */
export const islamabad: CityChoreography = {
  motifs: [
    // Ridge lines: two long, shallow ribbons crossing behind and below the
    // globe, reading as the Margalla hills at first light.
    {
      kind: 'ribbon',
      colour: 'rim',
      rim: 'key',
      position: [-0.15, -0.92, 0.55],
      rotation: [0.08, 0.22, -0.05],
      segments: 180,
      length: 3.4,
      width: 0.055,
      amplitude: 0.16,
      frequency: 1.15,
      depth: 0.22,
      seed: 0.31,
      opacity: 0.5,
      rimStrength: 1.3,
    },
    {
      kind: 'ribbon',
      colour: 'atmo',
      rim: 'key',
      position: [0.2, -1.12, -0.35],
      rotation: [-0.05, -0.3, 0.04],
      segments: 160,
      length: 3.0,
      width: 0.04,
      amplitude: 0.12,
      frequency: 1.6,
      depth: 0.18,
      seed: 0.77,
      opacity: 0.34,
      rimStrength: 1.1,
    },

    // Tulip and blossom, drifting rather than falling — spring, not autumn.
    {
      kind: 'particles',
      colour: 'accent',
      behaviour: 'drift',
      position: [0, 0, 0],
      budget: 0.34,
      spread: [2.5, 1.7, 1.5],
      speed: 0.055,
      swirl: 0.09,
      size: 34,
      opacity: 0.62,
      additive: false,
      stretch: 1.5,
    },

    // Morning haze: large, slow, additive, so the low sun appears to light it
    // from behind rather than the haze sitting in front of everything.
    {
      kind: 'particles',
      colour: 'key',
      behaviour: 'rise',
      position: [0, -0.3, 0],
      budget: 0.28,
      spread: [3.0, 1.5, 1.8],
      speed: 0.02,
      swirl: 0.05,
      size: 110,
      opacity: 0.1,
      additive: true,
    },

    // Pine stand, close and low: the globe rises out of it.
    {
      kind: 'silhouette',
      shape: 'pine',
      colour: 'surface',
      shadow: 'rim',
      position: [-0.35, -1.35, 1.05],
      count: 11,
      span: 1.5,
      depth: 0.4,
      minHeight: 0.16,
      maxHeight: 0.34,
      seed: 0.42,
      opacity: 0.82,
    },
  ],

  landmarks: [
    {
      art: faisalMosque,
      height: 0.6,
      orbitRadius: 1.86,
      orbitTilt: 0.14,
      orbitY: -0.12,
      direction: 1,
      phase: 0,
      anchored: true,
      slot: 'first',
    },
    {
      art: pakistanMonument,
      height: 0.66,
      orbitRadius: 1.74,
      orbitTilt: -0.18,
      orbitY: -0.08,
      direction: -1,
      phase: 0.35,
      anchored: true,
      slot: 'second',
    },
  ],
}
