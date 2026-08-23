import { Link } from 'react-router-dom'
import {
  Users,
  DollarSign,
  CalendarCheck,
  UserPlus,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusPill, priorityVariant } from '../components/ui/StatusPill'
import {
  CHAPTER,
  alerts,
  chapterHealth,
  events,
  members,
  prospects,
} from '../data/mockData'

export default function ExecutiveDashboard() {
  const activeMembers = members.filter((m) => m.status === 'Active' || m.status === 'New Member')
  const avgAttendance = Math.round(
    activeMembers.reduce((s, m) => s + m.attendancePct, 0) / activeMembers.length
  )
  const duesCollected = members.reduce((s, m) => s + m.duesPaid, 0)
  const duesExpected = members
    .filter((m) => m.status !== 'Alumni')
    .reduce((s, m) => s + m.duesExpected, 0)
  const activeProspects = prospects.filter((p) => !['Accepted', 'New Member'].includes(p.status))

  const stats = [
    {
      label: 'Active Members',
      value: activeMembers.length.toString(),
      icon: Users,
      detail: '+2 new members',
    },
    {
      label: 'Avg Attendance',
      value: `${avgAttendance}%`,
      icon: CalendarCheck,
      detail: 'Chapter meetings',
    },
    {
      label: 'Dues Collected',
      value: `$${duesCollected.toLocaleString()}`,
      icon: DollarSign,
      detail: `$${duesExpected.toLocaleString()} expected`,
    },
    {
      label: 'Active Prospects',
      value: activeProspects.length.toString(),
      icon: UserPlus,
      detail: 'In pipeline',
    },
    {
      label: 'Outstanding Tasks',
      value: '7',
      icon: ClipboardList,
      detail: '3 overdue',
    },
  ]

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date('2025-08-23'))
    .slice(0, 4)

  return (
    <>
      <TopBar
        title={`Good afternoon, Marcus`}
        subtitle={`${CHAPTER.name} · ${CHAPTER.school} · ${CHAPTER.semester}`}
      />

      <div className="space-y-6 p-8">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {stats.map(({ label, value, icon: Icon, detail }) => (
            <Card key={label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{detail}</p>
                </div>
                <div className="rounded-lg bg-navy/5 p-2 text-navy">
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chapter health */}
          <Card className="lg:col-span-2">
            <CardHeader title="Chapter Health" subtitle="Semester performance overview" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {chapterHealth.map(({ label, score, trend }) => (
                <div key={label} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      <TrendingUp size={12} className={trend.startsWith('-') ? 'rotate-180' : ''} />
                      {trend}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-navy">{score}</span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-navy to-gold transition-all"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader
              title="Alerts"
              subtitle={`${alerts.filter((a) => a.priority === 'high').length} high priority`}
            />
            <ul className="space-y-3">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    to={alert.link ?? '#'}
                    className="group flex gap-3 rounded-lg border border-border p-3 transition hover:border-gold/40 hover:bg-gold/5"
                  >
                    <AlertTriangle
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        alert.priority === 'high' ? 'text-red-500' : 'text-amber-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-navy group-hover:text-gold-dark">
                          {alert.title}
                        </p>
                        <StatusPill
                          label={alert.priority}
                          variant={priorityVariant(alert.priority)}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{alert.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Upcoming events */}
        <Card>
          <CardHeader
            title="Upcoming Events"
            subtitle="Next 30 days"
            action={
              <Link
                to="/events/e2"
                className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark"
              >
                View calendar <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group rounded-lg border border-border p-4 transition hover:border-navy/20 hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <StatusPill label={event.type} variant="gold" />
                  {event.required && <StatusPill label="Required" variant="high" />}
                </div>
                <h4 className="mt-2 text-sm font-semibold text-navy group-hover:text-gold-dark">
                  {event.name}
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {event.time}
                </p>
                <p className="mt-1 truncate text-xs text-slate-400">{event.location}</p>
                <p className="mt-2 text-xs font-medium text-gold">{event.points} pts</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
