import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowRight, Eye, Shield, Smartphone } from 'lucide-react'
import { AgoraMark } from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { getOrCreateUserId } from '../context/MembersContext'
import {
  GUEST_CHAPTER,
  GUEST_PRESETS,
  isGuestPreviewActive,
  markGuestPreview,
  type GuestPreviewMode,
} from '../lib/guestPreview'
import { clearDemoData, seedGuestDemo, backupRealSession } from '../lib/demoSeed'
import { contrastText } from '../lib/themeUtils'
import { defaultHomePath } from '../lib/onboardingStorage'
import { AGORA_PRODUCT_NAME, AGORA_TAGLINE } from '../lib/brandCopy'

/**
 * Guest / collaborator preview — no invite code required.
 * Seeds a demo chapter so reviewers can browse the product.
 */
export default function GuestLogin() {
  const { completeOnboarding, isOnboarded, onboarding } = useAuth()
  const { setSelectedOrg, setChapterMeta } = useChapter()

  useEffect(() => {
    setSelectedOrg('agora')
    setChapterMeta({ chapterDesignation: '', university: '' })
  }, [setSelectedOrg, setChapterMeta])

  const inGuestSession = isOnboarded && (onboarding?.isGuest === true || isGuestPreviewActive())
  const inRealSession = isOnboarded && !inGuestSession

  const enter = (mode: GuestPreviewMode) => {
    const preset = GUEST_PRESETS[mode]
    const userId = getOrCreateUserId()
    const { orgId, chapterDesignation, university } = GUEST_CHAPTER
    // Demo roster identities (not a fresh empty register)
    const memberId = mode === 'exec' ? 'm1' : 'm5'

    // Preserve real chapter data before seeding demo
    backupRealSession()
    clearDemoData()
    markGuestPreview(true)
    seedGuestDemo()

    try {
      localStorage.removeItem('chapter-os-selected-org')
    } catch {
      /* storage unavailable */
    }

    // Link this browser user to a seeded demo member without wiping the roster
    try {
      const accountsKey = 'chapter-os-member-accounts'
      const lockKey = 'chapter-os-chapter-lock'
      const accounts = [
        {
          id: `acct-guest-${mode}`,
          userId,
          memberId,
          profile: preset.profile,
          role: preset.role,
          email: `guest.${mode}@agora.preview`,
          inviteCodeId: `guest-${mode}`,
          joinedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem(accountsKey, JSON.stringify(accounts))
      if (mode === 'exec') {
        localStorage.setItem(
          lockKey,
          JSON.stringify({
            orgId,
            chapterDesignation,
            university,
            lockedAt: new Date().toISOString(),
            lockedByUserId: userId,
          })
        )
      }
    } catch {
      /* storage unavailable */
    }

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

    // Full reload so providers remount with guest flag + seeded storage
    window.location.assign(preset.home)
  }

  const primary = '#1a1a1a'
  const accent = '#c4a35a'
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
          <div className="flex items-center gap-3">
            <AgoraMark size={44} onDark />
            <div>
              <p className="font-serif text-lg tracking-tight">{AGORA_PRODUCT_NAME}</p>
              <p className="mt-0.5 text-sm opacity-75">{AGORA_TAGLINE}</p>
            </div>
          </div>
          <h1 className="mt-10 max-w-md font-serif text-5xl tracking-tight">
            Tour the product as a guest
          </h1>
          <p className="mt-4 max-w-sm text-sm opacity-75">
            Collaborators and reviewers can explore without an invite code. Demo data stays in this
            browser only.
          </p>
        </div>
        <p className="relative z-10 font-mono text-[10px] uppercase tracking-wider opacity-55">
          {AGORA_TAGLINE}
        </p>
      </aside>

      <main className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-14">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <AgoraMark size={40} />
          <div>
            <p className="font-serif text-base text-[var(--ink)]">{AGORA_PRODUCT_NAME}</p>
            <p className="text-xs text-[var(--muted)]">{AGORA_TAGLINE}</p>
          </div>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] lg:block">
          Guest login
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-[var(--ink)]">
          Choose a preview
        </h2>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          Instant access for demos. Pick your national org and chapter during full onboarding.
        </p>

        {inRealSession && (
          <p className="mt-4 max-w-md rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            You have a saved chapter session in this browser. Choose a preview below to switch to
            the Agora demo — your real session data here will be replaced.
          </p>
        )}

        {inGuestSession && (
          <p className="mt-4 max-w-md text-sm text-[var(--muted)]">
            Already in guest preview.{' '}
            <Link to={defaultHomePath()} className="text-[var(--accent)] underline-offset-2 hover:underline">
              Return to demo
            </Link>{' '}
            or pick another mode below.
          </p>
        )}

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
