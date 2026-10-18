import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, LayoutDashboard } from 'lucide-react'
import { useAuth, usePermissions } from '../../context/AuthContext'
import { useChapterViewMode } from '../../context/ChapterViewModeContext'
import { useIsMemberShell } from '../../hooks/useShellKind'
import { userIsExecCapable } from '../../lib/access/can'

/** Switch to Operations layout and open officer Home (/home). */
export function useGoToOperations() {
  const { setViewMode } = useChapterViewMode()
  const navigate = useNavigate()
  return () => {
    setViewMode('operations')
    navigate('/home')
  }
}

/** Shown under the guest banner on all Chapter Room routes for exec-capable users. */
export function MemberShellOperationsStrip() {
  const { role } = useAuth()
  const permissions = usePermissions()
  const { viewMode } = useChapterViewMode()
  const goToOperations = useGoToOperations()

  if (!userIsExecCapable(role, permissions) || viewMode !== 'chapter-room') return null

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--rule)] bg-[var(--surface-card)] px-4 py-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">
        Chapter Room view
      </p>
      <button
        type="button"
        onClick={goToOperations}
        className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[var(--primary)] bg-[var(--primary-subtle)] px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
      >
        <LayoutDashboard size={13} strokeWidth={1.75} />
        Back to Home
      </button>
    </div>
  )
}

/** TopBar: back to Room on subpages; Operations exit for officers. */
export function TopBarChapterModeLinks() {
  const { pathname } = useLocation()
  const { role } = useAuth()
  const permissions = usePermissions()
  const isMemberShell = useIsMemberShell()
  const { viewMode } = useChapterViewMode()
  const goToOperations = useGoToOperations()

  if (!isMemberShell) return null

  const onRoomHome = pathname === '/my-dashboard' || pathname === '/chapter-room'
  const execInRoom =
    userIsExecCapable(role, permissions) && viewMode === 'chapter-room'

  return (
    <div className="mr-1 flex shrink-0 flex-wrap items-center gap-1.5">
      {!onRoomHome && (
        <Link
          to="/my-dashboard"
          className="flex items-center gap-1 rounded-full border border-[var(--rule)] bg-[var(--surface-tint)] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
        >
          <ChevronLeft size={14} />
          Room
        </Link>
      )}
      {execInRoom && (
        <button
          type="button"
          onClick={goToOperations}
          className="flex items-center gap-1 rounded-full border border-[var(--primary)] bg-[var(--primary-subtle)] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
        >
          <LayoutDashboard size={13} />
          Back to Home
        </button>
      )}
    </div>
  )
}
