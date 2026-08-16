import type { CityId } from './index'
import { islamabad } from './islamabad'
import type { CityChoreography } from './motifs'

/**
 * Every city's choreography, in one place.
 *
 * Cities are added here as they are built. An empty entry is legitimate — the
 * globe, markers, solar stepper, copy and orbital lines all work without any
 * choreography at all, so an unfinished city degrades to a bare composition
 * rather than an error.
 */

const EMPTY: CityChoreography = { motifs: [], landmarks: [] }

export const CHOREOGRAPHIES: Record<CityId, CityChoreography> = {
  islamabad,
  karachi: EMPTY,
  lahore: EMPTY,
  peshawar: EMPTY,
  gwadar: EMPTY,
  skardu: EMPTY,
}
