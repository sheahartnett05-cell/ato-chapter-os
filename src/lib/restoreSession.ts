/**
 * Rebuild the local user session after OTP so people can sign back into
 * their profile/chapter without relying on a shared chapter_kv onboarding blob.
 */
import type { OnboardingData, UserProfile, UserRole } from '../types/permissions'
import type { Member } from '../types'
import { fetchCloudMembership } from './cloudIdentity'
import { hydrateFromCloud } from './chapterCloud'
import { getCachedCloudChapterId, setCachedCloudChapterId } from './cloudChapterId'
import { getSupabase } from './supabase'
import { getAuthEmail, getAuthUserId } from './supabaseAuth'
import { getSupabaseUser } from './supabaseSession'
import { readJson, writeJson } from './persist'
import {
  mergePersonAndRosterProfile,
  syncPersonProfileToChapter,
} from './syncPersonProfile'
import { currentTermLabel } from './demoRelativeDates'

const ONBOARDING_KEY = 'chapter-os-onboarding'
const MEMBERS_KEY = 'chapter-os-roster-members'
const ACCOUNTS_KEY = 'chapter-os-member-accounts'

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
    const raw = localStorage.getItem(MEMBERS_KEY)
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
      major?: string
      birthday?: string
      shirtSize?: string
      emergencyContact?: string
      emergencyPhone?: string
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
      major: m.major,
      birthday: m.birthday,
      shirtSize: m.shirtSize,
      emergencyContact: m.emergencyContact,
      emergencyPhone: m.emergencyPhone,
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
    // SQL `avatar` is initials only — never treat a long value as a photo URL
    avatar: data.avatar && data.avatar.length <= 4 ? data.avatar : data.avatar?.slice(0, 3) || '',
  }
}

/** Server roster row written by create_chapter / join_chapter — survives empty chapter_kv. */
async function fetchSqlChapterMemberProfile(
  chapterId: string
): Promise<Partial<UserProfile> | null> {
  const sb = getSupabase()
  const user = getSupabaseUser()
  if (!sb || !user) return null
  const { data, error } = await sb
    .from('chapter_members')
    .select('first_name, last_name, email, phone')
    .eq('chapter_id', chapterId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !data) return null
  const firstName = data.first_name?.trim() || ''
  const lastName = data.last_name?.trim() || ''
  // Ignore RPC placeholders when the person never set a real name
  if (
    (firstName === 'Member' && lastName === 'New') ||
    (firstName === 'Founder' && lastName === 'President')
  ) {
    if (!data.email && !data.phone) return null
  }
  return {
    firstName,
    lastName,
    email: data.email ?? undefined,
    phone: data.phone ?? '',
    avatar:
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '',
  }
}

function ensureLocalRosterRow(
  memberId: string,
  profile: UserProfile,
  role: UserRole,
  userId: string
) {
  const roster = readJson<Member[]>(MEMBERS_KEY, [])
  const existing = roster.find((m) => m.id === memberId)
  if (existing) {
    const patched = roster.map((m) =>
      m.id !== memberId
        ? m
        : {
            ...m,
            firstName: profile.firstName || m.firstName,
            lastName: profile.lastName || m.lastName,
            phone: profile.phone || m.phone,
            email: profile.email || m.email,
            graduationYear: profile.graduationYear || m.graduationYear,
            avatar: profile.avatar || m.avatar,
            photoUrl: profile.photoUrl || m.photoUrl,
            major: profile.major || m.major,
            birthday: profile.birthday || m.birthday,
            shirtSize: profile.shirtSize || m.shirtSize,
            emergencyContact: profile.emergencyContact || m.emergencyContact,
            emergencyPhone: profile.emergencyPhone || m.emergencyPhone,
          }
    )
    writeJson(MEMBERS_KEY, patched)
  } else if (profile.firstName.trim() || profile.lastName.trim() || profile.email) {
    const stub: Member = {
      id: memberId,
      firstName: profile.firstName || 'Member',
      lastName: profile.lastName || '',
      email: profile.email || `${memberId}@chapter.local`,
      phone: profile.phone || '',
      major: profile.major || 'Undeclared',
      graduationYear: profile.graduationYear || new Date().getFullYear() + 1,
      pledgeClass: currentTermLabel(),
      status: role === 'NewMember' ? 'New Member' : 'Active',
      isExec: !['ActiveMember', 'NewMember'].includes(role),
      role,
      birthday: profile.birthday || '2000-01-01',
      shirtSize: profile.shirtSize || 'M',
      emergencyContact: profile.emergencyContact || '',
      emergencyPhone: profile.emergencyPhone || '',
      duesStatus: 'Outstanding',
      duesPaid: 0,
      duesExpected: 850,
      attendancePct: null,
      points: 0,
      avatar:
        profile.avatar ||
        `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() ||
        '?',
      photoUrl: profile.photoUrl,
    }
    writeJson(MEMBERS_KEY, [...roster, stub])
  }

  const accounts = readJson<
    Array<{
      id: string
      userId: string
      memberId: string
      profile: UserProfile
      role: UserRole
      email?: string
      inviteCodeId: string
      joinedAt: string
    }>
  >(ACCOUNTS_KEY, [])
  if (!accounts.some((a) => a.memberId === memberId)) {
    writeJson(ACCOUNTS_KEY, [
      ...accounts,
      {
        id: `acct-restore-${memberId}`,
        userId,
        memberId,
        profile,
        role,
        email: profile.email,
        inviteCodeId: 'restored',
        joinedAt: new Date().toISOString(),
      },
    ])
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
    await hydrateFromCloud({ notify: false })
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
  const fromSql = fromRoster
    ? null
    : await fetchSqlChapterMemberProfile(membership.chapterId)
  const meta = readLocalChapterMeta()

  // Person fields prefer SQL profiles; chapter-only fields come from roster;
  // chapter_members fills the gap when chapter_kv hasn't synced yet.
  const profile: UserProfile = mergePersonAndRosterProfile(
    { ...authProfile, email: authProfile.email || getAuthEmail() || undefined },
    fromRoster ?? fromSql
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
  ensureLocalRosterRow(membership.appMemberId, profile, role, userId)
  // Re-align roster + SQL profiles with canonical person fields after restore
  await syncPersonProfileToChapter(membership.appMemberId, profile)

  // Keep selected org in sync for ChapterContext cold start
  if (meta.orgId) {
    try {
      localStorage.setItem('chapter-os-selected-org', JSON.stringify(meta.orgId))
    } catch {
      /* ignore */
    }
  }

  void getCachedCloudChapterId()

  const { notifyCloudHydrated } = await import('./cloudHydration')
  notifyCloudHydrated()

  const homePath =
    role === 'ActiveMember' || role === 'NewMember' ? '/my-dashboard' : '/home'

  return { ok: true, hasChapter: true, homePath }
}
