import { Group, type Object3D, type PerspectiveCamera, Vector3 } from 'three'
import { STATES_PER_CITY } from '../cities'
import type { City } from '../cities'
import type { CityChoreography, Motif } from '../cities/motifs'
import { paletteColour } from '../cities/motifs'
import type { Theme } from '../cities/themes'
import type { Keyframe } from '../cities/keyframes'
import { clamp01, smoothstep } from '../core/damp'
import type { TierProfile } from '../core/tier'
import { Landmark } from './Landmark'
import type { LayerRouter } from './LayerRouter'
import { Facets } from './primitives/Facets'
import { Lattice } from './primitives/Lattice'
import { LinePoints } from './primitives/LinePoints'
import { ParticleField } from './primitives/ParticleField'
import { Ribbon } from './primitives/Ribbon'
import { Silhouette } from './primitives/Silhouette'

/**
 * One city's choreography.
 *
 * Everything is built once at load and then only transformed — the brief's
 * "avoid remounting a complete Three.js scene on every city change" applies to
 * the motifs as much as to the globe. A city that is not active has its root
 * hidden and its landmarks outside their progress windows, so it costs nothing
 * to leave assembled.
 *
 * The motif root lives in the rear scene and moves as a unit under the
 * keyframe's scale, spin and depth. Landmarks are *not* children of it: they
 * are routed independently between the rear and front scenes as they orbit, so
 * they can genuinely pass in front of the Earth while the atmosphere behind it
 * does not.
 */

interface BuiltMotif {
  readonly motif: Motif
  readonly particles?: ParticleField
  readonly ribbon?: Ribbon
  readonly silhouette?: Silhouette
  readonly lattice?: Lattice
  readonly linePoints?: LinePoints
  readonly facets?: Facets
}

/** How far either side of a city boundary the motifs cross-fade, in states. */
const HANDOVER = 0.5

export class Choreography {
  readonly root = new Group()

  private readonly built: BuiltMotif[] = []
  private readonly landmarks: Landmark[] = []
  private readonly start: number

  constructor(
    readonly city: City,
    readonly cityIndex: number,
    score: CityChoreography,
    theme: Theme,
    sun: Vector3,
    profile: TierProfile,
    pixelRatio: number,
    lightX: number,
  ) {
    this.start = cityIndex * STATES_PER_CITY
    this.root.visible = false

    for (const motif of score.motifs) {
      this.built.push(this.buildMotif(motif, sun, profile, pixelRatio))
    }

    for (const landmarkScore of score.landmarks) {
      // Windows are derived from the city's position so they can never drift
      // out of step with the five states, and so the exit always lands on the
      // boundary with the object already behind the globe.
      const first = landmarkScore.slot === 'first'
      const entry = this.start + (first ? -0.25 : 2.0)
      const exit = this.start + (first ? 3.0 : STATES_PER_CITY)

      this.landmarks.push(
        new Landmark(
          {
            art: landmarkScore.art,
            height: landmarkScore.height,
            orbitRadius: landmarkScore.orbitRadius,
            orbitTilt: landmarkScore.orbitTilt,
            orbitY: landmarkScore.orbitY,
            direction: landmarkScore.direction,
            phase: landmarkScore.phase,
            anchored: landmarkScore.anchored,
            ...(landmarkScore.backdrop === undefined
              ? {}
              : { backdrop: landmarkScore.backdrop }),
            entry,
            exit,
          },
          theme,
          lightX,
          profile.landmarkTexture,
        ),
      )
    }
  }

