import type { UserProfile, UserRole } from './permissions'

/** Multi-use invite for chapter onboarding. `maxUses: null` = unlimited. */
export interface InviteCode {
  id: string
  code: string
  label: string
  /** When set, role step is locked to this position */
  role: UserRole
  createdBy: string
  createdAt: string
  /** Cap on redemptions; null means as many members as needed */
  maxUses: number | null
  usedCount: number
  expiresAt?: string
  active: boolean
}

/** Auth user linked to chapter roster */
export interface MemberAccount {
  id: string
  userId: string
  memberId: string
  profile: UserProfile
  role: UserRole
  email?: string
  inviteCodeId: string
  joinedAt: string
}

export interface ChapterLock {
  orgId: string
  chapterDesignation: string
  university: string
  lockedAt: string
  lockedByUserId: string
}
