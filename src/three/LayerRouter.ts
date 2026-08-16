import { Object3D, Scene, Vector3 } from 'three'
import { GLOBE_RADIUS } from './Camera'

/**
 * Rear/front layer assignment.
 *
 * The composition is two renderers sharing one camera: the rear scene holds the
 * Earth and everything currently behind it, the front scene is transparent and
 * holds everything that has cleared the Earth's silhouette. An object crossing
 * between them is reparented, not faded.
 *
 * Two rules make this stable:
 *
 *   Hysteresis — the switch threshold is a band, not a plane, so an object
 *   hovering exactly at the globe's depth cannot oscillate between layers and
 *   flicker.
 *
 *   Occlusion-gated opacity — an object may only change opacity while it is in
 *   the rear layer *and* inside the globe's screen-space disc, i.e. genuinely
 *   hidden. This is the mechanism behind "no opacity crossfades as a primary
 *   transition" and "nothing disappears while centered over the globe or in the
 *   foreground": rather than trusting the choreography to be well-behaved, the
 *   fade is simply not permitted anywhere it would be visible.
 */

export type Layer = 'rear' | 'front'

/** Half-width of the no-switch band, in world units. */
const HYSTERESIS = 0.05

export interface Placement {
  readonly layer: Layer
  /** Signed depth relative to the globe centre along the view axis. */
  readonly depth: number
  /** True when the object is behind the globe *and* occluded by it. */
  readonly hidden: boolean
}

const _toObject = new Vector3()
const _toGlobe = new Vector3()
const _forward = new Vector3()
const _lateral = new Vector3()

export class LayerRouter {
  constructor(
    private readonly rear: Scene,
    private readonly front: Scene,
  ) {}

  /**
   * Decide where an object belongs and move it there.
   *
   * @param radius  World-space radius of the object, used to decide whether it
   *                is fully swallowed by the globe's silhouette.
   */
  place(
    object: Object3D,
    worldPosition: Vector3,
    cameraPosition: Vector3,
    globeCenter: Vector3,
    radius: number,
  ): Placement {
    _forward.copy(globeCenter).sub(cameraPosition).normalize()
    _toObject.copy(worldPosition).sub(cameraPosition)
    _toGlobe.copy(globeCenter).sub(cameraPosition)

    const objectDepth = _toObject.dot(_forward)
    const globeDepth = _toGlobe.dot(_forward)
    const depth = objectDepth - globeDepth

    const previous = (object.userData.layer as Layer | undefined) ?? 'rear'
    let layer: Layer = previous
    if (depth < -HYSTERESIS) layer = 'front'
    else if (depth > HYSTERESIS) layer = 'rear'

    if (layer !== previous || object.parent === null) {
      object.userData.layer = layer
      const target = layer === 'front' ? this.front : this.rear
      if (object.parent !== target) target.add(object)
    }

    // Perpendicular distance from the view axis: how far off the globe's disc
    // the object sits, independent of how far behind it is.
    _lateral.copy(_toObject).addScaledVector(_forward, -objectDepth)
    const lateralDistance = _lateral.length()

    // Fully swallowed only when the object's whole extent is inside the disc,
    // with a small inset so a fade never begins on the silhouette edge.
    const hidden = layer === 'rear' && lateralDistance + radius < GLOBE_RADIUS * 0.9

    return { layer, depth, hidden }
  }

  remove(object: Object3D): void {
    object.removeFromParent()
    delete object.userData.layer
  }
}
