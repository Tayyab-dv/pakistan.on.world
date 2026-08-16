import { k2 } from '../art/landmarks/k2'
import { shigarFort } from '../art/landmarks/shigar-fort'
import type { CityChoreography } from './motifs'

/**
 * Skardu — late autumn, the last of the descending coral light, first snow.
 *
 * Glacial lake planes lying almost flat below the globe, poplars turning gold,
 * bare apricot branches, and the first snow of the year coming down over all
 * of it.
 *
 * The Karakoram peak silhouettes from the original brief are not built — K2
 * supersedes them, and it is scaled as a backdrop rather than as an object in
 * the same size class as the fort.
 */
export const skardu: CityChoreography = {
  motifs: [
    // The glacial lake: very low roughness, so it reads as a broken sheet of
    // ice rather than as terrain.
    {
      kind: 'facets',
      colour: 'atmo',
      shadow: 'fog',
      rim: 'key',
      position: [0, -1.34, -0.9],
      rotation: [0.34, 0.12, 0],
      divisions: 10,
      width: 2.9,
      height: 1.5,
      relief: 0.14,
      roughness: 0.22,
      seed: 0.29,
      opacity: 0.26,
      rimStrength: 2.4,
    },

    // Poplar stand — tall, narrow, unmistakably the Shigar valley.
    {
      kind: 'silhouette',
      shape: 'poplar',
      colour: 'accent',
      shadow: 'fog',
      rim: 'key',
      position: [-0.7, -1.2, -1.25],
      count: 18,
      span: 1.7,
      depth: 0.5,
      minHeight: 0.14,
      maxHeight: 0.32,
      seed: 0.61,
      opacity: 0.66,
    },

    // Bare apricot branches, close to camera on the opposite side.
    {
      kind: 'linepoints',
      shape: 'branch',
      colour: 'surface',
      node: 'accent',
      position: [-1.45, -0.95, -0.5],
      count: 5,
      span: 0.7,
      depth: 0.4,
      rise: 0.25,
      scaleFactor: 0.75,
      seed: 0.88,
      opacity: 0.3,
      nodeSize: 22,
    },

    // Poplar leaves coming off in the cold.
    {
      kind: 'particles',
      colour: 'accent',
      behaviour: 'fall',
      position: [0, 0.15, 0.1],
      budget: 0.1,
      spread: [2.8, 1.9, 1.6],
      speed: 0.1,
      swirl: 0.16,
      size: 13,
      opacity: 0.45,
      additive: false,
      stretch: 1.7,
    },

    // First snow: the densest particle field of the journey, and the only one
    // that should read as weather rather than as atmosphere.
    {
      kind: 'particles',
      colour: 'ink',
      behaviour: 'fall',
      position: [0, 0.35, 0],
      budget: 0.22,
      spread: [3.4, 2.2, 1.9],
      speed: 0.14,
      swirl: 0.1,
      size: 14,
      opacity: 0.68,
      additive: false,
    },
  ],

  landmarks: [
    // K2 is the exception the brief calls out: a towering backdrop presence,
    // not a low architectural anchor. Wide orbit so it clears the globe at its
    // much larger size, placed high, and explicitly not seated on the limb.
    {
      art: k2,
      height: 1.6,
      orbitRadius: 2.3,
      orbitTilt: 0.05,
      // Sits low enough that its base runs off the bottom of the frame, so the
      // plane's own edge never reads as a horizontal cut across the mountain.
      orbitY: -0.34,
      direction: 1,
      phase: 0,
      anchored: false,
      backdrop: true,
      slot: 'first',
    },
    {
      art: shigarFort,
      height: 0.62,
      orbitRadius: 1.74,
      orbitTilt: -0.15,
      orbitY: -0.1,
      direction: -1,
      phase: 0.33,
      anchored: true,
      slot: 'second',
    },
  ],
}
