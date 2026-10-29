import { defaultHomePath } from './onboardingStorage'
import { clearDemoData, restoreRealSession } from './demoSeed'
import { markGuestPreview } from './guestPreview'

let leaving = false

/** Leave demo mode. Restores a real chapter session when one was saved. Never wipes cloud memberships. */
export function leaveGuestPreview(fallbackPath = '/') {
  if (leaving) return
  leaving = true
  const overlay = document.createElement('div')
  overlay.setAttribute('role', 'status')
  overlay.textContent = 'Leaving preview…'
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#f4efe6;color:#1a1a1a;font:600 16px/1.4 "Source Sans 3",sans-serif'
  document.body.appendChild(overlay)

  const restored = restoreRealSession()
  if (!restored) {
    clearDemoData()
    markGuestPreview(false)
    try {
      localStorage.removeItem('chapter-os-onboarding')
    } catch {
      /* storage unavailable */
    }
    window.location.assign(fallbackPath)
    return
  }
  window.location.assign(defaultHomePath() || fallbackPath)
}
