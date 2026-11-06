import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Menu } from 'lucide-react'
import { useAuth, usePermissions } from '../../context/AuthContext'
import { useSetChapterViewMode } from '../../context/ChapterViewModeContext'
import { ShellMenuProvider } from '../../context/ShellMenuContext'
import { isOnboardingCompleteInStorage } from '../../lib/onboardingStorage'
import { isGuestPreviewActive } from '../../lib/guestPreview'
import { Sidebar } from '../layout/Sidebar'
import { MemberBottomNav } from '../layout/MemberBottomNav'
import { OfficerBottomNav } from '../layout/OfficerBottomNav'
import { MobileModeSwitcher } from '../layout/MobileModeSwitcher'
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

function useScrollContainerReset(ref: RefObject<HTMLElement | null>, pathname: string) {
  useEffect(() => {
    ref.current?.scrollTo({ top: 0, left: 0 })
  }, [pathname, ref])
}

function MobileTopChrome({
  showMenu,
  onOpenMenu,
}: {
  showMenu?: boolean
  onOpenMenu?: () => void
}) {
  const { role } = useAuth()
  const permissions = usePermissions()
  const showMode = userIsExecCapable(role, permissions)

  if (!showMenu && !showMode) return null

  return (
    <header className="z-20 shrink-0 border-b border-[var(--rule)] bg-[var(--surface-card)] pt-[env(safe-area-inset-top,0px)] md:hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        {showMenu && onOpenMenu ? (
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--rule)] text-[var(--ink)] active:bg-black/[0.03]"
            aria-label="Open menu"
            onClick={onOpenMenu}
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">{showMode ? <MobileModeSwitcher /> : null}</div>
      </div>
    </header>
  )
}

/** Chapter Room chrome: top mode tabs (exec) + scroll + bottom tabs */
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
      <MobileTopChrome />
      <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto">
        {children}
      </div>
      <MemberBottomNav />
    </div>
  )
}

/** Officer Home chrome: top tabs + drawer + bottom tabs on mobile */
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
        <MobileTopChrome showMenu onOpenMenu={() => setDrawerOpen(true)} />
        <div className="theme-stripe hidden shrink-0 md:block" />
        <div className="relative flex min-h-0 min-w-0 flex-1">
          <Sidebar mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <main
              ref={mainScrollRef}
              className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto"
            >
              <div className="min-h-full min-w-0" style={{ background: 'var(--surface-card)' }}>
                {children}
              </div>
            </main>
            <OfficerBottomNav />
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
