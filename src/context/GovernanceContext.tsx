import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  committeeChatMessages as initialChat,
  committeeTasks as initialTasks,
  committees as initialCommittees,
  fineSchedule as initialFineSchedule,
  fines as initialFines,
  governanceConfig as initialConfig,
  groupAnnouncements as initialAnnouncements,
  jBoardCases as initialCases,
  CURRENT_EXEC_ID,
  canViewAllCases,
} from '../data/governanceData'
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import { readJson, writeJson } from '../lib/persist'
import type {
  Committee,
  CommitteeChatMessage,
  CommitteeTask,
  Fine,
  FineScheduleRule,
  GovernanceConfig,
  GroupAnnouncement,
  JBoardCase,
} from '../types/governance'

const COMMITTEE_COLORS = ['#64748b', 'var(--accent)', '#a855f7', '#22c55e', '#f59e0b', '#0ea5e9']

type GovernanceBlob = {
  cases: JBoardCase[]
  fines: Fine[]
  groupAnnouncements: GroupAnnouncement[]
  committeeTasks: CommitteeTask[]
  fineSchedule: FineScheduleRule[]
  config: GovernanceConfig
}

function readGovernanceBlob(): GovernanceBlob | null {
  return readJson<GovernanceBlob | null>(STORAGE_KEYS.governance, null)
}

