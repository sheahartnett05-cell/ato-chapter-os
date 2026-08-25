import { Check, X } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, ListRow } from '../components/ui/Section'
import { StatusPill } from '../components/ui/StatusPill'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useMembers } from '../context/MembersContext'
import { useAuth } from '../context/AuthContext'
import { useGovernance } from '../context/GovernanceContext'
import { useStandardsModuleConfig } from '../hooks/useStandardsModuleConfig'
import type { RsvpExcuse } from '../types/features'

export default function ExcuseApprovals() {
  const { excuses, events, updateExcuseStatus, setAttendanceEntry } = useChapterOps()
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
      setAttendanceEntry(excuse.eventId, excuse.memberId, 'Excused', 0)
      return
    }

    if (status === 'denied') {
      const event = events.find((e) => e.id === excuse.eventId)
      setAttendanceEntry(excuse.eventId, excuse.memberId, 'Absent', 0)
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
      })
    }
  }

  const pending = excuses.filter((e) => e.status === 'pending')
  const sorted = [...excuses].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )

  return (
    <>
      <TopBar
        title="Excuse Approvals"
        subtitle={`${pending.length} pending · ${config.excuse_policy.lead_time_hours}h lead time · deny issues fine`}
      />
      <PageShell>
        <div className="divide-y divide-black/5 rounded-2xl bg-neutral-50/60">
          {sorted.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-500">No excuses submitted.</p>
          ) : (
            sorted.map((excuse) => {
              const member = getMemberById(excuse.memberId)
              const event = events.find((e) => e.id === excuse.eventId)
              return (
                <ListRow key={excuse.id}>
                  <div className="flex flex-1 flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-900">
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
                      <p className="mt-1 text-xs font-medium text-neutral-500">
                        {event?.name} ·{' '}
                        {new Date(excuse.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-sm text-neutral-600">{excuse.reason}</p>
                      {excuse.reviewedBy && excuse.reviewedAt && (
                        <p className="mt-1 text-xs text-neutral-400">
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
                          className="flex items-center gap-1.5 rounded-sm bg-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-300"
                        >
                          <X size={14} /> Deny
                        </button>
                      </div>
                    )}
                  </div>
                </ListRow>
              )
            })
          )}
        </div>
      </PageShell>
    </>
  )
}
