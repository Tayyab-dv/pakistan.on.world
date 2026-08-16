/**
 * The scroll engine: the single source of time and progress for the whole
 * application, and the owner of the only `requestAnimationFrame` loop.
 *
 * Architecture: a tall element in normal flow provides a *real* scrollbar, and
 * the composition is painted on fixed canvases above it. Nothing hijacks the
 * wheel or the touch gesture, so native momentum, keyboard paging, browser
 * scroll restoration, and find-in-page all keep working for free.
 */

import { MAX_DT, clamp, damp, easeInOutCubic } from './damp'
import { MAX_STATE, landingStateFor } from '../cities'
import { onReducedMotionChange, prefersReducedMotion, progressLambda } from './motion-pref'

/**
 * Total scroll track height, in viewport heights.
 *
 * 1200vh across 30 states is 40vh per state — roughly six to eight seconds per
 * city at a normal trackpad pace, about forty seconds end to end. Long enough
 * for each state to register, short enough that the scrollbar thumb stays
 * grabbable. This is the pacing dial; it is deliberately one constant.
 */
export const TRACK_VH = 1200

/** Duration of a click-to-jump scroll, in seconds. */
const JUMP_DURATION = 1.1

export interface Frame {
  /** Damped, rendered progress in [0, MAX_STATE]. */
  readonly progress: number
  /** Undamped progress implied by the current scroll offset. */
  readonly targetProgress: number
  /** Seconds since the previous frame, clamped to MAX_DT. */
  readonly dt: number
  readonly reduced: boolean
}

type FrameListener = (frame: Frame) => void

interface Jump {
  fromY: number
  /**
   * Stored as a progress value, not a pixel offset.
   *
   * The mapping from progress to scrollY depends on `maxScroll`, which changes
   * whenever the viewport does. Holding pixels means a resize mid-flight aims
   * the tween at a stale target; holding the state means it simply re-derives.
   */
  toState: number
  elapsed: number
}

class ScrollEngine {
  private listeners = new Set<FrameListener>()
  private rafId = 0
  private lastTime = 0
  private started = false

  private currentProgress = 0
  private targetProgress = 0
  private maxScroll = 1
  private reduced = false

  private jump: Jump | null = null
  private disposers: Array<() => void> = []

  /** Latest rendered progress. Read by UI that samples rather than subscribes. */
  get progress(): number {
    return this.currentProgress
  }

  start(): void {
    if (this.started) return
    this.started = true

    this.reduced = prefersReducedMotion()
    this.disposers.push(
      onReducedMotionChange((reduced) => {
        this.reduced = reduced
      }),
    )

    document.documentElement.style.setProperty('--track-h', `${TRACK_VH}vh`)

    this.measure()
    // Snap to whatever the browser restored, rather than easing in from zero.
    this.currentProgress = this.targetProgress = this.readTargetProgress()

    const onResize = () => this.measure()
    const onCancelJump = () => this.cancelJump()

    window.addEventListener('resize', onResize, { passive: true })
    window.visualViewport?.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('wheel', onCancelJump, { passive: true })
    window.addEventListener('touchstart', onCancelJump, { passive: true })
    window.addEventListener('keydown', onCancelJump)

    this.disposers.push(
      () => window.removeEventListener('resize', onResize),
      () => window.visualViewport?.removeEventListener('resize', onResize),
      () => window.removeEventListener('wheel', onCancelJump),
      () => window.removeEventListener('touchstart', onCancelJump),
      () => window.removeEventListener('keydown', onCancelJump),
    )

    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.tick)
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    cancelAnimationFrame(this.rafId)
    for (const dispose of this.disposers) dispose()
    this.disposers = []
    this.listeners.clear()
  }

  subscribe(listener: FrameListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Scroll to a city.
   *
   * Lands half a state inside the city rather than on its boundary — at exactly
   * `city * 5`, a rounding error downward puts the viewer in the *previous*
   * city, which is the defect the brief names explicitly.
   */
  scrollToCity(cityIndex: number): void {
    const state = landingStateFor(cityIndex)

    if (this.reduced) {
      this.cancelJump()
      window.scrollTo(0, this.scrollYForProgress(state))
      return
    }

    this.jump = { fromY: window.scrollY, toState: state, elapsed: 0 }
  }

  /**
   * Jump straight to a progress value with no easing and no damping.
   *
   * Used by the verification harness, which needs a state to be exactly the
   * state it asked for rather than a damped approach to it.
   */
  snapToState(state: number): void {
    this.cancelJump()
    const y = this.scrollYForProgress(state)
    window.scrollTo(0, y)
    this.targetProgress = this.readTargetProgress()
    this.currentProgress = this.targetProgress
  }

  private cancelJump(): void {
    this.jump = null
  }

  private measure(): void {
    const doc = document.documentElement
    this.maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)

    // A jump in flight is deliberately *not* cancelled here. Browsers fire
    // resize and visualViewport events for incidental reasons — scrollbar
    // changes, a mobile URL bar retracting — and cancelling on those left a
    // long jump stranded partway, which is how a click on the last city
    // stopped short of it. The jump stores a state rather than a pixel offset,
    // so the new measurement is picked up on the next frame automatically.
  }

  private readTargetProgress(): number {
    return clamp((window.scrollY / this.maxScroll) * MAX_STATE, 0, MAX_STATE)
  }

  private scrollYForProgress(progress: number): number {
    return (clamp(progress, 0, MAX_STATE) / MAX_STATE) * this.maxScroll
  }

  private readonly tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick)

    const dt = clamp((now - this.lastTime) / 1000, 0, MAX_DT)
    this.lastTime = now

    if (this.jump) {
      this.jump.elapsed += dt
      const t = clamp(this.jump.elapsed / JUMP_DURATION, 0, 1)
      // Re-derived every frame from the current measurement, so a resize
      // mid-flight retargets rather than derailing the jump.
      const toY = this.scrollYForProgress(this.jump.toState)
      window.scrollTo(0, this.jump.fromY + (toY - this.jump.fromY) * easeInOutCubic(t))
      if (t >= 1) this.jump = null
    }

    this.targetProgress = this.readTargetProgress()
    this.currentProgress = damp(
      this.currentProgress,
      this.targetProgress,
      progressLambda(this.reduced),
      dt,
    )

    // Guard against a NaN ever entering the pipeline; one would silently corrupt
    // every downstream matrix for the rest of the session.
    if (!Number.isFinite(this.currentProgress)) this.currentProgress = this.targetProgress

    const frame: Frame = {
      progress: this.currentProgress,
      targetProgress: this.targetProgress,
      dt,
      reduced: this.reduced,
    }

    for (const listener of this.listeners) listener(frame)
  }
}

export const scrollEngine = new ScrollEngine()
