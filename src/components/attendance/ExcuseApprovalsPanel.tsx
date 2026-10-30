import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { ListRow } from '../ui/Section'
import { StatusPill } from '../ui/StatusPill'
import { useChapterOps } from '../../context/ChapterOpsContext'
import { useMembers } from '../../context/MembersContext'
import { useAuth } from '../../context/AuthContext'
import { useGovernance } from '../../context/GovernanceContext'
import { useStandardsModuleConfig } from '../../hooks/useStandardsModuleConfig'
import type { RsvpExcuse } from '../../types/features'

type Props = {
  statusFilter?: string | null
}

export function ExcuseApprovalsPanel({ statusFilter }: Props) {
  const {
    excuses,
    events,
    updateExcuseStatus,
    applyExcuseAttendanceDecision,
    getEventAttendance,
  } = useChapterOps()
  const { getMemberById } = useMembers()
  const { profile } = useAuth()
  const { issueFine } = useGovernance()
  const { config } = useStandardsModuleConfig()
  const reviewerName = `${profile.firstName} ${profile.lastName}`.trim() || 'Exec'

  const absenceFine =
    config.fine_matrix.find(
      (f) => f.is_active && f.title.toLowerCase().includes('unexcused chapter')
    ) ??
    config.fine_matrix.find((f) => f.is_active && f.type === 'fine') ??
    null

  const updateStatus = (id: string, status: RsvpExcuse['status']) => {
    const excuse = excuses.find((e) => e.id === id)
    if (!excuse) return

    updateExcuseStatus(id, status, reviewerName)

    if (status === 'approved') {
      applyExcuseAttendanceDecision(id, 'approved')
      return
    }

    if (status === 'denied') {
      const prior = getEventAttendance(excuse.eventId).find(
        (a) => a.memberId === excuse.memberId
      )
      const wasExcused = prior?.status === 'Excused'
      applyExcuseAttendanceDecision(id, 'denied')

      if (wasExcused) return

      const event = events.find((e) => e.id === excuse.eventId)
      const amount = absenceFine?.fine_amount ?? 15
      const due = new Date()
      due.setDate(due.getDate() + 14)
      issueFine({
        memberId: excuse.memberId,
        amount,
        reason: `Denied excuse · ${event?.name ?? 'Required event'}`,
        dateIssued: new Date().toISOString().slice(0, 10),
        dueDate: due.toISOString().slice(0, 10),
        status: 'Unpaid',
        sourceRef: excuse.id,
      })
    }
  }

  const visible = useMemo(() => {
    const base =
      statusFilter === 'pending' ? excuses.filter((e) => e.status === 'pending') : excuses
    return [...base].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )
  }, [excuses, statusFilter])

  if (visible.length === 0) {
    return <p className="p-8 text-center text-sm text-[var(--muted)]">No excuses submitted.</p>
  }

  return (
    <div className="divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)] bg-[var(--surface-card)]">
      {visible.map((excuse) => {
        const member = getMemberById(excuse.memberId)
        const event = events.find((e) => e.id === excuse.eventId)
        return (
          <ListRow key={excuse.id}>
            <div className="flex flex-1 flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[var(--ink)]">
                    {member?.firstName} {member?.lastName}
                  </p>
                  <StatusPill
                    label={excuse.status}
                    variant={
                      excuse.status === 'approved'
                        ? 'present'
                        : excuse.status === 'denied'
                          ? 'absent'
                          : 'maybe'
                    }
                  />
                </div>
                <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                  {event?.name} · {new Date(excuse.submittedAt).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{excuse.reason}</p>
                {excuse.reviewedBy && excuse.reviewedAt && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Reviewed by {excuse.reviewedBy} ·{' '}
                    {new Date(excuse.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              {excuse.status === 'pending' && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(excuse.id, 'approved')}
                    className="flex items-center gap-1.5 rounded-sm bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(excuse.id, 'denied')}
                    className="flex items-center gap-1.5 rounded-sm bg-[var(--surface-tint)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-black/5"
                  >
                    <X size={14} /> Deny
                  </button>
                </div>
              )}
            </div>
          </ListRow>
        )
      })}
    </div>
  )
}