function writeGovernanceBlob(blob: GovernanceBlob) {
  writeJson(STORAGE_KEYS.governance, blob)
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function readCommittees(): Committee[] {
  const parsed = readJson<Committee[] | null>(STORAGE_KEYS.committees, null)
  if (parsed && Array.isArray(parsed)) return parsed
  return allowDemoData() ? initialCommittees : []
}

function readChatMessages(): CommitteeChatMessage[] {
  const parsed = readJson<CommitteeChatMessage[] | null>(STORAGE_KEYS.committeeChat, null)
  if (parsed && Array.isArray(parsed)) return parsed
  return allowDemoData() ? initialChat : []
}

function writeCommittees(next: Committee[]) {
  writeJson(STORAGE_KEYS.committees, next)
}

function writeChatMessages(next: CommitteeChatMessage[]) {
  writeJson(STORAGE_KEYS.committeeChat, next)
}

interface GovernanceContextValue {
  viewerId: string
  cases: JBoardCase[]
  fines: Fine[]
  committees: Committee[]
  committeeChat: CommitteeChatMessage[]
  groupAnnouncements: GroupAnnouncement[]
  committeeTasks: CommitteeTask[]
  fineSchedule: FineScheduleRule[]
  config: GovernanceConfig
  canAdmin: boolean
  getCommittee: (id: string) => Committee | undefined
  createCommittee: (input: {
    name: string
    description: string
    chairId: string
    memberIds: string[]
    isPrivate?: boolean
    parentId?: string
  }) => Committee
  updateCommittee: (id: string, patch: Partial<Committee>) => void
  addCommitteeMember: (committeeId: string, memberId: string) => void
  removeCommitteeMember: (committeeId: string, memberId: string) => void
  sendCommitteeMessage: (committeeId: string, authorId: string, body: string) => void
  fileCase: (caseData: Omit<JBoardCase, 'id'>) => void
  issueFine: (fine: Omit<Fine, 'id'>) => void
  updateFineStatus: (id: string, status: Fine['status']) => void
  submitAppeal: (caseId: string, memberId: string) => void
  submitFineAppeal: (fineId: string) => void
  updateConfig: (patch: Partial<GovernanceConfig>) => void
  updateFineSchedule: (rules: FineScheduleRule[]) => void
  addGroupAnnouncement: (a: Omit<GroupAnnouncement, 'id' | 'timestamp'>) => void
}

const GovernanceContext = createContext<GovernanceContextValue | null>(null)

export function GovernanceProvider({ children }: { children: ReactNode }) {
  const storedGov = readGovernanceBlob()
  const [cases, setCases] = useState<JBoardCase[]>(() =>
    storedGov?.cases ?? (allowDemoData() ? initialCases : [])
  )
  const [finesList, setFinesList] = useState<Fine[]>(() =>
    storedGov?.fines ?? (allowDemoData() ? initialFines : [])
  )
  const [committees, setCommittees] = useState<Committee[]>(readCommittees)
  const [committeeChat, setCommitteeChat] = useState<CommitteeChatMessage[]>(readChatMessages)
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>(() =>
    storedGov?.groupAnnouncements ?? (allowDemoData() ? initialAnnouncements : [])
  )
  const [tasks] = useState<CommitteeTask[]>(() =>
    storedGov?.committeeTasks ?? (allowDemoData() ? initialTasks : [])
  )
  const [fineSchedule, setFineSchedule] = useState<FineScheduleRule[]>(() =>
    storedGov?.fineSchedule ?? (allowDemoData() ? initialFineSchedule : [])
  )
  const [config, setConfig] = useState<GovernanceConfig>(
    () => storedGov?.config ?? initialConfig
  )

  const viewerId = CURRENT_EXEC_ID
  const canAdmin = canViewAllCases(viewerId)

  const persistCommittees = useCallback((updater: (prev: Committee[]) => Committee[]) => {
    setCommittees((prev) => {
      const next = updater(prev)
      writeCommittees(next)
      return next
    })
  }, [])

  const persistChat = useCallback((updater: (prev: CommitteeChatMessage[]) => CommitteeChatMessage[]) => {
    setCommitteeChat((prev) => {
      const next = updater(prev)
      writeChatMessages(next)
      return next
    })
  }, [])

  const getCommittee = useCallback(
    (id: string) => committees.find((c) => c.id === id),
    [committees]
  )

  const createCommittee = useCallback(
    (input: {
      name: string
      description: string
      chairId: string
      memberIds: string[]
      isPrivate?: boolean
      parentId?: string
    }) => {
      const memberIds = [...new Set([input.chairId, ...input.memberIds])]
      const committee: Committee = {
        id: uid('c'),
        name: input.name.trim(),
        description: input.description.trim(),
        chairId: input.chairId,
        memberIds,
        isPrivate: input.isPrivate ?? false,
        parentId: input.parentId,
        color: COMMITTEE_COLORS[committees.length % COMMITTEE_COLORS.length],
      }
      persistCommittees((prev) => [...prev, committee])
      return committee
    },
    [committees.length, persistCommittees]
  )

  const updateCommittee = useCallback(
    (id: string, patch: Partial<Committee>) => {
      persistCommittees((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      )
    },
    [persistCommittees]
  )

  const addCommitteeMember = useCallback(
    (committeeId: string, memberId: string) => {
      persistCommittees((prev) =>
        prev.map((c) => {
          if (c.id !== committeeId || c.memberIds.includes(memberId)) return c
          return { ...c, memberIds: [...c.memberIds, memberId] }
        })
      )
    },
    [persistCommittees]
  )

  const removeCommitteeMember = useCallback(
    (committeeId: string, memberId: string) => {
      persistCommittees((prev) =>
        prev.map((c) => {
          if (c.id !== committeeId) return c
          const memberIds = c.memberIds.filter((id) => id !== memberId)
          const chairId = c.chairId === memberId ? memberIds[0] ?? '' : c.chairId
          return { ...c, memberIds, chairId }
        })
      )
    },
    [persistCommittees]
  )

  const sendCommitteeMessage = useCallback(
    (committeeId: string, authorId: string, body: string) => {
      const trimmed = body.trim()
      if (!trimmed) return
      const message: CommitteeChatMessage = {
        id: uid('cm'),
        committeeId,
        authorId,
        body: trimmed,
        timestamp: new Date().toISOString(),
      }
      persistChat((prev) => [...prev, message])
    },
    [persistChat]
  )

  const fileCase = useCallback((caseData: Omit<JBoardCase, 'id'>) => {
    const id = `jc-${Date.now()}`
    setCases((prev) => {
      const nextCases = [...prev, { ...caseData, id }]
      setFinesList((prevFines) => {
        let nextFines = prevFines
        if (caseData.sanctionType === 'Fine' && caseData.fineAmount > 0) {
          nextFines = [
            ...prevFines,
            {
              id: `f-${Date.now()}`,
              memberId: caseData.memberId,
              caseId: id,
              amount: caseData.fineAmount,
              reason: `${caseData.category} — ${caseData.description.slice(0, 40)}`,
              dateIssued: new Date().toISOString().slice(0, 10),
              dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
              status: 'Unpaid' as const,
            },
          ]
        }
        writeGovernanceBlob({
          cases: nextCases,
          fines: nextFines,
          groupAnnouncements: announcements,
          committeeTasks: tasks,
          fineSchedule,
          config,
        })
        return nextFines
      })
      return nextCases
    })
  }, [announcements, tasks, fineSchedule, config])

  const issueFine = useCallback(
    (fine: Omit<Fine, 'id'>) => {
      setFinesList((prev) => {
        const next = [...prev, { ...fine, id: `f-${Date.now()}` }]
        writeGovernanceBlob({
          cases,
          fines: next,
          groupAnnouncements: announcements,
          committeeTasks: tasks,
          fineSchedule,
          config,
        })
        return next
      })
    },
    [cases, announcements, tasks, fineSchedule, config]
  )

  const updateFineStatus = useCallback(
    (id: string, status: Fine['status']) => {
      setFinesList((prev) => {
        const next = prev.map((f) => (f.id === id ? { ...f, status } : f))
        writeGovernanceBlob({
          cases,
          fines: next,
          groupAnnouncements: announcements,
          committeeTasks: tasks,
          fineSchedule,
          config,
        })
        return next
      })
    },
    [cases, announcements, tasks, fineSchedule, config]
  )

  const submitAppeal = useCallback(
    (caseId: string, memberId: string) => {
      setCases((prev) => {
        const next = prev.map((c) =>
          c.id === caseId && c.memberId === memberId ? { ...c, appealSubmitted: true } : c
        )
        writeGovernanceBlob({
          cases: next,
          fines: finesList,
          groupAnnouncements: announcements,
          committeeTasks: tasks,
          fineSchedule,
          config,
        })
        return next
      })
    },
    [finesList, announcements, tasks, fineSchedule, config]
  )

  const submitFineAppeal = useCallback(
    (fineId: string) => {
      setFinesList((prev) => {
        const next = prev.map((f) => (f.id === fineId ? { ...f, status: 'Appealed' as const } : f))
        writeGovernanceBlob({
          cases,
          fines: next,
          groupAnnouncements: announcements,
          committeeTasks: tasks,
          fineSchedule,
          config,
        })
        return next
      })
    },
    [cases, announcements, tasks, fineSchedule, config]
  )

  const updateConfig = useCallback(
    (patch: Partial<GovernanceConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...patch }
        writeGovernanceBlob({
          cases,
          fines: finesList,
          groupAnnouncements: announcements,
          committeeTasks: tasks,
          fineSchedule,
          config: next,
        })
        return next
      })
    },
    [cases, finesList, announcements, tasks, fineSchedule]
  )

  const updateFineSchedule = useCallback(
    (rules: FineScheduleRule[]) => {
      setFineSchedule(rules)
      writeGovernanceBlob({
        cases,
        fines: finesList,
        groupAnnouncements: announcements,
        committeeTasks: tasks,
        fineSchedule: rules,
        config,
      })
    },
    [cases, finesList, announcements, tasks, config]
  )

  const addGroupAnnouncement = useCallback(
    (a: Omit<GroupAnnouncement, 'id' | 'timestamp'>) => {
      setAnnouncements((prev) => {
        const next = [
          {
            ...a,
            id: `ga-${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]
        writeGovernanceBlob({
          cases,
          fines: finesList,
          groupAnnouncements: next,
          committeeTasks: tasks,
          fineSchedule,
          config,
        })
        return next
      })
    },
    [cases, finesList, tasks, fineSchedule, config]
  )

  const value = useMemo<GovernanceContextValue>(
    () => ({
      viewerId,
      cases,
      fines: finesList,
      committees,
      committeeChat,
      groupAnnouncements: announcements,
      committeeTasks: tasks,
      fineSchedule,
      config,
      canAdmin,
      getCommittee,
      createCommittee,
      updateCommittee,
      addCommitteeMember,
      removeCommitteeMember,
      sendCommitteeMessage,
      fileCase,
      issueFine,
      updateFineStatus,
      submitAppeal,
      submitFineAppeal,
      updateConfig,
      updateFineSchedule,
      addGroupAnnouncement,
    }),
    [
      cases,
      finesList,
      committees,
      committeeChat,
      announcements,
      tasks,
      fineSchedule,
      config,
      canAdmin,
      getCommittee,
      createCommittee,
      updateCommittee,
      addCommitteeMember,
      removeCommitteeMember,
      sendCommitteeMessage,
      fileCase,
      issueFine,
      updateFineStatus,
      submitAppeal,
      submitFineAppeal,
      updateConfig,
      updateFineSchedule,
      addGroupAnnouncement,
    ]
  )

  return (
    <GovernanceContext.Provider value={value}>{children}</GovernanceContext.Provider>
  )
}

export function useGovernance(): GovernanceContextValue {
  const ctx = useContext(GovernanceContext)
  if (!ctx) throw new Error('useGovernance must be used within GovernanceProvider')
  return ctx
}

/** Member-scoped helpers (regular member view) */
export function useMemberGovernance(memberId: string) {
  const gov = useGovernance()
  return useMemo(
    () => ({
      myCases: gov.cases.filter((c) => c.memberId === memberId),
      myFines: gov.fines.filter((f) => f.memberId === memberId),
      myCommittees: gov.committees.filter((c) => c.memberIds.includes(memberId)),
      submitAppeal: (caseId: string) => gov.submitAppeal(caseId, memberId),
      submitFineAppeal: gov.submitFineAppeal,
    }),
    [gov, memberId]
  )
}
