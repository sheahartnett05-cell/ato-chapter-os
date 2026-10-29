/** Shared cloud chapter id cache (avoids circular imports between chapterCloud and identity RPCs). */

export const CLOUD_CHAPTER_ID_KEY = 'chapter-os-supabase-chapter-id'

let chapterIdCache: string | null = null

export function getCachedCloudChapterId(): string | null {
  if (chapterIdCache) return chapterIdCache
  try {
    chapterIdCache = localStorage.getItem(CLOUD_CHAPTER_ID_KEY)
  } catch {
    chapterIdCache = null
  }
  return chapterIdCache
}

export function setCachedCloudChapterId(id: string | null) {
  chapterIdCache = id
  try {
    if (id) localStorage.setItem(CLOUD_CHAPTER_ID_KEY, id)
    else localStorage.removeItem(CLOUD_CHAPTER_ID_KEY)
  } catch {
    /* ignore */
  }
}
