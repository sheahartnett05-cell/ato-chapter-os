import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isGuestPreviewActive } from '../../lib/guestPreview'
import {
  defaultHomePath,
  isOnboardingCompleteInStorage,
} from '../../lib/onboardingStorage'
import { writeRememberedEmail } from '../../lib/rememberedAuth'
import { getAuthEmail, getAuthUserId } from '../../lib/supabaseAuth'
import Landing from '../../pages/Landing'

/**
 * When a Supabase session already exists (home-screen reopen), restore the
 * local chapter profile without asking for another OTP.
 */
export function useResumeSavedSession() {
  const { isOnboarded, onboarding, authReady, reloadOnboardingFromStorage } = useAuth()
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle')
  const [home, setHome] = useState<'/home' | '/my-dashboard' | null>(null)

  useEffect(() => {
    if (!authReady) return
    if (status !== 'idle') return

    const guest = onboarding?.isGuest === true || isGuestPreviewActive()
    if ((isOnboarded || isOnboardingCompleteInStorage()) && !guest) {
      if (!isOnboarded) reloadOnboardingFromStorage()
      setHome(defaultHomePath())
      setStatus('done')
      return
    }

    const userId = getAuthUserId()
    if (!userId) {
      setStatus('done')
      return
    }

    setStatus('working')
    const email = getAuthEmail()
    if (email) writeRememberedEmail(email)

    void import('../../lib/restoreSession')
      .then(({ restoreSessionAfterAuth }) => restoreSessionAfterAuth())
      .then((result) => {
        if (result.ok && result.hasChapter) {
          reloadOnboardingFromStorage()
          setHome(result.homePath)
        }
        setStatus('done')
      })
      .catch(() => setStatus('done'))
  }, [
    authReady,
    isOnboarded,
    onboarding?.isGuest,
    reloadOnboardingFromStorage,
    status,
  ])

  return { status, home, ready: status === 'done' }
}

/** Root `/` — open chapter automatically when this device remembers the account. */
export function RootRedirect() {
  const { status, home, ready } = useResumeSavedSession()

  if (!ready || status === 'working') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-[var(--ink)]">Opening your chapter…</p>
        <p className="max-w-sm text-xs text-[var(--muted)]">
          Signed-in profiles stay on this phone until you sign out.
        </p>
      </div>
    )
  }

  if (home) return <Navigate to={home} replace />
  return <Landing />
}
