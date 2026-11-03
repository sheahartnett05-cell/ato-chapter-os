export const NOTIFY_PREFS_KEY = 'chapter-os-notify-prefs'

export type NotifyPrefs = { email: boolean; push: boolean }

export function readNotifyPrefs(): NotifyPrefs {
  try {
    const raw = localStorage.getItem(NOTIFY_PREFS_KEY)
    if (!raw) return { email: true, push: true }
    const parsed = JSON.parse(raw) as Partial<NotifyPrefs>
    return {
      email: parsed.email !== false,
      push: parsed.push !== false,
    }
  } catch {
    return { email: true, push: true }
  }
}

export function writeNotifyPrefs(prefs: NotifyPrefs) {
  try {
    localStorage.setItem(NOTIFY_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage unavailable */
  }
}
