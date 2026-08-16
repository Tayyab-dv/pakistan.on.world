import { useEffect, useRef } from 'react'
import { MAX_STATE } from '../cities'
import { scrollEngine } from '../core/scroll'
import { world } from '../three/World'
import { CityCopy } from './CityCopy'
import { Grain } from './Grain'
import { SolarStepper } from './SolarStepper'

/**
 * Inspection surface for `scripts/visual-check.mjs`.
 *
 * The harness has to assert things a screenshot cannot show — which layer a
 * landmark is on, whether its opacity changed while it was in the open, whether
 * a previous city's landmark is still visible at a boundary. Small, read-only,
 * and it costs nothing to leave in the bundle.
 */
interface Inspector {
  ready: () => boolean
  inspect: () => ReturnType<typeof world.inspect>
  snapToState: (state: number) => void
  scrollToCity: (index: number) => void
  maxState: number
}

declare global {
  interface Window {
    __turningWorld?: Inspector
  }
}

/**
 * The pinned composition.
 *
 * React's only job here is to put two canvases and the interface on the page.
 * The 3D world is created once in an effect and driven imperatively from the
 * scroll engine's frame callback — no React state is written per frame, so a
 * re-render can never disturb the scene.
 */
export function Stage() {
  const rearRef = useRef<HTMLCanvasElement | null>(null)
  const frontRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const rear = rearRef.current
    const front = frontRef.current
    if (!rear || !front) return

    let unsubscribe: (() => void) | null = null
    let cancelled = false

    void world
      .init({
        rear,
        front,
        onCityPick: (index) => scrollEngine.scrollToCity(index),
      })
      .then(() => {
        if (cancelled) return
        unsubscribe = scrollEngine.subscribe(({ progress, targetProgress, dt, reduced }) => {
          world.setProgress(progress, dt, reduced, targetProgress)
        })
      })

    const onResize = () => world.resize()
    window.addEventListener('resize', onResize, { passive: true })
    window.visualViewport?.addEventListener('resize', onResize, { passive: true })

    window.__turningWorld = {
      ready: () => world.isReady,
      inspect: () => world.inspect(),
      snapToState: (state) => scrollEngine.snapToState(state),
      scrollToCity: (index) => scrollEngine.scrollToCity(index),
      maxState: MAX_STATE,
    }

    scrollEngine.start()

    return () => {
      cancelled = true
      unsubscribe?.()
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
      delete window.__turningWorld
    }
  }, [])

  return (
    <>
      <div className="stage">
        <canvas className="stage__canvas stage__canvas--rear" ref={rearRef} />
        <canvas className="stage__canvas stage__canvas--front" ref={frontRef} />

        {/* Transparent surface that receives globe drags and marker taps.
            `touch-action: pan-y` (see interface CSS) leaves vertical scrolling
            to the browser and gives us horizontal movement. */}
        <div className="stage__picker" />

        <Grain />
        <CityCopy />
        <SolarStepper />
      </div>

      {/* The only element in normal flow. Its height is the journey. */}
      <div className="scroll-track" aria-hidden="true" />
    </>
  )
}
