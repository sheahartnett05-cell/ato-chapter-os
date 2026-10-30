import type { Prospect } from '../../types'

export type PromoteProspectFn = (prospect: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  major?: string
  graduationYear?: number
  photoUrl?: string
  avatar?: string
  pledgeClass?: string
}) => { ok: true; memberId: string } | { ok: false; error: string }

export type RosterMemberLookup = {
  id: string
  email: string
}

/**
 * Idempotent PNM → roster link.
 * 1. Existing rosterMemberId that still exists → no-op success
 * 2. Email match on roster → link that id
 * 3. Else create via promoteProspectToMember
 */
export function ensureProspectOnRoster(
  prospect: Prospect,
  roster: RosterMemberLookup[],
  promote: PromoteProspectFn,
  pledgeClass?: string
): { ok: true; rosterMemberId: string; created: boolean } | { ok: false; error: string } {
  if (prospect.rosterMemberId) {
    const stillThere = roster.some((m) => m.id === prospect.rosterMemberId)
    if (stillThere) {
      return { ok: true, rosterMemberId: prospect.rosterMemberId, created: false }
    }
  }

  const email = (prospect.email || '').trim().toLowerCase()
  if (email) {
    const match = roster.find((m) => m.email.trim().toLowerCase() === email)
    if (match) {
      return { ok: true, rosterMemberId: match.id, created: false }
    }
  }

  const result = promote({
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    email: prospect.email,
    phone: prospect.phone,
    major: prospect.major,
    graduationYear: prospect.graduationYear,
    photoUrl: prospect.photoUrl,
    avatar: prospect.avatar,
    pledgeClass,
  })
  if (!result.ok) return result
  return { ok: true, rosterMemberId: result.memberId, created: true }
}
