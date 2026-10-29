import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Users, Phone, Calendar, TrendingUp, Plus } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card, CardHeader } from '../components/ui/Card'
import { MemberAvatar } from '../components/ui/MemberAvatar'
import { StatusPill } from '../components/ui/StatusPill'
import { AddProspectModal } from '../components/recruitment/AddProspectModal'
import { ClearCycleButton } from '../components/recruitment/ClearCycleButton'
import { CycleSwitcher } from '../components/recruitment/CycleSwitcher'
import { PIPELINE_STAGES } from '../data/pipelineStages'
import { useRecruitment } from '../context/RecruitmentContext'
import type { PipelineStage } from '../types'
import { useChapter } from '../context/ChapterContext'
import { localTodayIso } from '../lib/liveAlerts'
import { computeBidStats } from '../lib/recruitment/bidStats'

export default function RecruitmentDashboard() {
  const { languagePack } = useChapter()
  const {
    boardProspects,
    canEditRecruitment,
    isViewingArchived,
    viewCycle,
    activeCycle,
  } = useRecruitment()
  const [addOpen, setAddOpen] = useState(false)

  const cycle = viewCycle ?? activeCycle
  const visibleProspects = boardProspects

  const stageCounts = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = visibleProspects.filter((p) => p.status === stage).length
      return acc
    },
    {} as Record<PipelineStage, number>
  )

  const totalActive = visibleProspects.filter(
    (p) => !['Accepted', 'New Member'].includes(p.status) && p.bid?.response !== 'declined'
  ).length

  const today = localTodayIso()
  const needsFollowUp = visibleProspects.filter(
    (p) =>
      !['Accepted', 'New Member'].includes(p.status) &&
      p.bid?.response !== 'declined' &&
      p.nextFollowUp &&
      p.nextFollowUp <= today
  )

  const bidStats = useMemo(() => computeBidStats(visibleProspects, today), [visibleProspects, today])

  const topProspects = visibleProspects
    .filter((p) => p.rating >= 4)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)

  return (
    <>
      <TopBar
        title={`${languagePack.recruitmentTerm} Dashboard`}
        subtitle={
          cycle
            ? `${cycle.label}${cycle.archivedAt ? ' · archived' : ' · active'}${
                cycle.bidDay ? ` · bid day ${cycle.bidDay}` : ''
              }`
            : `${languagePack.recruitmentTerm} cycle`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ClearCycleButton />
            {canEditRecruitment && !isViewingArchived && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                <Plus size={16} />
                Add PNM
              </button>
            )}
            <Link
              to="/recruitment/pipeline"
              className="flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Open Pipeline
              <ArrowRight size={16} />
            </Link>
          </div>
        }
      />

      <div className="space-y-6 p-8">
        <CycleSwitcher />
        {isViewingArchived && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Viewing an archived cycle — edits are disabled.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {PIPELINE_STAGES.map((stage) => (
            <Link
              key={stage}
              to="/recruitment/pipeline"
              className="rounded-xl border border-black/5 bg-white p-4 text-center transition hover:border-accent/40 hover:shadow-md"
            >
              <p className="text-2xl font-bold text-neutral-900">{stageCounts[stage]}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">{stage}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader title="Cycle overview" />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-neutral-50 p-4">
                <Users size={20} className="text-accent" />
                <p className="mt-2 text-2xl font-bold text-neutral-900">{totalActive}</p>
                <p className="text-xs text-neutral-500">Active prospects</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4">
                <TrendingUp size={20} className="text-emerald-600" />
                <p className="mt-2 text-2xl font-bold text-neutral-900">{bidStats.accepted}</p>
                <p className="text-xs text-neutral-500">Bids accepted</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Bids" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-lg font-bold text-neutral-900">{bidStats.extended}</p>
                <p className="text-xs text-neutral-500">Extended</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-lg font-bold text-neutral-900">{bidStats.pending}</p>
                <p className="text-xs text-neutral-500">Pending</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-lg font-bold text-emerald-800">{bidStats.accepted}</p>
                <p className="text-xs text-emerald-700">Accepted</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-lg font-bold text-neutral-900">{bidStats.declined}</p>
                <p className="text-xs text-neutral-500">Declined</p>
              </div>
            </div>
            {bidStats.overduePending > 0 && (
              <p className="mt-3 text-xs font-medium text-red-700">
                {bidStats.overduePending} pending bid
                {bidStats.overduePending === 1 ? '' : 's'} past deadline
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Follow-ups due"
              action={
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <Calendar size={12} /> {needsFollowUp.length} due
                </span>
              }
            />
            {needsFollowUp.length === 0 ? (
              <p className="text-sm text-neutral-500">All caught up</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {needsFollowUp.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/recruitment/pnm/${p.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-neutral-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <MemberAvatar photoUrl={p.photoUrl} initials={p.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {p.assignedBrother}
                            {p.nextFollowUp ? ` · due ${p.nextFollowUp}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill label={p.status} variant="gold" />
                        <Phone size={14} className="text-neutral-400" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader title="Top-rated prospects" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topProspects.map((p) => (
              <Link
                key={p.id}
                to={`/recruitment/pnm/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-black/5 p-4 transition hover:border-accent/30"
              >
                <MemberAvatar photoUrl={p.photoUrl} initials={p.avatar} size="md" />
                <div>
                  <p className="font-semibold text-neutral-900">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">{p.major}</p>
                  <p className="mt-1 text-xs font-medium text-accent">{p.rating}/5 rating</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <AddProspectModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
