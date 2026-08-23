import { Link } from 'react-router-dom'
import { ArrowRight, Users, Phone, Calendar, TrendingUp } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { prospects, PIPELINE_STAGES } from '../data/mockData'
import type { PipelineStage } from '../types'
import { useChapter } from '../context/ChapterContext'

export default function RecruitmentDashboard() {
  const { languagePack } = useChapter()
  const stageCounts = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = prospects.filter((p) => p.status === stage).length
      return acc
    },
    {} as Record<PipelineStage, number>
  )

  const totalActive = prospects.filter(
    (p) => !['Accepted', 'New Member'].includes(p.status)
  ).length

  const needsFollowUp = prospects.filter(
    (p) => p.nextFollowUp && new Date(p.nextFollowUp) <= new Date('2025-08-26')
  )

  const topProspects = prospects
    .filter((p) => p.rating >= 4)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)

  return (
    <>
      <TopBar
        title={`${languagePack.recruitmentTerm} Dashboard`}
        subtitle={`Fall 2025 ${languagePack.recruitmentTerm} Cycle`}
        actions={
          <Link
            to="/recruitment/pipeline"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-gold-dark"
          >
            Open Pipeline
            <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="space-y-6 p-8">
        {/* Pipeline metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {PIPELINE_STAGES.map((stage) => (
            <Link
              key={stage}
              to="/recruitment/pipeline"
              className="rounded-xl border border-border bg-white p-4 text-center transition hover:border-gold/40 hover:shadow-md"
            >
              <p className="text-2xl font-bold text-navy">{stageCounts[stage]}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{stage}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Overview stats */}
          <Card className="lg:col-span-2">
            <CardHeader title="Cycle Overview" subtitle="Key recruitment metrics" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Active Prospects', value: totalActive, icon: Users },
                { label: 'Contacted This Week', value: 6, icon: Phone },
                { label: 'Events This Month', value: 3, icon: Calendar },
                { label: 'Conversion Rate', value: '42%', icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-border p-4">
                  <Icon size={18} className="text-gold" />
                  <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Follow-ups needed */}
          <Card>
            <CardHeader
              title="Follow-ups Due"
              subtitle={`${needsFollowUp.length} this week`}
            />
            <ul className="space-y-2">
              {needsFollowUp.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/recruitment/pnm/${p.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:border-gold/40 hover:bg-gold/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due {new Date(p.nextFollowUp + 'T12:00:00').toLocaleDateString()}
                      </p>
                    </div>
                    <StatusPill label={p.status} variant="gold" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Top prospects */}
        <Card>
          <CardHeader
            title="Top Prospects"
            subtitle="Rated 4+ stars"
            action={
              <Link
                to="/recruitment/pipeline"
                className="text-xs font-medium text-gold hover:text-gold-dark"
              >
                View all →
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topProspects.map((p) => (
              <Link
                key={p.id}
                to={`/recruitment/pnm/${p.id}`}
                className="flex items-center gap-4 rounded-xl border border-border p-4 transition hover:border-navy/20 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gradient-to-br from-navy to-navy-light text-sm font-bold text-white">
                  {p.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.major} · {p.hometown}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusPill label={p.status} variant="gold" />
                    <span className="text-xs text-gold">
                      {'★'.repeat(p.rating)}{'☆'.repeat(5 - p.rating)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
