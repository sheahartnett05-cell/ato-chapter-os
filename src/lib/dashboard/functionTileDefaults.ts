import { coerceOfficerFunction, type OfficerFunction } from '../../types/officerFunction'
import type { DashboardTileId } from './tileIds'

export const FUNCTION_TILE_DEFAULTS: Record<OfficerFunction, DashboardTileId[]> = {
  president: ['next_event', 'attendance', 'dues', 'action_items'],
  treasurer: ['dues', 'budget', 'next_event', 'open_excuses'],
  secretary: ['attendance', 'minutes_pending', 'next_event', 'roster_changes'],
  internal_vp_standards: ['good_standing', 'standards_cases', 'repeat_absences', 'open_excuses'],
  recruitment: ['rush_pipeline', 'next_event', 'attendance', 'action_items'],
  new_member_educator: ['nm_class', 'nm_behind', 'next_event', 'action_items'],
  scholarship: ['study_hours', 'attendance', 'next_event', 'action_items'],
  risk_management: ['risk_forms', 'sober_monitors', 'next_event', 'compliance_deadline'],
  social: ['next_event', 'participation', 'action_items', 'attendance'],
  philanthropy_service: ['service_hours', 'funds_raised', 'next_event', 'action_items'],
  house: ['maintenance', 'chores', 'house_bills', 'next_event'],
  alumni: ['alumni', 'next_event', 'compliance_deadline', 'action_items'],
  brotherhood: ['participation', 'next_event', 'attendance', 'action_items'],
  ritual: ['compliance_deadline', 'nm_class', 'next_event', 'action_items'],
  athletics: ['participation', 'next_event', 'attendance', 'action_items'],
  communications: ['minutes_pending', 'roster_changes', 'next_event', 'action_items'],
  other: ['next_event', 'attendance', 'dues', 'action_items'],
}

export function defaultTilesForFunction(fn: OfficerFunction): DashboardTileId[] {
  const key = coerceOfficerFunction(fn)
  const tiles = FUNCTION_TILE_DEFAULTS[key]
  return Array.isArray(tiles) ? [...tiles] : [...FUNCTION_TILE_DEFAULTS.president]
}
