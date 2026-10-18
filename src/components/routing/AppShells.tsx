import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useAuth, usePermissions } from '../../context/AuthContext'
import { isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import { isGuestPreviewActive } from '../../lib/guestPreview'
import { Sidebar } from '../layout/Sidebar'
import { MemberBottomNav } from '../layout/MemberBottomNav'
import { GuestPreviewBanner } from './GuestPreviewBanner'
import { useShellKind } from '../../hooks/useShellKind'
import { userIsExecCapable } from '../../lib/access/can'

function useOnboarded(): boolean {
  return isOnboardingCompleteInStorage()
}

function useShowGuestBanner(): boolean {
  const { onboarding } = useAuth()
  return onboarding?.isGuest === true || isGuestPreviewActive()
}

const MEMBER_NAV_PAD = 'pb-[4.25rem]'

/** Chapter Room chrome: scrollable content + bottom nav */
function MemberChrome({ children }: { children: ReactNode }) {
  const showGuest = useShowGuestBanner()

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ background: 'var(--surface-tint)' }}
    >
      {showGuest && <GuestPreviewBanner />}
      <div className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${MEMBER_NAV_PAD}`}>{children}</div>
      <MemberBottomNav />
    </div>
  )
}

/** Operations chrome: responsive sidebar drawer + main */
function ExecChrome({ children }: { children: ReactNode }) {
  const showGuest = useShowGuestBanner()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ background: 'var(--surface-tint)' }}
    >
      {showGuest && <GuestPreviewBanner />}
      <div className="relative flex min-h-0 min-w-0 flex-1">
        {drawerOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <Sidebar mobileOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-3 border-b border-[var(--rule)] bg-[var(--surface-card)] px-4 py-3 md:hidden">
            <button
              type="button"
              className="border border-[var(--rule)] p-2 text-[var(--ink)]"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <p className="font-serif text-lg tracking-tight text-[var(--ink)]">Operations</p>
          </div>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="theme-stripe hidden md:block" />
            <div className="min-h-full" style={{ background: 'var(--surface-card)' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function RequireOnboarded({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  if (!onboarded) return <Navigate to="/preview" replace />
  return <>{children}</>
}

/** Pick member vs exec chrome from view mode (see useShellKind). */
export function SharedShell({ children }: { children: ReactNode }) {
  const kind = useShellKind()
  return (
    <RequireOnboarded>
      {kind === 'member' ? <MemberChrome>{children}</MemberChrome> : <ExecChrome>{children}</ExecChrome>}
    </RequireOnboarded>
  )
}

/** Always Chapter Room chrome (Room + Profile). */
export function MemberShell({ children }: { children: ReactNode }) {
  return (
    <RequireOnboarded>
      <MemberChrome>{children}</MemberChrome>
    </RequireOnboarded>
  )
}

/** Operations-only routes (/home, roster, …). Redirect to Room when in chapter-room mode. */
export function ExecShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { role } = useAuth()
  const permissions = usePermissions()
  const kind = useShellKind()

  if (!onboarded) return <Navigate to="/preview" replace />

  const execCapable = userIsExecCapable(role, permissions)
  if (!execCapable) return <Navigate to="/my-dashboard" replace />
  if (kind === 'member') return <Navigate to="/my-dashboard" replace />

  return <ExecChrome>{children}</ExecChrome>
}

/** @deprecated Use SharedShell */
export function AdaptiveShell({ children }: { children: ReactNode }) {
  return <SharedShell>{children}</SharedShell>
}

/** @deprecated Use SharedShell */
export function SettingsShellPage({ children }: { children: ReactNode }) {
  return <SharedShell>{children}</SharedShell>
}
