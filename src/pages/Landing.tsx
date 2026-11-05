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

function ActionCard({
  to,
  icon: Icon,
  title,
  body,
  primary = false,
}: {
  to: string
  icon: typeof LogIn
  title: string
  body: string
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      className={`flex min-h-[4.5rem] items-start gap-4 border p-4 text-left transition active:scale-[0.99] sm:p-5 ${
        primary
          ? 'border-[var(--ink)] bg-[var(--primary)] text-[var(--primary-foreground)]'
          : 'border-[var(--rule)] bg-[var(--surface-card)] text-[var(--ink)] active:border-[var(--ink)]'
      }`}
    >
      <Icon size={20} className="mt-0.5 shrink-0" strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug">{title}</span>
        <span
          className={`mt-1 block text-sm leading-snug ${primary ? 'opacity-80' : 'text-[var(--muted)]'}`}
        >
          {body}
        </span>
      </span>
      <ArrowRight
        size={16}
        className={`mt-1 shrink-0 ${primary ? '' : 'text-[var(--muted)]'}`}
      />
    </Link>
  )
}

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
    <div
      className="flex min-h-screen min-h-[100dvh]"
      style={{ background: 'var(--surface-tint)' }}
    >
      <BrandHeroPanel
        org={null}
        headline="Your chapter, in one place."
        description="Roster, calendar, dues, and recruitment for officers and members. Start a real chapter, or look through a sample one first."
      />

      <main className="flex w-full flex-col justify-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:py-12 lg:w-1/2 lg:px-14">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <ChapteraMark size={40} />
          <div>
            <p className="font-serif text-lg text-[var(--ink)]">{CHAPTERA_PRODUCT_NAME}</p>
            <p className="text-xs text-[var(--muted)]">{CHAPTERA_TAGLINE}</p>
          </div>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Get started
        </p>
        <h1 className="mt-2 max-w-md font-serif text-[2rem] leading-[1.15] tracking-tight text-[var(--ink)] sm:mt-3 sm:text-4xl">
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
            <Link
              to={defaultHomePath()}
              className="font-semibold text-[var(--ink)] underline-offset-2 hover:underline"
            >
              Return to the demo
            </Link>
          </p>
        )}

        <div className="mt-7 max-w-md space-y-2.5 sm:mt-8 sm:space-y-3">
          {inChapter ? (
            <ActionCard
              to={defaultHomePath()}
              icon={LogIn}
              primary
              title="Continue as saved profile"
              body="This phone already remembers you — no code needed."
            />
          ) : (
            <ActionCard
              to="/login"
              icon={LogIn}
              primary
              title="Sign in"
              body={
                remembered
                  ? `Continue as ${remembered} — code only if this phone signed you out.`
                  : 'Returning members — email + password or a one-time login code.'
              }
            />
          )}

          <ActionCard
            to="/onboarding?intent=join"
            icon={KeyRound}
            title="Join with a code"
            body="Your officers shared an invite code. Enter it to join the roster."
          />

          <ActionCard
            to="/onboarding?intent=create"
            icon={UserPlus}
            title="Create a chapter"
            body="You are the founding officer. Name, school, then your org."
          />

          <ActionCard
            to="/demo"
            icon={Play}
            title="Try the demo"
            body="A sample chapter in this browser. No account, no invite code."
          />
        </div>
      </main>
    </div>
  )
}
