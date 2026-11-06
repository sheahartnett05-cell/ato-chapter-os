import type { UserProfile } from '../types/permissions'
import type { UserRole } from '../types/permissions'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { getSupabaseUser } from './supabaseSession'

export function requiresSupabaseAuth(): boolean {
  if (import.meta.env.VITE_SMOKE_TEST === '1') return false
  return isSupabaseConfigured()
}

const MIN_PASSWORD_LEN = 8

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LEN) {
    return `Password must be at least ${MIN_PASSWORD_LEN} characters.`
  }
  return null
}

/** Map GoTrue / Supabase auth messages into something members can act on. */
export function humanizeAuthError(
  message: string | null | undefined,
  context: 'password' | 'otp' | 'signup' | 'reset' | 'update' = 'password'
): string {
  const raw = (message ?? '').trim()
  if (!raw) return 'Something went wrong. Try again.'
  const lower = raw.toLowerCase()

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Wrong email or password. If you joined with an email code and never set a password, use Email code — or Forgot password to create one.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email from the link we sent, or sign in with an email code.'
  }
  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('already registered')
  ) {
    return 'That email already has an account. Sign in on Login, or use Email code.'
  }
  if (
    (lower.includes('token') || lower.includes('otp') || lower.includes('code')) &&
    (lower.includes('expired') || lower.includes('invalid') || lower.includes('not found'))
  ) {
    return 'That code is invalid or expired. Request a new one.'
  }
  if (lower.includes('security purposes') || lower.includes('only request this after')) {
    return 'Wait a moment, then request another email code.'
  }
  if (
    lower.includes('reauthenticat') ||
    lower.includes('nonce') ||
    lower.includes('reauthentication')
  ) {
    return context === 'update'
      ? 'Enter the 6-digit code we emailed you, then save again.'
      : 'Confirm with the 6-digit code from your email, then try again.'
  }
  if (lower.includes('same password')) {
    return 'Choose a password different from your current one.'
  }
  return raw
}

export function isInvalidLoginCredentials(message: string | null | undefined): boolean {
  const lower = (message ?? '').toLowerCase()
  return (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('wrong email or password')
  )
}

export async function sendEmailOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { ok: false, error: 'Email required' }

  const { error } = await sb.auth.signInWithOtp({
    email: trimmed,
    options: { shouldCreateUser: true },
  })
  if (error) return { ok: false, error: humanizeAuthError(error.message, 'otp') }
  return { ok: true }
}

export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  const trimmed = email.trim().toLowerCase()
  const code = token.trim().replace(/\s/g, '')
  if (!trimmed || !code) return { ok: false, error: 'Email and code required' }

  const types = ['email', 'signup', 'magiclink', 'recovery'] as const
  let lastError: string | undefined
  for (const type of types) {
    const attempt = await sb.auth.verifyOtp({
      email: trimmed,
      token: code,
      type,
    })
    if (!attempt.error) return { ok: true }
    lastError = attempt.error.message
  }

  return { ok: false, error: humanizeAuthError(lastError, 'otp') }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { ok: false, error: 'Email required' }
  // Strip accidental paste whitespace; intentional edge spaces are extremely rare here.
  const pwd = password.trim()
  const pwdError = validatePassword(pwd)
  if (pwdError) return { ok: false, error: pwdError }

  const { error } = await sb.auth.signInWithPassword({ email: trimmed, password: pwd })
  if (error) return { ok: false, error: humanizeAuthError(error.message, 'password') }
  return { ok: true }
}

/** Create account with email + password (onboarding / first device). */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string; needsEmailConfirm?: boolean }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { ok: false, error: 'Email required' }
  const pwd = password.trim()
  const pwdError = validatePassword(pwd)
  if (pwdError) return { ok: false, error: pwdError }

  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
  const { data, error } = await sb.auth.signUp({
    email: trimmed,
    password: pwd,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) return { ok: false, error: humanizeAuthError(error.message, 'signup') }
  // No session means project requires email confirm before sign-in
  if (!data.session) return { ok: true, needsEmailConfirm: true }
  return { ok: true }
}

/**
 * Email a one-time code so the signed-in user can change their password.
 * Pair with updatePassword(..., { emailCode }).
 */
