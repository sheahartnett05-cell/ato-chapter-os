import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, ListRow } from '../components/ui/Section'
import { StatusPill } from '../components/ui/StatusPill'
import { rsvpExcuses } from '../data/featureData'
import { getMember } from '../data/mockData'
import { useChapterOps } from '../context/ChapterOpsContext'
import type { RsvpExcuse } from '../types/features'

export default function ExcuseApprovals() {
  const [excuses, setExcuses] = useState(rsvpExcuses)
  const { events } = useChapterOps()

  const updateStatus = (id: string, status: RsvpExcuse['status']) => {
    setExcuses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              reviewedBy: 'Marcus Chen',
              reviewedAt: new Date().toISOString(),
            }
          : e
      )
    )
  }

  const pending = excuses.filter((e) => e.status === 'pending')

  return (
    <>
      <TopBar
        title="Excuse Approvals"
        subtitle={`${pending.length} pending review`}
      />
      <PageShell>
        <div className="divide-y divide-black/5 rounded-2xl bg-neutral-50/60">
          {excuses.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-500">No excuses submitted.</p>
          ) : (
            excuses.map((excuse) => {
              const member = getMember(excuse.memberId)
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