  private buildMotif(
    motif: Motif,
    sun: Vector3,
    profile: TierProfile,
    pixelRatio: number,
  ): BuiltMotif {
    switch (motif.kind) {
      case 'particles': {
        const particles = new ParticleField(
          {
            count: Math.max(120, Math.round(profile.particles * motif.budget)),
            behaviour: motif.behaviour,
            spread: new Vector3(...motif.spread),
            speed: motif.speed,
            swirl: motif.swirl,
            size: motif.size,
            opacity: motif.opacity,
            additive: motif.additive,
            ...(motif.stretch === undefined ? {} : { stretch: motif.stretch }),
          },
          pixelRatio,
        )
        this.placeObject(particles.points, motif)
        this.root.add(particles.points)
        return { motif, particles }
      }

      case 'ribbon': {
        const ribbon = new Ribbon(
          {
            segments: motif.segments,
            length: motif.length,
            width: motif.width,
            amplitude: motif.amplitude,
            frequency: motif.frequency,
            depth: motif.depth,
            seed: motif.seed,
            opacity: motif.opacity,
            ...(motif.rimStrength === undefined ? {} : { rimStrength: motif.rimStrength }),
          },
          sun,
        )
        this.placeObject(ribbon.mesh, motif)
        this.root.add(ribbon.mesh)
        return { motif, ribbon }
      }

      case 'silhouette': {
        const silhouette = new Silhouette(
          {
            kind: motif.shape,
            count: motif.count,
            span: motif.span,
            depth: motif.depth,
            minHeight: motif.minHeight,
            maxHeight: motif.maxHeight,
            seed: motif.seed,
            opacity: motif.opacity,
          },
          sun,
        )
        this.placeObject(silhouette.group, motif)
        this.root.add(silhouette.group)
        return { motif, silhouette }
      }

      case 'lattice': {
        const lattice = new Lattice(
          {
            pattern: motif.pattern,
            fragments: motif.fragments,
            columns: motif.columns,
            rows: motif.rows,
            size: motif.size,
            scatter: motif.scatter,
            seed: motif.seed,
            opacity: motif.opacity,
          },
          sun,
        )
        this.placeObject(lattice.group, motif)
        this.root.add(lattice.group)
        return { motif, lattice }
      }

      case 'linepoints': {
        const linePoints = new LinePoints(
          {
            kind: motif.shape,
            count: motif.count,
            span: motif.span,
            depth: motif.depth,
            ...(motif.rise === undefined ? {} : { rise: motif.rise }),
            scale: motif.scaleFactor,
            seed: motif.seed,
            opacity: motif.opacity,
            nodeSize: motif.nodeSize,
          },
          pixelRatio,
        )
        this.placeObject(linePoints.group, motif)
        this.root.add(linePoints.group)
        return { motif, linePoints }
      }

      case 'facets': {
        const facets = new Facets(
          {
            divisions: motif.divisions,
            width: motif.width,
            height: motif.height,
            relief: motif.relief,
            roughness: motif.roughness,
            seed: motif.seed,
            opacity: motif.opacity,
            ...(motif.rimStrength === undefined ? {} : { rimStrength: motif.rimStrength }),
          },
          sun,
        )
        this.placeObject(facets.mesh, motif)
        this.root.add(facets.mesh)
        return { motif, facets }
      }
    }
  }

  private placeObject(object: Object3D, motif: Motif): void {
    object.position.set(...motif.position)
    if (motif.rotation) object.rotation.set(...motif.rotation)
    if (motif.scale !== undefined) object.scale.setScalar(motif.scale)
  }

  /**
   * Presence of this city in the composition, 0..1.
   *
   * Rises across the boundary into the city and falls across the boundary out
   * of it, so consecutive cities hand over rather than cutting.
   */
  presence(progress: number): number {
    const into = smoothstep(this.start - HANDOVER, this.start + HANDOVER, progress)
    const outOf = smoothstep(
      this.start + STATES_PER_CITY - HANDOVER,
      this.start + STATES_PER_CITY + HANDOVER,
      progress,
    )
    return clamp01(into * (1 - outOf))
  }

