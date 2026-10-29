/**
 * Server-owned chapter identity RPCs (Phase A).
 * Guest / local-only mode must not call these.
 */
import type { UserRole } from '../types/permissions'
import { setCachedCloudChapterId } from './cloudChapterId'
import { getSupabase } from './supabase'
import { getSupabaseUser } from './supabaseSession'

export type ServerCapability =
  | 'roster'
  | 'dues'
  | 'standards'
  | 'recruitment'
  | 'calendar'
  | 'announcements'
  | 'setup'
  | 'attendance'
  | 'budget'
  | 'house'

export interface CloudMembership {
  chapterId: string
  appMemberId: string
  role: UserRole
  isFounder: boolean
}

export interface CloudOfficerSeat {
  seatId: string
  title: string
  function: string
  memberUserId: string | null
  capabilities: ServerCapability[]
}

function isGuestSession(): boolean {
  try {
    if (localStorage.getItem('chapter-os-guest-preview') === '1') return true
    const raw = localStorage.getItem('chapter-os-onboarding')
    if (!raw) return false
    return Boolean((JSON.parse(raw) as { isGuest?: boolean }).isGuest)
  } catch {
    return false
  }
}

export function cloudIdentityEnabled(): boolean {
  return Boolean(getSupabase() && getSupabaseUser()) && !isGuestSession()
}

export async function rpcCreateChapter(input: {
  orgId: string
  designation: string
  university: string
  orgName?: string
  nickname?: string
  letters?: string
  semester?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  appMemberId?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}): Promise<{ ok: true; chapterId: string } | { ok: false; error: string }> {
  const sb = getSupabase()
  if (!sb || !cloudIdentityEnabled()) return { ok: false, error: 'Cloud identity unavailable' }

  const { data, error } = await sb.rpc('create_chapter', {
    p_org_id: input.orgId,
    p_designation: input.designation,
    p_university: input.university,
    p_org_name: input.orgName ?? null,
    p_nickname: input.nickname ?? null,
    p_letters: input.letters ?? null,
    p_semester: input.semester ?? '',
    p_primary_color: input.primaryColor ?? null,
    p_secondary_color: input.secondaryColor ?? null,
    p_accent_color: input.accentColor ?? null,
    p_app_member_id: input.appMemberId ?? null,
    p_first_name: input.firstName ?? null,
    p_last_name: input.lastName ?? null,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
  })

  if (error) return { ok: false, error: error.message }
  const chapterId = typeof data === 'string' ? data : null
  if (!chapterId) return { ok: false, error: 'create_chapter returned no id' }
  setCachedCloudChapterId(chapterId)
  return { ok: true, chapterId }
}

export async function rpcJoinChapter(input: {
  code: string
  appMemberId?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}): Promise<{ ok: true; chapterId: string } | { ok: false; error: string }> {
  const sb = getSupabase()
  if (!sb || !cloudIdentityEnabled()) return { ok: false, error: 'Cloud identity unavailable' }

  const { data, error } = await sb.rpc('join_chapter', {
    p_code: input.code.trim().toUpperCase(),
    p_app_member_id: input.appMemberId ?? null,
    p_first_name: input.firstName ?? null,
    p_last_name: input.lastName ?? null,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
  })

  if (error) return { ok: false, error: error.message }
  const chapterId = typeof data === 'string' ? data : null
  if (!chapterId) return { ok: false, error: 'join_chapter returned no id' }
  setCachedCloudChapterId(chapterId)
  return { ok: true, chapterId }
}

