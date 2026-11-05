/**
 * Merge server chapter_memberships + chapter_members into the local KV roster.
 * SQL is the join source of truth; chapter_kv can lag or get last-write-wins wiped.
 */
import type { Member } from '../types'
import type { UserRole } from '../types/permissions'
import { currentTermLabel } from './demoRelativeDates'
import { getSupabase } from './supabase'
import { readJson, writeJson } from './persist'
import { mergeRosterLists } from './rosterMerge'

const MEMBERS_KEY = 'chapter-os-roster-members'
const ACCOUNTS_KEY = 'chapter-os-member-accounts'

type SqlMembership = {
  user_id: string
  app_member_id: string
  role: string
  is_founder: boolean | null
}

type SqlPerson = {
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string
  status: string
}

function stubFromSql(membership: SqlMembership, person: SqlPerson | undefined): Member {
  const firstName = person?.first_name?.trim() || 'Member'
  const lastName = person?.last_name?.trim() || ''
  const role = (membership.role || person?.role || 'ActiveMember') as UserRole
  const status =
    person?.status === 'New Member' || role === 'NewMember'
      ? 'New Member'
      : person?.status === 'Alumni'
        ? 'Alumni'
        : 'Active'
  return {
    id: membership.app_member_id,
    firstName,
    lastName,
    email: person?.email?.trim() || `${membership.app_member_id}@chapter.local`,
    phone: person?.phone?.trim() || '',
    major: 'Undeclared',
    graduationYear: new Date().getFullYear() + 1,
    pledgeClass: currentTermLabel(),
    status,
    isExec: !['ActiveMember', 'NewMember'].includes(role),
    role,
    birthday: '2000-01-01',
    shirtSize: 'M',
    emergencyContact: '',
    emergencyPhone: '',
    duesStatus: 'Outstanding',
    duesPaid: 0,
    duesExpected: 850,
    attendancePct: null,
    points: 0,
    avatar: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?',
  }
}

/** Pull SQL members for this chapter and union into local roster (+ accounts stubs). */
export async function syncRosterFromSqlChapter(
  chapterId: string
): Promise<{ ok: boolean; added: number; total: number; error?: string }> {
  const sb = getSupabase()
  if (!sb || !chapterId) return { ok: false, added: 0, total: 0, error: 'no client' }

  const [{ data: memberships, error: memErr }, { data: people, error: peopleErr }] =
    await Promise.all([
      sb
        .from('chapter_memberships')
        .select('user_id, app_member_id, role, is_founder')
        .eq('chapter_id', chapterId),
      sb
        .from('chapter_members')
        .select('user_id, first_name, last_name, email, phone, role, status')
        .eq('chapter_id', chapterId),
    ])

  if (memErr) return { ok: false, added: 0, total: 0, error: memErr.message }
  if (peopleErr) return { ok: false, added: 0, total: 0, error: peopleErr.message }

  const byUser = new Map<string, SqlPerson>()
  for (const p of (people ?? []) as SqlPerson[]) {
    if (p.user_id) byUser.set(p.user_id, p)
  }

  const sqlRows = ((memberships ?? []) as SqlMembership[]).map((m) =>
    stubFromSql(m, byUser.get(m.user_id))
  )

  const local = readJson<Member[]>(MEMBERS_KEY, [])
  const beforeIds = new Set(local.map((m) => m.id))
  const merged = mergeRosterLists(local, sqlRows)
  writeJson(MEMBERS_KEY, merged)

  // Ensure member accounts exist for SQL joiners (used by profile/role lookups).
  const accounts = readJson<
    Array<{
      id: string
      userId: string
      memberId: string
      profile: {
        firstName: string
        lastName: string
        phone: string
        email?: string
        graduationYear: number
        avatar: string
      }
      role: UserRole
      email?: string
      inviteCodeId: string
      joinedAt: string
    }>
  >(ACCOUNTS_KEY, [])
  const accountByMember = new Set(accounts.map((a) => a.memberId))
  let nextAccounts = accounts
  for (const m of (memberships ?? []) as SqlMembership[]) {
    if (accountByMember.has(m.app_member_id)) continue
    const person = byUser.get(m.user_id)
    const stub = stubFromSql(m, person)
    nextAccounts = [
      ...nextAccounts,
      {
        id: `acct-sql-${m.app_member_id}`,
        userId: m.user_id,
        memberId: m.app_member_id,
        profile: {
          firstName: stub.firstName,
          lastName: stub.lastName,
          phone: stub.phone,
          email: stub.email,
          graduationYear: stub.graduationYear,
          avatar: stub.avatar,
        },
        role: (m.role as UserRole) || 'ActiveMember',
        email: stub.email,
        inviteCodeId: 'sql-sync',
        joinedAt: new Date().toISOString(),
      },
    ]
  }
  if (nextAccounts !== accounts) writeJson(ACCOUNTS_KEY, nextAccounts)

  const added = merged.filter((m) => !beforeIds.has(m.id)).length
  return { ok: true, added, total: merged.length }
}
