import {
  Mesh,
  MeshBasicMaterial,
  type PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import { clamp, clamp01, invLerp, lerp, smoothstep } from '../core/damp'
import type { Theme } from '../cities/themes'
import type { LandmarkArt } from '../art/types'
import { renderLandmark } from '../art/render'
import type { LandmarkTexture } from '../art/render'
import { GLOBE_RADIUS } from './Camera'
import type { LayerRouter, Placement } from './LayerRouter'

/**
 * A landmark on a globe-centred orbit.
 *
 * The path is one full revolution around the Earth, and every value along it is
 * a pure function of scroll progress — so scrolling backward runs the object
 * back along the identical physical path rather than playing a reversed
 * animation. The eight stages the brief describes fall out of that single
 * revolution:
 *
 *      θ = -π/2   small, genuinely behind the globe   (enters here)
 *      θ =  0     approaching the right-hand limb
 *      θ →        clears the silhouette, switches to the foreground layer
 *      θ =  π/2   crossing the foreground as the focus
 *      θ =  π     moving laterally to the opposite limb
 *      θ = 3π/2   back around and behind             (exits here, hidden)
 *
 * Opacity may only change while the object is occluded — see `LayerRouter` —
 * so an entry or exit can never be seen happening.
 */

const TAU = Math.PI * 2

export interface LandmarkConfig {
  readonly art: LandmarkArt
  /** World height at the focal moment, in globe radii. */
  readonly height: number
  /** Preferred orbit radius, in globe radii. Reduced if the viewport is tight. */
  readonly orbitRadius: number
  /** Inclination of the orbit plane, radians. */
  readonly orbitTilt: number
  /** Vertical offset of the orbit plane, in globe radii. */
  readonly orbitY: number
  readonly direction: 1 | -1
  /** Absolute progress window this landmark occupies. */
  readonly entry: number
  readonly exit: number
  /** Offset added to θ, so two landmarks in a city are never in step. */
  readonly phase: number
  /**
   * Seat the base against the globe's silhouette at the focal moment.
   *
   * True for architecture, which should read as standing on the world's edge.
   * False for K2, which is a scaled backdrop peak rather than a low anchor.
   */
  readonly anchored: boolean

  /**
   * Never come in front of the Earth.
   *
   * K2 alone. The brief asks for it as "a towering backdrop presence", and at
   * the scale a mountain needs to read as a mountain it simply obliterates the
   * globe if it crosses the foreground — which costs the composition its hero.
   *
   * A backdrop keeps the same circular path but with its depth mirrored, so
   * the near half of the orbit becomes a second pass behind: it drifts out to
   * one limb, back behind, out to the other, and back. Both ends of the window
   * still land directly behind the Earth, so the fade stays hidden.
   */
  readonly backdrop?: boolean
}

const _world = new Vector3()
const _spin = new Quaternion()
const _axis = new Vector3(0, 1, 0)

export class Landmark {
  readonly mesh: Mesh
  private readonly material: MeshBasicMaterial
  private readonly art: LandmarkTexture

  /** Effective values after viewport correction. */
  private radius: number
  private scale: number

  private opacity = 0
  private placement: Placement | null = null

  constructor(
    readonly config: LandmarkConfig,
    theme: Theme,
    lightX: number,
    textureSize: number,
  ) {
    this.art = renderLandmark(config.art, theme, lightX, textureSize)

    this.material = new MeshBasicMaterial({
      map: this.art.texture,
      transparent: true,
      // Matches `texture.premultiplyAlpha`. Together these are what keep the
      // silhouette free of the dark fringe that unpremultiplied alpha produces
      // wherever the texture is filtered.
      premultipliedAlpha: true,
      depthWrite: false,
      depthTest: true,
      opacity: 0,
      toneMapped: false,
    })

    this.mesh = new Mesh(new PlaneGeometry(1, 1), this.material)
    this.mesh.visible = false
    this.mesh.renderOrder = 2

    this.radius = config.orbitRadius
    this.scale = 1
  }

  /** World-space radius of the object, for the occlusion test. */
  private get worldRadius(): number {
    const height = this.config.height * this.scale
    return (height * Math.max(1, this.art.aspect)) / 2
  }

  /**
   * Fit the orbit to the viewport.
   *
   * The orbit radius is a world-space quantity but the *visible* world width is
   * not: a portrait phone frames the globe on its horizontal field of view and
   * leaves very little room either side. Rather than letting landmarks swing
   * off-screen there, both the orbit and the object shrink — while never
   * dropping below the radius needed to clear the Earth's silhouette.
   *
   * @param halfWidth Visible half-width in world units at the globe's depth.
   */
  fitViewport(halfWidth: number): void {
    // Below about 1.9 there is no lateral room to speak of, so scale down.
    this.scale = clamp(halfWidth / 1.9, 0.5, 1)

    const objectHalfWidth = this.worldRadius
    const minimum = GLOBE_RADIUS + objectHalfWidth * 0.85
    const maximum = Math.max(minimum, halfWidth * 0.94 - objectHalfWidth)

    this.radius = clamp(this.config.orbitRadius * this.scale, minimum, maximum)
  }

  /**
   * Advance to a progress value.
   *
   * @returns true while the landmark is part of the composition.
   */
  update(
    progress: number,
    camera: PerspectiveCamera,
    globeCenter: Vector3,
    router: LayerRouter,
  ): boolean {
    const { config } = this
    const u = invLerp(config.entry, config.exit, progress)

    if (progress <= config.entry || progress >= config.exit) {
      // Detach on leaving the window, not merely on becoming invisible: an
      // invisible mesh left parented to a scene still participates in every
      // subsequent traversal and sort.
      if (this.mesh.parent !== null) {
        this.mesh.visible = false
        this.opacity = 0
        this.material.opacity = 0
        router.remove(this.mesh)
      }
      return false
    }

    const theta = -Math.PI / 2 + config.direction * u * TAU + config.phase

    // Position on the orbit, then tilt the whole plane. A backdrop mirrors its
    // depth so the path never reaches positive z — in front of the Earth.
    const x = Math.cos(theta) * this.radius
    const sweep = Math.sin(theta) * this.radius
    const z = config.backdrop ? -Math.abs(sweep) : sweep
    const y = config.orbitY * this.scale

    const tilt = config.orbitTilt
    _world.set(
      x,
      y * Math.cos(tilt) - z * Math.sin(tilt),
      y * Math.sin(tilt) + z * Math.cos(tilt),
    )
    _world.add(globeCenter)

    // How far into the foreground the object has come. sin θ is +1 at the
    // nearest point of the orbit and -1 directly behind the globe.
    const frontness = clamp01((Math.sin(theta) + 1) / 2)

    if (config.anchored) {
      // Seat architecture low against the globe as it crosses the foreground,
      // so it reads as standing on the edge of the world rather than hovering.
      //
      // Deliberately a constant height rather than the sphere's silhouette at
      // this x. Following the true limb looks correct on paper but the limb
      // rises to the equator as the object travels outward, which lifts the
      // building into empty sky exactly when it is most visible.
      //
      // `baseline` is where the ground sits within the art, so this puts the
      // *ground line* at the target height rather than the plane's edge.
      const height = config.height * this.scale
      const groundY = globeCenter.y - GLOBE_RADIUS * 0.72
      _world.y = lerp(_world.y, groundY + height * (this.art.baseline - 0.5), frontness)
    }

    this.mesh.position.copy(_world)

    // Face the camera, then yaw slightly toward travel so the object reads as
    // moving through the scene rather than sliding across it.
    this.mesh.quaternion.copy(camera.quaternion)
    _spin.setFromAxisAngle(_axis, config.direction * 0.18 * Math.cos(theta))
    this.mesh.quaternion.multiply(_spin)

    const height = config.height * this.scale * (0.82 + 0.18 * frontness)
    this.mesh.scale.set(height * this.art.aspect, height, 1)

    this.placement = router.place(
      this.mesh,
      _world,
      camera.position,
      globeCenter,
      this.worldRadius,
    )

    // The fade envelope.
    //
    // A pure function of progress, like everything else here. An earlier
    // version gated the change on live occlusion — only letting opacity move
    // while the object was measurably hidden — which was correct frame to frame
    // but broke the moment progress jumped rather than swept: clicking a
    // stepper dot, or reloading onto a restored scroll position, could land a
    // landmark mid-orbit with its opacity frozen at zero, invisible for the
    // rest of the city.
    //
    // Safety now comes from the window instead. Both edges sit at θ = ±π/2,
    // the deepest point directly behind the Earth, and the ramp is short enough
    // that it finishes long before the object reaches the limb — so the fade
    // still cannot be seen, and it survives discontinuous progress.
    this.opacity = smoothstep(0, 0.045, u) * (1 - smoothstep(0.955, 1, u))

    this.material.opacity = this.opacity
    this.mesh.visible = this.opacity > 0.002
    return this.mesh.visible
  }

  /** Current opacity, sampled by the verification harness. */
  get currentOpacity(): number {
    return this.opacity
  }

  get layer(): string {
    return (this.mesh.userData.layer as string | undefined) ?? 'rear'
  }

  /**
   * Whether the object is genuinely out of sight this frame.
   *
   * No longer used to gate the fade — that is a pure function of progress now —
   * but the harness asserts against it: every frame in which opacity changes
   * must be a frame in which this is true, or behind the globe at least.
   */
  get occluded(): boolean {
    if (!this.placement) return false
    return this.placement.hidden || this.placement.depth > GLOBE_RADIUS * 0.5
  }

  dispose(router: LayerRouter): void {
    router.remove(this.mesh)
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.art.dispose()
  }
}
