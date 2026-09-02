import { Link } from 'react-router-dom'
import { ArrowUpRight, Megaphone, BookOpen, Settings, ClipboardCheck } from 'lucide-react'
import { PageShell } from '../components/ui/Section'
import { PersistErrorNotice } from '../components/ui/PersistErrorNotice'
import { useChapter } from '../context/ChapterContext'
import { useAuth } from '../context/AuthContext'
import { useCommunications } from '../context/CommunicationsContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useMembers } from '../context/MembersContext'
import { useRecruitment } from '../context/RecruitmentContext'
import { buildLiveAlerts, localTodayIso } from '../lib/liveAlerts'
import { useStandardsModuleConfig } from '../hooks/useStandardsModuleConfig'

function priorityLabel(p: string) {
  return p === 'high' ? 'HIGH' : p === 'medium' ? 'MED' : 'LOW'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export default function ExecutiveDashboard() {
  const { chapter, languagePack } = useChapter()
  const { profile } = useAuth()
  const { posts } = useCommunications()
  const { events, excuses, studyLocations } = useChapterOps()
  const { members } = useMembers()
  const { prospects } = useRecruitment()
  const { configured: standardsConfigured } = useStandardsModuleConfig()
  const activeMembers = members.filter((m) => m.status === 'Active' || m.status === 'New Member')
  const avgAttendance = activeMembers.length
    ? Math.round(activeMembers.reduce((s, m) => s + m.attendancePct, 0) / activeMembers.length)
    : 0
  const duesCollected = members.reduce((s, m) => s + m.duesPaid, 0)
  const activeProspects = prospects.filter(
    (p) => !p.archived && !['Accepted', 'New Member'].includes(p.status)
  )
  const pendingExcuses = excuses.filter((e) => e.status === 'pending').length
  const chapterPosts = posts.filter((p) => p.kind === 'announcement')
  const today = localTodayIso()
  const liveAlerts = buildLiveAlerts({ members, excuses, prospects })

  const launchSteps = [
    { label: 'Schedule first event', done: events.length > 0, to: '/calendar' },
    { label: 'Add study location', done: studyLocations.length > 0, to: '/library-hours' },
    { label: 'Post announcement', done: posts.length > 0, to: '/announcements' },
    { label: 'Invite members', done: activeMembers.length > 1, to: '/settings' },
    { label: 'Configure standards & fines', done: standardsConfigured, to: '/standards/setup' },
  ]
  const showLaunchChecklist = launchSteps.some((s) => !s.done)

  const chapterTag = chapter.chapterDesignation.toUpperCase()

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
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 4)

  return (
    <PageShell className="space-y-0 py-8">
      <PersistErrorNotice />
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

      {showLaunchChecklist && (
        <section className="mb-8 rounded-md border border-[var(--rule)] bg-[var(--surface-card)] p-5">
          <h2 className="font-serif text-xl tracking-tight">Chapter launch checklist</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Get your chapter ready — complete these steps to unlock the full experience.
          </p>
          <ul className="mt-4 space-y-2">
            {launchSteps.map((step) => (
              <li key={step.label}>
                <Link
                  to={step.to}
                  className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition hover:bg-black/[0.03] ${
                    step.done ? 'text-[var(--muted)] line-through' : 'text-[var(--ink)]'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                      step.done
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-[var(--rule)]'
                    }`}
                  >
                    {step.done ? '✓' : '○'}
                  </span>
                  {step.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
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
            {chapterPosts.length === 0 ? (
              <li className="py-6 text-sm text-[var(--muted)]">
                No announcements yet.{' '}
                <Link to="/announcements" className="font-semibold text-[var(--primary)] hover:underline">
                  Post the first one →
                </Link>
              </li>
            ) : (
              chapterPosts.slice(0, 5).map((a) => (
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
              ))
            )}
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
              {upcomingEvents.length === 0 ? (
                <li className="py-6 text-sm text-[var(--muted)]">
                  No upcoming events.{' '}
                  <Link to="/calendar" className="font-semibold text-[var(--primary)] hover:underline">
                    Create one on the calendar →
                  </Link>
                </li>
              ) : (
                upcomingEvents.map((event) => (
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
                ))
              )}
            </ul>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Action Ledger</h2>
            {liveAlerts.length > 0 && (
              <span className="metric text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {liveAlerts.length} item{liveAlerts.length === 1 ? '' : 's'}
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
              {liveAlerts.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                  Nothing needs attention
                </li>
              ) : (
                liveAlerts.slice(0, 6).map((alert) => (
                  <li key={alert.id} className="border-b border-[var(--rule)] last:border-0">
                    <Link
                      to={alert.link ?? '/home'}
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
                      <span className="truncate text-sm text-[var(--ink)]">{alert.title}</span>
                      <ArrowUpRight size={14} className="justify-self-end text-[var(--muted)]" />
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
