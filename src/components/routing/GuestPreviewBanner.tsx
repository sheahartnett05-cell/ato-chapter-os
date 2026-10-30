import { Link } from 'react-router-dom'
import { Eye, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isGuestPreviewActive, GUEST_EXEC_FUNCTION_PRESETS } from '../../lib/guestPreview'
import { leaveGuestPreview } from '../../lib/leaveGuestPreview'
import { ACTIVE_FUNCTION_KEY } from '../../lib/dashboard/resolveDashboard'
import { roleLabel } from '../../types/permissions'

function demoPersonaLabel(role: ReturnType<typeof useAuth>['role']): string {
  try {
    const raw = localStorage.getItem(ACTIVE_FUNCTION_KEY)
    if (raw) {
      const fn = raw.startsWith('"') ? (JSON.parse(raw) as string) : raw
      const preset = GUEST_EXEC_FUNCTION_PRESETS.find((p) => p.function === fn)
      if (preset) return preset.label
    }
  } catch {
    /* ignore */
  }
  if (!role || role === 'ActiveMember') return 'Member'
  return roleLabel(role)
}

/** Compact top banner for collaborator / demo sessions */
export function GuestPreviewBanner() {
  const { onboarding, role } = useAuth()
  const show = onboarding?.isGuest === true || isGuestPreviewActive()

  if (!show) return null

  const exit = () => leaveGuestPreview('/')
  const persona = demoPersonaLabel(role)

  return (
    <div
      className="relative flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2"
      style={{
        background: 'var(--accent)',
        color: 'var(--accent-foreground)',
        borderColor: 'color-mix(in srgb, var(--accent) 70%, #000)',
      }}
    >
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
        <Eye size={12} />
        Demo · viewing as {persona}
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/demo"
          className="font-mono text-[11px] uppercase tracking-wider underline-offset-2 hover:underline"
        >
          Change demo role
        </Link>
        <button
          type="button"
          onClick={exit}
          className="inline-flex min-h-11 items-center gap-1 font-mono text-[11px] uppercase tracking-wider"
          aria-label="Exit guest preview"
        >
          <X size={12} /> Exit
        </button>
      </div>
    </div>
  )
}
