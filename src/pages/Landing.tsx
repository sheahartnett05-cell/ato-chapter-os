import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound, LogIn, Play, UserPlus } from 'lucide-react'
import { BrandHeroPanel } from '../components/onboarding/BrandHeroPanel'
import { ChapteraMark } from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { CHAPTERA_PRODUCT_NAME, CHAPTERA_TAGLINE } from '../lib/brandCopy'
import { isGuestPreviewActive } from '../lib/guestPreview'
import { defaultHomePath } from '../lib/onboardingStorage'
import { readRememberedEmail } from '../lib/rememberedAuth'

export default function Landing() {
  const navigate = useNavigate()
  const { isOnboarded, onboarding, emailVerified } = useAuth()
  const inGuest = isOnboarded && (onboarding?.isGuest === true || isGuestPreviewActive())
  const inChapter = isOnboarded && !inGuest
  const remembered = readRememberedEmail()

  useEffect(() => {
    if (inChapter && emailVerified) {
      navigate(defaultHomePath(), { replace: true })
    }
  }, [inChapter, emailVerified, navigate])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-tint)' }}>
      <BrandHeroPanel
        org={null}
        headline="Your chapter, in one place."
        description="Roster, calendar, dues, and recruitment for officers and members. Start a real chapter, or look through a sample one first."
      />

      <main className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-14">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <ChapteraMark size={40} />
          <div>
            <p className="font-serif text-base text-[var(--ink)]">{CHAPTERA_PRODUCT_NAME}</p>
            <p className="text-xs text-[var(--muted)]">{CHAPTERA_TAGLINE}</p>
          </div>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Get started
        </p>
        <h1 className="mt-3 max-w-md font-serif text-4xl tracking-tight text-[var(--ink)]">
          What do you want to do?
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Creating an account and trying the demo are separate. Pick one — you can switch later.
        </p>

        {inChapter && (
          <p className="mt-4 max-w-md text-sm text-[var(--ink)]">
            Welcome back
            {onboarding?.profile?.firstName ? `, ${onboarding.profile.firstName}` : ''}.{' '}
            <Link to={defaultHomePath()} className="font-semibold underline-offset-2 hover:underline">
              Open your chapter
            </Link>
          </p>
        )}
        {inGuest && (
          <p className="mt-4 max-w-md text-sm text-[var(--muted)]">
            You are in the sample chapter.{' '}
            <Link to={defaultHomePath()} className="font-semibold text-[var(--ink)] underline-offset-2 hover:underline">
              Return to the demo
            </Link>
          </p>
        )}

        <div className="mt-8 max-w-md space-y-3">
          {inChapter ? (
            <Link
              to={defaultHomePath()}
              className="flex items-start gap-4 border border-[var(--ink)] bg-[var(--primary)] p-5 text-left text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              <LogIn size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Continue as saved profile</span>
                <span className="mt-1 block text-sm opacity-80">
                  This phone already remembers you — no code needed.
                </span>
              </span>
              <ArrowRight size={16} className="mt-1 shrink-0" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-start gap-4 border border-[var(--ink)] bg-[var(--primary)] p-5 text-left text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              <LogIn size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Sign in</span>
                <span className="mt-1 block text-sm opacity-80">
                  {remembered
                    ? `Continue as ${remembered} — code only if this phone signed you out.`
                    : 'Returning members — email login code once per phone.'}
                </span>
              </span>
              <ArrowRight size={16} className="mt-1 shrink-0" />
            </Link>
          )}

          <Link
            to="/onboarding?intent=create"
            className="flex items-start gap-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5 text-left text-[var(--ink)] transition hover:border-[var(--ink)]"
          >
            <UserPlus size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Create a chapter</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">
                You are the founding officer. Name, school, then your org.
              </span>
            </span>
            <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
          </Link>

          <Link
            to="/demo"
            className="flex items-start gap-4 border border-[var(--rule)] bg-[var(--surface-card)] p-5 text-left text-[var(--ink)] transition hover:border-[var(--ink)]"
          >
            <Play size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Try the demo</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">
                A sample chapter in this browser. No account, no invite code.
              </span>
            </span>
            <ArrowRight size={16} className="mt-1 shrink-0 text-[var(--muted)]" />
          </Link>
        </div>

        <Link
          to="/onboarding?intent=join"
          className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <KeyRound size={14} />
          I have a join code
        </Link>
      </main>
    </div>
  )
}
