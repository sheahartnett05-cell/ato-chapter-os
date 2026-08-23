import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_MEMBERS as seedMembers } from '../data/mockData'
import { allowDemoData } from '../lib/demoSeed'
import { generateInviteCode, SEED_INVITE_CODES } from '../data/inviteData'
import type { ChapterLock, InviteCode, MemberAccount } from '../types/memberAccount'
import type { Member } from '../types'
import type { UserProfile, UserRole } from '../types/permissions'

const INVITES_KEY = 'chapter-os-invite-codes'
const ACCOUNTS_KEY = 'chapter-os-member-accounts'
const MEMBERS_KEY = 'chapter-os-roster-members'
const CHAPTER_LOCK_KEY = 'chapter-os-chapter-lock'
const USER_ID_KEY = 'chapter-os-user-id'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function getOrCreateUserId(): string {
  let id = readJson<string | null>(USER_ID_KEY, null)
  if (!id) {
    id = uid('user')
    writeJson(USER_ID_KEY, id)
  }
  return id
}

interface MembersContextValue {
  members: Member[]
  inviteCodes: InviteCode[]
  accounts: MemberAccount[]
  chapterLock: ChapterLock | null
  getMemberById: (id: string) => Member | undefined
  getAccountByUserId: (userId: string) => MemberAccount | undefined
  getAccountByMemberId: (memberId: string) => MemberAccount | undefined
  validateInvite: (code: string) => { valid: boolean; invite?: InviteCode; error?: string }
  redeemInvite: (code: string) => InviteCode | null
  createInvite: (role: UserRole, label: string, maxUses?: number) => InviteCode
  toggleInvite: (id: string) => void
  registerMember: (input: {
    userId: string
    profile: UserProfile
    role: UserRole
    inviteCodeId?: string
    orgId: string
    chapterDesignation: string
    university: string
    email?: string
  }) => { memberId: string; account: MemberAccount }
  updateMemberProfile: (memberId: string, patch: Partial<UserProfile>) => void
  updateMemberDetails: (memberId: string, patch: Partial<Member>) => void
  /** President: change a member's app role / permission set */
  assignMemberRole: (memberId: string, role: UserRole) => void
  lockChapter: (lock: Omit<ChapterLock, 'lockedAt' | 'lockedByUserId'>, userId: string) => void
}

const MembersContext = createContext<MembersContextValue | null>(null)

