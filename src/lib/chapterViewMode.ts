export type ChapterViewMode = 'chapter-room' | 'operations'

const STORAGE_PREFIX = 'chapter-os-view-mode'

export function viewModeStorageKey(userId: string) {
  return `${STORAGE_PREFIX}-${userId}`
}

export function readStoredViewMode(userId: string): ChapterViewMode | null {
  try {
    const raw = localStorage.getItem(viewModeStorageKey(userId))
    if (raw === 'chapter-room' || raw === 'operations') return raw
  } catch {
    /* ignore */
  }
  return null
}

export function writeStoredViewMode(userId: string, mode: ChapterViewMode) {
  try {
    localStorage.setItem(viewModeStorageKey(userId), mode)
  } catch {
    /* storage unavailable */
  }
}

/** Default when user has no saved preference. */
export function defaultViewModeForViewport(): ChapterViewMode {
  if (typeof window === 'undefined') return 'operations'
  return window.matchMedia('(min-width: 768px)').matches ? 'operations' : 'chapter-room'
}
