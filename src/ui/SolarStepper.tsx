import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CITIES,
  MAX_STATE,
  cityIndexForProgress,
  landingStateFor,
} from '../cities'
import { clamp, clamp01, lerp } from '../core/damp'
import { scrollEngine } from '../core/scroll'
import {
  PATH_D,
  TOTAL_LENGTH,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  lengthAt,
  pointAt,
} from './solar-path'

/**
 * The solar course stepper.
 *
 * Every position is evaluated from the Bézier rather than hardcoded, so the
 * dots sit exactly on the curve and the travelling sun follows the same path.
 * The arc SVG stretches to the viewport width (`preserveAspectRatio="none"`)
 * while the dots and labels are HTML positioned in percentage terms, so the
 * circles stay circular and the type stays real text.
 */

/**
 * Anchors mapping scroll progress to a position along the curve.
 *
 * A city's solar position is anchored to its *landing* state — the point a
 * click on that dot scrolls to — so clicking a dot puts the sun exactly on it.
 * Head and tail segments carry the sun out to the ends of the arc rather than
 * leaving it parked for the first and last stretch of the journey.
 */
const ANCHORS: ReadonlyArray<{ p: number; t: number }> = [
  { p: 0, t: 0 },
  ...CITIES.map((city, index) => ({ p: landingStateFor(index), t: city.solarT })),
  { p: MAX_STATE, t: 1 },
]

function sunTFor(progress: number): number {
  const p = clamp(progress, 0, MAX_STATE)
  for (let i = 0; i < ANCHORS.length - 1; i += 1) {
    const a = ANCHORS[i]!
    const b = ANCHORS[i + 1]!
    if (p <= b.p) {
      const span = b.p - a.p
      return span <= 0 ? b.t : lerp(a.t, b.t, (p - a.p) / span)
    }
  }
  return 1
}

/** Percentage coordinates of a curve parameter, for HTML positioning. */
function percentAt(t: number): { left: string; top: string } {
  const point = pointAt(t)
  return {
    left: `${(point.x / VIEWBOX_WIDTH) * 100}%`,
    top: `${(point.y / VIEWBOX_HEIGHT) * 100}%`,
  }
}

function labelAlign(index: number): 'start' | 'center' | 'end' {
  if (index === 0) return 'start'
  if (index === CITIES.length - 1) return 'end'
  return 'center'
}

