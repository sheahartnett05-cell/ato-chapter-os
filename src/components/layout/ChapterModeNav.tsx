import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, LayoutDashboard } from 'lucide-react'
import { useSetChapterViewMode } from '../../context/ChapterViewModeContext'
import { useIsMemberShell } from '../../hooks/useShellKind'

/** Switch to Officer Home layout and open /home. Storage value remains `operations`. */
export function useGoToOperations() {
  const setViewMode = useSetChapterViewMode()
  const navigate = useNavigate()
  return () => {
    setViewMode('operations')
    navigate('/home')
  }
}

export function GoToDashboardButton({
  variant = 'bar',
}: {
  variant?: 'hero' | 'bar'
}) {
  const goToOperations = useGoToOperations()

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={goToOperations}
        className="flex min-h-11 max-w-full shrink-0 items-center gap-1.5 border border-white/30 bg-white px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)] shadow-sm transition active:opacity-90 sm:gap-2 sm:px-3.5 sm:text-[11px]"
      >
        <LayoutDashboard size={15} strokeWidth={2} className="shrink-0" />
        <span className="truncate">Dashboard</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={goToOperations}
      className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm border border-[var(--primary)] bg-[var(--primary-subtle)] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
    >
      <LayoutDashboard size={13} strokeWidth={1.75} />
      Dashboard
    </button>
  )
}

/** @deprecated MobileModeSwitcher in AppShells replaced this strip. */
export function MemberShellOperationsStrip() {
  return null
}

/** Desktop/tablet back-to-Room chip; phones use the Room | Officer top tabs. */
export function TopBarChapterModeLinks() {
  const { pathname } = useLocation()
  const isMemberShell = useIsMemberShell()

  if (!isMemberShell) return null

  const onRoomHome = pathname === '/my-dashboard' || pathname === '/chapter-room'
  if (onRoomHome) return null

  return (
    <div className="mr-1 hidden shrink-0 flex-wrap items-center gap-1.5 md:flex">
      <Link
        to="/my-dashboard"
        className="flex min-h-11 items-center gap-1 rounded-full border border-[var(--rule)] bg-[var(--surface-tint)] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
      >
        <ChevronLeft size={14} />
        Room
      </Link>
    </div>
  )
}
