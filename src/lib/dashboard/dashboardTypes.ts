import type { Member, Prospect, Event, AttendanceEntry } from '../../types'
import type { RsvpExcuse } from '../../types/features'
import type {
  DuesCharge,
  DuesPayment,
  StudyHoursLog,
  StudyHoursRequirementsConfig,
  StudyHoursResetConfig,
} from '../../types/chapterOps'
import type { ChapterBudget } from '../../types/budget'
import type { JBoardCase } from '../../types/governance'
import type { DashboardStubBundle } from '../../types/dashboardStubs'
import type { DashboardTileId } from './tileIds'

export type TileTrend = {
  delta: number
  direction: 'up' | 'down'
  goodWhen: 'up' | 'down'
}

export type StatTileViewModel = {
  id: DashboardTileId
  label: string
  value: string
  context?: string
  progress?: number
  trend?: TileTrend
  href: string
  search?: string
  loading?: boolean
  empty?: { message: string; linkLabel?: string; linkTo?: string }
}

export interface DashboardDataSnapshot {
  today: string
  members: Member[]
  events: Event[]
  getEventAttendance: (eventId: string) => AttendanceEntry[]
  excuses: RsvpExcuse[]
  prospects: Prospect[]
  duesCharges: DuesCharge[]
  duesPayments: DuesPayment[]
  memberDuesBalance: (memberId: string) => number
  budgets: ChapterBudget[]
  studyLogs: StudyHoursLog[]
  studyHoursRequirements: StudyHoursRequirementsConfig
  studyHoursReset: StudyHoursResetConfig
  stubs: DashboardStubBundle
  jBoardCases: JBoardCase[]
  actionItemCount: number
  actionItemBreakdown: { high: number; medium: number; low: number }
  recruitmentTerm: string
}

export function formatMoneyCompact(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${Math.round(n)}`
}

export function daysUntil(isoDate: string, today: string): number {
  const a = new Date(`${today}T12:00:00`).getTime()
  const b = new Date(`${isoDate}T12:00:00`).getTime()
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}
