import type { Alert, Member } from '../types'
import type { RsvpExcuse } from '../types/features'
import type { Prospect } from '../types'

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Build exec Action Ledger from live chapter data (not mock alerts). */
export function buildLiveAlerts(input: {
  members: Member[]
  excuses: RsvpExcuse[]
  prospects: Prospect[]
}): Alert[] {
  const { members, excuses, prospects } = input
  const alerts: Alert[] = []

  const unpaid = members.filter(
    (m) =>
      (m.status === 'Active' || m.status === 'New Member') &&
      (m.duesStatus === 'Overdue' ||
        m.duesStatus === 'Outstanding' ||
        m.duesStatus === 'Partially Paid' ||
        m.duesExpected - m.duesPaid > 0)
  )
  if (unpaid.length > 0) {
    alerts.push({
      id: 'live-dues',
      type: 'dues',
      title: `${unpaid.length} unpaid dues`,
      description: 'Members with outstanding balances',
      priority: unpaid.some((m) => m.duesStatus === 'Overdue' || m.duesStatus === 'Outstanding')
        ? 'high'
        : 'medium',
      link: '/dues',
    })
  }

  const lowAtt = members.filter(
    (m) =>
      (m.status === 'Active' || m.status === 'New Member') && m.attendancePct < 70
  )
  if (lowAtt.length > 0) {
    alerts.push({
      id: 'live-attendance',
      type: 'attendance',
      title: `${lowAtt.length} low attendance`,
      description: 'Below 70% recorded attendance',
      priority: 'high',
      link: '/members',
    })
  }

  const pendingExcuses = excuses.filter((e) => e.status === 'pending')
  if (pendingExcuses.length > 0) {
    alerts.push({
      id: 'live-excuses',
      type: 'task',
      title: `${pendingExcuses.length} excuse${pendingExcuses.length === 1 ? '' : 's'} pending`,
      description: 'Awaiting exec review',
      priority: 'high',
      link: '/excuses',
    })
  }

  const today = todayIso()
  const followUps = prospects.filter(
    (p) =>
      !['Accepted', 'New Member'].includes(p.status) &&
      p.nextFollowUp &&
      p.nextFollowUp <= today
  )
  if (followUps.length > 0) {
    alerts.push({
      id: 'live-recruitment',
      type: 'recruitment',
      title: `${followUps.length} follow-up${followUps.length === 1 ? '' : 's'} due`,
      description: 'PNMs / candidates needing contact',
      priority: 'medium',
      link: '/recruitment',
    })
  }

  return alerts
}

export function localTodayIso(): string {
  return todayIso()
}
