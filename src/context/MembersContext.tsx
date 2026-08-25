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
import { syncAllMemberDues } from '../lib/duesSync'
import { syncMemberAttendancePct } from '../lib/attendanceSync'
import { generateJoinCode, LEGACY_ROLE_INVITE_CODES, SEED_INVITE_CODES } from '../data/inviteData'
import { pushLocalChapterToCloud, bootstrapChapterCloud } from '../lib/chapterCloud'
import { requiresSupabaseAuth } from '../lib/supabaseAuth'
import { readJson, writeJson, writeLocalOnly } from '../lib/persist'
import type { ChapterLock, InviteCode, MemberAccount } from '../types/memberAccount'
import type { Member } from '../types'
import type { DuesCharge, DuesPayment } from '../types/chapterOps'
import type { UserProfile, UserRole } from '../types/permissions'

const INVITES_KEY = 'chapter-os-invite-codes'
const ACCOUNTS_KEY = 'chapter-os-member-accounts'
const MEMBERS_KEY = 'chapter-os-roster-members'
const CHAPTER_LOCK_KEY = 'chapter-os-chapter-lock'
const USER_ID_KEY = 'chapter-os-user-id'

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function getOrCreateUserId(): string {
  let id = readJson<string | null>(USER_ID_KEY, null)
  if (!id) {
    id = uid('user')
    writeLocalOnly(USER_ID_KEY, id)
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
  /** Create a general join code (ActiveMember). President assigns roles later. */
  createInvite: (label?: string) => InviteCode
  /** Chapter's main join code (created at founding). */
  primaryJoinCode: InviteCode | null
  /** Ensure a primary join code exists for a locked chapter (backfill). */
  ensurePrimaryJoinCode: () => InviteCode | null
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
  /** Add a roster member (exec add form). Rejects duplicate emails. */
  addMemberToRoster: (input: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    major?: string
    graduationYear?: number
    status?: Member['status']
  }) => { ok: true; memberId: string } | { ok: false; error: string }
  /** Convert an accepted PNM into a New Member roster record. */
  promoteProspectToMember: (prospect: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    major?: string
    graduationYear?: number
    photoUrl?: string
    avatar?: string
  }) => { ok: true; memberId: string } | { ok: false; error: string }
  updateMemberProfile: (memberId: string, patch: Partial<UserProfile>) => void
  updateMemberDetails: (memberId: string, patch: Partial<Member>) => void
  /** President: change a member's app role / permission set */
  assignMemberRole: (memberId: string, role: UserRole) => void
  /** Sync roster dues fields from ops ledger */
  syncRosterDues: (
    charges: import('../types/chapterOps').DuesCharge[],
    payments: import('../types/chapterOps').DuesPayment[]
  ) => void
  /** Sync roster attendancePct from recorded event attendance */
  syncRosterAttendance: (
    attendanceByEvent: Record<string, import('../types').AttendanceEntry[]>
  ) => void
  lockChapter: (lock: Omit<ChapterLock, 'lockedAt' | 'lockedByUserId'>, userId: string) => void
}

const MembersContext = createContext<MembersContextValue | null>(null)

function readInviteCodes(): InviteCode[] {
  const stored = readJson<InviteCode[] | null>(INVITES_KEY, null)
  const base = stored && Array.isArray(stored) ? stored : []
  const byCode = new Map<string, InviteCode>()

  for (const i of base) {
    const key = i.code.toUpperCase()
    const isLegacy = (LEGACY_ROLE_INVITE_CODES as readonly string[]).includes(key)
    const isFounder = key === 'CHAPTER-FOUNDER'
    byCode.set(key, {
      ...i,
      maxUses: i.maxUses === undefined ? null : i.maxUses,
      // General join: force ActiveMember except founder
      role: isFounder ? 'President' : 'ActiveMember',
      // Kill old role-specific seed loopholes
      active: isLegacy ? false : i.active,
    })
  }

  for (const seed of SEED_INVITE_CODES) {
    const key = seed.code.toUpperCase()
    if (!byCode.has(key)) byCode.set(key, seed)
  }

  return [...byCode.values()]
}

