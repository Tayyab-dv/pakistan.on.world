import {
  ACESFilmicToneMapping,
  Color,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three'
import {
  CITIES,
  MAX_STATE,
  STATES_PER_CITY,
  cityAt,
  cityIndexForProgress,
} from '../cities'
import { KEYFRAMES, createWorkingKeyframe, sampleKeyframe } from '../cities/keyframes'
import type { Keyframe } from '../cities/keyframes'
import { THEMES, applyThemeToCSS, createWorkingTheme, lerpTheme } from '../cities/themes'
import type { Theme } from '../cities/themes'
import { clamp, smootherstep } from '../core/damp'
import { LAMBDA, globeLambda, themeLambda } from '../core/motion-pref'
import { TierMonitor, pixelRatioCap } from '../core/tier'
import type { TierProfile } from '../core/tier'
import { createCamera, solveFitDistance } from './Camera'
import { Globe } from './Globe'
import { Markers } from './Markers'
import { loadEarthTextures } from './textures'

/**
 * The 3D world.
 *
 * A plain class, instantiated exactly once and never touched by React's
 * reconciler. The brief requires that the globe "never remounts", and the most
 * reliable way to guarantee that is for React to have no opinion about the
 * scene graph at all: it mounts two canvases and hands them over.
 *
 * Two renderers share one camera and one animation frame. The rear canvas holds
 * the Earth, its atmosphere, the orbital guide lines and anything currently
 * behind the globe; the front canvas is transparent and holds whatever has
 * cleared the Earth's silhouette. Real depth testing cannot do this on its own
 * because the layers need to composite independently.
 */

export interface WorldHandles {
  rear: HTMLCanvasElement
  front: HTMLCanvasElement
  onCityPick: (index: number) => void
}

/** Movement in pixels beyond which a pointer gesture is a drag, not a click. */
const CLICK_SLOP = 5

export class World {
  private rendererRear: WebGLRenderer | null = null
  private rendererFront: WebGLRenderer | null = null
  private readonly sceneRear = new Scene()
  private readonly sceneFront = new Scene()
  private camera: PerspectiveCamera | null = null

  private globe: Globe | null = null
  private markers: Markers | null = null

  private readonly tierMonitor = new TierMonitor()
  private profile: TierProfile = this.tierMonitor.profile

  private readonly theme: Theme = createWorkingTheme()
  private readonly frame: Keyframe = createWorkingKeyframe()
  private readonly background = new Color()

  private fitDistance = 3
  private ready = false
  private disposed = false
  private handles: WorldHandles | null = null
  private teardown: Array<() => void> = []

  /** Latest rendered progress, exposed for the verification harness. */
  progress = 0

  get isReady(): boolean {
    return this.ready
  }

  get tierProfile(): TierProfile {
    return this.profile
  }

  async init(handles: WorldHandles): Promise<void> {
    if (this.rendererRear || this.disposed) return
    this.handles = handles

    const dpr = pixelRatioCap()

    this.rendererRear = new WebGLRenderer({
      canvas: handles.rear,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.rendererFront = new WebGLRenderer({
      canvas: handles.front,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })

    for (const renderer of [this.rendererRear, this.rendererFront]) {
      renderer.setPixelRatio(dpr)
      renderer.outputColorSpace = SRGBColorSpace
      renderer.toneMapping = ACESFilmicToneMapping
      renderer.toneMappingExposure = 1
    }
    this.rendererFront.setClearColor(0x000000, 0)

    this.camera = createCamera(window.innerWidth / Math.max(1, window.innerHeight))

    const textures = await loadEarthTextures(this.profile)
    if (this.disposed) return

    this.globe = new Globe(textures, this.profile)
    this.markers = new Markers()
    this.globe.group.add(this.markers.group)
    this.sceneRear.add(this.globe.group)

    // Seed orientation and theme from the current scroll position so the first
    // frame is already correct rather than easing in from a default.
    const initial = KEYFRAMES[0]!
    this.globe.setTarget(initial.camLat, initial.camLon)

    this.resize()
    this.attachPointer()

    this.tierMonitor.onChange((profile) => {
      this.profile = profile
      this.rendererRear?.setPixelRatio(Math.min(pixelRatioCap(), 1.5))
      this.rendererFront?.setPixelRatio(Math.min(pixelRatioCap(), 1.5))
    })

    this.ready = true
  }

  /* ---------------------------------------------------------------------------
     Pointer interaction.

     `touch-action: pan-y` on the picker element hands vertical panning to the
     browser and horizontal movement to us, which resolves the drag-versus-scroll
     conflict natively: the page scroll is never hijacked, and the browser sends
     `pointercancel` the moment it claims the gesture for a scroll.
     ------------------------------------------------------------------------ */

  private attachPointer(): void {
    const element = this.handles?.rear.parentElement?.querySelector<HTMLElement>('.stage__picker')
    if (!element) return

    let dragging = false
    let pointerId = -1
    let lastX = 0
    let lastY = 0
    let startX = 0
    let startY = 0
    let travelled = 0

    const onPointerDown = (event: PointerEvent) => {
      dragging = true
      pointerId = event.pointerId
      lastX = startX = event.clientX
      lastY = startY = event.clientY
      travelled = 0
      element.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return

      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      lastX = event.clientX
      lastY = event.clientY
      travelled += Math.abs(dx) + Math.abs(dy)

      // Full viewport width ≈ half a turn, which matches the physical
      // expectation of pushing a globe around.
      const radiansPerPixel = Math.PI / Math.max(320, window.innerWidth)
      this.globe?.addDrag(dx * radiansPerPixel, dy * radiansPerPixel * 0.65)
    }

    const endDrag = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      dragging = false
      pointerId = -1
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      const wasDragging = dragging && event.pointerId === pointerId
      endDrag(event)
      if (!wasDragging) return

      const moved = Math.hypot(event.clientX - startX, event.clientY - startY)
      if (moved > CLICK_SLOP || travelled > CLICK_SLOP * 3) return

      // A tap, not a drag: treat it as a marker click.
      const rect = element.getBoundingClientRect()
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1
      const camera = this.camera
      if (!camera || !this.markers) return

      const hit = this.markers.pick(ndcX, ndcY, camera)
      if (hit !== null) this.handles?.onCityPick(hit)
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)
    element.addEventListener('pointercancel', endDrag)

    this.teardown.push(() => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerUp)
      element.removeEventListener('pointercancel', endDrag)
    })
  }

  resize(): void {
    const width = window.innerWidth
    const height = Math.max(1, window.innerHeight)
    const aspect = width / height

    this.fitDistance = solveFitDistance(aspect)

    if (this.camera) {
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
    }

    this.rendererRear?.setSize(width, height, false)
    this.rendererFront?.setSize(width, height, false)
  }

  /**
   * Advance and render one frame.
   *
   * Everything here is a pure function of `progress` plus damping state, which
   * is what makes reverse scrolling retrace the identical path rather than play
   * a separate animation.
   */
  setProgress(progress: number, dt: number, reduced: boolean): void {
    if (!this.ready || !this.camera || !this.globe || !this.markers) return

    this.progress = progress
    this.tierMonitor.sample(dt)

    sampleKeyframe(this.frame, progress)
    this.sampleTheme(progress)

    const globeL = globeLambda(reduced)
    this.globe.setTarget(this.frame.camLat, this.frame.camLon)
    this.globe.update(dt, globeL, LAMBDA.dragDecay, reduced)
    this.globe.applyTheme(this.theme, this.frame)

    this.camera.position.z = this.fitDistance * this.frame.camDist
    this.camera.updateMatrixWorld()

    this.markers.update(progress, dt, themeLambda(reduced), this.camera, this.theme)

    this.background.setRGB(this.theme.fog[0], this.theme.fog[1], this.theme.fog[2])
    this.rendererRear?.setClearColor(this.background, 1)
    for (const renderer of [this.rendererRear, this.rendererFront]) {
      if (renderer) renderer.toneMappingExposure = this.theme.exposure
    }

    applyThemeToCSS(this.theme)

    this.rendererRear?.render(this.sceneRear, this.camera)
    this.rendererFront?.render(this.sceneFront, this.camera)
  }

  /**
   * Blend the two adjacent city themes.
   *
   * The blend runs across the city boundary rather than within a city, so each
   * city holds its own look for most of its five states and hands over in the
   * last and first fifth.
   */
  private sampleTheme(progress: number): void {
    const p = clamp(progress, 0, MAX_STATE)
    const index = cityIndexForProgress(p)
    const local = (p - index * STATES_PER_CITY) / STATES_PER_CITY

    const current = THEMES[cityAt(index).id]

    if (local > 0.8 && index < CITIES.length - 1) {
      const next = THEMES[cityAt(index + 1).id]
      lerpTheme(this.theme, current, next, smootherstep(0.8, 1, local))
      return
    }

    if (local < 0.2 && index > 0) {
      const previous = THEMES[cityAt(index - 1).id]
      lerpTheme(this.theme, previous, current, smootherstep(-0.2, 0.2, local))
      return
    }

    lerpTheme(this.theme, current, current, 0)
  }

  dispose(): void {
    this.disposed = true
    this.ready = false
    for (const fn of this.teardown) fn()
    this.teardown = []
    this.globe?.dispose()
    this.markers?.dispose()
    this.rendererRear?.dispose()
    this.rendererFront?.dispose()
    this.rendererRear = null
    this.rendererFront = null
  }
}

export const world = new World()
