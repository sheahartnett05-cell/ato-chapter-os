import type { InviteCode } from '../types/memberAccount'
import type { UserRole } from '../types/permissions'

function code(role: UserRole, suffix: string, label: string, maxUses: number): InviteCode {
  return {
    id: `inv-${suffix}`,
    code: suffix,
    label,
    role,
    createdBy: 'system',
    createdAt: '2025-08-01T00:00:00',
    maxUses,
    usedCount: 0,
    active: true,
  }
}

/** Demo invite codes — replace with exec-generated codes in production */
export const SEED_INVITE_CODES: InviteCode[] = [
  code('President', 'CHAPTER-FOUNDER', 'Founding President (one-time)', 1),
  code('Treasurer', 'ATO-TREASURER', 'Treasurer invite', 5),
  code('ScholarshipChair', 'ATO-SCHOLAR', 'Scholarship Chair invite', 3),
  code('ActiveMember', 'ATO-MEMBER', 'Active member invite', 50),
  code('NewMember', 'ATO-NEWMEMBER', 'New member invite', 30),
]

export function generateInviteCode(role: UserRole, _label: string, _maxUses = 10): string {
  const prefix = role.replace(/([A-Z])/g, '-$1').replace(/^-/, '').slice(0, 8).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${rand}`
}
