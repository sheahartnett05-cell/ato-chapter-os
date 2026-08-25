import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  AlertTriangle,
  Settings,
  User,
  BookOpen,
  DollarSign,
  Megaphone,
  ExternalLink,
  ChevronRight,
  Pin,
  UsersRound,
} from 'lucide-react'
import { Logo } from '../components/layout/Logo'
import { Modal } from '../components/ui/Modal'
import { localTodayIso } from '../lib/liveAlerts'
import { PollCard } from '../components/communications/PollCard'
import { SignupCard } from '../components/communications/SignupCard'
import { useCommunications } from '../context/CommunicationsContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useChapterTables } from '../context/ChapterTablesContext'
import {
  FORM_RSVP_OPTIONS,
  formRsvpBadgeClass,
  formRsvpButtonClass,
  normalizeFormRsvp,
  type FormRsvpOption,
} from '../lib/formRsvps'
import { useAuth } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import { useChapter } from '../context/ChapterContext'
import { useMemberGovernance } from '../context/GovernanceContext'
import { MemberStudyHoursPanel } from '../components/study/MemberStudyHoursPanel'
import { roleLabel } from '../types/permissions'
import type { Event } from '../types'

type RsvpChoice = FormRsvpOption

function memberNameFrom(member: { firstName: string; lastName: string }) {
  return `${member.firstName} ${member.lastName}`.trim()
}

function formatBuzzTime(iso: string) {

  return new Date(iso).toLocaleDateString('en-US', {

    month: 'short',

    day: 'numeric',

  }).toUpperCase()

}

function formatEventDay(iso: string) {

  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {

    weekday: 'short',

    month: 'short',

    day: 'numeric',

  })

}

