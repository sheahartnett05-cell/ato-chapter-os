import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Megaphone,
  BookOpen,
  Settings,
  ClipboardCheck,
  ClipboardList,
  ChevronDown,
} from 'lucide-react'
import { PageShell } from '../components/ui/Section'
import { useChapter } from '../context/ChapterContext'
import { useAuth } from '../context/AuthContext'
import { useCommunications } from '../context/CommunicationsContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useOfficerDashboard } from '../hooks/useOfficerDashboard'
import { StatTile } from '../components/dashboard/StatTile'
import { statGridClassName } from '../lib/dashboard/displayTiles'
import { formatChapterHeaderLine } from '../lib/chapterDisplay'
import { localTodayIso } from '../lib/liveAlerts'
import { formatHomeEventDateTime } from '../lib/homeDateFormat'
import { officerFunctionLabel } from '../types/officerFunction'

function priorityLabel(p: string) {
  return p === 'high' ? 'HIGH' : p === 'medium' ? 'MED' : 'LOW'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

const homeListStampClass =
  'timestamp shrink-0 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-[var(--ink)]'

export default function ExecutiveDashboard() {
  const { chapter } = useChapter()
  const { profile } = useAuth()
  const { posts } = useCommunications()
  const { events, excuses } = useChapterOps()
  const {
    tiles,
    ledgerTasks,
    activeFunction,
    activeTitle,
    setActiveFunction,
    functionOptions,
  } = useOfficerDashboard()

  const pendingExcuses = excuses.filter((e) => e.status === 'pending').length
  const chapterPosts = posts.filter((p) => p.kind === 'announcement')
  const today = localTodayIso()

  const quickActions = [
    { label: 'Post', icon: Megaphone, to: '/announcements' },
    { label: 'Attendance', icon: ClipboardList, to: '/attendance' },
    { label: 'Excuses', icon: ClipboardCheck, to: '/attendance?tab=excuses', badge: pendingExcuses },
    { label: 'Library', icon: BookOpen, to: '/library-hours' },
    { label: 'Setup', icon: Settings, to: '/chapter-setup' },
  ]

  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 4)

  const chapterTag = formatChapterHeaderLine(chapter.chapterDesignation)
  const ledgerPreview = ledgerTasks.slice(0, 5)

  return (
    <PageShell className="space-y-0 py-8">
      <header className="mb-8 flex flex-col gap-5 border-b border-[var(--rule)] pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {chapterTag}
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-[var(--ink)] md:text-[2.25rem]">
            Hey, {profile.firstName || 'Member'}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
            {chapter.orgName} · {chapter.university}
          </p>
          {functionOptions.length > 1 ? (
            <div className="relative mt-3 inline-flex items-center">
              <label className="sr-only" htmlFor="dashboard-function">
                Dashboard view
              </label>
              <select
                id="dashboard-function"
                value={activeFunction}
                onChange={(e) => setActiveFunction(e.target.value as typeof activeFunction)}
                className="appearance-none border border-[var(--rule)] bg-[var(--surface-card)] py-1.5 pl-2 pr-8 font-mono text-[10px] uppercase tracking-wider text-[var(--ink)]"
              >
                {functionOptions.map((o) => (
                  <option key={o.fn} value={o.fn}>
                    {o.title} · {officerFunctionLabel(o.fn)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2 text-[var(--muted)]"
              />
            </div>
          ) : (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {activeTitle}
            </p>
          )}
        </div>
        <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:w-auto sm:min-w-[14rem] sm:max-w-md md:grid-cols-2">
          {quickActions.map(({ label, icon: Icon, to, badge }) => (
            <Link
              key={label}
              to={to}
              className="btn-ghost relative flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs sm:justify-start"
            >
              <span className="flex items-center gap-1.5">
                <Icon size={14} strokeWidth={1.75} />
                {label}
              </span>
              {badge != null && badge > 0 && (
                <span className="metric text-[10px] text-red-700">{badge}</span>
              )}
            </Link>
          ))}
        </div>
      </header>

      {tiles.length > 0 && (
        <div
          className={`mb-10 grid auto-rows-fr items-stretch gap-px border border-[var(--rule)] bg-[var(--rule)] ${statGridClassName(tiles.length)}`}
        >
          {tiles.map((tile) => (
            <StatTile key={tile.id} tile={tile} />
          ))}
        </div>
      )}

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
            {chapterPosts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link
                  to="/announcements"
                  className="flex items-start gap-4 py-3.5 transition hover:bg-black/[0.015]"
                >
                  <span className={`${homeListStampClass} min-w-[3.25rem]`}>
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
            {upcomingEvents.length === 0 ? (
              <div className="border border-[var(--rule)] px-4 py-8 text-center">
                <p className="text-sm text-[var(--muted)]">No upcoming events on the calendar.</p>
                <Link
                  to="/calendar?from=form-create"
                  className="mt-3 inline-block font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] hover:underline"
                >
                  Create event
                </Link>
              </div>
            ) : (
              <ul className="list-editorial">
                {upcomingEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      to={`/events/${event.id}`}
                      className="flex items-start gap-3 py-3.5 transition hover:bg-black/[0.015] sm:gap-4"
                    >
                      <span className={`${homeListStampClass} min-w-[11rem] sm:min-w-[11.5rem]`}>
                        {formatHomeEventDateTime(event.date, event.time)}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] leading-snug text-[var(--ink)]">
                        {event.name}
                      </span>
                      {event.required && (
                        <span className="tag shrink-0 text-[9px] font-semibold uppercase tracking-wider text-red-700">
                          Req
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section id="action-ledger">
          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Action Ledger</h2>
            {ledgerTasks.length > 5 && (
              <Link
                to="/home#action-ledger"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
              >
                View all
              </Link>
            )}
          </div>
          <div className="border border-[var(--rule)]">
            <div className="grid grid-cols-[56px_1fr_24px] border-b border-[var(--rule)] bg-[var(--primary)] px-3 py-2 text-[var(--primary-foreground)]">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Pri</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Item</span>
              <span />
            </div>
            <ul>
              {ledgerPreview.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                  Nothing needs attention
                </li>
              ) : (
                ledgerPreview.map((alert) => (
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
                      <span className="line-clamp-2 text-sm leading-snug text-[var(--ink)]">
                        {alert.title}
                      </span>
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
