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

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function readCommittees(): Committee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.committees)
    if (raw) {
      const parsed = JSON.parse(raw) as Committee[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return allowDemoData() ? initialCommittees : []
}

function readChatMessages(): CommitteeChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.committeeChat)
    if (raw) {
      const parsed = JSON.parse(raw) as CommitteeChatMessage[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return allowDemoData() ? initialChat : []
}

function writeCommittees(next: Committee[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.committees, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
}

function writeChatMessages(next: CommitteeChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.committeeChat, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
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
  const [cases, setCases] = useState(() => (allowDemoData() ? initialCases : []))
  const [finesList, setFinesList] = useState(() => (allowDemoData() ? initialFines : []))
  const [committees, setCommittees] = useState<Committee[]>(readCommittees)
  const [committeeChat, setCommitteeChat] = useState<CommitteeChatMessage[]>(readChatMessages)
  const [announcements, setAnnouncements] = useState(() =>
    allowDemoData() ? initialAnnouncements : []
  )
  const [tasks] = useState(() => (allowDemoData() ? initialTasks : []))
  const [fineSchedule, setFineSchedule] = useState(() =>
    allowDemoData() ? initialFineSchedule : []
  )
  const [config, setConfig] = useState(initialConfig)

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
    setCases((prev) => [...prev, { ...caseData, id }])
    if (caseData.sanctionType === 'Fine' && caseData.fineAmount > 0) {
      setFinesList((prev) => [
        ...prev,
        {
          id: `f-${Date.now()}`,
          memberId: caseData.memberId,
          caseId: id,
          amount: caseData.fineAmount,
          reason: `${caseData.category} — ${caseData.description.slice(0, 40)}`,
          dateIssued: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          status: 'Unpaid',
        },
      ])
    }
  }, [])

  const issueFine = useCallback((fine: Omit<Fine, 'id'>) => {
    setFinesList((prev) => [...prev, { ...fine, id: `f-${Date.now()}` }])
  }, [])

  const updateFineStatus = useCallback((id: string, status: Fine['status']) => {
    setFinesList((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)))
  }, [])

  const submitAppeal = useCallback((caseId: string, memberId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId && c.memberId === memberId ? { ...c, appealSubmitted: true } : c
      )
    )
  }, [])

  const submitFineAppeal = useCallback((fineId: string) => {
    setFinesList((prev) =>
      prev.map((f) => (f.id === fineId ? { ...f, status: 'Appealed' } : f))
    )
  }, [])

  const updateConfig = useCallback((patch: Partial<GovernanceConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateFineSchedule = useCallback((rules: FineScheduleRule[]) => {
    setFineSchedule(rules)
  }, [])

  const addGroupAnnouncement = useCallback(
    (a: Omit<GroupAnnouncement, 'id' | 'timestamp'>) => {
      setAnnouncements((prev) => [
        {
          ...a,
          id: `ga-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    []
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
