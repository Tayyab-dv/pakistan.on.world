import { PerspectiveCamera } from 'three'
import { DEG2RAD } from '../core/damp'

/**
 * Camera framing.
 *
 * The globe must never be cropped at any viewport — 390, 768, 1280 and 1440 are
 * checked explicitly, but the requirement is really "any aspect ratio". Rather
 * than a breakpoint table of scales, the distance is *solved* from the aspect
 * ratio each time the viewport changes, which cannot miss a width nobody
 * thought to test.
 */

/** World radius of the Earth sphere. Everything else is expressed in these units. */
export const GLOBE_RADIUS = 1

/**
 * The radius that actually has to fit on screen. The sphere is 1, but the
 * atmosphere shell and the marker light shafts extend past it, and fitting the
 * bare sphere would clip both.
 */
export const EFFECTIVE_RADIUS = GLOBE_RADIUS * 1.18

export const FOV = 32

/**
 * Extra breathing room beyond a perfect fit.
 *
 * A bare fit puts the atmosphere hard against the viewport edge on a 16:9
 * desktop, leaving the copy and the solar stepper sitting on top of the globe
 * with nothing between them. This backs the camera off so the composition has
 * air around the hero.
 */
const MARGIN = 1.3

export const NEAR = 0.1
export const FAR = 100

/**
 * Distance at which a sphere of `radius` fits inside the frustum on its
 * tightest axis.
 *
 * In portrait the horizontal field of view is the constraint; in landscape it
 * is the vertical. Taking the minimum of the two handles both without a branch.
 */
export function solveFitDistance(aspect: number, radius = EFFECTIVE_RADIUS): number {
  const vFov = FOV * DEG2RAD
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.0001))
  const fit = Math.min(vFov, hFov)
  return (radius / Math.sin(fit / 2)) * MARGIN
}

export function createCamera(aspect: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(FOV, aspect, NEAR, FAR)
  camera.position.set(0, 0, solveFitDistance(aspect))
  camera.lookAt(0, 0, 0)
  return camera
}

/**
 * Half the visible world width at a given depth.
 *
 * The orbit solver needs this: a portrait phone frames the globe on its
 * *horizontal* field of view and leaves almost no room either side, so a
 * landmark on a world-space orbit that looks generous on a desktop would swing
 * clean off the screen there.
 */
export function visibleHalfWidth(distance: number, aspect: number): number {
  const vFov = FOV * DEG2RAD
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.0001))
  return Math.tan(hFov / 2) * distance
}

/**
 * Projected on-screen radius of the globe, in pixels.
 *
 * Used by the orbit solver to guarantee a landmark clears the Earth's
 * silhouette, and by the verification harness to assert nothing is clipped.
 */
export function projectedGlobeRadius(
  cameraDistance: number,
  viewportHeight: number,
  radius = GLOBE_RADIUS,
): number {
  const vFov = FOV * DEG2RAD
  const halfHeightAtDistance = Math.tan(vFov / 2) * cameraDistance
  return (radius / halfHeightAtDistance) * (viewportHeight / 2)
}
