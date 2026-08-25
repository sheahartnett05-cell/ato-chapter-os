import type { UserProfile } from '../types/permissions'
import type { UserRole } from '../types/permissions'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { getSupabaseUser } from './supabaseSession'

export function requiresSupabaseAuth(): boolean {
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

  const { error } = await sb.auth.verifyOtp({
    email: trimmed,
    token: code,
    type: 'email',
  })
  if (error) return { ok: false, error: error.message }
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

export async function linkChapterMembership(input: {
  chapterId: string
  appMemberId: string
  role: UserRole
  isFounder?: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const user = getSupabaseUser()
  const sb = getSupabase()
  if (!user || !sb) return { ok: false, error: 'Not signed in' }

  const { error } = await sb.from('chapter_memberships').upsert(
    {
      chapter_id: input.chapterId,
      user_id: user.id,
      app_member_id: input.appMemberId,
      role: input.role,
      is_founder: input.isFounder ?? false,
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'chapter_id,user_id' }
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
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
