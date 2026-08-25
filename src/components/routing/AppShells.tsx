import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePermissions, useAuth } from '../../context/AuthContext'
import { isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import { isGuestPreviewActive } from '../../lib/guestPreview'
import { Sidebar } from '../layout/Sidebar'
import { GuestPreviewBanner } from './GuestPreviewBanner'

function useOnboarded(): boolean {
  return isOnboardingCompleteInStorage()
}

function useShowGuestBanner(): boolean {
  const { onboarding } = useAuth()
  return onboarding?.isGuest === true || isGuestPreviewActive()
}

/** Shared exec chrome: guest banner + sidebar + scrollable content */
function ExecChrome({ children }: { children: ReactNode }) {
  const showGuest = useShowGuestBanner()

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ background: 'var(--surface-tint)' }}
    >
      {showGuest && <GuestPreviewBanner />}
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="theme-stripe" />
          <div className="min-h-full" style={{ background: 'var(--surface-card)' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function MemberChrome({ children }: { children: ReactNode }) {
  const showGuest = useShowGuestBanner()

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ background: 'var(--surface-tint)' }}
    >
      {showGuest && <GuestPreviewBanner />}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

/** Exec app shell — officers and seat-boosted members (not pure member view) */
export function ExecShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { isMemberView, canAccessExecTools } = usePermissions()

  if (!onboarded) return <Navigate to="/preview" replace />
  // Position boosts clear isMemberView; also allow anyone with exec tools
  if (isMemberView && !canAccessExecTools) return <Navigate to="/my-dashboard" replace />

  return <ExecChrome>{children}</ExecChrome>
}

/** Member-facing pages */
export function MemberShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  if (!onboarded) return <Navigate to="/preview" replace />
  return <MemberChrome>{children}</MemberChrome>
}

/** Exec sidebar for officers; standalone for members */
export function AdaptiveShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { isMemberView, canAccessExecTools } = usePermissions()

  if (!onboarded) return <Navigate to="/preview" replace />
  if (isMemberView && !canAccessExecTools) return <MemberChrome>{children}</MemberChrome>
  return <ExecChrome>{children}</ExecChrome>
}

/** Settings — exec gets sidebar, members get standalone */
export function SettingsShellPage({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { isMemberView, canAccessExecTools } = usePermissions()

  if (!onboarded) return <Navigate to="/preview" replace />
  if (isMemberView && !canAccessExecTools) return <MemberChrome>{children}</MemberChrome>
  return <ExecChrome>{children}</ExecChrome>
}
