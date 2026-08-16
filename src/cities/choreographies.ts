import { gwadar } from './gwadar'
import type { CityId } from './index'
import { islamabad } from './islamabad'
import { karachi } from './karachi'
import { lahore } from './lahore'
import type { CityChoreography } from './motifs'
import { peshawar } from './peshawar'
import { skardu } from './skardu'

/**
 * Every city's choreography, in one place.
 *
 * Six configurations over six shared primitive generators. Peshawar is the only
 * one with an empty landmark list — by instruction it stays entirely
 * procedural, so its lattice, archways, lanterns and air carry it alone.
 */
export const CHOREOGRAPHIES: Record<CityId, CityChoreography> = {
  islamabad,
  karachi,
  lahore,
  peshawar,
  gwadar,
  skardu,
}
