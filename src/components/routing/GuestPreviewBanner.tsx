import { Link, useNavigate } from 'react-router-dom'
import { Eye, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { isGuestPreviewActive, markGuestPreview } from '../../lib/guestPreview'

/** Fixed banner for collaborator / demo sessions */
export function GuestPreviewBanner() {
  const { onboarding, resetOnboarding } = useAuth()
  const navigate = useNavigate()
  const show = onboarding?.isGuest === true || isGuestPreviewActive()

  if (!show) return null

  const exit = () => {
    markGuestPreview(false)
    resetOnboarding()
    navigate('/preview', { replace: true })
  }

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b px-4 py-2"
      style={{
        background: 'var(--accent)',
        color: 'var(--accent-foreground)',
        borderColor: 'color-mix(in srgb, var(--accent) 70%, #000)',
      }}
    >
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
        <Eye size={12} />
        Guest preview · demo chapter · local only
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/preview"
          onClick={(e) => {
            e.preventDefault()
            exit()
          }}
          className="font-mono text-[10px] uppercase tracking-wider underline-offset-2 hover:underline"
        >
          Switch preview
        </Link>
        <button
          type="button"
          onClick={exit}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider"
          aria-label="Exit guest preview"
        >
          <X size={12} /> Exit
        </button>
      </div>
    </div>
  )
}
