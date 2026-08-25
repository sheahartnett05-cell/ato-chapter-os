import type { InviteCode } from '../types/memberAccount'

function code(
  value: string,
  label: string,
  maxUses: number | null,
  role: InviteCode['role'] = 'ActiveMember'
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

/**
 * Only the founder bootstrap code is seeded.
 * Each chapter gets its own primary join code when the founding president creates it.
 */
export const SEED_INVITE_CODES: InviteCode[] = [
  code('CHAPTER-FOUNDER', 'Founding President (one-time)', 1, 'President'),
]

/** Legacy shared/role seeds — deactivated on read */
export const LEGACY_ROLE_INVITE_CODES = [
  'CHAPTER-MEMBER',
  'CHAPTER-TREASURER',
  'CHAPTER-SCHOLAR',
  'CHAPTER-CHAPLAIN',
  'CHAPTER-NEWMEMBER',
] as const

export function generateJoinCode(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CHAPTER-JOIN-${rand}`
}

/** @deprecated use generateJoinCode */
export function generateInviteCode(): string {
  return generateJoinCode()
}
