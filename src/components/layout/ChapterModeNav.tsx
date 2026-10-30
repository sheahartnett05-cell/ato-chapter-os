import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, LayoutDashboard } from 'lucide-react'
import { useAuth, usePermissions } from '../../context/AuthContext'
import {
  useResolvedChapterViewMode,
  useSetChapterViewMode,
} from '../../context/ChapterViewModeContext'
import { useIsMemberShell } from '../../hooks/useShellKind'
import { userIsExecCapable } from '../../lib/access/can'

/** Switch to Officer Home layout and open /home. Storage value remains `operations`. */
export function useGoToOperations() {
  const setViewMode = useSetChapterViewMode()
  const navigate = useNavigate()
  return () => {
    setViewMode('operations')
    navigate('/home')
  }
}

/** Single Officer Home control under the guest banner on Chapter Room routes. */
export function MemberShellOperationsStrip() {
  const { role } = useAuth()
  const permissions = usePermissions()
  const viewMode = useResolvedChapterViewMode()
  const goToOperations = useGoToOperations()

  if (!userIsExecCapable(role, permissions) || viewMode !== 'chapter-room') return null

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--rule)] bg-[var(--surface-card)] px-4 py-2.5">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        Chapter Room view
      </p>
      <button
        type="button"
        onClick={goToOperations}
        className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm border border-[var(--primary)] bg-[var(--primary-subtle)] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
      >
        <LayoutDashboard size={13} strokeWidth={1.75} />
        Officer Home
      </button>
    </div>
  )
}

/** TopBar: back to Room on subpages only (Officer Home lives on the strip). */
export function TopBarChapterModeLinks() {
  const { pathname } = useLocation()
  const isMemberShell = useIsMemberShell()

  if (!isMemberShell) return null

  const onRoomHome = pathname === '/my-dashboard' || pathname === '/chapter-room'

  if (onRoomHome) return null

  return (
    <div className="mr-1 flex shrink-0 flex-wrap items-center gap-1.5">
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