export function MembersProvider({ children }: { children: ReactNode }) {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(() =>
    readJson(INVITES_KEY, allowDemoData() ? SEED_INVITE_CODES : [])
  )
  const [accounts, setAccounts] = useState<MemberAccount[]>(() =>
    readJson(ACCOUNTS_KEY, [])
  )
  const [roster, setRoster] = useState<Member[]>(() => {
    const stored = readJson<Member[] | null>(MEMBERS_KEY, null)
    if (stored) return stored
    return allowDemoData() ? seedMembers : []
  })
  const [chapterLock, setChapterLock] = useState<ChapterLock | null>(() =>
    readJson(CHAPTER_LOCK_KEY, null)
  )

  const persistInvites = useCallback((next: InviteCode[]) => {
    setInviteCodes(next)
    writeJson(INVITES_KEY, next)
  }, [])

  const persistAccounts = useCallback((next: MemberAccount[]) => {
    setAccounts(next)
    writeJson(ACCOUNTS_KEY, next)
  }, [])

  const persistRoster = useCallback((next: Member[]) => {
    setRoster(next)
    writeJson(MEMBERS_KEY, next)
  }, [])

  const getMemberById = useCallback(
    (id: string) => roster.find((m) => m.id === id),
    [roster]
  )

  const getAccountByUserId = useCallback(
    (userId: string) => accounts.find((a) => a.userId === userId),
    [accounts]
  )

  const getAccountByMemberId = useCallback(
    (memberId: string) => accounts.find((a) => a.memberId === memberId),
    [accounts]
  )

  const validateInvite = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase()
      const invite = inviteCodes.find(
        (i) => i.code.toUpperCase() === normalized && i.active
      )
      if (!invite) return { valid: false, error: 'Invalid invite code' }
      if (invite.usedCount >= invite.maxUses)
        return { valid: false, error: 'Invite code has no uses left' }
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date())
        return { valid: false, error: 'Invite code expired' }
      if (invite.code === 'CHAPTER-FOUNDER' && chapterLock)
        return { valid: false, error: 'Chapter already has a founder' }
      return { valid: true, invite }
    },
    [inviteCodes, chapterLock]
  )

  const redeemInvite = useCallback(
    (code: string) => {
      const result = validateInvite(code)
      if (!result.valid || !result.invite) return null
      const invite = result.invite
      const next = inviteCodes.map((i) =>
        i.id === invite.id ? { ...i, usedCount: i.usedCount + 1 } : i
      )
      persistInvites(next)
      return invite
    },
    [inviteCodes, validateInvite, persistInvites]
  )

  const createInvite = useCallback(
    (role: UserRole, label: string, maxUses = 10) => {
      const invite: InviteCode = {
        id: uid('inv'),
        code: generateInviteCode(role, label, maxUses),
        label,
        role,
        createdBy: 'exec',
        createdAt: new Date().toISOString(),
        maxUses,
        usedCount: 0,
        active: true,
      }
      persistInvites([invite, ...inviteCodes])
      return invite
    },
    [inviteCodes, persistInvites]
  )

  const toggleInvite = useCallback(
    (id: string) => {
      persistInvites(
        inviteCodes.map((i) => (i.id === id ? { ...i, active: !i.active } : i))
      )
    },
    [inviteCodes, persistInvites]
  )

  const lockChapter = useCallback(
    (lock: Omit<ChapterLock, 'lockedAt' | 'lockedByUserId'>, userId: string) => {
      const next: ChapterLock = {
        ...lock,
        lockedAt: new Date().toISOString(),
        lockedByUserId: userId,
      }
      setChapterLock(next)
      writeJson(CHAPTER_LOCK_KEY, next)
    },
    []
  )

  const registerMember = useCallback(
    (input: {
      userId: string
      profile: UserProfile
      role: UserRole
      inviteCodeId?: string
      orgId: string
      chapterDesignation: string
      university: string
      email?: string
    }) => {
      const memberId = uid('m')
      const isExec = !['ActiveMember', 'NewMember'].includes(input.role)
      const status = input.role === 'NewMember' ? 'New Member' : 'Active'

      const newMember: Member = {
        id: memberId,
        firstName: input.profile.firstName,
        lastName: input.profile.lastName,
        email: input.email ?? input.profile.email ?? `${input.profile.firstName.toLowerCase()}@chapter.local`,
        phone: input.profile.phone,
        major: input.profile.major ?? 'Undeclared',
        graduationYear: input.profile.graduationYear,
        pledgeClass: 'Fall 2025',
        status,
        isExec,
        role: input.role,
        birthday: input.profile.birthday ?? '2000-01-01',
        shirtSize: input.profile.shirtSize ?? 'M',
        emergencyContact: input.profile.emergencyContact ?? '',
        emergencyPhone: input.profile.emergencyPhone ?? '',
        duesStatus: 'Outstanding',
        duesPaid: 0,
        duesExpected: 850,
        attendancePct: 100,
        points: 0,
        avatar: input.profile.avatar,
        photoUrl: input.profile.photoUrl,
      }

      const account: MemberAccount = {
        id: uid('acct'),
        userId: input.userId,
        memberId,
        profile: input.profile,
        role: input.role,
        email: input.email,
        inviteCodeId: input.inviteCodeId ?? 'self-register',
        joinedAt: new Date().toISOString(),
      }

      persistRoster([...roster, newMember])
      persistAccounts([...accounts, account])

      if (input.role === 'President' && !chapterLock) {
        lockChapter(
          {
            orgId: input.orgId,
            chapterDesignation: input.chapterDesignation,
            university: input.university,
          },
          input.userId
        )
      }

      return { memberId, account }
    },
    [roster, accounts, chapterLock, lockChapter, persistRoster, persistAccounts]
  )

  const updateMemberProfile = useCallback(
    (memberId: string, patch: Partial<UserProfile>) => {
      persistRoster(
        roster.map((m) =>
          m.id === memberId
            ? {
                ...m,
                firstName: patch.firstName ?? m.firstName,
                lastName: patch.lastName ?? m.lastName,
                phone: patch.phone ?? m.phone,
                email: patch.email ?? m.email,
                graduationYear: patch.graduationYear ?? m.graduationYear,
                avatar: patch.avatar ?? m.avatar,
                photoUrl: patch.photoUrl !== undefined ? patch.photoUrl : m.photoUrl,
                major: patch.major ?? m.major,
                birthday: patch.birthday ?? m.birthday,
                shirtSize: patch.shirtSize ?? m.shirtSize,
                emergencyContact: patch.emergencyContact ?? m.emergencyContact,
                emergencyPhone: patch.emergencyPhone ?? m.emergencyPhone,
              }
            : m
        )
      )
      persistAccounts(
        accounts.map((a) =>
          a.memberId === memberId
            ? { ...a, profile: { ...a.profile, ...patch }, email: patch.email ?? a.email }
            : a
        )
      )
    },
    [roster, accounts, persistRoster, persistAccounts]
  )

  const updateMemberDetails = useCallback(
    (memberId: string, patch: Partial<Member>) => {
      persistRoster(
        roster.map((m) => (m.id === memberId ? { ...m, ...patch } : m))
      )
    },
    [roster, persistRoster]
  )

  const assignMemberRole = useCallback(
    (memberId: string, role: UserRole) => {
      const isExec = !['ActiveMember', 'NewMember'].includes(role)
      const status = role === 'NewMember' ? 'New Member' : 'Active'
      persistRoster(
        roster.map((m) =>
          m.id === memberId
            ? {
                ...m,
                role,
                isExec,
                status: status as Member['status'],
              }
            : m
        )
      )
      persistAccounts(
        accounts.map((a) => (a.memberId === memberId ? { ...a, role } : a))
      )
    },
    [roster, accounts, persistRoster, persistAccounts]
  )

  const value = useMemo<MembersContextValue>(
    () => ({
      members: roster,
      inviteCodes,
      accounts,
      chapterLock,
      getMemberById,
      getAccountByUserId,
      getAccountByMemberId,
      validateInvite,
      redeemInvite,
      createInvite,
      toggleInvite,
      registerMember,
      updateMemberProfile,
      updateMemberDetails,
      assignMemberRole,
      lockChapter,
    }),
    [
      roster,
      inviteCodes,
      accounts,
      chapterLock,
      getMemberById,
      getAccountByUserId,
      getAccountByMemberId,
      validateInvite,
      redeemInvite,
      createInvite,
      toggleInvite,
      registerMember,
      updateMemberProfile,
      updateMemberDetails,
      assignMemberRole,
      lockChapter,
    ]
  )

  return (
    <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
  )
}

export function useMembers(): MembersContextValue {
  const ctx = useContext(MembersContext)
  if (!ctx) throw new Error('useMembers must be used within MembersProvider')
  return ctx
}
