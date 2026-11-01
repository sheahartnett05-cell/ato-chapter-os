import { OFFICER_FUNCTIONS, type OfficerFunction } from '../../types/officerFunction'
import type { ChapterDashboardLayouts } from '../../types/dashboardStubs'
import type { DashboardTileId } from './tileIds'
import { defaultTilesForFunction } from './functionTileDefaults'

function parseOfficerFunction(raw: string | null): OfficerFunction | null {
  if (!raw) return null
  let value = raw.trim()
  // Older demo entry wrote JSON.stringify(fn) → `"president"` with quotes.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    try {
      value = JSON.parse(value) as string
    } catch {
      value = value.slice(1, -1)
    }
  }
  return (OFFICER_FUNCTIONS as string[]).includes(value) ? (value as OfficerFunction) : null
}

const LAYOUTS_KEY = 'chapter-os-dashboard-layouts'
export const ACTIVE_FUNCTION_KEY = 'chapter-os-dashboard-function'

export function readChapterDashboardLayouts(): ChapterDashboardLayouts {
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ChapterDashboardLayouts
  } catch {
    return {}
  }
}

export function writeChapterDashboardLayouts(layouts: ChapterDashboardLayouts) {
  try {
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts))
  } catch {
    /* storage unavailable */
  }
}

export function readActiveDashboardFunction(): OfficerFunction | null {
  try {
    return parseOfficerFunction(localStorage.getItem(ACTIVE_FUNCTION_KEY))
  } catch {
    return null
  }
}

export function writeActiveDashboardFunction(fn: OfficerFunction) {
  try {
    // JSON string so chapter_kv cloud push (JSON.parse) keeps the active seat.
    localStorage.setItem(ACTIVE_FUNCTION_KEY, JSON.stringify(fn))
  } catch {
    /* storage unavailable */
  }
}

export function resolveTileSet(
  fn: OfficerFunction,
  chapterOverrides?: ChapterDashboardLayouts
): DashboardTileId[] {
  const layouts = chapterOverrides ?? readChapterDashboardLayouts()
  const custom = layouts[fn]
  if (custom && custom.length > 0) {
    const ids = custom.filter(Boolean).slice(0, 4)
    if (ids.length > 0) return ids
  }
  return defaultTilesForFunction(fn)
}
