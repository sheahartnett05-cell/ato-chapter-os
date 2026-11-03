import { readNotifyPrefs, writeNotifyPrefs } from './notifyPrefs'

export type LocalNotifyInput = {
  title: string
  body: string
  tag?: string
  url?: string
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/** Push pref on + browser permission granted. */
export function canNotify(): boolean {
  if (!readNotifyPrefs().push) return false
  return notificationPermission() === 'granted'
}

/**
 * Turn push pref on and request OS/browser permission (call from a user gesture).
 * Returns whether notifications can fire afterward.
 */
export async function ensurePushEnabled(): Promise<boolean> {
  const prefs = readNotifyPrefs()
  writeNotifyPrefs({ ...prefs, push: true })
  const perm = await requestNotificationPermission()
  if (perm !== 'granted') {
    writeNotifyPrefs({ ...prefs, push: false })
    return false
  }
  return true
}

export async function notifyLocal(input: LocalNotifyInput): Promise<boolean> {
  if (!canNotify()) return false
  const { title, body, tag, url = '/' } = input
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        tag,
        data: { url },
        icon: '/favicon.svg',
        badge: '/favicon.svg',
      })
      return true
    }
    const n = new Notification(title, { body, tag, icon: '/favicon.svg' })
    n.onclick = () => {
      window.focus()
      if (url) window.location.assign(url)
      n.close()
    }
    return true
  } catch (e) {
    console.warn('[chaptera] local notify failed', e)
    return false
  }
}

const recentTags = new Map<string, number>()

/** Avoid spamming the same tag within `ttlMs` (default 10 min). */
export function notifyLocalOnce(
  input: LocalNotifyInput,
  ttlMs = 10 * 60 * 1000
): Promise<boolean> {
  const tag = input.tag ?? input.title
  const last = recentTags.get(tag) ?? 0
  if (Date.now() - last < ttlMs) return Promise.resolve(false)
  recentTags.set(tag, Date.now())
  return notifyLocal({ ...input, tag })
}
