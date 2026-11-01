import type { DashboardStubBundle } from '../types/dashboardStubs'
import { addDays, localTodayIso } from '../lib/demoRelativeDates'

export function buildDashboardStubSeed(eventIds: {
  pastMeetingId: string
  upcomingIds: string[]
}): DashboardStubBundle {
  const today = localTodayIso()
  return {
    meetingMinutes: [{ eventId: eventIds.pastMeetingId }],
    rosterChanges: [
      {
        id: 'rc1',
        memberId: 'm9',
        summary: 'Status change to Alumni',
        status: 'pending',
        submittedAt: new Date(`${addDays(today, -2)}T10:00:00`).toISOString(),
      },
    ],
    complianceDeadlines: [
      {
        id: 'cd1',
        label: 'IFC roster certification',
        dueDate: addDays(today, 21),
        source: 'university',
      },
    ],
    serviceHours: {
      termGoalHours: 500,
      loggedHours: 312,
      memberMinimumHours: 8,
    },
    philanthropy: {
      termGoalDollars: 15000,
      raisedDollars: 9200,
    },
    houseBills: [
      {
        id: 'hb1',
        label: 'Utilities — October',
        amountDue: 840,
        dueDate: addDays(today, 8),
        status: 'open',
      },
    ],
    maintenance: [
      {
        id: 'mr1',
        title: 'Upstairs bathroom leak',
        status: 'open',
        submittedAt: new Date(`${addDays(today, -4)}T09:00:00`).toISOString(),
      },
    ],
    chores: {
      weekStart: addDays(today, -((new Date().getDay() + 6) % 7)),
      assigned: 28,
      completed: 19,
    },
    alumni: {
      contactCount: 142,
      nextEventName: 'Homecoming tailgate',
      nextEventDate: addDays(today, 12),
      donationsThisTerm: 4200,
    },
    nmRequirements: [
      { memberId: 'm7', completedCount: 4, totalCount: 8 },
      { memberId: 'm24', completedCount: 6, totalCount: 8 },
    ],
    eventRisk: eventIds.upcomingIds.map((eventId, i) => ({
      eventId,
      riskFormComplete: i > 0,
      soberMonitorsNeeded: 2,
      soberMonitorsAssigned: i === 0 ? 0 : 2,
    })),
    recruitmentMeta: {
      bidDayDate: addDays(today, 14),
    },
  }
}

export const EMPTY_DASHBOARD_STUBS: DashboardStubBundle = {
  meetingMinutes: [],
  rosterChanges: [],
  complianceDeadlines: [],
  serviceHours: { termGoalHours: 0, loggedHours: 0, memberMinimumHours: 0 },
  philanthropy: { termGoalDollars: 0, raisedDollars: 0 },
  houseBills: [],
  maintenance: [],
  chores: { weekStart: localTodayIso(), assigned: 0, completed: 0 },
  alumni: { contactCount: 0, donationsThisTerm: 0 },
  nmRequirements: [],
  eventRisk: [],
  recruitmentMeta: { bidDayDate: localTodayIso() },
}