export function SolarStepper() {
  const [activeCity, setActiveCity] = useState(0)
  /** Roving tabindex: which dot Tab lands on. Follows the active city unless
   *  the user has moved focus with the arrow keys. */
  const [focusedCity, setFocusedCity] = useState(0)

  const sunRef = useRef<HTMLDivElement | null>(null)
  const travelledRef = useRef<SVGPathElement | null>(null)
  const progressRef = useRef<HTMLSpanElement | null>(null)
  const dotRefs = useRef<Array<HTMLButtonElement | null>>([])
  const rootRef = useRef<HTMLElement | null>(null)

  const dotPositions = useMemo(() => CITIES.map((city) => percentAt(city.solarT)), [])

  useEffect(() => {
    return scrollEngine.subscribe(({ progress }) => {
      const t = sunTFor(progress)

      if (sunRef.current) {
        const { left, top } = percentAt(t)
        sunRef.current.style.left = left
        sunRef.current.style.top = top
      }

      // Glow along the travelled arc. Driven by arc length, not by the curve
      // parameter — the curve is far steeper at its ends than at its apex, so
      // using `t` directly makes the glow lead and then lag the sun.
      if (travelledRef.current) {
        const travelled = lengthAt(t)
        travelledRef.current.style.strokeDasharray = `${travelled} ${TOTAL_LENGTH}`
      }

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${clamp01(progress / MAX_STATE)})`
      }

      const city = cityIndexForProgress(progress)
      setActiveCity((previous) => (previous === city ? previous : city))
    })
  }, [])

  // Keep the tab stop on the active city, unless the user is currently driving
  // focus themselves.
  useEffect(() => {
    const root = rootRef.current
    const focusIsInside = root?.contains(document.activeElement) ?? false
    if (!focusIsInside) setFocusedCity(activeCity)
  }, [activeCity])

  const goTo = useCallback((index: number) => {
    const clamped = clamp(index, 0, CITIES.length - 1)
    setFocusedCity(clamped)
    scrollEngine.scrollToCity(clamped)
  }, [])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      let next = focusedCity
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          next = focusedCity - 1
          break
        case 'ArrowRight':
        case 'ArrowDown':
          next = focusedCity + 1
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = CITIES.length - 1
          break
        default:
          return
      }

      event.preventDefault()
      const clamped = clamp(next, 0, CITIES.length - 1)
      setFocusedCity(clamped)
      dotRefs.current[clamped]?.focus()
    },
    [focusedCity],
  )

  return (
    <nav className="solar" aria-label="Solar course" ref={rootRef}>
      <div className="solar__arc">
        <svg
          className="solar__svg"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path className="solar__track" d={PATH_D} />
          <path className="solar__travelled" d={PATH_D} ref={travelledRef} />
        </svg>

        {/* Fixed solar glyphs: the arc reads as a day without any caption. */}
        <div className="solar__glyph solar__glyph--rise" style={percentAt(CITIES[0]!.solarT)}>
          <svg viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
            {/* Half-sun: only the upper limb has risen. */}
            <path d="M -7 0 A 7 7 0 0 1 7 0 Z" className="solar__glyph-body" />
            <line x1="-10.5" y1="0" x2="10.5" y2="0" className="solar__glyph-horizon" />
          </svg>
        </div>

        <div className="solar__glyph solar__glyph--zenith" style={percentAt(CITIES[2]!.solarT)}>
          <svg viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
            <circle r="6.4" className="solar__glyph-body" />
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * Math.PI * 2
              return (
                <line
                  key={i}
                  x1={Math.cos(angle) * 8.6}
                  y1={Math.sin(angle) * 8.6}
                  x2={Math.cos(angle) * 12.4}
                  y2={Math.sin(angle) * 12.4}
                  className="solar__glyph-ray"
                />
              )
            })}
          </svg>
        </div>

        <div className="solar__glyph solar__glyph--set" style={percentAt(CITIES[4]!.solarT)}>
          <svg viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
            {/* Sunset: the disc is sinking, so the lower limb is already cut. */}
            <path d="M -7 0 A 7 7 0 0 1 7 0 Z" className="solar__glyph-body" />
            <line x1="-10.5" y1="0" x2="10.5" y2="0" className="solar__glyph-horizon" />
            <line x1="-9" y1="4" x2="-3.5" y2="4" className="solar__glyph-horizon" />
            <line x1="3.5" y1="4" x2="9" y2="4" className="solar__glyph-horizon" />
          </svg>
        </div>

        {/* The one sun that actually travels. */}
        <div className="solar__sun" ref={sunRef} aria-hidden="true" />

        <div
          className="solar__dots"
          role="tablist"
          aria-label="Cities"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
        >
          {CITIES.map((city, index) => (
            <button
              key={city.id}
              type="button"
              role="tab"
              className="solar__dot"
              data-active={index === activeCity ? 'true' : 'false'}
              data-align={labelAlign(index)}
              style={{ left: dotPositions[index]!.left }}
              tabIndex={index === focusedCity ? 0 : -1}
              aria-selected={index === activeCity}
              onClick={() => goTo(index)}
              ref={(node) => {
                dotRefs.current[index] = node
              }}
            >
              <span className="solar__mark" style={{ top: dotPositions[index]!.top }} />
              <span className="solar__label">
                <span className="solar__name">{city.name}</span>
                <span className="solar__season">{city.season}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="solar__progress" aria-hidden="true">
        <span className="solar__progress-fill" ref={progressRef} />
      </div>
    </nav>
  )
}
