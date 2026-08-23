import { Link } from 'react-router-dom'
import { ArrowUpRight, Megaphone, BookOpen, Settings, ClipboardCheck } from 'lucide-react'
import { PageShell } from '../components/ui/Section'
import { alerts, members, prospects } from '../data/mockData'
import { rsvpExcuses } from '../data/featureData'
import { useChapter } from '../context/ChapterContext'
import { useAuth } from '../context/AuthContext'
import { useCommunications } from '../context/CommunicationsContext'
import { useChapterOps } from '../context/ChapterOpsContext'

function priorityLabel(p: string) {
  return p === 'high' ? 'HIGH' : p === 'medium' ? 'MED' : 'LOW'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

function alertTitle(alert: (typeof alerts)[0]): string {
  switch (alert.id) {
    case 'al1':
      return '3 Unpaid Dues'
    case 'al2':
      return '2 Low Attendance'
    case 'al3':
      return '4 PNMs Follow-up'
    case 'al4':
      return 'Venue Deposit Due'
    default:
      return alert.title.split(' ').slice(0, 4).join(' ')
  }
}

export default function ExecutiveDashboard() {
  const { chapter, languagePack } = useChapter()
  const { profile } = useAuth()
  const { posts } = useCommunications()
  const { events } = useChapterOps()
  const activeMembers = members.filter((m) => m.status === 'Active' || m.status === 'New Member')
  const avgAttendance = Math.round(
    activeMembers.reduce((s, m) => s + m.attendancePct, 0) / activeMembers.length
  )
  const duesCollected = members.reduce((s, m) => s + m.duesPaid, 0)
  const activeProspects = prospects.filter((p) => !['Accepted', 'New Member'].includes(p.status))
  const pendingExcuses = rsvpExcuses.filter((e) => e.status === 'pending').length
  const chapterPosts = posts.filter((p) => p.kind === 'announcement')

  const stats = [
    { label: 'MEMBERS', value: String(activeMembers.length) },
    { label: 'ATTENDANCE', value: `${avgAttendance}%` },
    { label: 'DUES', value: `$${(duesCollected / 1000).toFixed(1)}K` },
    { label: languagePack.recruitmentTerm.toUpperCase(), value: String(activeProspects.length) },
  ]

  const quickActions = [
    { label: 'Post', icon: Megaphone, to: '/announcements' },
    { label: 'Excuses', icon: ClipboardCheck, to: '/excuses', badge: pendingExcuses },
    { label: 'Library', icon: BookOpen, to: '/library-hours' },
    { label: 'Setup', icon: Settings, to: '/chapter-setup' },
  ]

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date('2025-08-23'))
    .slice(0, 4)

  const chapterTag = chapter.chapterDesignation.toUpperCase()

  return (
    <PageShell className="space-y-0 py-8">
      {/* Editorial header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--rule)] pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {chapterTag} CHAPTER
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-[var(--ink)] md:text-[2.25rem]">
            Hey, {profile.firstName || 'Member'}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
            {chapter.orgName} · {chapter.university}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(({ label, icon: Icon, to, badge }) => (
            <Link key={label} to={to} className="btn-ghost relative gap-1.5 px-3 py-2 text-xs">
              <Icon size={13} strokeWidth={1.75} />
              {label}
              {badge != null && badge > 0 && (
                <span className="metric ml-1 text-[10px] text-red-700">{badge}</span>
              )}
            </Link>
          ))}
        </div>
      </header>

      {/* Editorial Ledger Bar */}
      <div className="ledger-bar mb-10 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight text-[var(--ink)]">{s.value}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Asymmetric main grid */}
      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        {/* Announcements */}
        <section>
          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Chapter Announcements</h2>
            <Link
              to="/announcements"
              className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
            >
              View all
            </Link>
          </div>
          <ul className="list-editorial">
            {chapterPosts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link
                  to="/announcements"
                  className="flex items-baseline gap-4 py-3.5 transition hover:bg-black/[0.015]"
                >
                  <span className="timestamp w-14 shrink-0 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {formatTime(a.createdAt)}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] leading-snug text-[var(--ink)]">
                    {a.pinned && (
                      <span className="tag mr-2 text-[9px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                        Pin
                      </span>
                    )}
                    {a.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
              <h2 className="font-serif text-xl tracking-tight">Upcoming</h2>
              <Link
                to="/calendar"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Full calendar
              </Link>
            </div>
            <ul className="list-editorial">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    to={`/events/${event.id}`}
                    className="flex items-baseline gap-4 py-3.5 transition hover:bg-black/[0.015]"
                  >
                    <span className="timestamp w-14 shrink-0 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {new Date(event.date + 'T12:00:00')
                        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        .toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] text-[var(--ink)]">{event.name}</span>
                    {event.required && (
                      <span className="tag text-[9px] font-semibold uppercase tracking-wider text-red-700">
                        Req
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Action Ledger */}
        <section>
          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Action Ledger</h2>
            {pendingExcuses > 0 && (
              <span className="metric text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {pendingExcuses} excuse{pendingExcuses === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="border border-[var(--rule)]">
            <div className="grid grid-cols-[56px_1fr_24px] border-b border-[var(--rule)] bg-[var(--primary)] px-3 py-2 text-[var(--primary-foreground)]">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Pri</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Item</span>
              <span />
            </div>
            <ul>
              {alerts.slice(0, 6).map((alert) => (
                <li key={alert.id} className="border-b border-[var(--rule)] last:border-0">
                  <Link
                    to={alert.link ?? '/excuses'}
                    className="grid grid-cols-[56px_1fr_24px] items-center px-3 py-3 transition hover:bg-black/[0.02]"
                  >
                    <span
                      className={`tag text-[9px] font-semibold uppercase tracking-wider ${
                        alert.priority === 'high'
                          ? 'text-red-700'
                          : alert.priority === 'medium'
                            ? 'text-amber-800'
                            : 'text-[var(--muted)]'
                      }`}
                    >
                      {priorityLabel(alert.priority)}
                    </span>
                    <span className="truncate text-sm text-[var(--ink)]">{alertTitle(alert)}</span>
                    <ArrowUpRight size={14} className="justify-self-end text-[var(--muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
