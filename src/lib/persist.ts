/**
 * Dual-write persistence: localStorage (sync UI) + Supabase chapter_kv (cloud).
 * Guest preview stays local-only.
 */
import { isGuestPreviewActive } from './guestPreview'
import { isSupabaseConfigured } from './supabase'
import { queueChapterKvWrite } from './chapterCloud'

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.error('[agora] localStorage quota exceeded — changes not saved for', key)
    } else {
      console.warn('[agora] localStorage write failed for', key, e)
    }
    return false
  }
  if (!isGuestPreviewActive() && isSupabaseConfigured()) {
    queueChapterKvWrite(key, value)
  }
  return true
}

export function removeJson(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
  if (!isGuestPreviewActive() && isSupabaseConfigured()) {
    queueChapterKvWrite(key, null)
  }
}

/** Write local only (device-scoped keys: user id, guest flag, etc.) */
export function writeLocalOnly(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export function writeLocalString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}
