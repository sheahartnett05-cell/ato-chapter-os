import { flushSync } from 'react-dom'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, Shield, Smartphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { getOrCreateUserId, useMembers } from '../context/MembersContext'
import {
  GUEST_CHAPTER,
  GUEST_PRESETS,
  markGuestPreview,
  type GuestPreviewMode,
} from '../lib/guestPreview'
import { contrastText } from '../lib/themeUtils'

/**
 * Guest / collaborator preview — no invite code required.
 * Seeds a demo ATO chapter so reviewers can browse the product.
 */
export default function GuestLogin() {
  const navigate = useNavigate()
  const { completeOnboarding, isOnboarded } = useAuth()
  const { setSelectedOrg, setChapterMeta, chapter } = useChapter()
  const { registerMember, chapterLock, lockChapter } = useMembers()

  if (isOnboarded) {
    return <Navigate to="/" replace />
  }

  const enter = (mode: GuestPreviewMode) => {
    const preset = GUEST_PRESETS[mode]
    const userId = getOrCreateUserId()
    const { orgId, chapterDesignation, university } = GUEST_CHAPTER

    const { memberId } = registerMember({
      userId,
      profile: preset.profile,
      role: preset.role,
      inviteCodeId: `guest-${mode}`,
      orgId,
      chapterDesignation,
      university,
      email: `guest.${mode}@chapter-os.preview`,
    })

    if (mode === 'exec' && !chapterLock) {
      lockChapter({ orgId, chapterDesignation, university }, userId)
    }

    markGuestPreview(true)

    flushSync(() => {
      setSelectedOrg(orgId)
      setChapterMeta({ chapterDesignation, university })
      completeOnboarding({
        profile: preset.profile,
        orgId,
        chapterDesignation,
        university,
        role: preset.role,
        memberId,
        userId,
        inviteCodeId: `guest-${mode}`,
        isGuest: true,
      })
    })

    navigate(preset.home, { replace: true })
  }

  const primary = chapter.primaryColor || '#002147'
  const accent = chapter.accentColor || '#ffc72c'
  const fg = contrastText(primary)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-tint)' }}>
      <aside
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ backgroundColor: primary, color: fg }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(135deg, ${accent}, transparent 50%)`,
          }}
        />
        <div className="relative z-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
            Chapter OS · Preview
          </p>
          <h1 className="mt-8 max-w-md font-serif text-5xl tracking-tight">
            Tour the product as a guest
          </h1>
          <p className="mt-4 max-w-sm text-sm opacity-75">
            Collaborators and reviewers can explore without an invite code. Demo data stays in this
            browser only.
          </p>
        </div>
        <p className="relative z-10 font-mono text-[10px] uppercase tracking-wider opacity-55">
          {GUEST_CHAPTER.chapterDesignation} · {GUEST_CHAPTER.university} · ATO
        </p>
      </aside>

      <main className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-14">
        <div className="theme-stripe mb-8 lg:hidden" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Guest login
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-[var(--ink)]">
          Choose a preview
        </h2>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          Instant access for demos. Use full onboarding when joining a real chapter.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => enter('exec')}
            className="flex w-full items-start gap-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5 text-left transition hover:border-[var(--ink)]"
          >
            <Shield size={20} className="mt-0.5 shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--ink)]">Exec / officer preview</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                President tools — roster, calendar, announcements, invites, settings
              </p>
            </div>
            <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
          </button>

          <button
            type="button"
            onClick={() => enter('member')}
            className="flex w-full items-start gap-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5 text-left transition hover:border-[var(--ink)]"
          >
            <Smartphone
              size={20}
              className="mt-0.5 shrink-0 text-[var(--primary)]"
              strokeWidth={1.5}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--ink)]">Member preview</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Chapter Room — RSVPs, buzz, polls, dues, study hours
              </p>
            </div>
            <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
          </button>
        </div>

        <div className="mt-10 border-t border-[var(--rule)] pt-6">
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <Eye size={12} /> Full chapter onboarding (invite code)
          </Link>
        </div>
      </main>
    </div>
  )
}
