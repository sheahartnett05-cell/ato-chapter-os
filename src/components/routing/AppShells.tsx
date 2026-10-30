import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useAuth, usePermissions } from '../../context/AuthContext'
import { useSetChapterViewMode } from '../../context/ChapterViewModeContext'
import { ShellMenuProvider } from '../../context/ShellMenuContext'
import { isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import { isGuestPreviewActive } from '../../lib/guestPreview'
import { Sidebar } from '../layout/Sidebar'
import { MemberBottomNav } from '../layout/MemberBottomNav'
import { MemberShellOperationsStrip } from '../layout/ChapterModeNav'
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

const MEMBER_NAV_PAD = 'pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]'

function useScrollContainerReset(ref: RefObject<HTMLElement | null>, pathname: string) {
  useEffect(() => {
    ref.current?.scrollTo({ top: 0, left: 0 })
  }, [pathname, ref])
}

/** Chapter Room chrome: scrollable content + bottom nav */
function MemberChrome({ children }: { children: ReactNode }) {
  const showGuest = useShowGuestBanner()
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  useScrollContainerReset(scrollRef, pathname)

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ background: 'var(--surface-tint)' }}
    >
      {showGuest && <GuestPreviewBanner />}
      <MemberShellOperationsStrip />
      <div
        ref={scrollRef}
        className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${MEMBER_NAV_PAD}`}
      >
        {children}
      </div>
      <MemberBottomNav />
    </div>
  )
}

/** Officer Home chrome: responsive sidebar drawer + main (no duplicate mobile title bar). */
function ExecChrome({ children }: { children: ReactNode }) {
  const showGuest = useShowGuestBanner()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const mainScrollRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useScrollContainerReset(mainScrollRef, location.pathname)

  return (
    <ShellMenuProvider openMenu={() => setDrawerOpen(true)}>
      <div
        className="flex h-dvh flex-col overflow-hidden"
        style={{ background: 'var(--surface-tint)' }}
      >
        {showGuest && <GuestPreviewBanner />}
        <div className="theme-stripe hidden shrink-0 md:block" />
        <div className="relative flex min-h-0 min-w-0 flex-1">
          <Sidebar mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <main ref={mainScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
              <div className="min-h-full" style={{ background: 'var(--surface-card)' }}>
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </ShellMenuProvider>
  )
}

function RequireOnboarded({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  if (!onboarded) return <Navigate to="/" replace />
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

/**
 * Officer Home routes (/home, roster, …).
 * SHEA FLAG: when an exec-capable user in chapter-room mode deep-links to an exec URL,
 * switch view mode to `operations` and render — explicit URL is intent (avoids silent bounce).
 * Non-exec users still redirect to Chapter Room.
 */
export function ExecShell({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded()
  const { role } = useAuth()
  const permissions = usePermissions()
  const kind = useShellKind()
  const setViewMode = useSetChapterViewMode()

  const execCapable = userIsExecCapable(role, permissions)

  useEffect(() => {
    if (!onboarded || !execCapable) return
    if (kind === 'member') setViewMode('operations')
  }, [onboarded, execCapable, kind, setViewMode])

  if (!onboarded) return <Navigate to="/" replace />
  if (!execCapable) return <Navigate to="/my-dashboard" replace />

  return <ExecChrome>{children}</ExecChrome>
}

