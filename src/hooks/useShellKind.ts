import { useAuth, usePermissions } from '../context/AuthContext'
import { useChapterViewMode } from '../context/ChapterViewModeContext'
import { userIsExecCapable } from '../lib/access/can'

export type ShellKind = 'member' | 'exec'

/** Which app chrome wraps the current route — driven by view mode, not route alone. */
export function useShellKind(): ShellKind {
  const { role } = useAuth()
  const permissions = usePermissions()
  const { viewMode } = useChapterViewMode()

  const execCapable = userIsExecCapable(role, permissions)
  if (!execCapable) return 'member'
  return viewMode === 'chapter-room' ? 'member' : 'exec'
}

export function useIsMemberShell(): boolean {
  return useShellKind() === 'member'
}
