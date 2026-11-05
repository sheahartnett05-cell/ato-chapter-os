/**
 * Keep the three person copies aligned:
 * - Supabase `profiles` (login identity)
 * - local onboarding profile
 * - chapter roster row (`app_member_id` / memberId) in chapter_kv
 */
import type { UserProfile } from '../types/permissions'
import { writeJson } from './persist'
import { upsertSupabaseProfile } from './supabaseAuth'

const ROSTER_KEY = 'chapter-os-roster-members'
const ACCOUNTS_KEY = 'chapter-os-member-accounts'

type RosterRow = {
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
  [key: string]: unknown
}

type AccountRow = {
  memberId: string
  userId?: string
  profile?: Partial<UserProfile>
  [key: string]: unknown
}

function pick(next: string | undefined, prev: string | undefined): string | undefined {
  const n = next?.trim()
  if (n) return next
  return prev
}

function patchRosterRow(memberId: string, profile: UserProfile) {
  try {
    const raw = localStorage.getItem(ROSTER_KEY)
    if (!raw) return
    const list = JSON.parse(raw) as RosterRow[]
    let changed = false
    const next = list.map((row) => {
      if (row.id !== memberId) return row
      changed = true
      return {
        ...row,
        firstName: pick(profile.firstName, row.firstName) ?? row.firstName,
        lastName: pick(profile.lastName, row.lastName) ?? row.lastName,
        phone: pick(profile.phone, row.phone) ?? row.phone,
        email: pick(profile.email, row.email) ?? row.email,
        graduationYear: profile.graduationYear ?? row.graduationYear,
        avatar: pick(profile.avatar, row.avatar) ?? row.avatar,
        photoUrl: profile.photoUrl || row.photoUrl,
        major: pick(profile.major, row.major) ?? row.major,
        birthday: pick(profile.birthday, row.birthday) ?? row.birthday,
        shirtSize: pick(profile.shirtSize, row.shirtSize) ?? row.shirtSize,
        emergencyContact:
          pick(profile.emergencyContact, row.emergencyContact) ?? row.emergencyContact,
        emergencyPhone: pick(profile.emergencyPhone, row.emergencyPhone) ?? row.emergencyPhone,
      }
    })
    if (changed) writeJson(ROSTER_KEY, next)
  } catch {
    /* ignore */
  }
}

function patchAccountProfile(memberId: string, profile: UserProfile) {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return
    const list = JSON.parse(raw) as AccountRow[]
    let changed = false
    const next = list.map((row) => {
      if (row.memberId !== memberId) return row
      changed = true
      return {
        ...row,
        profile: {
          ...row.profile,
          ...profile,
          firstName: profile.firstName || row.profile?.firstName || '',
          lastName: profile.lastName || row.profile?.lastName || '',
          phone: profile.phone || row.profile?.phone || '',
          email: profile.email || row.profile?.email,
          photoUrl: profile.photoUrl || row.profile?.photoUrl,
        },
      }
    })
    if (changed) writeJson(ACCOUNTS_KEY, next)
  } catch {
    /* ignore */
  }
}

/** Push person fields to SQL profiles + chapter roster/accounts KV. */
export async function syncPersonProfileToChapter(
  memberId: string | null | undefined,
  profile: UserProfile
): Promise<void> {
  await upsertSupabaseProfile(profile)
  if (!memberId) return
  patchRosterRow(memberId, profile)
  patchAccountProfile(memberId, profile)
}

/**
 * Merge person identity (prefer SQL profiles) with chapter-only fields from roster.
 * Empty strings never clobber a real roster/SQL value.
 */
export function mergePersonAndRosterProfile(
  authProfile: Partial<UserProfile>,
  roster: Partial<UserProfile> | null
): UserProfile {
  const firstName = authProfile.firstName?.trim() || roster?.firstName?.trim() || ''
  const lastName = authProfile.lastName?.trim() || roster?.lastName?.trim() || ''
  return {
    firstName,
    lastName,
    phone: authProfile.phone?.trim() || roster?.phone?.trim() || '',
    email: authProfile.email?.trim() || roster?.email?.trim() || undefined,
    avatar:
      authProfile.avatar?.trim() ||
      roster?.avatar?.trim() ||
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
      '',
    photoUrl: roster?.photoUrl || authProfile.photoUrl,
    graduationYear:
      roster?.graduationYear ??
      authProfile.graduationYear ??
      new Date().getFullYear() + 1,
    major: roster?.major || authProfile.major,
    birthday: roster?.birthday || authProfile.birthday,
    shirtSize: roster?.shirtSize || authProfile.shirtSize,
    emergencyContact: roster?.emergencyContact || authProfile.emergencyContact,
    emergencyPhone: roster?.emergencyPhone || authProfile.emergencyPhone,
  }
}
