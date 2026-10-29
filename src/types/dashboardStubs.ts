/** Minimal records for dashboard tiles — full modules TODO. */

export interface MeetingMinutesRecord {
  eventId: string
  postedAt?: string
}

export interface RosterChangeRequest {
  id: string
  memberId: string
  summary: string
  status: 'pending' | 'approved' | 'denied'
  submittedAt: string
}

export interface ComplianceDeadline {
  id: string
  label: string
  dueDate: string
  source: 'national' | 'university' | 'chapter'
}

export interface ChapterServiceHoursGoal {
  termGoalHours: number
  loggedHours: number
  memberMinimumHours: number
}

export interface PhilanthropyGoal {
  termGoalDollars: number
  raisedDollars: number
}

export interface HouseBillStub {
  id: string
  label: string
  amountDue: number
  dueDate: string
  status: 'open' | 'paid'
}

export interface MaintenanceRequestStub {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'done'
  submittedAt: string
}

export interface ChoreWeekStub {
  weekStart: string
  assigned: number
  completed: number
}

export interface AlumniDashboardStub {
  contactCount: number
  nextEventName?: string
  nextEventDate?: string
  donationsThisTerm: number
}

export interface NewMemberRequirementStub {
  memberId: string
  completedCount: number
  totalCount: number
}

export interface EventRiskStub {
  eventId: string
  riskFormComplete: boolean
  soberMonitorsNeeded: number
  soberMonitorsAssigned: number
}

export interface RecruitmentMetaStub {
  bidDayDate: string
}

export interface DashboardStubBundle {
  meetingMinutes: MeetingMinutesRecord[]
  rosterChanges: RosterChangeRequest[]
  complianceDeadlines: ComplianceDeadline[]
  serviceHours: ChapterServiceHoursGoal
  philanthropy: PhilanthropyGoal
  houseBills: HouseBillStub[]
  maintenance: MaintenanceRequestStub[]
  chores: ChoreWeekStub
  alumni: AlumniDashboardStub
  nmRequirements: NewMemberRequirementStub[]
  eventRisk: EventRiskStub[]
  recruitmentMeta: RecruitmentMetaStub
}

import type { OfficerFunction } from './officerFunction'
import type { DashboardTileId } from '../lib/dashboard/tileIds'

export type ChapterDashboardLayouts = Partial<Record<OfficerFunction, DashboardTileId[]>>
