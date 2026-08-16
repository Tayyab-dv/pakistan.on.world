import type { Vector3 } from 'three'
import type { LatticeMotifKind } from '../three/primitives/Lattice'
import type { LinePointsKind } from '../three/primitives/LinePoints'
import type { ParticleBehaviour } from '../three/primitives/ParticleField'
import type { SilhouetteKind } from '../three/primitives/Silhouette'
import type { LandmarkArt } from '../art/types'
import type { RGB, Theme } from './themes'

/**
 * The declarative description of a city's choreography.
 *
 * Six primitive generators cover all thirty motifs across the six cities. A
 * city is then a list of configurations rather than a bespoke module, which is
 * what keeps the motion language coherent between cities while leaving every
 * individual motif tunable.
 *
 * Colour is never specified literally here — a motif names a *role* in the
 * city's theme, so recolouring a city is a single edit in `themes.ts` and the
 * choreography follows automatically.
 */

export type PaletteRole =
  | 'key'
  | 'accent'
  | 'atmo'
  | 'rim'
  | 'ink'
  | 'cloud'
  | 'surface'
  /** The scene background. A motif using this reads as a true silhouette. */
  | 'fog'

export function paletteColour(theme: Theme, role: PaletteRole): RGB {
  switch (role) {
    case 'key':
      return theme.key
    case 'accent':
      return theme.accent
    case 'atmo':
      return theme.atmo
    case 'rim':
      return theme.rim
    case 'ink':
      return theme.ink
    case 'cloud':
      return theme.cloudTint
    case 'surface':
      return theme.surfaceTint
    case 'fog':
      return theme.fog
  }
}

/** Placement of a motif relative to the globe, in globe radii. */
export interface Placement {
  readonly position: readonly [number, number, number]
  readonly rotation?: readonly [number, number, number]
  readonly scale?: number
}

export interface ParticleMotif extends Placement {
  readonly kind: 'particles'
  readonly colour: PaletteRole
  readonly behaviour: ParticleBehaviour
  /** Fraction of the tier's particle budget this field claims. */
  readonly budget: number
  readonly spread: readonly [number, number, number]
  readonly speed: number
  readonly swirl: number
  readonly size: number
  readonly opacity: number
  readonly additive: boolean
  readonly stretch?: number
}

export interface RibbonMotif extends Placement {
  readonly kind: 'ribbon'
  readonly colour: PaletteRole
  readonly shadow?: PaletteRole
  readonly rim?: PaletteRole
  readonly segments: number
  readonly length: number
  readonly width: number
  readonly amplitude: number
  readonly frequency: number
  readonly depth: number
  readonly seed: number
  readonly opacity: number
  readonly rimStrength?: number
}

export interface SilhouetteMotif extends Placement {
  readonly kind: 'silhouette'
  readonly shape: SilhouetteKind
  readonly colour: PaletteRole
  readonly shadow?: PaletteRole
  readonly rim?: PaletteRole
  readonly count: number
  readonly span: number
  readonly depth: number
  readonly minHeight: number
  readonly maxHeight: number
  readonly seed: number
  readonly opacity: number
}

export interface LatticeMotif extends Placement {
  readonly kind: 'lattice'
  readonly pattern: LatticeMotifKind
  readonly colour: PaletteRole
  readonly shadow?: PaletteRole
  readonly rim?: PaletteRole
  readonly fragments: number
  readonly columns: number
  readonly rows: number
  readonly size: number
  readonly scatter: number
  readonly seed: number
  readonly opacity: number
}

export interface LinePointsMotif extends Placement {
  readonly kind: 'linepoints'
  readonly shape: LinePointsKind
  /** Colour of the structure. */
  readonly colour: PaletteRole
  /** Colour of the glowing nodes. */
  readonly node: PaletteRole
  readonly count: number
  readonly span: number
  readonly depth: number
  /** Vertical scatter, so instances do not all hang on one flat line. */
  readonly rise?: number
  readonly scaleFactor: number
  readonly seed: number
  readonly opacity: number
  readonly nodeSize: number
}

export interface FacetsMotif extends Placement {
  readonly kind: 'facets'
  readonly colour: PaletteRole
  readonly shadow?: PaletteRole
  readonly rim?: PaletteRole
  readonly divisions: number
  readonly width: number
  readonly height: number
  readonly relief: number
  readonly roughness: number
  readonly seed: number
  readonly opacity: number
  readonly rimStrength?: number
}

export type Motif =
  | ParticleMotif
  | RibbonMotif
  | SilhouetteMotif
  | LatticeMotif
  | LinePointsMotif
  | FacetsMotif

/**
 * A landmark's spatial score, without the progress window — that is derived
 * from the city's position in the journey so the two can never disagree.
 */
export interface LandmarkScore {
  readonly art: LandmarkArt
  readonly height: number
  readonly orbitRadius: number
  readonly orbitTilt: number
  readonly orbitY: number
  readonly direction: 1 | -1
  readonly phase: number
  readonly anchored: boolean
  /** Never cross in front of the Earth. K2 only — see `LandmarkConfig`. */
  readonly backdrop?: boolean
  /**
   * Which half of the city this landmark owns.
   * 'first' takes focus in states 1-2, 'second' in states 3-4.
   */
  readonly slot: 'first' | 'second'
}

export interface CityChoreography {
  readonly motifs: readonly Motif[]
  readonly landmarks: readonly LandmarkScore[]
}

/** Convert a readonly tuple to a Three vector without allocating in a loop. */
export function toVector(target: Vector3, source: readonly [number, number, number]): Vector3 {
  return target.set(source[0], source[1], source[2])
}
