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
        firstName: profile.firstName || row.firstName,
        lastName: profile.lastName || row.lastName,
        phone: profile.phone || row.phone,
        email: profile.email ?? row.email,
        graduationYear: profile.graduationYear ?? row.graduationYear,
        avatar: profile.avatar || row.avatar,
        photoUrl: profile.photoUrl ?? row.photoUrl,
        major: profile.major ?? row.major,
        birthday: profile.birthday ?? row.birthday,
        shirtSize: profile.shirtSize ?? row.shirtSize,
        emergencyContact: profile.emergencyContact ?? row.emergencyContact,
        emergencyPhone: profile.emergencyPhone ?? row.emergencyPhone,
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
      return { ...row, profile: { ...row.profile, ...profile } }
    })
    if (changed) writeJson(ACCOUNTS_KEY, next)
  } catch {
    /* ignore */
  }
}

/** Push person fields to SQL profiles + chapter roster/accounts KV. */
export function syncPersonProfileToChapter(memberId: string | null | undefined, profile: UserProfile) {
  void upsertSupabaseProfile(profile)
  if (!memberId) return
  patchRosterRow(memberId, profile)
  patchAccountProfile(memberId, profile)
}

/**
 * Merge person identity (prefer SQL profiles) with chapter-only fields from roster.
 */
export function mergePersonAndRosterProfile(
  authProfile: Partial<UserProfile>,
  roster: Partial<UserProfile> | null
): UserProfile {
  return {
    firstName: authProfile.firstName || roster?.firstName || '',
    lastName: authProfile.lastName || roster?.lastName || '',
    phone: authProfile.phone || roster?.phone || '',
    email: authProfile.email || roster?.email,
    avatar: authProfile.avatar || roster?.avatar || '',
    photoUrl: roster?.photoUrl || authProfile.photoUrl,
    graduationYear: roster?.graduationYear ?? new Date().getFullYear() + 1,
    major: roster?.major,
    birthday: roster?.birthday,
    shirtSize: roster?.shirtSize,
    emergencyContact: roster?.emergencyContact,
    emergencyPhone: roster?.emergencyPhone,
  }
}
