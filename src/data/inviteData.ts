import type { InviteCode } from '../types/memberAccount'
import type { UserRole } from '../types/permissions'

function code(
  role: UserRole,
  value: string,
  label: string,
  maxUses: number | null
): InviteCode {
  return {
    id: `inv-${value.toLowerCase()}`,
    code: value,
    label,
    role,
    createdBy: 'system',
    createdAt: '2025-08-01T00:00:00',
    maxUses,
    usedCount: 0,
    active: true,
  }
}

/** Seed invite codes — member codes are unlimited; one account per email enforces uniqueness */
export const SEED_INVITE_CODES: InviteCode[] = [
  code('President', 'CHAPTER-FOUNDER', 'Founding President (one-time)', 1),
  code('Treasurer', 'CHAPTER-TREASURER', 'Treasurer invite', null),
  code('ScholarshipChair', 'CHAPTER-SCHOLAR', 'Scholarship Chair invite', null),
  code('Chaplain', 'CHAPTER-CHAPLAIN', 'Chaplain invite', null),
  code('ActiveMember', 'CHAPTER-MEMBER', 'Active member invite', null),
  code('NewMember', 'CHAPTER-NEWMEMBER', 'New member invite', null),
]

export function generateInviteCode(role: UserRole, _label: string, _maxUses: number | null = null): string {
  const prefix = role
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-/, '')
    .slice(0, 10)
    .toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CHAPTER-${prefix}-${rand}`
}
