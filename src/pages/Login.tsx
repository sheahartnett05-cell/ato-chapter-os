import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BrandHeroPanel } from '../components/onboarding/BrandHeroPanel'
import { ChapteraMark } from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { useResumeSavedSession } from '../components/routing/SessionResume'
import { CHAPTERA_PRODUCT_NAME, CHAPTERA_TAGLINE } from '../lib/brandCopy'
import { isLikelyEmail } from '../lib/formUtils'
import { ensurePushEnabled } from '../lib/notifications/localPush'
import {
  readRememberedEmail,
  writeRememberedEmail,
} from '../lib/rememberedAuth'
import { restoreSessionAfterAuth } from '../lib/restoreSession'
import { defaultHomePath } from '../lib/onboardingStorage'
import {
  isInvalidLoginCredentials,
  validatePassword,
} from '../lib/supabaseAuth'

type Mode = 'password' | 'otp' | 'forgot' | 'setPassword'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    sendEmailOtp,
    verifyEmailOtp,
    signInWithPassword,
    updatePassword,
    sendPasswordResetEmail,
    emailVerified,
    authEmail,
    requiresSupabaseAuth,
    isOnboarded,
    reloadOnboardingFromStorage,
  } = useAuth()

  const resume = useResumeSavedSession()
  const resetFromEmail = searchParams.get('reset') === '1'

  const [mode, setMode] = useState<Mode>(resetFromEmail ? 'setPassword' : 'password')
  const [email, setEmail] = useState(() => authEmail ?? readRememberedEmail())
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [enablePush, setEnablePush] = useState(true)
  const [noPasswordHint, setNoPasswordHint] = useState(false)

  useEffect(() => {
    if (authEmail && !email) setEmail(authEmail)
  }, [authEmail, email])

  useEffect(() => {
    if (resetFromEmail) setMode('setPassword')
  }, [resetFromEmail])

  useEffect(() => {
    if (!resume.ready) return
    if (mode === 'setPassword') return
    if (resume.home) navigate(resume.home, { replace: true })
  }, [resume.ready, resume.home, navigate, mode])

  if (!resume.ready || resume.status === 'working') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-[var(--ink)]">Checking saved sign-in…</p>
        <p className="max-w-sm text-xs text-[var(--muted)]">
          If you use Chaptera from your home screen, you usually stay signed in.
        </p>
      </div>
    )
  }

  if (mode !== 'setPassword' && (resume.home || (emailVerified && isOnboarded))) {
    return (
      <RedirectHome
        message="Welcome back — opening your chapter."
        onContinue={() => navigate(resume.home ?? defaultHomePath(), { replace: true })}
      />
    )
  }

  const afterAuth = async () => {
    writeRememberedEmail(email)
    if (enablePush) {
      try {
        await ensurePushEnabled()
      } catch {
        /* optional */
      }
    }
    setStatus('Loading your chapter profile…')
    const restored = await restoreSessionAfterAuth()
    reloadOnboardingFromStorage()
    if (!restored.ok) {
      setError(restored.error)
      return
    }
    if (restored.hasChapter) {
      window.location.assign(restored.homePath)
      return
    }
    window.location.assign('/onboarding?intent=join')
  }

  const submitPasswordLogin = async () => {
    setError(null)
    setStatus(null)
    setNoPasswordHint(false)
    if (!isLikelyEmail(email)) {
      setError('Enter a valid email.')
      return
    }
    if (!requiresSupabaseAuth) {
      setError('Cloud sign-in is not configured in this environment.')
      return
    }
    const pwdError = validatePassword(password.trim())
    if (pwdError) {
      setError(pwdError)
      return
    }
    setBusy(true)
    const res = await signInWithPassword(email, password)
    if (!res.ok) {
      setBusy(false)
      setError(res.error ?? 'Sign-in failed.')
      if (isInvalidLoginCredentials(res.error)) setNoPasswordHint(true)
      return
    }
    await afterAuth()
    setBusy(false)
  }

  const sendCode = async () => {
    setError(null)
    setStatus(null)
    setNoPasswordHint(false)
    if (!isLikelyEmail(email)) {
      setError('Enter a valid email.')
      return
    }
    writeRememberedEmail(email)
    setBusy(true)
    const res = await sendEmailOtp(email)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not send login code.')
      return
    }
    setMode('otp')
    setOtpSent(true)
    setStatus('Code sent — check your inbox.')
  }

  const verifyOtp = async () => {
    setError(null)
    setStatus(null)
    if (otpCode.trim().length < 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setBusy(true)
    const res = await verifyEmailOtp(email, otpCode)
    if (!res.ok) {
      setBusy(false)
      setError(res.error ?? 'Invalid code.')
      return
    }
    await afterAuth()
    setBusy(false)
  }

  const sendReset = async () => {
    setError(null)
    setStatus(null)
    if (!isLikelyEmail(email)) {
      setError('Enter a valid email.')
      return
    }
    setBusy(true)
    const res = await sendPasswordResetEmail(email)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not send reset email.')
      return
    }
    writeRememberedEmail(email)
    setStatus('Check your email for a reset link, then choose a new password here.')
  }

  const saveNewPassword = async () => {
    setError(null)
    setStatus(null)
    if (!emailVerified) {
      setError('Open the reset link from your email first, then set a new password.')
      return
    }
    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      return
    }
    if (password !== password2) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    // Recovery link already verified email — do not require a second OTP here.
    const res = await updatePassword(password, { requireEmailCode: false })
    if (!res.ok) {
      setBusy(false)
      setError(res.error ?? 'Could not update password.')
      return
    }
    setStatus('Password saved.')
    await afterAuth()
    setBusy(false)
  }

  return (
    <div
      className="flex min-h-screen min-h-[100dvh]"
      style={{ background: 'var(--surface-tint)' }}
    >
      <BrandHeroPanel
        org={null}
        headline="Sign in to your profile."
        description="Use your email and password. This phone keeps you signed in until you sign out."
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
          Login
        </p>
        <h1 className="mt-2 max-w-md font-serif text-[2rem] leading-[1.15] tracking-tight text-[var(--ink)] sm:mt-3 sm:text-4xl">
          {mode === 'forgot'
            ? 'Reset password'
            : mode === 'setPassword'
              ? 'Choose a new password'
              : mode === 'otp'
                ? 'Email login code'
                : 'Welcome back'}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          {mode === 'password'
            ? 'Email + password. One chapter per account.'
            : mode === 'otp'
              ? 'We’ll email a one-time code if you don’t use a password yet.'
              : mode === 'forgot'
                ? 'We’ll email a link so you can set a new password.'
                : 'Pick a password you’ll use on this and other phones.'}
        </p>

        <div className="mt-8 max-w-md space-y-3">
          {mode !== 'setPassword' ? (
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                className="input-editorial mt-1 min-h-11"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setOtpSent(false)
                  setError(null)
                }}
              />
            </label>
          ) : null}

          {mode === 'password' ? (
            <>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  Password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input-editorial mt-1 min-h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitPasswordLogin()
                  }}
                />
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={enablePush}
                  onChange={(e) => setEnablePush(e.target.checked)}
                />
                Enable push notifications on this phone
              </label>
              <button
                type="button"
                className="btn-primary min-h-11 w-full disabled:opacity-40"
                disabled={busy || !email.trim() || !password}
                onClick={() => void submitPasswordLogin()}
              >
                Sign in
              </button>
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                Joined with an email code and never set a password? Use email code below — or
                Forgot password to create one.
              </p>
              {noPasswordHint ? (
                <div className="space-y-2 border border-[var(--rule)] bg-[var(--surface-card)] p-3">
                  <p className="text-sm text-[var(--ink)]">
                    Try an email code for this address — most members who hit this never saved a
                    password yet.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary min-h-11 w-full"
                    disabled={busy || !email.trim()}
                    onClick={() => void sendCode()}
                  >
                    Send login code
                  </button>
                  <button
                    type="button"
                    className="btn-ghost min-h-11 w-full"
                    disabled={busy}
                    onClick={() => {
                      setNoPasswordHint(false)
                      setMode('forgot')
                    }}
                  >
                    Forgot password
                  </button>
                </div>
              ) : null}
              <div className="flex flex-col gap-1 pt-1 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
                <button
                  type="button"
                  className="min-h-11 px-1 text-left font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] active:text-[var(--ink)]"
                  onClick={() => {
                    setNoPasswordHint(false)
                    setMode('forgot')
                  }}
                >
                  Forgot password
                </button>
                <button
                  type="button"
                  className="min-h-11 px-1 text-left font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] active:text-[var(--ink)]"
                  onClick={() => {
                    setNoPasswordHint(false)
                    setMode('otp')
                  }}
                >
                  Use email code instead
                </button>
              </div>
            </>
          ) : null}

          {mode === 'otp' ? (
            <>
              <button
                type="button"
                className="btn-primary min-h-11 w-full disabled:opacity-40"
                disabled={busy || !email.trim()}
                onClick={() => void sendCode()}
              >
                {otpSent ? 'Resend login code' : 'Send login code'}
              </button>
              {otpSent ? (
                <>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      6-digit code
                    </span>
                    <input
                      className="input-editorial mt-1 min-h-11 tracking-[0.3em]"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-primary min-h-11 w-full disabled:opacity-40"
                    disabled={busy || otpCode.length < 6}
                    onClick={() => void verifyOtp()}
                  >
                    Verify & open my profile
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="min-h-11 px-1 text-left font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] active:text-[var(--ink)]"
                onClick={() => setMode('password')}
              >
                ← Back to password
              </button>
            </>
          ) : null}

          {mode === 'forgot' ? (
            <>
              <button
                type="button"
                className="btn-primary min-h-11 w-full disabled:opacity-40"
                disabled={busy || !email.trim()}
                onClick={() => void sendReset()}
              >
                Send reset link
              </button>
              <button
                type="button"
                className="min-h-11 px-1 text-left font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] active:text-[var(--ink)]"
                onClick={() => setMode('password')}
              >
                ← Back to password
              </button>
            </>
          ) : null}

          {mode === 'setPassword' ? (
            <>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  New password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input-editorial mt-1 min-h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  Confirm password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input-editorial mt-1 min-h-11"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-primary min-h-11 w-full disabled:opacity-40"
                disabled={busy || !password || !password2}
                onClick={() => void saveNewPassword()}
              >
                Save password & continue
              </button>
            </>
          ) : null}

          {status ? <p className="text-sm text-[var(--ink)]">{status}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="mt-8 flex flex-col sm:mt-10">
          <Link
            to="/"
            className="flex min-h-11 items-center font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] active:text-[var(--ink)]"
          >
            ← Back to start
          </Link>
          <Link
            to="/onboarding?intent=join"
            className="flex min-h-11 items-center font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] active:text-[var(--ink)]"
          >
            Join with a code
          </Link>
          <Link
            to="/onboarding?intent=create"
            className="flex min-h-11 items-center font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] active:text-[var(--ink)]"
          >
            Create a chapter
          </Link>
        </div>
      </main>
    </div>
  )
}

function RedirectHome({
  message,
  onContinue,
}: {
  message: string
  onContinue: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-[var(--ink)]">{message}</p>
      <button type="button" className="btn-primary min-h-11" onClick={onContinue}>
        Continue to chapter
      </button>
      <Link
        to="/my-profile"
        className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]"
      >
        Open my profile
      </Link>
    </div>
  )
}
