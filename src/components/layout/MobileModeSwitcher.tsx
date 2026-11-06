import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, usePermissions } from '../../context/AuthContext'
import { useSetChapterViewMode } from '../../context/ChapterViewModeContext'
import { useShellKind } from '../../hooks/useShellKind'
import { userIsExecCapable } from '../../lib/access/can'

/** Top Room | Officer switch — only for exec-capable users on small screens. */
export function MobileModeSwitcher() {
  const { role } = useAuth()
  const permissions = usePermissions()
  const setViewMode = useSetChapterViewMode()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const kind = useShellKind()

  if (!userIsExecCapable(role, permissions)) return null

  // Prefer the chrome that is actually mounted (and Room routes) so the control
  // never shows Officer while Chapter Room tabs are on screen.
  const forceRoom =
    pathname.startsWith('/my-dashboard') ||
    pathname.startsWith('/chapter-room') ||
    pathname.startsWith('/profile')
  const isRoom = forceRoom || kind === 'member'

  return (
    <div
      className="flex rounded-md border border-[var(--rule)] bg-[var(--surface-tint)] p-0.5"
      role="tablist"
      aria-label="Chapter view"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isRoom}
        className={`min-h-10 flex-1 px-3 font-mono text-[10px] uppercase tracking-wider transition ${
          isRoom
            ? 'bg-[var(--surface-card)] text-[var(--ink)] shadow-sm'
            : 'text-[var(--muted)] active:text-[var(--ink)]'
        }`}
        onClick={() => {
          setViewMode('chapter-room')
          navigate('/my-dashboard')
        }}
      >
        Room
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!isRoom}
        className={`min-h-10 flex-1 px-3 font-mono text-[10px] uppercase tracking-wider transition ${
          !isRoom
            ? 'bg-[var(--surface-card)] text-[var(--ink)] shadow-sm'
            : 'text-[var(--muted)] active:text-[var(--ink)]'
        }`}
        onClick={() => {
          setViewMode('operations')
          navigate('/home')
        }}
      >
        Officer
      </button>
    </div>
  )
}
