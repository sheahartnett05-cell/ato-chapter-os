/**
 * Notify React providers after chapter_kv lands in localStorage so UI
 * re-reads roster / accounts / onboarding instead of keeping a stale mount.
 */
export const CLOUD_HYDRATED_EVENT = 'chaptera:cloud-hydrated'

export function notifyCloudHydrated(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new Event(CLOUD_HYDRATED_EVENT))
  } catch {
    /* ignore */
  }
}

export function subscribeCloudHydrated(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(CLOUD_HYDRATED_EVENT, listener)
  return () => window.removeEventListener(CLOUD_HYDRATED_EVENT, listener)
}
