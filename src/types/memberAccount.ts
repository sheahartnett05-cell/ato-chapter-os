import type { UserProfile, UserRole } from './permissions'

/** Single-use or multi-use invite for chapter onboarding */
export interface InviteCode {
  id: string
  code: string
  label: string
  /** When set, role step is locked to this position */
  role: UserRole
  createdBy: string
  createdAt: string
  maxUses: number
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
