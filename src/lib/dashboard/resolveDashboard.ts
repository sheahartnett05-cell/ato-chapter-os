import {
  coerceOfficerFunction,
  isOfficerFunction,
  type OfficerFunction,
} from '../../types/officerFunction'
import type { ChapterDashboardLayouts } from '../../types/dashboardStubs'
import type { DashboardTileId } from './tileIds'
import { defaultTilesForFunction } from './functionTileDefaults'

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
    const raw = localStorage.getItem(ACTIVE_FUNCTION_KEY)
    if (!raw) return null
    return isOfficerFunction(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeActiveDashboardFunction(fn: OfficerFunction) {
  try {
    localStorage.setItem(ACTIVE_FUNCTION_KEY, fn)
  } catch {
    /* storage unavailable */
  }
}

export function resolveTileSet(
  fn: OfficerFunction,
  chapterOverrides?: ChapterDashboardLayouts
): DashboardTileId[] {
  const resolvedFn = coerceOfficerFunction(fn)
  const layouts = chapterOverrides ?? readChapterDashboardLayouts()
  const custom = layouts[resolvedFn]
  if (Array.isArray(custom) && custom.length > 0) {
    const ids = custom.filter(Boolean).slice(0, 4)
    if (ids.length > 0) return ids as DashboardTileId[]
  }
  return defaultTilesForFunction(resolvedFn)
}
