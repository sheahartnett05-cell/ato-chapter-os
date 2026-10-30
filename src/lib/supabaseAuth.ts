import type { UserProfile } from '../types/permissions'
import type { UserRole } from '../types/permissions'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { getSupabaseUser } from './supabaseSession'

export function requiresSupabaseAuth(): boolean {
  if (import.meta.env.VITE_SMOKE_TEST === '1') return false
  return isSupabaseConfigured()
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
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: 'Supabase not configured' }
  const trimmed = email.trim().toLowerCase()
  const code = token.trim()
  if (!trimmed || !code) return { ok: false, error: 'Email and code required' }

  const emailAttempt = await sb.auth.verifyOtp({
    email: trimmed,
    token: code,
    type: 'email',
  })
  if (!emailAttempt.error) return { ok: true }

  const signupAttempt = await sb.auth.verifyOtp({
    email: trimmed,
    token: code,
    type: 'signup',
  })
  if (!signupAttempt.error) return { ok: true }

  return { ok: false, error: signupAttempt.error.message || emailAttempt.error.message }
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

  await sb.from('profiles').upsert({
    id: user.id,
    email: profile.email ?? user.email ?? null,
    first_name: profile.firstName ?? null,
    last_name: profile.lastName ?? null,
    phone: profile.phone ?? null,
    avatar: profile.avatar ?? profile.photoUrl ?? null,
  })
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
  return Boolean(getSupabaseUser()?.email)
}
