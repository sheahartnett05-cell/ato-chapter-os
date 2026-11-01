import { budgetTotals } from '../../types/budget'
import { eventAttendancePct, formatAttendancePct } from '../attendance/attendanceMath'
import {
  formatHomeEventDateTime,
  nextEventTileValue,
  truncateTileText,
} from '../homeDateFormat'
import {
  memberStudyHoursRequired,
  memberVerifiedHours,
} from '../studyHours'
import type { DashboardDataSnapshot, StatTileViewModel } from './dashboardTypes'
import { daysUntil, formatMoneyCompact } from './dashboardTypes'
import type { DashboardTileId } from './tileIds'
import { TILE_REGISTRY, tileLabelUpper } from './tileRegistryMeta'

function activeMembers(s: DashboardDataSnapshot) {
  return s.members.filter((m) => m.status === 'Active' || m.status === 'New Member')
}

function rosterWithBalance(s: DashboardDataSnapshot) {
  return activeMembers(s).map((m) => ({
    member: m,
    balance: s.memberDuesBalance(m.id),
  }))
}

function duesTotals(s: DashboardDataSnapshot) {
  const roster = rosterWithBalance(s)
  const billed = s.duesCharges.reduce(
    (sum, c) => sum + c.amount * (c.assignedMemberIds.length || roster.length),
    0
  )
  const collected = s.duesPayments.reduce((sum, p) => sum + p.amountPaid, 0)
  const outstanding = roster.reduce((sum, r) => sum + r.balance, 0)
  const outstandingCount = roster.filter((r) => r.balance > 0).length
  return { billed, collected, outstanding, outstandingCount }
}

function lastPastMeetingWithAttendance(s: DashboardDataSnapshot) {
  return (
    s.events
      .filter((e) => e.date < s.today && s.getEventAttendance(e.id).length > 0)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))[0] ?? null
  )
}

function semesterAvgMeetingAttendance(s: DashboardDataSnapshot) {
  const past = s.events
    .filter((e) => e.date < s.today && s.getEventAttendance(e.id).length > 0)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .slice(0, 4)
  const pcts = past
    .map((e) => meetingAttendancePct(s, e.id))
    .filter((p): p is number => p != null)
  if (!pcts.length) return semesterAvgAttendance(s)
  return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length)
}

function tileBase(id: DashboardTileId, s: DashboardDataSnapshot): StatTileViewModel {
  return {
    id,
    label: tileLabelUpper(id, s.recruitmentTerm),
    href: TILE_REGISTRY[id].href,
    value: '—',
  }
}

function actionItemsContext(s: DashboardDataSnapshot): string {
  const { high, medium, low } = s.actionItemBreakdown
  const parts: string[] = []
  if (high > 0) parts.push(`${high} high`)
  if (medium > 0) parts.push(`${medium} med`)
  if (low > 0) parts.push(`${low} low`)
  return parts.length > 0 ? parts.join(' · ') : 'Nothing urgent'
}

function meetingAttendancePct(s: DashboardDataSnapshot, eventId: string) {
  return eventAttendancePct(s.getEventAttendance(eventId))
}

function semesterAvgAttendance(s: DashboardDataSnapshot) {
  const active = activeMembers(s)
  const pcts = active
    .map((m) => m.attendancePct)
    .filter((p): p is number => p != null && Number.isFinite(p))
  if (!pcts.length) return null
  return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length)
}

function nextUpcomingEvent(s: DashboardDataSnapshot) {
  return s.events
    .filter((e) => e.date >= s.today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0]
}

function studyBelowCount(s: DashboardDataSnapshot) {
  const ref = new Date()
  let below = 0
  let logged = 0
  for (const m of activeMembers(s)) {
    const req = memberStudyHoursRequired(s.studyHoursRequirements, m.id)
    if (req == null) continue
    const hrs = memberVerifiedHours(s.studyLogs, m.id, s.studyHoursReset, ref)
    logged += hrs
    if (hrs < req) below += 1
  }
  return { below, logged: Math.round(logged * 10) / 10 }
}