export default function MemberDashboard() {

  const { chapter } = useChapter()

  const { memberId, profile, role } = useAuth()

  const { getMemberById } = useMembers()
  const TODAY = localTodayIso()

  const {

    events: chapterEvents,

    billHighway,

    memberDuesBalance,

    getMemberVerifiedHours,
    getMemberStudyHoursRequired,

  } = useChapterOps()
  const { getEventRsvps, updateMemberFormRsvp } = useChapterTables()

  const memberRecord = memberId ? getMemberById(memberId) : undefined
  const member = memberRecord
  const resolvedMemberId = member?.id ?? ''
  const memberDisplayName = member
    ? memberNameFrom(member)
    : `${profile.firstName} ${profile.lastName}`.trim() || 'Member'

  const { myCases, myFines, myCommittees, submitAppeal, submitFineAppeal } =
    useMemberGovernance(resolvedMemberId)

  const memberRsvps = useMemo(() => {
    const initial: Record<string, RsvpChoice | null> = {}
    for (const eventItem of chapterEvents) {
      const entry = getEventRsvps(eventItem.id).find((r) => r.memberId === resolvedMemberId)
      if (entry) {
        const status = normalizeFormRsvp(entry.rsvp)
        if (status) initial[eventItem.id] = status
      }
    }
    return initial
  }, [chapterEvents, getEventRsvps, resolvedMemberId])

  const setRsvp = (event: Event, value: FormRsvpOption) => {
    if (value === 'No' && event.required) {
      setDeclineTarget(event)
      return
    }
    updateMemberFormRsvp(event.id, resolvedMemberId, memberDisplayName, value)
  }

  const [declineTarget, setDeclineTarget] = useState<Event | null>(null)

  const [excuseReason, setExcuseReason] = useState('')

  const duesBalance = member
    ? memberDuesBalance(resolvedMemberId) || member.duesExpected - member.duesPaid
    : 0

  const studyHoursLogged = getMemberVerifiedHours(resolvedMemberId)
  const studyHoursTarget = getMemberStudyHoursRequired(resolvedMemberId)
  const studyPct =
    studyHoursTarget === null
      ? 0
      : Math.min(100, Math.round((studyHoursLogged / Math.max(studyHoursTarget, 1)) * 100))

  const { posts } = useCommunications()

  const sortedBuzz = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
    [posts]
  )
  const pinned = sortedBuzz.find((a) => a.pinned && a.kind === 'announcement')
  const feed = sortedBuzz.filter((a) => a.kind === 'announcement' && !a.pinned).slice(0, 3)
  const activePolls = sortedBuzz.filter((a) => a.kind === 'poll').slice(0, 1)
  const activeSignups = sortedBuzz.filter((a) => a.kind === 'signup').slice(0, 1)

  const todayEvents = useMemo(

    () =>

      chapterEvents

        .filter((e) => e.date === TODAY)

        .sort((a, b) => a.time.localeCompare(b.time)),

    [chapterEvents, TODAY]

  )

  const upcomingRsvp = useMemo(

    () =>

      chapterEvents

        .filter((e) => e.date >= TODAY)

        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

        .slice(0, 5),

    [chapterEvents, TODAY]

  )

  const unpaidFines = myFines.filter((f) => f.status === 'Unpaid')

  const pendingCases = myCases.filter((c) => c.status === 'Pending' && !c.appealSubmitted)

  const needsAction = unpaidFines.length + pendingCases.length + (duesBalance > 0 ? 1 : 0)

  const submitDecline = () => {
    if (!declineTarget || !excuseReason.trim()) return
    updateMemberFormRsvp(
      declineTarget.id,
      resolvedMemberId,
      memberDisplayName,
      'No'
    )

    setDeclineTarget(null)

    setExcuseReason('')

  }

  const displayName = profile.firstName || member?.firstName || 'Member'

  const initials =
    profile.avatar ||
    (member
      ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
      : '?')

  if (!member) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-neutral-600">No member profile linked to this session.</p>
        <Link to="/onboarding" className="btn-primary text-sm">
          Complete onboarding
        </Link>
      </div>
    )
  }

  return (

    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-tint)' }}>

      <div className="theme-stripe" />

      {/* Chapter Room hero */}

      <header className="relative overflow-hidden theme-sidebar px-5 pb-8 pt-4">

        <p

          className="pointer-events-none absolute -right-4 top-6 select-none font-serif text-[7rem] leading-none opacity-[0.08]"

          aria-hidden

        >

          {chapter.letters}

        </p>

        <div className="relative z-10 flex items-start justify-between gap-3">

          <Logo compact />

          <Link

            to="/profile"

            className="flex h-9 w-9 items-center justify-center font-mono text-[11px] font-semibold ring-1 ring-white/20"

            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}

          >

            {initials}

          </Link>

        </div>

        <div className="relative z-10 mt-8">

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">

            Chapter Room

          </p>

          <h1 className="mt-2 font-serif text-3xl tracking-tight text-white md:text-4xl">

            Hey, {displayName}

          </h1>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">

            {chapter.chapterDesignation} · {chapter.university}

          </p>

          {role && (

            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">

              {roleLabel(role)} · {chapter.semester}

            </p>

          )}

        </div>

        <div className="relative z-10 mt-6 flex gap-px">

          {[chapter.primaryColor, chapter.accentColor, chapter.secondaryColor].map((c) => (

            <span key={c} className="h-0.5 flex-1" style={{ backgroundColor: c }} />

          ))}

        </div>

      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-8 md:max-w-2xl">

        {/* Member ledger — MCR stats, editorial treatment */}

        <div className="ledger-bar grid-cols-2 border border-[var(--rule)] bg-[var(--surface-card)] md:grid-cols-4">

          {[

            { label: 'Attendance', value: `${member.attendancePct}%` },

            { label: 'Points', value: String(member.points) },

            {
              label: 'Study hrs',
              value:
                studyHoursTarget === null
                  ? `${studyHoursLogged} logged`
                  : `${studyHoursLogged}/${studyHoursTarget}`,
            },

            { label: 'Dues', value: duesBalance > 0 ? `$${duesBalance}` : 'Paid' },

          ].map((s) => (

            <div key={s.label} className="ledger-cell border-[var(--rule)] py-4">

              <p className="font-serif text-2xl tracking-tight text-[var(--ink)]">{s.value}</p>

              <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">

                {s.label}

              </p>

            </div>

          ))}

        </div>

        {/* Action queue */}

        {needsAction > 0 && (

          <section>

            <div className="mb-2 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">

              <h2 className="font-serif text-lg tracking-tight">Needs you</h2>

              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

                {needsAction} item{needsAction === 1 ? '' : 's'}

              </span>

            </div>

            <ul className="divide-y divide-[var(--rule)] border border-[var(--rule)]">

              {duesBalance > 0 && (

                <li className="flex items-center justify-between gap-3 px-4 py-3">

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-[var(--ink)]">${duesBalance} dues owed</p>

                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

                      Pay via BillHighway

                    </p>

                  </div>

                  {billHighway.enabled ? (

                    <a

                      href={billHighway.payUrl}

                      target="_blank"

                      rel="noreferrer"

                      className="btn-primary shrink-0 gap-1 text-xs py-1.5 px-3"

                    >

                      Pay <ExternalLink size={11} />

                    </a>

                  ) : (

                    <Link to="/dues" className="btn-ghost text-xs">

                      View

                    </Link>

                  )}

                </li>

              )}

              {unpaidFines.map((f) => (

                <li

                  key={f.id}

                  className="flex items-center justify-between gap-3 px-4 py-3"

                >

                  <div className="flex min-w-0 items-center gap-2">

                    <AlertTriangle size={14} className="shrink-0 text-red-600" />

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-[var(--ink)]">

                        Fine · ${f.amount}

                      </p>

                      <p className="truncate font-mono text-[10px] text-[var(--muted)]">

                        {f.reason.split('—')[0]?.trim()}

                      </p>

                    </div>

                  </div>

                  <button

                    type="button"

                    onClick={() => submitFineAppeal(f.id)}

                    className="btn-ghost shrink-0 text-[10px]"

                  >

                    Appeal

                  </button>

                </li>

              ))}

              {pendingCases.map((c) => (

                <li

                  key={c.id}

                  className="flex items-center justify-between gap-3 px-4 py-3"

                >

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-[var(--ink)]">

                      {c.category} violation

                    </p>

                    <p className="font-mono text-[10px] uppercase tracking-wider text-amber-800">

                      Pending · ${c.fineAmount} fine

                    </p>

                  </div>

                  {!c.appealSubmitted && (

                    <button

                      type="button"

                      onClick={() => submitAppeal(c.id)}

                      className="btn-ghost shrink-0 text-[10px]"

                    >

                      Appeal

                    </button>

                  )}

                </li>

              ))}

            </ul>

          </section>

        )}

        {/* Quick access — one tap hub like MCR, cleaner grid */}

        <section>

          <div className="mb-3 border-b border-[var(--rule)] pb-2">

            <h2 className="font-serif text-lg tracking-tight">Quick access</h2>

          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

            {[

              { to: '/calendar', label: 'Calendar', icon: CalendarDays },

              { to: '/committees', label: 'Committees', icon: UsersRound, sub: `${myCommittees.length}` },

              {
                to: '#study-hours',
                label: 'Study hrs',
                icon: BookOpen,
                sub: studyHoursTarget === null ? 'Exempt' : `${studyPct}%`,
              },

              {

                to: billHighway.enabled ? billHighway.payUrl : '/dues',

                label: 'Dues',

                icon: DollarSign,

                external: billHighway.enabled,

              },

              { to: '/profile', label: 'Profile', icon: User },

            ].map(({ to, label, icon: Icon, sub, external }) =>

              external ? (

                <a

                  key={label}

                  href={to}

                  target="_blank"

                  rel="noreferrer"

                  className="flex flex-col gap-2 border border-[var(--rule)] bg-[var(--surface-card)] p-3 transition hover:border-[var(--ink)]"

                >

                  <Icon size={16} className="text-[var(--primary)]" strokeWidth={1.5} />

                  <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>

                  <ExternalLink size={10} className="text-[var(--muted)]" />

                </a>

              ) : to.startsWith('#') ? (

                <a

                  key={label}

                  href={to}

                  className="flex flex-col gap-2 border border-[var(--rule)] bg-[var(--surface-card)] p-3 transition hover:border-[var(--ink)]"

                >

                  <Icon size={16} className="text-[var(--primary)]" strokeWidth={1.5} />

                  <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>

                  {sub && (

                    <span className="font-mono text-[10px] text-[var(--muted)]">{sub}</span>

                  )}

                </a>

              ) : (

                <Link

                  key={label}

                  to={to}

                  className="flex flex-col gap-2 border border-[var(--rule)] bg-[var(--surface-card)] p-3 transition hover:border-[var(--ink)]"

                >

                  <Icon size={16} className="text-[var(--primary)]" strokeWidth={1.5} />

                  <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>

                  {sub && (

                    <span className="font-mono text-[10px] text-[var(--muted)]">{sub}</span>

                  )}

                </Link>

              )

            )}

          </div>

        </section>

        {/* Today */}

        {todayEvents.length > 0 && (

          <section>

            <div className="mb-2 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">

              <h2 className="font-serif text-lg tracking-tight">Today</h2>

              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">

                {formatEventDay(TODAY)}

              </span>

            </div>

            <ul className="list-editorial border border-[var(--rule)]">

              {todayEvents.map((event) => (

                <li key={event.id} className="px-4">

                  <Link

                    to={`/events/${event.id}`}

                    className="flex items-center justify-between gap-3 py-3"

                  >

                    <div className="min-w-0">

                      <p className="font-medium text-[var(--ink)]">{event.name}</p>

                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

                        {event.time} · {event.location}

                      </p>

                    </div>

                    <ChevronRight size={14} className="shrink-0 text-[var(--muted)]" />

                  </Link>

                </li>

              ))}

            </ul>

          </section>

        )}

        {/* Chapter announcements feed */}

        <section>

          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">

            <h2 className="font-serif text-lg tracking-tight flex items-center gap-2">

              <Megaphone size={16} className="text-[var(--primary)]" />

              Chapter Announcements

            </h2>

          </div>

          {pinned && (

            <article className="mb-4 border border-[var(--primary)] bg-[var(--primary-subtle)] p-4">

              <div className="mb-2 flex items-center gap-2">

                <Pin size={12} className="text-[var(--primary)]" />

                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">

                  Pinned

                </span>

              </div>

              <h3 className="font-serif text-lg tracking-tight text-[var(--ink)]">{pinned.title}</h3>

              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">

                {pinned.body}

              </p>

              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

                {pinned.author} · {formatBuzzTime(pinned.createdAt)}

              </p>

            </article>

          )}

          <ul className="list-editorial">
            {feed.map((a) => (
              <li key={a.id} className="py-3">
                <Link to="/announcements" className="block hover:opacity-80">
                  <p className="text-[15px] font-medium text-[var(--ink)]">{a.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">{a.body}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {a.authorRole} · {formatBuzzTime(a.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/announcements"
            className="mt-3 inline-block font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]"
          >
            All announcements & tools →
          </Link>
        </section>

        {activePolls.map((a) => (
          <section key={a.id}>
            <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
              <h2 className="font-serif text-lg tracking-tight">{a.title}</h2>
              <Link
                to="/announcements"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
              >
                Polls
              </Link>
            </div>
            <PollCard post={a} memberId={resolvedMemberId} compact />
          </section>
        ))}

        {activeSignups.map((a) => (
          <section key={a.id}>
            <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
              <h2 className="font-serif text-lg tracking-tight">{a.title}</h2>
              <Link
                to="/announcements"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
              >
                Sign-ups
              </Link>
            </div>
            <SignupCard post={a} memberId={resolvedMemberId} compact />
          </section>
        ))}

        {/* RSVP queue — core MCR calendar + excuse flow, cleaner */}

        <section>

          <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">

            <h2 className="font-serif text-lg tracking-tight">Respond to events</h2>

            <Link

              to="/calendar"

              className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"

            >

              Full calendar

            </Link>

          </div>

          <ul className="space-y-0 divide-y divide-[var(--rule)] border border-[var(--rule)]">

            {upcomingRsvp.map((event) => {

              const choice = memberRsvps[event.id]

              const isToday = event.date === TODAY

              return (

                <li key={event.id} className="bg-[var(--surface-card)] px-4 py-4">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <Link

                          to={`/events/${event.id}`}

                          className="font-medium text-[var(--ink)] hover:underline"

                        >

                          {event.name}

                        </Link>

                        {isToday && (

                          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--primary)]">

                            Today

                          </span>

                        )}

                        {event.required && (

                          <span className="font-mono text-[9px] uppercase tracking-wider text-red-700">

                            Required

                          </span>

                        )}

                      </div>

                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">

                        {formatEventDay(event.date)} · {event.time}

                      </p>

                    </div>

                    {choice && (
                      <span
                        className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 ${formRsvpBadgeClass(choice)}`}
                      >
                        {choice}
                      </span>
                    )}

                  </div>

                  <div className="mt-3 flex gap-2">
                    {FORM_RSVP_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setRsvp(event, option)}
                        className={formRsvpButtonClass(choice === option, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                </li>

              )

            })}

          </ul>

        </section>

        {/* Study hours progress */}

        <MemberStudyHoursPanel memberId={resolvedMemberId} />

      </main>

      {/* Bottom nav */}

      <nav

        className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl"

        style={{

          backgroundColor: 'color-mix(in srgb, var(--surface-card) 96%, transparent)',

          borderColor: 'var(--rule)',

        }}

      >

        <div className="mx-auto flex max-w-lg justify-around py-2.5 md:max-w-2xl">

          {[

            { to: '/my-dashboard', label: 'Room', icon: Megaphone, active: true },

            { to: '/calendar', label: 'Calendar', icon: CalendarDays },

            { to: '/committees', label: 'Groups', icon: UsersRound },

            { to: '/profile', label: 'Profile', icon: User },

            { to: '/settings', label: 'Settings', icon: Settings },

          ].map(({ to, label, icon: Icon, active }) => (

            <Link

              key={to}

              to={to}

              className={`flex flex-col items-center gap-0.5 px-3 py-1 font-mono text-[9px] uppercase tracking-wider ${

                active ? 'text-[var(--primary)]' : 'text-[var(--muted)]'

              }`}

            >

              <Icon size={18} strokeWidth={1.5} />

              {label}

            </Link>

          ))}

        </div>

      </nav>

      <Modal

        open={declineTarget != null}

        onClose={() => {

          setDeclineTarget(null)

          setExcuseReason('')

        }}

        title="Excuse required"

      >

        <p className="mb-3 text-sm text-[var(--muted)]">

          <strong>{declineTarget?.name}</strong> is required. Your reason goes to exec for approval

          — same flow as MyChapterRoom excuse forms, but faster.

        </p>

        <textarea

          value={excuseReason}

          onChange={(e) => setExcuseReason(e.target.value)}

          placeholder="Why can't you make it?"

          rows={3}

          className="input-editorial resize-none"

        />

        <button

          type="button"

          onClick={submitDecline}

          disabled={!excuseReason.trim()}

          className="btn-primary mt-4 w-full disabled:opacity-40"

        >

          Submit excuse

        </button>

      </Modal>

    </div>

  )

}