export function MembersProvider({ children }: { children: ReactNode }) {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(() => {
    const codes = readInviteCodes()
    writeJson(INVITES_KEY, codes)
    return codes
  })
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
      if (invite.maxUses != null && invite.usedCount >= invite.maxUses)
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
    (label = 'Chapter join code') => {
      const invite: InviteCode = {
        id: uid('inv'),
        code: generateJoinCode(),
        label: label.trim() || 'Chapter join code',
        role: 'ActiveMember',
        createdBy: 'exec',
        createdAt: new Date().toISOString(),
        maxUses: null,
        usedCount: 0,
        active: true,
      }
      persistInvites([invite, ...inviteCodes])
      return invite
    },
    [inviteCodes, persistInvites]
  )

  const primaryJoinCode = useMemo(() => {
    if (chapterLock?.primaryJoinCodeId) {
      const byId = inviteCodes.find((i) => i.id === chapterLock.primaryJoinCodeId && i.active)
      if (byId) return byId
    }
    return inviteCodes.find((i) => i.isPrimary && i.active) ?? null
  }, [chapterLock, inviteCodes])

  const ensurePrimaryJoinCode = useCallback(() => {
    if (!chapterLock) return null
    if (primaryJoinCode) return primaryJoinCode

    const invite: InviteCode = {
      id: uid('inv'),
      code: generateJoinCode(),
      label: `${chapterLock.chapterDesignation || 'Chapter'} join code`,
      role: 'ActiveMember',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      maxUses: null,
      usedCount: 0,
      active: true,
      isPrimary: true,
    }
    persistInvites([invite, ...inviteCodes.filter((i) => !i.isPrimary)])
    const nextLock: ChapterLock = { ...chapterLock, primaryJoinCodeId: invite.id }
    setChapterLock(nextLock)
    writeJson(CHAPTER_LOCK_KEY, nextLock)
    void pushLocalChapterToCloud()
    return invite
  }, [chapterLock, primaryJoinCode, inviteCodes, persistInvites])

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
      void pushLocalChapterToCloud()
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
      const email = (
        input.email ??
        input.profile.email ??
        `${input.profile.firstName.toLowerCase()}@chapter.local`
      )
        .trim()
        .toLowerCase()
      const existing = email
        ? roster.find((m) => m.email.trim().toLowerCase() === email)
        : undefined
      const existingAcct = email
        ? accounts.find((a) => (a.email ?? a.profile.email ?? '').trim().toLowerCase() === email)
        : undefined
      if (existing || existingAcct) {
        throw new Error('An account with this email already exists. Use a different email.')
      }
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
        attendancePct: 0,
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

      const founding = input.role === 'President' && !chapterLock
      if (founding) {
        const joinInvite: InviteCode = {
          id: uid('inv'),
          code: generateJoinCode(),
          label: `${input.chapterDesignation || 'Chapter'} join code`,
          role: 'ActiveMember',
          createdBy: input.userId,
          createdAt: new Date().toISOString(),
          maxUses: null,
          usedCount: 0,
          active: true,
          isPrimary: true,
        }
        persistInvites([
          joinInvite,
          ...inviteCodes.map((i) =>
            i.isPrimary || i.code.toUpperCase() === 'CHAPTER-MEMBER'
              ? { ...i, active: false, isPrimary: false }
              : i
          ),
        ])
        lockChapter(
          {
            orgId: input.orgId,
            chapterDesignation: input.chapterDesignation,
            university: input.university,
            primaryJoinCodeId: joinInvite.id,
          },
          input.userId
        )
      }

      if (requiresSupabaseAuth()) {
        void bootstrapChapterCloud({
          appMemberId: memberId,
          role: input.role,
          isFounder: founding,
        })
      }

      return { memberId, account }
    },
    [
      roster,
      accounts,
      chapterLock,
      inviteCodes,
      lockChapter,
      persistRoster,
      persistAccounts,
      persistInvites,
    ]
  )

  const addMemberToRoster = useCallback(
    (input: {
      firstName: string
      lastName: string
      email: string
      phone?: string
      major?: string
      graduationYear?: number
      status?: Member['status']
    }) => {
      const email = input.email.trim().toLowerCase()
      if (!input.firstName.trim() || !input.lastName.trim()) {
        return { ok: false as const, error: 'First and last name are required.' }
      }
      if (!email) return { ok: false as const, error: 'Email is required.' }
      if (roster.some((m) => m.email.trim().toLowerCase() === email)) {
        return { ok: false as const, error: 'A member with this email already exists.' }
      }
      const memberId = uid('m')
      const newMember: Member = {
        id: memberId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim(),
        phone: input.phone?.trim() || '',
        major: input.major?.trim() || 'Undeclared',
        graduationYear: input.graduationYear ?? new Date().getFullYear() + 1,
        pledgeClass: 'Fall 2025',
        status: input.status ?? 'Active',
        isExec: false,
        birthday: '2000-01-01',
        shirtSize: 'M',
        emergencyContact: '',
        emergencyPhone: '',
        duesStatus: 'Outstanding',
        duesPaid: 0,
        duesExpected: 850,
        attendancePct: 0,
        points: 0,
        avatar: `${input.firstName[0] ?? ''}${input.lastName[0] ?? ''}`.toUpperCase() || '?',
      }
      persistRoster([...roster, newMember])
      return { ok: true as const, memberId }
    },
    [roster, persistRoster]
  )

  const promoteProspectToMember = useCallback(
    (prospect: {
      firstName: string
      lastName: string
      email: string
      phone?: string
      major?: string
      graduationYear?: number
      photoUrl?: string
      avatar?: string
    }) => {
      const email = (prospect.email || '').trim().toLowerCase()
      if (!prospect.firstName.trim() || !prospect.lastName.trim()) {
        return { ok: false as const, error: 'Prospect needs a name.' }
      }
      if (email && roster.some((m) => m.email.trim().toLowerCase() === email)) {
        return { ok: false as const, error: 'Already on roster.' }
      }
      const memberId = uid('m')
      const newMember: Member = {
        id: memberId,
        firstName: prospect.firstName.trim(),
        lastName: prospect.lastName.trim(),
        email: prospect.email?.trim() || `${prospect.firstName.toLowerCase()}@chapter.local`,
        phone: prospect.phone?.trim() || '',
        major: prospect.major?.trim() || 'Undeclared',
        graduationYear: prospect.graduationYear ?? new Date().getFullYear() + 1,
        pledgeClass: 'Spring 2026',
        status: 'New Member',
        isExec: false,
        role: 'NewMember',
        birthday: '2000-01-01',
        shirtSize: 'M',
        emergencyContact: '',
        emergencyPhone: '',
        duesStatus: 'Outstanding',
        duesPaid: 0,
        duesExpected: 850,
        attendancePct: 0,
        points: 0,
        avatar:
          prospect.avatar ||
          `${prospect.firstName[0] ?? ''}${prospect.lastName[0] ?? ''}`.toUpperCase() ||
          '?',
        photoUrl: prospect.photoUrl,
      }
      persistRoster([...roster, newMember])
      return { ok: true as const, memberId }
    },
    [roster, persistRoster]
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

  const syncRosterDues = useCallback(
    (charges: DuesCharge[], payments: DuesPayment[]) => {
      const synced = syncAllMemberDues(roster, charges, payments)
      const changed = synced.some((m, i) => {
        const prev = roster[i]
        return (
          prev.duesPaid !== m.duesPaid ||
          prev.duesExpected !== m.duesExpected ||
          prev.duesStatus !== m.duesStatus
        )
      })
      if (changed) persistRoster(synced)
    },
    [roster, persistRoster]
  )

  const syncRosterAttendance = useCallback(
    (attendanceByEvent: Record<string, import('../types').AttendanceEntry[]>) => {
      const synced = syncMemberAttendancePct(roster, attendanceByEvent)
      const changed = synced.some((m, i) => roster[i]?.attendancePct !== m.attendancePct)
      if (changed) persistRoster(synced)
    },
    [roster, persistRoster]
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
      primaryJoinCode,
      ensurePrimaryJoinCode,
      toggleInvite,
      registerMember,
      addMemberToRoster,
      promoteProspectToMember,
      updateMemberProfile,
      updateMemberDetails,
      assignMemberRole,
      syncRosterDues,
      syncRosterAttendance,
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
      primaryJoinCode,
      ensurePrimaryJoinCode,
      toggleInvite,
      registerMember,
      addMemberToRoster,
      promoteProspectToMember,
      updateMemberProfile,
      updateMemberDetails,
      assignMemberRole,
      syncRosterDues,
      syncRosterAttendance,
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