export function computeDashboardTile(
  id: DashboardTileId,
  s: DashboardDataSnapshot
): StatTileViewModel {
  const base = tileBase(id, s)

  switch (id) {
    case 'dues': {
      if (!s.duesCharges.length) {
        return {
          ...base,
          value: '—',
          empty: { message: 'No dues cycle set up', linkLabel: 'Set up dues', linkTo: '/dues' },
          href: '/dues',
        }
      }
      const { billed, collected, outstandingCount } = duesTotals(s)
      const pct = billed > 0 ? collected / billed : 0
      return {
        ...base,
        value: formatMoneyCompact(collected),
        context: `of ${formatMoneyCompact(billed)} · ${Math.round(pct * 100)}% · ${outstandingCount} outstanding`,
        progress: pct,
        href: '/dues',
        search: '?status=unpaid',
      }
    }
    case 'attendance': {
      const meeting = lastPastMeetingWithAttendance(s)
      if (!meeting) {
        return {
          ...base,
          empty: {
            message: 'No meeting recorded',
            linkLabel: 'Open attendance',
            linkTo: '/attendance',
          },
        }
      }
      const pct = meetingAttendancePct(s, meeting.id)
      const avg = semesterAvgMeetingAttendance(s)
      const trend =
        pct != null && avg != null
          ? {
              delta: Math.abs(pct - avg),
              direction: pct >= avg ? ('up' as const) : ('down' as const),
              goodWhen: 'up' as const,
            }
          : undefined
      return {
        ...base,
        value: formatAttendancePct(pct),
        context: `${truncateTileText(meeting.name, 28)} · semester avg ${formatAttendancePct(avg)}`,
        trend,
        search: `?event=${meeting.id}`,
      }
    }
    case 'next_event': {
      const ev = nextUpcomingEvent(s)
      if (!ev) {
        return {
          ...base,
          empty: { message: 'No upcoming events', linkLabel: 'Create event', linkTo: '/calendar?from=form-create' },
        }
      }
      const when = nextEventTileValue(ev.date, ev.time, s.today)
      const context = `${truncateTileText(ev.name, 36)} · ${formatHomeEventDateTime(ev.date, ev.time)}`
      return {
        ...base,
        value: when,
        context,
        href: `/events/${ev.id}`,
      }
    }
    case 'rush_pipeline': {
      const active = s.prospects.filter((p) => !['Accepted', 'New Member'].includes(p.status))
      const bids = active.filter((p) => p.status === 'Bid').length
      const bidDay = s.stubs.recruitmentMeta.bidDayDate
      const days = daysUntil(bidDay, s.today)
      return {
        ...base,
        value: String(active.length),
        context: `${bids} bids out · bid day in ${days}d`,
        href: '/recruitment',
      }
    }
    case 'budget': {
      if (!s.budgets.length) {
        return {
          ...base,
          empty: { message: 'No budgets yet', linkLabel: 'Budgets', linkTo: '/budgets' },
          href: '/budgets',
        }
      }
      let allocated = 0
      let spent = 0
      for (const b of s.budgets) {
        const t = budgetTotals(b)
        allocated += t.allocated
        spent += t.spent
      }
      const remaining = allocated - spent
      return {
        ...base,
        value: formatMoneyCompact(spent),
        context: `${formatMoneyCompact(remaining)} remaining`,
        progress: allocated > 0 ? spent / allocated : 0,
        href: '/budgets',
      }
    }
    case 'study_hours': {
      const { below, logged } = studyBelowCount(s)
      return {
        ...base,
        value: String(below),
        context: `${logged}h logged this period · below requirement`,
        href: '/library-hours',
        search: '?filter=below',
      }
    }
    case 'open_excuses': {
      const pending = s.excuses.filter((e) => e.status === 'pending').length
      return {
        ...base,
        value: String(pending),
        context: pending === 1 ? 'Awaiting review' : 'Awaiting review',
        search: '?tab=excuses&status=pending',
      }
    }
    case 'action_items': {
      return {
        ...base,
        value: String(s.actionItemCount),
        context: actionItemsContext(s),
        search: '#action-ledger',
      }
    }
    case 'minutes_pending': {
      const pending = s.stubs.meetingMinutes.filter((m) => !m.postedAt).length
      return {
        ...base,
        value: String(pending),
        context: 'Meetings without posted minutes',
        href: '/calendar',
      }
    }
    case 'roster_changes': {
      const pending = s.stubs.rosterChanges.filter((r) => r.status === 'pending').length
      return {
        ...base,
        value: String(pending),
        context: 'Pending roster changes',
        href: '/members',
        search: '?filter=pending',
      }
    }
    case 'good_standing': {
      const notGood = activeMembers(s).filter(
        (m) =>
          m.duesStatus === 'Overdue' ||
          m.duesStatus === 'Outstanding' ||
          (m.attendancePct != null && m.attendancePct < 70)
      ).length
      return {
        ...base,
        value: String(notGood),
        context: 'Not in good standing',
        href: '/members',
        search: '?filter=attention',
      }
    }
    case 'standards_cases': {
      const open = s.jBoardCases.filter(
        (c) => c.status === 'Pending' || c.status === 'Hearing Scheduled'
      ).length
      return {
        ...base,
        value: String(open),
        context: 'Open standards cases',
        href: '/standards',
      }
    }
    case 'repeat_absences': {
      const counts = new Map<string, number>()
      for (const e of s.events) {
        if (e.date >= s.today) continue
        for (const row of s.getEventAttendance(e.id)) {
          if (row.status === 'Absent') {
            counts.set(row.memberId, (counts.get(row.memberId) ?? 0) + 1)
          }
        }
      }
      const repeat = [...counts.values()].filter((n) => n >= 2).length
      return {
        ...base,
        value: String(repeat),
        context: '2+ unexcused absences',
        href: '/members',
        search: '?filter=attendance',
      }
    }
    case 'nm_class': {
      const nm = s.members.filter((m) => m.status === 'New Member')
      const reqs = s.stubs.nmRequirements
      const pct =
        reqs.length > 0
          ? Math.round(
              (reqs.reduce((sum, r) => sum + r.completedCount / r.totalCount, 0) / reqs.length) *
                100
            )
          : 0
      return {
        ...base,
        value: String(nm.length),
        context: `${pct}% avg requirements complete`,
        progress: pct / 100,
        href: '/members',
        search: '?filter=new-member',
      }
    }
    case 'nm_behind': {
      const behind = s.stubs.nmRequirements.filter(
        (r) => r.completedCount / r.totalCount < 0.5
      ).length
      return {
        ...base,
        value: String(behind),
        context: 'Behind on requirements',
        href: '/members',
        search: '?filter=new-member',
      }
    }
    case 'risk_forms': {
      const missing = s.stubs.eventRisk.filter((r) => !r.riskFormComplete).length
      return {
        ...base,
        value: String(missing),
        context: 'Upcoming events missing forms',
        href: '/calendar',
      }
    }
    case 'sober_monitors': {
      const need = s.stubs.eventRisk.filter(
        (r) => r.soberMonitorsAssigned < r.soberMonitorsNeeded
      ).length
      return {
        ...base,
        value: String(need),
        context: 'Events need sober monitors',
        href: '/calendar',
      }
    }
    case 'compliance_deadline': {
      const next = [...s.stubs.complianceDeadlines].sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate)
      )[0]
      if (!next) {
        return {
          ...base,
          empty: { message: 'No deadlines tracked', linkTo: '/chapter-setup' },
          href: '/chapter-setup',
        }
      }
      const d = daysUntil(next.dueDate, s.today)
      return {
        ...base,
        value: d <= 0 ? 'Due' : `${d}d`,
        context: next.label,
        href: '/chapter-setup',
      }
    }
    case 'service_hours': {
      const g = s.stubs.serviceHours
      if (!g.termGoalHours) {
        return { ...base, empty: { message: 'Service tracking not set up' }, href: '/chapter-setup' }
      }
      // Use stub service totals only — do not count library/study hour logs as service.
      return {
        ...base,
        value: `${g.loggedHours}`,
        context: `of ${g.termGoalHours}h term goal · min ${g.memberMinimumHours}h/member`,
        progress: g.termGoalHours > 0 ? g.loggedHours / g.termGoalHours : 0,
        href: '/chapter-setup',
      }
    }
    case 'funds_raised': {
      const p = s.stubs.philanthropy
      return {
        ...base,
        value: formatMoneyCompact(p.raisedDollars),
        context: `of ${formatMoneyCompact(p.termGoalDollars)} goal`,
        progress: p.termGoalDollars > 0 ? p.raisedDollars / p.termGoalDollars : 0,
        href: '/chapter-setup',
      }
    }
    case 'maintenance': {
      const open = s.stubs.maintenance.filter((m) => m.status !== 'done').length
      return {
        ...base,
        value: String(open),
        context: 'Open maintenance requests',
        href: '/house',
      }
    }
    case 'chores': {
      const c = s.stubs.chores
      const pct = c.assigned > 0 ? c.completed / c.assigned : 0
      return {
        ...base,
        value: `${Math.round(pct * 100)}%`,
        context: `${c.completed}/${c.assigned} this week`,
        progress: pct,
        href: '/house',
      }
    }
    case 'house_bills': {
      const open = s.stubs.houseBills.filter((b) => b.status === 'open')
      const total = open.reduce((sum, b) => sum + b.amountDue, 0)
      return {
        ...base,
        value: formatMoneyCompact(total),
        context: `${open.length} bill${open.length === 1 ? '' : 's'} outstanding`,
        href: '/house',
      }
    }
    case 'alumni': {
      const a = s.stubs.alumni
      const eventLine =
        a.nextEventName && a.nextEventDate
          ? `${truncateTileText(a.nextEventName, 24)} · ${formatHomeEventDateTime(a.nextEventDate)}`
          : a.nextEventName
            ? truncateTileText(a.nextEventName, 32)
            : ''
      return {
        ...base,
        value: String(a.contactCount),
        context: eventLine
          ? `${eventLine} · ${formatMoneyCompact(a.donationsThisTerm)} raised`
          : `${formatMoneyCompact(a.donationsThisTerm)} raised this term`,
        href: '/chapter-setup',
      }
    }
    case 'participation': {
      const required = s.events
        .filter((e) => e.date < s.today && e.required)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
      if (!required.length) {
        return {
          ...base,
          empty: { message: 'No required events yet', linkLabel: 'Calendar', linkTo: '/calendar' },
          href: '/calendar',
        }
      }
      const pcts = required
        .map((e) => meetingAttendancePct(s, e.id))
        .filter((p): p is number => p != null)
      if (!pcts.length) {
        return {
          ...base,
          value: '—',
          context: 'Last 3 required events',
          href: '/calendar',
        }
      }
      const avg = Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length)
      return {
        ...base,
        value: `${avg}%`,
        context: 'Last 3 required events',
        href: '/calendar',
      }
    }
    default:
      return base
  }
}
