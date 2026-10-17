import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, Eye, Shield, Smartphone, ChevronLeft } from 'lucide-react'
import { AgoraMark } from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { getOrCreateUserId } from '../context/MembersContext'
import {
  GUEST_CHAPTER,
  GUEST_PRESETS,
  GUEST_EXEC_FUNCTION_PRESETS,
  isGuestPreviewActive,
  markGuestPreview,
  type GuestExecFunctionPreset,
  type GuestPreviewMode,
} from '../lib/guestPreview'
import { clearDemoData, seedGuestDemo, backupRealSession } from '../lib/demoSeed'
import { writeActiveDashboardFunction } from '../lib/dashboard/resolveDashboard'
import { contrastText } from '../lib/themeUtils'
import { defaultHomePath } from '../lib/onboardingStorage'

/**
 * Guest / collaborator preview — no invite code required.
 * Seeds a demo chapter so reviewers can browse the product.
 */
export default function GuestLogin() {
  const { completeOnboarding, isOnboarded, onboarding } = useAuth()
  const { setSelectedOrg, setChapterMeta } = useChapter()
  const [execPickerOpen, setExecPickerOpen] = useState(false)

  useEffect(() => {
    setSelectedOrg('agora')
    setChapterMeta({ chapterDesignation: '', university: '' })
  }, [setSelectedOrg, setChapterMeta])

  const inGuestSession = isOnboarded && (onboarding?.isGuest === true || isGuestPreviewActive())
  const inRealSession = isOnboarded && !inGuestSession

  const finishGuestSession = (
    mode: GuestPreviewMode,
    memberId: string,
    role: (typeof GUEST_PRESETS)['exec']['role'],
    profile: (typeof GUEST_PRESETS)['exec']['profile']
  ) => {
    const preset = GUEST_PRESETS[mode]
    const userId = getOrCreateUserId()
    const { orgId, chapterDesignation, university } = GUEST_CHAPTER

    backupRealSession()
    clearDemoData()
    markGuestPreview(true)
    seedGuestDemo()

    try {
      localStorage.removeItem('chapter-os-selected-org')
    } catch {
      /* storage unavailable */
    }

    try {
      const accountsKey = 'chapter-os-member-accounts'
      const lockKey = 'chapter-os-chapter-lock'
      const accounts = [
        {
          id: `acct-guest-${mode}-${memberId}`,
          userId,
          memberId,
          profile,
          role,
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
      profile,
      orgId,
      chapterDesignation,
      university,
      role,
      memberId,
      userId,
      inviteCodeId: `guest-${mode}`,
      isGuest: true,
    })

    window.location.assign(preset.home)
  }

  const enterMember = () => {
    const preset = GUEST_PRESETS.member
    finishGuestSession('member', 'm5', preset.role, preset.profile)
  }

  const enterExec = (execPreset: GuestExecFunctionPreset) => {
    writeActiveDashboardFunction(execPreset.function)
    const base = GUEST_PRESETS.exec
    finishGuestSession('exec', execPreset.memberId, execPreset.role, {
      ...base.profile,
      firstName: 'Guest',
      lastName: execPreset.label.split(' ')[0] ?? 'Officer',
      avatar: execPreset.label.slice(0, 2).toUpperCase(),
    })
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
              <p className="font-serif text-lg tracking-tight">Agora</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-65">
                Preview
              </p>
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
          Built for every chapter · IFC · Panhellenic · NPHC · MGC
        </p>
      </aside>

      <main className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-14">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <AgoraMark size={40} />
          <div>
            <p className="font-serif text-base text-[var(--ink)]">Agora</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Guest login
            </p>
          </div>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] lg:block">
          Guest login
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-[var(--ink)]">
          {execPickerOpen ? 'Officer dashboard preview' : 'Choose a preview'}
        </h2>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          {execPickerOpen
            ? 'Each role shows a different Home dashboard — tiles are driven by officer function, not title.'
            : 'Instant access for demos. Pick your national org and chapter during full onboarding.'}
        </p>

        {inRealSession && (
          <p className="mt-4 max-w-md rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            You have a saved chapter session in this browser. Choose a preview below to switch to
            the Agora demo — your real session data here will be replaced.
          </p>
        )}

        {inGuestSession && !execPickerOpen && (
          <p className="mt-4 max-w-md text-sm text-[var(--muted)]">
            Already in guest preview.{' '}
            <Link to={defaultHomePath()} className="text-[var(--accent)] underline-offset-2 hover:underline">
              Return to demo
            </Link>{' '}
            or pick another mode below.
          </p>
        )}

        <div className="mt-8 space-y-3">
          {execPickerOpen ? (
            <>
              <button
                type="button"
                onClick={() => setExecPickerOpen(false)}
                className="mb-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <ChevronLeft size={14} /> Back
              </button>
              {GUEST_EXEC_FUNCTION_PRESETS.map((preset) => (
                <button
                  key={preset.function}
                  type="button"
                  onClick={() => enterExec(preset)}
                  className="flex w-full items-start gap-4 border border-[var(--rule)] bg-[var(--surface-card)] p-4 text-left transition hover:border-[var(--ink)]"
                >
                  <Shield size={18} className="mt-0.5 shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--ink)]">{preset.label}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{preset.hint}</p>
                  </div>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExecPickerOpen(true)}
                className="flex w-full items-start gap-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5 text-left transition hover:border-[var(--ink)]"
              >
                <Shield size={20} className="mt-0.5 shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--ink)]">Exec / officer preview</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Choose function — President, Treasurer, Recruitment, Scholarship, and more
                  </p>
                </div>
                <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
              </button>

              <button
                type="button"
                onClick={enterMember}
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
            </>
          )}
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
