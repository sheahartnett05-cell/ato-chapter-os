import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
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
import type {
  Committee,
  CommitteeTask,
  Fine,
  FineScheduleRule,
  GovernanceConfig,
  GroupAnnouncement,
  JBoardCase,
} from '../types/governance'

interface GovernanceContextValue {
  /** Mock viewer — exec admin vs regular member */
  viewerId: string
  cases: JBoardCase[]
  fines: Fine[]
  committees: Committee[]
  groupAnnouncements: GroupAnnouncement[]
  committeeTasks: CommitteeTask[]
  fineSchedule: FineScheduleRule[]
  config: GovernanceConfig
  canAdmin: boolean
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
  const [cases, setCases] = useState(initialCases)
  const [finesList, setFinesList] = useState(initialFines)
  const [committees] = useState(initialCommittees)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [tasks] = useState(initialTasks)
  const [fineSchedule, setFineSchedule] = useState(initialFineSchedule)
  const [config, setConfig] = useState(initialConfig)

  const viewerId = CURRENT_EXEC_ID
  const canAdmin = canViewAllCases(viewerId)

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
      groupAnnouncements: announcements,
      committeeTasks: tasks,
      fineSchedule,
      config,
      canAdmin,
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
      announcements,
      tasks,
      fineSchedule,
      config,
      canAdmin,
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