export async function sendPasswordChangeEmailCode(): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  if (!getSupabaseUser()) return { ok: false, error: 'Sign in first' }
  const { error } = await sb.auth.reauthenticate()
  if (error) return { ok: false, error: humanizeAuthError(error.message, 'update') }
  return { ok: true }
}

/**
 * Set or change password while signed in.
 * Password changes from Profile require the email code from sendPasswordChangeEmailCode.
 * Recovery / first-set after magic link may omit the code when Secure password change allows it.
 */
export async function updatePassword(
  password: string,
  options?: { emailCode?: string; requireEmailCode?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  const pwd = password.trim()
  const pwdError = validatePassword(pwd)
  if (pwdError) return { ok: false, error: pwdError }

  const code = options?.emailCode?.trim() ?? ''
  if (options?.requireEmailCode !== false) {
    if (!/^\d{6}$/.test(code)) {
      return { ok: false, error: 'Enter the 6-digit code from your email.' }
    }
  }

  const payload: { password: string; nonce?: string } = { password: pwd }
  if (code) payload.nonce = code

  const { error } = await sb.auth.updateUser(payload)
  if (error) return { ok: false, error: humanizeAuthError(error.message, 'update') }
  return { ok: true }
}

export async function sendPasswordResetEmail(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { ok: false, error: 'Email required' }
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/login?reset=1` : undefined
  const { error } = await sb.auth.resetPasswordForEmail(trimmed, { redirectTo })
  if (error) return { ok: false, error: humanizeAuthError(error.message, 'reset') }
  return { ok: true }
}

export async function signOutSupabase(): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  await sb.auth.signOut()
}

export async function upsertSupabaseProfile(
  profile: Partial<UserProfile> & { email?: string }
): Promise<void> {
  // Never push guest/demo names onto a real signed-in Supabase profile.
  try {
    if (localStorage.getItem('chapter-os-guest-preview') === '1') return
    const onboardingRaw = localStorage.getItem('chapter-os-onboarding')
    if (onboardingRaw) {
      const parsed = JSON.parse(onboardingRaw) as { isGuest?: boolean }
      if (parsed.isGuest) return
    }
  } catch {
    /* storage unavailable */
  }

  const user = getSupabaseUser()
  const sb = getSupabase()
  if (!user || !sb) return

  // Only write non-empty person fields so a blank restore never wipes SQL names.
  const row: {
    id: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    avatar?: string | null
  } = { id: user.id }

  const email = profile.email?.trim() || user.email || null
  if (email) row.email = email
  if (profile.firstName?.trim()) row.first_name = profile.firstName.trim()
  if (profile.lastName?.trim()) row.last_name = profile.lastName.trim()
  if (profile.phone?.trim()) row.phone = profile.phone.trim()
  // Avatar column stores initials only — never a photo data URL
  const initials = profile.avatar?.trim()
  if (initials && initials.length <= 4) row.avatar = initials

  const { error } = await sb.from('profiles').upsert(row)
  if (error) console.warn('[agora auth] profile upsert failed', error.message)
}

export async function fetchUserChapterId(): Promise<string | null> {
  const user = getSupabaseUser()
  const sb = getSupabase()
  if (!user || !sb) return null

  const { data, error } = await sb
    .from('chapter_memberships')
    .select('chapter_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[agora auth] membership lookup failed', error.message)
    return null
  }
  return data?.chapter_id ?? null
}

/**
 * @deprecated Phase A — membership writes only via create_chapter / join_chapter RPCs.
 * Kept as a hard failure so call sites cannot silently reintroduce self-upsert.
 */
export async function linkChapterMembership(_input: {
  chapterId: string
  appMemberId: string
  role: UserRole
  isFounder?: boolean
}): Promise<{ ok: boolean; error?: string }> {
  return {
    ok: false,
    error: 'Direct membership upsert disabled; use create_chapter or join_chapter',
  }
}

export function getAuthUserId(): string | null {
  return getSupabaseUser()?.id ?? null
}

export function getAuthEmail(): string | null {
  return getSupabaseUser()?.email ?? null
}

export function isEmailVerified(): boolean {
  const user = getSupabaseUser()
  if (!user?.email) return false
  // Password/OTP session means the address is usable even if confirm flag lags.
  if (user.email_confirmed_at) return true
  return Boolean(user.aud === 'authenticated' && user.id)
}
