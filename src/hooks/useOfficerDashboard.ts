import { useMemo, useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChapter } from '../context/ChapterContext'
import { useChapterPositions } from '../context/ChapterPositionsContext'
import { useMembers } from '../context/MembersContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useRecruitment } from '../context/RecruitmentContext'
import { useBudgets } from '../context/BudgetContext'
import { useGovernance } from '../context/GovernanceContext'
import { inferFunctionFromTitle, compareFunctionPrecedence } from '../lib/officerFunctions'
import type { OfficerFunction } from '../types/officerFunction'
import { officerFunctionLabel } from '../types/officerFunction'
import type { ChapterPosition } from '../types/features'
import {
  readActiveDashboardFunction,
  resolveTileSet,
  writeActiveDashboardFunction,
} from '../lib/dashboard/resolveDashboard'
import { computeDashboardTile } from '../lib/dashboard/dashboardTileCompute'
import {
  actionItemCount,
  buildActionLedgerTasks,
} from '../lib/dashboard/actionLedgerTasks'
import { localTodayIso } from '../lib/liveAlerts'
import { readJson } from '../lib/persist'
import { STORAGE_KEYS } from '../lib/demoSeed'
import type { DashboardStubBundle } from '../types/dashboardStubs'
import { EMPTY_DASHBOARD_STUBS } from '../data/dashboardStubSeed'
import type { StatTileViewModel } from '../lib/dashboard/dashboardTypes'
import { filterDisplayableTiles } from '../lib/dashboard/displayTiles'

function positionFunction(p: ChapterPosition, orgId: string): OfficerFunction {
  if (p.function) return p.function
  return inferFunctionFromTitle(p.title, orgId)
}

export function useOfficerDashboard() {
  const { onboarding } = useAuth()
  const { chapter } = useChapter()
  const { positions } = useChapterPositions()
  const { members, getMemberById } = useMembers()
  const ops = useChapterOps()
  const { prospects } = useRecruitment()
  const { budgets } = useBudgets()
  const { cases } = useGovernance()
  const memberId = onboarding?.memberId

  const stubs = useMemo(
    () =>
      readJson<DashboardStubBundle>(STORAGE_KEYS.dashboardStubs, EMPTY_DASHBOARD_STUBS),
    []
  )

  const myPositions = useMemo(() => {
    if (!memberId) return []
    return positions.filter((p) => p.assignedMemberId === memberId)
  }, [positions, memberId])

  const positionsWithFn = useMemo(
    () =>
      myPositions.map((p) => ({
        position: p,
        fn: positionFunction(p, chapter.id),
      })),
    [myPositions, chapter.id]
  )

  const defaultFunction = useMemo((): OfficerFunction => {
    if (positionsWithFn.length === 0) {
      if (onboarding?.role === 'Treasurer') return 'treasurer'
      if (onboarding?.role === 'RecruitmentChair') return 'recruitment'
      if (onboarding?.role === 'ScholarshipChair') return 'scholarship'
      if (onboarding?.role === 'JBoardChair') return 'internal_vp_standards'
      return 'president'
    }
    const sorted = [...positionsWithFn].sort((a, b) =>
      compareFunctionPrecedence(a.fn, b.fn)
    )
    return sorted[0].fn
  }, [positionsWithFn, onboarding?.role])

  const [activeFunction, setActiveFunctionState] = useState<OfficerFunction>(() => {
    const stored = readActiveDashboardFunction()
    if (stored) return stored
    return defaultFunction
  })

  useEffect(() => {
    const stored = readActiveDashboardFunction()
    if (!stored) setActiveFunctionState(defaultFunction)
  }, [defaultFunction])

  const setActiveFunction = useCallback((fn: OfficerFunction) => {
    writeActiveDashboardFunction(fn)
    setActiveFunctionState(fn)
  }, [])

  const activeTitle = useMemo(() => {
    const match = positionsWithFn.find((p) => p.fn === activeFunction)
    return match?.position.title ?? officerFunctionLabel(activeFunction)
  }, [positionsWithFn, activeFunction])

  const today = localTodayIso()

  const ledgerTasks = useMemo(
    () =>
      buildActionLedgerTasks({
        activeFunction,
        members,
        events: ops.events,
        excuses: ops.excuses,
        prospects,
        getMemberById,
      }),
    [activeFunction, members, ops.events, ops.excuses, prospects, getMemberById]
  )

  const tiles = useMemo((): StatTileViewModel[] => {
    const tileIds = resolveTileSet(activeFunction)
    const snapshot = {
      today,
      members,
      events: ops.events,
      getEventAttendance: ops.getEventAttendance,
      excuses: ops.excuses,
      prospects,
      duesCharges: ops.duesCharges,
      duesPayments: ops.duesPayments,
      memberDuesBalance: ops.memberDuesBalance,
      budgets,
      studyLogs: ops.studyLogs,
      studyHoursRequirements: ops.studyHoursRequirements,
      studyHoursReset: ops.studyHoursReset,
      stubs,
      jBoardCases: cases,
      actionItemCount: actionItemCount(ledgerTasks),
      actionItemBreakdown: {
        high: ledgerTasks.filter((t) => t.priority === 'high').length,
        medium: ledgerTasks.filter((t) => t.priority === 'medium').length,
        low: ledgerTasks.filter((t) => t.priority === 'low').length,
      },
      recruitmentTerm: chapter.languagePack.recruitmentTerm,
    }
    const computed = tileIds.map((id) => computeDashboardTile(id, snapshot))
    return filterDisplayableTiles(computed)
  }, [
    activeFunction,
    today,
    members,
    ops,
    prospects,
    budgets,
    stubs,
    cases,
    ledgerTasks,
    chapter.languagePack.recruitmentTerm,
  ])

  const functionOptions = useMemo(() => {
    if (positionsWithFn.length <= 1) return []
    return positionsWithFn.map((p) => ({
      fn: p.fn,
      title: p.position.title,
    }))
  }, [positionsWithFn])

  return {
    tiles,
    ledgerTasks,
    activeFunction,
    activeTitle,
    setActiveFunction,
    functionOptions,
  }
}
