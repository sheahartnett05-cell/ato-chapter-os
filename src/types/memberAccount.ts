import type { UserProfile, UserRole } from './permissions'

/** Chapter join / founder invite. Join codes always onboard as ActiveMember. */
export interface InviteCode {
  id: string
  code: string
  label: string
  /** Only CHAPTER-FOUNDER uses President; all join codes use ActiveMember */
  role: UserRole
  createdBy: string
  createdAt: string
  /** Cap on redemptions; null means unlimited */
  maxUses: number | null
  usedCount: number
  expiresAt?: string
  active: boolean
  /** Auto-created when the founding president locks the chapter */
  isPrimary?: boolean
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
  /** Invite code id issued at founding for members to join */
  primaryJoinCodeId?: string
}
