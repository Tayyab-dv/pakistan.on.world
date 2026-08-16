import { useEffect, useRef } from 'react'
import { CITIES, STATES_PER_CITY, cityIndexForProgress } from '../cities'
import { smoothstep } from '../core/damp'
import { scrollEngine } from '../core/scroll'

/**
 * The city name and its single editorial sentence, lower-left.
 *
 * All six blocks are rendered and stacked; their opacity and offset are
 * *derived* from progress every frame rather than triggered on a city change.
 * That matters for two reasons: fast reverse scrolling cannot catch a fired
 * animation mid-flight, and the crossfade is exactly symmetric in both
 * directions. Six short text nodes cost nothing to keep mounted.
 */

/** Half-width of the crossfade window, in scroll states. */
const FADE = 0.7
/** Vertical travel of the fade, in pixels. */
const RISE = 14

function opacityFor(distanceIntoCity: number): number {
  const appearing = smoothstep(-FADE, FADE, distanceIntoCity)
  const leaving = smoothstep(STATES_PER_CITY - FADE, STATES_PER_CITY + FADE, distanceIntoCity)
  return appearing * (1 - leaving)
}

function offsetFor(distanceIntoCity: number): number {
  const appearing = smoothstep(-FADE, FADE, distanceIntoCity)
  const leaving = smoothstep(STATES_PER_CITY - FADE, STATES_PER_CITY + FADE, distanceIntoCity)
  // Rises into place from below, then continues upward on the way out.
  return RISE * (1 - appearing) - RISE * leaving
}

export function CityCopy() {
  const blockRefs = useRef<Array<HTMLDivElement | null>>([])
  const liveRef = useRef<HTMLParagraphElement | null>(null)
  const announced = useRef(-1)

  useEffect(() => {
    return scrollEngine.subscribe(({ progress }) => {
      for (let i = 0; i < CITIES.length; i += 1) {
        const node = blockRefs.current[i]
        if (!node) continue

        const distance = progress - i * STATES_PER_CITY
        const opacity = opacityFor(distance)

        node.style.opacity = opacity.toFixed(3)
        node.style.transform = `translate3d(0, ${offsetFor(distance).toFixed(2)}px, 0)`
        // Keep the fading-out block out of the accessibility tree so a screen
        // reader never sees two city names at once.
        node.setAttribute('aria-hidden', opacity < 0.5 ? 'true' : 'false')
      }

      const active = cityIndexForProgress(progress)
      if (active !== announced.current && liveRef.current) {
        announced.current = active
        liveRef.current.textContent = CITIES[active]!.name
      }
    })
  }, [])

  return (
    <div className="city-copy">
      {CITIES.map((city, index) => (
        <div
          key={city.id}
          className="city-copy__block"
          ref={(node) => {
            blockRefs.current[index] = node
          }}
          style={{ opacity: 0 }}
        >
          <h2 className="city-copy__name">{city.name}</h2>
          <p className="city-copy__line">{city.copy}</p>
        </div>
      ))}

      {/* Announces the active city to assistive technology, since the visual
          transition alone communicates nothing to a screen reader. */}
      <p ref={liveRef} className="visually-hidden" aria-live="polite" aria-atomic="true" />
    </div>
  )
}
