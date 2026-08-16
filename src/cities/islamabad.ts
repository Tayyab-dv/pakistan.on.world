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
      colour: 'key',
      rim: 'accent',
      position: [-0.2, -1.3, -1.0],
      rotation: [0.06, 0.22, -0.04],
      segments: 180,
      length: 3.8,
      width: 0.07,
      amplitude: 0.2,
      frequency: 1.05,
      depth: 0.3,
      seed: 0.31,
      opacity: 0.2,
      rimStrength: 1.8,
    },
    {
      kind: 'ribbon',
      colour: 'atmo',
      rim: 'key',
      position: [0.25, -1.46, -1.5],
      rotation: [-0.04, -0.3, 0.03],
      segments: 160,
      length: 3.3,
      width: 0.055,
      amplitude: 0.15,
      frequency: 1.5,
      depth: 0.26,
      seed: 0.77,
      opacity: 0.14,
      rimStrength: 1.5,
    },

    // Tulip and blossom, drifting rather than falling — spring, not autumn.
    // Sparse and small on purpose: at any real density this stops reading as
    // blossom carried on the air and starts reading as noise over the globe.
    {
      kind: 'particles',
      colour: 'accent',
      behaviour: 'drift',
      position: [0, 0, 0],
      budget: 0.15,
      spread: [3.2, 2.0, 1.8],
      speed: 0.05,
      swirl: 0.1,
      size: 13,
      opacity: 0.55,
      additive: false,
      stretch: 1.6,
    },

    // Morning haze: very large, very faint, additive — a wash of light at the
    // edges of the frame rather than anything the eye resolves as particles.
    {
      kind: 'particles',
      colour: 'key',
      behaviour: 'rise',
      position: [0, -0.4, -0.5],
      budget: 0.05,
      spread: [3.4, 1.6, 1.4],
      speed: 0.018,
      swirl: 0.04,
      size: 240,
      opacity: 0.022,
      additive: true,
    },

    // Pine stand: a treeline, not a row of trees. Dark against the sky with a
    // warm sunrise edge, and small enough that the eye reads texture rather
    // than individual shapes — at any larger size these look like clip art.
    {
      kind: 'silhouette',
      shape: 'pine',
      colour: 'fog',
      shadow: 'fog',
      rim: 'accent',
      position: [-0.05, -1.2, -1.4],
      count: 26,
      span: 2.1,
      depth: 0.55,
      minHeight: 0.07,
      maxHeight: 0.17,
      seed: 0.42,
      opacity: 0.8,
    },
  ],

  landmarks: [
    {
      art: faisalMosque,
      height: 0.78,
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
      height: 0.82,
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
