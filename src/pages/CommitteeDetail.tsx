import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { useGovernance } from '../context/GovernanceContext'
import { getMember } from '../data/mockData'
import { getCommittee } from '../data/governanceData'

export default function CommitteeDetail() {
  const { id } = useParams<{ id: string }>()
  const committee = getCommittee(id ?? '')
  const { groupAnnouncements, committeeTasks } = useGovernance()

  if (!committee) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-500">
        Committee not found
      </div>
    )
  }

  const feed = groupAnnouncements.filter((a) => a.committeeId === committee.id)
  const tasks = committeeTasks.filter((t) => t.committeeId === committee.id)
  const chair = getMember(committee.chairId)

  return (
    <>
      <TopBar
        title={committee.name}
        subtitle={`${committee.memberIds.length} members`}
        actions={
          <Link
            to="/committees"
            className="flex items-center gap-1 rounded-sm bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700"
          >
            <ArrowLeft size={12} /> Back
          </Link>
        }
      />
      <PageShell className="space-y-5">
        {/* Feed */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Feed</p>
          <ul className="space-y-1">
            {feed.length === 0 ? (
              <li className="text-xs text-neutral-500">No posts</li>
            ) : (
              feed.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-neutral-50"
                >
                  {a.isUrgent && (
                    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-700">
                      Urgent
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.title}</span>
                  <span className="shrink-0 text-[10px] text-neutral-400">
                    {new Date(a.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Roster */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Roster</p>
          <ul className="flex flex-wrap gap-2">
            {committee.memberIds.map((mid) => {
              const m = getMember(mid)
              const isChair = mid === committee.chairId
              return (
                <li
                  key={mid}
                  className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium ${
                    isChair ? 'bg-[var(--primary)] text-white' : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {m?.avatar} {m?.firstName}
                  {isChair && <span className="text-[9px] opacity-80">Chair</span>}
                </li>
              )
            })}
          </ul>
          {chair && (
            <p className="mt-2 text-[10px] text-neutral-400">Lead: {chair.firstName} {chair.lastName}</p>
          )}
        </div>

        {/* Tasks */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase text-neutral-400">Tasks</p>
          <ul className="space-y-2">
            {tasks.map((t) => {
              const assignee = t.assigneeId ? getMember(t.assigneeId) : null
              return (
                <li key={t.id} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{t.title}</span>
                    <span className="text-[10px] tabular-nums text-neutral-400">
                      {assignee?.firstName ?? '—'}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-neutral-200">
                    <div
                      className="h-full rounded-sm bg-[var(--accent)]"
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-neutral-400">{t.progress}%</p>
                </li>
              )
            })}
          </ul>
        </div>
      </PageShell>
    </>
  )
}