export async function rpcSetMemberRole(
  chapterId: string,
  userId: string,
  role: UserRole
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb || !cloudIdentityEnabled()) return { ok: false, error: 'Cloud identity unavailable' }
  const { error } = await sb.rpc('set_member_role', {
    p_chapter_id: chapterId,
    p_user_id: userId,
    p_role: role,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function rpcAssignOfficerSeat(input: {
  chapterId: string
  seatId: string
  memberUserId: string | null
  title?: string
  function?: string
  capabilities?: ServerCapability[]
}): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb || !cloudIdentityEnabled()) return { ok: false, error: 'Cloud identity unavailable' }
  const { error } = await sb.rpc('assign_officer_seat', {
    p_chapter_id: input.chapterId,
    p_seat_id: input.seatId,
    p_member_user_id: input.memberUserId,
    p_title: input.title ?? null,
    p_function: input.function ?? null,
    p_capabilities: input.capabilities ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function rpcRemoveOfficerSeat(
  chapterId: string,
  seatId: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb || !cloudIdentityEnabled()) return { ok: false, error: 'Cloud identity unavailable' }
  const { error } = await sb.rpc('remove_officer_seat', {
    p_chapter_id: chapterId,
    p_seat_id: seatId,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function rpcLeaveChapter(chapterId: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase()
  if (!sb || !cloudIdentityEnabled()) return { ok: false, error: 'Cloud identity unavailable' }
  const { error } = await sb.rpc('leave_chapter', { p_chapter_id: chapterId })
  if (error) return { ok: false, error: error.message }
  setCachedCloudChapterId(null)
  return { ok: true }
}

export async function fetchCloudMembership(): Promise<CloudMembership | null> {
  const sb = getSupabase()
  const user = getSupabaseUser()
  if (!sb || !user || isGuestSession()) return null

  const { data, error } = await sb
    .from('chapter_memberships')
    .select('chapter_id, app_member_id, role, is_founder')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return {
    chapterId: data.chapter_id,
    appMemberId: data.app_member_id,
    role: data.role as UserRole,
    isFounder: Boolean(data.is_founder),
  }
}

export async function fetchCloudOfficerSeats(chapterId: string): Promise<CloudOfficerSeat[]> {
  const sb = getSupabase()
  if (!sb || isGuestSession()) return []

  const { data, error } = await sb
    .from('chapter_officer_seats')
    .select('seat_id, title, function, member_user_id, capabilities')
    .eq('chapter_id', chapterId)

  if (error || !data) return []
  return data.map((row) => ({
    seatId: row.seat_id,
    title: row.title,
    function: row.function,
    memberUserId: row.member_user_id,
    capabilities: (row.capabilities ?? []) as ServerCapability[],
  }))
}

export async function fetchMyCapabilities(chapterId: string): Promise<ServerCapability[]> {
  const sb = getSupabase()
  const user = getSupabaseUser()
  if (!sb || !user || isGuestSession()) return []

  const caps: ServerCapability[] = [
    'roster',
    'dues',
    'standards',
    'recruitment',
    'calendar',
    'announcements',
    'setup',
    'attendance',
    'budget',
    'house',
  ]
  const granted: ServerCapability[] = []
  for (const cap of caps) {
    const { data, error } = await sb.rpc('has_capability', {
      p_chapter_id: chapterId,
      p_cap: cap,
    })
    if (!error && data === true) granted.push(cap)
  }
  return granted
}

/** Map server capabilities → local PermissionFlags fields. */
export function permissionsFromCapabilities(
  baseRole: UserRole,
  caps: ServerCapability[],
  getPermissions: (role: UserRole) => import('../types/permissions').PermissionFlags
): import('../types/permissions').PermissionFlags {
  const base = getPermissions(baseRole)
  const has = (c: ServerCapability) => caps.includes(c)
  return {
    ...base,
    canManageRoster: base.canManageRoster || has('roster'),
    canManageInvites: base.canManageInvites || has('roster') || has('setup'),
    canAccessTreasurerSettings: base.canAccessTreasurerSettings || has('dues') || has('budget'),
    canManageBudgets: base.canManageBudgets || has('budget'),
    canManageFines: base.canManageFines || has('standards') || has('dues'),
    canViewJBoardCases: base.canViewJBoardCases || has('standards'),
    canAccessJBoardSettings: base.canAccessJBoardSettings || has('standards'),
    canManageRecruitment: base.canManageRecruitment || has('recruitment'),
    canPostAnnouncements: base.canPostAnnouncements || has('announcements'),
    canEditEventPoints: base.canEditEventPoints || has('calendar') || has('attendance'),
    canManageStudyLocations: base.canManageStudyLocations || has('attendance'),
    canVerifyStudyHours: base.canVerifyStudyHours || has('attendance'),
    canAccessAdminSettings: base.canAccessAdminSettings || has('setup'),
    canAccessExecTools:
      base.canAccessExecTools ||
      has('setup') ||
      has('roster') ||
      has('dues') ||
      has('standards') ||
      has('recruitment') ||
      has('calendar') ||
      has('announcements') ||
      has('attendance') ||
      has('budget') ||
      has('house'),
    isMemberView: base.isMemberView && caps.length === 0 && baseRole !== 'President',
  }
}
