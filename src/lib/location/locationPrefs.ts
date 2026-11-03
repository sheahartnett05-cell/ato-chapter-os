export const LOCATION_PREFS_KEY = 'chapter-os-location-prefs'

export type LocationPrefs = {
  /** When true, app may request GPS for study-hour geofencing. */
  enabled: boolean
}

export type LocationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

export function readLocationPrefs(): LocationPrefs {
  try {
    const raw = localStorage.getItem(LOCATION_PREFS_KEY)
    if (!raw) return { enabled: true }
    const parsed = JSON.parse(raw) as Partial<LocationPrefs>
    return { enabled: parsed.enabled !== false }
  } catch {
    return { enabled: true }
  }
}

export function writeLocationPrefs(prefs: LocationPrefs) {
  try {
    localStorage.setItem(LOCATION_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage unavailable */
  }
}

export function locationSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
}

/** Query browser permission when available (Chrome/Android); Safari often returns prompt. */
export async function queryLocationPermission(): Promise<LocationPermissionState> {
  if (!locationSupported()) return 'unsupported'
  try {
    const perms = navigator.permissions
    if (perms?.query) {
      const status = await perms.query({ name: 'geolocation' as PermissionName })
      if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
        return status.state
      }
    }
  } catch {
    /* Safari / older WebViews */
  }
  return 'prompt'
}

/**
 * Triggers the OS/browser location prompt (user-gesture safe when called from a click).
 * Returns the resulting permission state after the attempt.
 */
export async function requestLocationPermission(): Promise<LocationPermissionState> {
  if (!locationSupported()) return 'unsupported'
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) resolve('denied')
        else void queryLocationPermission().then(resolve)
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      }
    )
  })
}

export function locationDeniedHelp(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isIOS = /iPad|iPhone|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  if (isIOS) {
    return 'On iPhone: Settings → Privacy & Security → Location Services → turn on, then allow Safari (or Chaptera if installed).'
  }
  if (isAndroid) {
    return 'On Android: Settings → Location → on, then Chrome (or Chaptera) → Permissions → Location → Allow.'
  }
  return 'Enable location for this site in your browser or device settings, then try again.'
}
