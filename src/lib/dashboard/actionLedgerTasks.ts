import type { Member, Prospect, Event } from '../../types'
import type { RsvpExcuse } from '../../types/features'
import type { Alert } from '../../types'
import type { OfficerFunction } from '../../types/officerFunction'
import { localTodayIso } from '../liveAlerts'
import { formatHomeEventDateShort } from '../homeDateFormat'

export type ActionLedgerTask = Alert & { functions?: OfficerFunction[] }

function memberName(m: Member | undefined) {
  if (!m) return 'Member'
  return `${m.firstName} ${m.lastName}`.trim()
}

export function buildActionLedgerTasks(input: {
  activeFunction: OfficerFunction
  members: Member[]
  events: Event[]
  excuses: RsvpExcuse[]
  prospects: Prospect[]
  getMemberById: (id: string) => Member | undefined
}): ActionLedgerTask[] {
  const { members, events, excuses, prospects, getMemberById, activeFunction } = input
  const today = localTodayIso()
  const tasks: ActionLedgerTask[] = []

  for (const ex of excuses.filter((e) => e.status === 'pending')) {
    const m = getMemberById(ex.memberId)
    const ev = events.find((e) => e.id === ex.eventId)
    const dateLabel = ev ? formatHomeEventDateShort(ev.date) : 'meeting'
    tasks.push({
      id: `excuse-${ex.id}`,
      type: 'task',
      title: `Approve ${memberName(m)}'s excuse · ${dateLabel}`,
      description: ev?.name ?? '',
      priority: 'high',
      link: `/excuses?status=pending`,
      functions: ['president', 'internal_vp_standards', 'treasurer', 'secretary', 'other'],
    })
  }

  const overdueDues = members.filter(
    (m) =>
      (m.status === 'Active' || m.status === 'New Member') &&
      (m.duesStatus === 'Overdue' || m.duesStatus === 'Outstanding')
  )
  if (overdueDues.length > 0) {
    tasks.push({
      id: 'dues-remind',
      type: 'dues',
      title: `Remind ${overdueDues.length} member${overdueDues.length === 1 ? '' : 's'} · dues 30+ days late`,
      description: 'Outstanding chapter balances',
      priority: 'high',
      link: '/dues?status=unpaid',
      functions: ['president', 'treasurer', 'other'],
    })
  }

  const partial = members.filter(
    (m) =>
      (m.status === 'Active' || m.status === 'New Member') &&
      m.duesStatus === 'Partially Paid'
  )
  if (partial.length > 0 && overdueDues.length === 0) {
    tasks.push({
      id: 'dues-partial',
      type: 'dues',
      title: `Follow up · ${partial.length} partial dues payment${partial.length === 1 ? '' : 's'}`,
      description: 'Partial balances on chapter dues',
      priority: 'medium',
      link: '/dues?status=unpaid',
      functions: ['treasurer', 'president'],
    })
  }

  const followUps = prospects.filter(
    (p) =>
      !['Accepted', 'New Member'].includes(p.status) &&
      p.nextFollowUp &&
      p.nextFollowUp <= today
  )
  if (followUps.length > 0) {
    tasks.push({
      id: 'pnm-followup',
      type: 'recruitment',
      title: `Follow up with ${followUps.length} PNM${followUps.length === 1 ? '' : 's'}`,
      description: 'Recruitment follow-ups due',
      priority: 'medium',
      link: '/recruitment',
      functions: ['recruitment', 'president'],
    })
  }

  const lowStudy = members.filter(
    (m) => (m.status === 'Active' || m.status === 'New Member') && m.attendancePct < 70
  )
  if (lowStudy.length > 0) {
    const first = lowStudy[0]
    tasks.push({
      id: 'attendance-low',
      type: 'attendance',
      title: `Check in · ${memberName(first)} · ${first.attendancePct}% attendance`,
      description:
        lowStudy.length > 1 ? `+${lowStudy.length - 1} more below 70%` : '',
      priority: 'high',
      link: '/members?filter=attendance',
      functions: ['scholarship', 'internal_vp_standards', 'president'],
    })
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const filtered = tasks.filter(
    (t) => !t.functions || t.functions.includes(activeFunction) || activeFunction === 'president'
  )
  filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  return filtered
}

export function actionItemCount(tasks: ActionLedgerTask[]): number {
  return tasks.length
}
