import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePermissions } from '../../context/AuthContext'
import { isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import { Sidebar } from '../layout/Sidebar'
import { GuestPreviewBanner } from './GuestPreviewBanner'

function useOnboarded(): boolean {
  return isOnboardingCompleteInStorage()
}

function withGuestBanner(content: ReactNode) {
  return (
    <>
      <GuestPreviewBanner />
      {content}
    </>
  )
}

/** Exec app shell — flat route wrapper (no nested Outlet) */
export function ExecShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { isMemberView } = usePermissions()

  if (!onboarded) return <Navigate to="/preview" replace />
  if (isMemberView) return <Navigate to="/my-dashboard" replace />

  return withGuestBanner(
    <div className="min-h-screen text-[var(--ink)]" style={{ background: 'var(--surface-tint)' }}>
      <Sidebar />
      <main className="ml-56 min-h-screen">
        <div className="theme-stripe sticky top-0 z-40" />
        <div className="min-h-[calc(100vh-2px)] bg-[var(--surface-card)]">{children}</div>
      </main>
    </div>
  )
}

/** Member-facing pages */
export function MemberShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  if (!onboarded) return <Navigate to="/preview" replace />
  return withGuestBanner(<>{children}</>)
}

/** Exec sidebar for officers; standalone for active/new members */
export function AdaptiveShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { isMemberView } = usePermissions()

  if (!onboarded) return <Navigate to="/preview" replace />
  if (isMemberView) return withGuestBanner(<>{children}</>)

  return withGuestBanner(
    <div className="min-h-screen text-[var(--ink)]" style={{ background: 'var(--surface-tint)' }}>
      <Sidebar />
      <main className="ml-56 min-h-screen">
        <div className="theme-stripe sticky top-0 z-40" />
        <div className="min-h-[calc(100vh-2px)] bg-[var(--surface-card)]">{children}</div>
      </main>
    </div>
  )
}

/** Settings — exec gets sidebar, members get standalone */
export function SettingsShellPage({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { isMemberView } = usePermissions()

  if (!onboarded) return <Navigate to="/preview" replace />
  if (isMemberView) return withGuestBanner(<>{children}</>)

  return withGuestBanner(
    <div className="min-h-screen text-[var(--ink)]" style={{ background: 'var(--surface-tint)' }}>
      <Sidebar />
      <main className="ml-56 min-h-screen">
        <div className="theme-stripe sticky top-0 z-40" />
        <div className="min-h-[calc(100vh-2px)] bg-[var(--surface-card)]">{children}</div>
      </main>
    </div>
  )
}