  update(
    progress: number,
    dt: number,
    frame: Keyframe,
    theme: Theme,
    camera: PerspectiveCamera,
    globeCenter: Vector3,
    router: LayerRouter,
    reduced: boolean,
  ): void {
    const presence = this.presence(progress)

    // Landmarks are gated by their own windows, not by the city root, because
    // they must be able to orbit across the boundary while the motifs fade.
    for (const landmark of this.landmarks) {
      landmark.update(progress, camera, globeCenter, router)
    }

    if (presence <= 0.001) {
      if (this.root.visible) this.root.visible = false
      return
    }
    this.root.visible = true

    // The root's own motion: the whole group scales, spins and moves in depth
    // under the keyframe, which is what makes the motifs feel like they are
    // dancing around the globe rather than sitting beside it.
    this.root.scale.setScalar(frame.choreoScale)
    this.root.rotation.y = frame.choreoSpin
    this.root.position.copy(globeCenter)
    this.root.position.z += frame.choreoDepth

    const rate = frame.particleRate * presence

    for (const item of this.built) {
      const motif = item.motif

      if (item.particles) {
        item.particles.update(dt, rate, paletteColour(theme, motif.colour), reduced)
        continue
      }

      const fog = theme.fog

      if (item.ribbon && motif.kind === 'ribbon') {
        item.ribbon.setPalette(
          paletteColour(theme, motif.colour),
          motif.shadow ? paletteColour(theme, motif.shadow) : fog,
          motif.rim ? paletteColour(theme, motif.rim) : theme.rim,
        )
        item.ribbon.setOpacity(presence)
      }

      if (item.silhouette && motif.kind === 'silhouette') {
        item.silhouette.setPalette(
          paletteColour(theme, motif.colour),
          motif.shadow ? paletteColour(theme, motif.shadow) : fog,
          motif.rim ? paletteColour(theme, motif.rim) : theme.rim,
        )
        item.silhouette.setOpacity(presence)
      }

      if (item.lattice && motif.kind === 'lattice') {
        item.lattice.setPalette(
          paletteColour(theme, motif.colour),
          motif.shadow ? paletteColour(theme, motif.shadow) : fog,
          motif.rim ? paletteColour(theme, motif.rim) : theme.rim,
        )
        item.lattice.setOpacity(presence)
      }

      if (item.linePoints && motif.kind === 'linepoints') {
        item.linePoints.setPalette(
          paletteColour(theme, motif.colour),
          paletteColour(theme, motif.node),
        )
        item.linePoints.setOpacity(presence)
      }

      if (item.facets && motif.kind === 'facets') {
        item.facets.setPalette(
          paletteColour(theme, motif.colour),
          motif.shadow ? paletteColour(theme, motif.shadow) : fog,
          motif.rim ? paletteColour(theme, motif.rim) : theme.rim,
        )
        item.facets.setOpacity(presence)
      }
    }
  }

  fitViewport(halfWidth: number): void {
    for (const landmark of this.landmarks) landmark.fitViewport(halfWidth)
  }

  setPixelRatio(ratio: number): void {
    for (const item of this.built) {
      item.particles?.setPixelRatio(ratio)
      item.linePoints?.setPixelRatio(ratio)
    }
  }

  /** Landmark state, sampled by the verification harness. */
  get landmarkStates(): ReadonlyArray<{
    id: string
    opacity: number
    layer: string
    occluded: boolean
  }> {
    return this.landmarks.map((landmark) => ({
      id: landmark.config.art.id,
      opacity: landmark.currentOpacity,
      layer: landmark.layer,
      occluded: landmark.occluded,
    }))
  }

  dispose(router: LayerRouter): void {
    for (const item of this.built) {
      item.particles?.dispose()
      item.ribbon?.dispose()
      item.silhouette?.dispose()
      item.lattice?.dispose()
      item.linePoints?.dispose()
      item.facets?.dispose()
    }
    for (const landmark of this.landmarks) landmark.dispose(router)
    this.root.removeFromParent()
  }
}
