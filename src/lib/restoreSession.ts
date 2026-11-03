/**
 * Rebuild the local user session after OTP so people can sign back into
 * their profile/chapter without relying on a shared chapter_kv onboarding blob.
 */
import type { OnboardingData, UserProfile, UserRole } from '../types/permissions'
import { fetchCloudMembership } from './cloudIdentity'
import { hydrateFromCloud } from './chapterCloud'
import { getCachedCloudChapterId, setCachedCloudChapterId } from './cloudChapterId'
import { getSupabase } from './supabase'
import { getAuthEmail, getAuthUserId } from './supabaseAuth'
import { getSupabaseUser } from './supabaseSession'
import { writeJson } from './persist'
import {
  mergePersonAndRosterProfile,
  syncPersonProfileToChapter,
} from './syncPersonProfile'

const ONBOARDING_KEY = 'chapter-os-onboarding'

function readLocalChapterMeta(): { chapterDesignation: string; university: string; orgId: string } {
  let chapterDesignation = ''
  let university = ''
  let orgId = ''
  try {
    const lockRaw = localStorage.getItem('chapter-os-chapter-lock')
    if (lockRaw) {
      const lock = JSON.parse(lockRaw) as {
        chapterDesignation?: string
        university?: string
        orgId?: string
      }
      chapterDesignation = lock.chapterDesignation ?? ''
      university = lock.university ?? ''
      orgId = lock.orgId ?? ''
    }
  } catch {
    /* ignore */
  }
  try {
    if (!orgId) {
      const raw = localStorage.getItem('chapter-os-selected-org')
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown
          orgId = typeof parsed === 'string' ? parsed : raw
        } catch {
          orgId = raw
        }
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const metaRaw = localStorage.getItem('chapter-os-chapter-meta')
    if (metaRaw) {
      const meta = JSON.parse(metaRaw) as {
        chapterDesignation?: string
        university?: string
      }
      if (!chapterDesignation) chapterDesignation = meta.chapterDesignation ?? ''
      if (!university) university = meta.university ?? ''
    }
  } catch {
    /* ignore */
  }
  return { chapterDesignation, university, orgId }
}

function rosterProfile(memberId: string): Partial<UserProfile> | null {
  try {
    const raw = localStorage.getItem('chapter-os-roster-members')
    if (!raw) return null
    const list = JSON.parse(raw) as Array<{
      id: string
      firstName?: string
      lastName?: string
      phone?: string
      email?: string
      graduationYear?: number
      avatar?: string
      photoUrl?: string
    }>
    const m = list.find((row) => row.id === memberId)
    if (!m) return null
    return {
      firstName: m.firstName ?? '',
      lastName: m.lastName ?? '',
      phone: m.phone ?? '',
      email: m.email,
      graduationYear: m.graduationYear ?? new Date().getFullYear() + 1,
      avatar: m.avatar ?? '',
      photoUrl: m.photoUrl,
    }
  } catch {
    return null
  }
}

async function fetchAuthProfile(): Promise<Partial<UserProfile>> {
  const sb = getSupabase()
  const user = getSupabaseUser()
  if (!sb || !user) return {}
  const { data } = await sb
    .from('profiles')
    .select('first_name, last_name, phone, email, avatar')
    .eq('id', user.id)
    .maybeSingle()
  if (!data) return { email: user.email ?? getAuthEmail() ?? undefined }
  return {
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    phone: data.phone ?? '',
    email: data.email ?? user.email ?? getAuthEmail() ?? undefined,
    avatar: data.avatar ?? '',
  }
}

export type RestoreSessionResult =
  | { ok: true; hasChapter: true; homePath: '/home' | '/my-dashboard' }
  | { ok: true; hasChapter: false }
  | { ok: false; error: string }

/**
 * Hydrate chapter data from cloud, then write a user-owned onboarding session
 * from membership + profiles (not shared KV).
 */
export async function restoreSessionAfterAuth(): Promise<RestoreSessionResult> {
  const userId = getAuthUserId()
  if (!userId) return { ok: false, error: 'Not signed in' }

  try {
    await hydrateFromCloud()
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Could not load chapter data',
    }
  }

  const membership = await fetchCloudMembership()
  if (!membership) {
    return { ok: true, hasChapter: false }
  }

  setCachedCloudChapterId(membership.chapterId)
  const authProfile = await fetchAuthProfile()
  const fromRoster = rosterProfile(membership.appMemberId)
  const meta = readLocalChapterMeta()

  // Person fields prefer SQL `profiles`; chapter-only fields come from roster
  const profile: UserProfile = mergePersonAndRosterProfile(
    { ...authProfile, email: authProfile.email || getAuthEmail() || undefined },
    fromRoster
  )

  const role = membership.role as UserRole
  const onboarding: OnboardingData = {
    completed: true,
    profile,
    orgId: meta.orgId || 'unknown',
    chapterDesignation: meta.chapterDesignation,
    university: meta.university,
    role,
    memberId: membership.appMemberId,
    userId,
    isGuest: false,
  }

  writeJson(ONBOARDING_KEY, onboarding)
  // Re-align roster with canonical person fields after restore
  syncPersonProfileToChapter(membership.appMemberId, profile)

  // Keep selected org in sync for ChapterContext cold start
  if (meta.orgId) {
    try {
      localStorage.setItem('chapter-os-selected-org', JSON.stringify(meta.orgId))
    } catch {
      /* ignore */
    }
  }

  void getCachedCloudChapterId()

  const homePath =
    role === 'ActiveMember' || role === 'NewMember' ? '/my-dashboard' : '/home'

  return { ok: true, hasChapter: true, homePath }
}
