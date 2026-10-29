import { useMemo, useState, type ReactNode } from 'react'
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
import { CollapsibleSection } from '../components/ui/CollapsibleSection'
import { Modal } from '../components/ui/Modal'
import { formatAttendancePct } from '../lib/attendance/attendanceMath'
import { localTodayIso } from '../lib/liveAlerts'
import { useChapterFeaturesOptional } from '../context/ChapterFeaturesContext'
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
import { useAuth, usePermissions } from '../context/AuthContext'
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

type RoomSectionTone = 'default' | 'soft' | 'accent'

function ChapterRoomSection({
  id,
  eyebrow,
  title,
  action,
  tone = 'default',
  pad = true,
  className = '',
  children,
}: {
  id?: string
  eyebrow?: string
  title?: ReactNode
  action?: ReactNode
  tone?: RoomSectionTone
  pad?: boolean
  className?: string
  children: ReactNode
}) {
  const toneClass =
    tone === 'accent'
      ? 'border-amber-200/70 bg-[color-mix(in_srgb,var(--surface-card)_88%,#fef3c7_12%)]'
      : tone === 'soft'
        ? 'border-black/[0.05] bg-neutral-50/80'
        : 'border-black/[0.06] bg-[var(--surface-card)]'

  const hasHeader = Boolean(eyebrow || title || action)

  return (
    <section
      id={id}
      className={`overflow-hidden rounded-2xl border shadow-[0_1px_0_rgba(0,0,0,0.04)] ${toneClass} ${className}`}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rule)]/55 bg-black/[0.015] px-4 py-2.5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={`break-words font-serif text-lg tracking-tight text-[var(--ink)] ${eyebrow ? 'mt-0.5' : ''}`}
              >
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? (hasHeader ? 'p-4 pt-3' : 'p-4') : undefined}>{children}</div>
    </section>
  )
}

export default function MemberDashboard() {

  const { chapter } = useChapter()

  const { memberId, profile, role } = useAuth()
  const permissions = usePermissions()
  const { getMemberById } = useMembers()
  const features = useChapterFeaturesOptional()
  const attendanceOn = features?.isFeatureEnabled('attendancePoints') !== false
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

    <div className="min-h-screen pb-6" style={{ background: 'var(--surface-tint)' }}>

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
            aria-label="Your profile"
            className="flex h-11 w-11 shrink-0 items-center justify-center font-mono text-[11px] font-semibold ring-1 ring-white/20"
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

      <main className="mx-auto max-w-lg space-y-3 px-4 py-5 md:max-w-2xl">

        <ChapterRoomSection eyebrow="Your semester" tone="soft" pad={false}>
        <div className="ledger-bar grid-cols-2 border-0 bg-transparent md:grid-cols-4">

          {[

            ...(attendanceOn
              ? [
                  { label: 'Attendance', value: formatAttendancePct(member.attendancePct) },
                  { label: 'Points', value: String(member.points) },
                ]
              : []),

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
        </ChapterRoomSection>

        {/* Action queue */}

        {needsAction > 0 && (
          <ChapterRoomSection
            tone="accent"
            eyebrow="Action queue"
            title="Needs you"
            action={
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {needsAction} item{needsAction === 1 ? '' : 's'}
              </span>
            }
          >
            <ul className="divide-y divide-[var(--rule)] overflow-hidden rounded-xl border border-[var(--rule)]/80 bg-[var(--surface-card)]">

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
          </ChapterRoomSection>
        )}

        <CollapsibleSection eyebrow="Navigate" title="Quick access" defaultOpen>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              { to: '/calendar', label: 'Calendar', icon: CalendarDays },
              {
                to: '/announcements',
                label: 'Buzz',
                icon: Megaphone,
                badge: permissions.canPostAnnouncements ? 'Post' : undefined,
              },
              {
                to: '/committees',
                label: 'Groups',
                icon: UsersRound,
                badge: myCommittees.length > 0 ? String(myCommittees.length) : undefined,
              },
              {
                to: '#study-hours',
                label: 'Study',
                icon: BookOpen,
                badge: studyHoursTarget === null ? '—' : `${studyPct}%`,
                anchor: true,
              },
              {
                to: billHighway.enabled ? billHighway.payUrl : '/dues',
                label: 'Dues',
                icon: DollarSign,
                external: billHighway.enabled,
              },
              { to: '/profile', label: 'Profile', icon: User },
              { to: '/settings', label: 'Settings', icon: Settings },
            ].map(({ to, label, icon: Icon, badge, external, anchor }) => {
              const chipClass =
                'flex w-full items-center justify-between gap-2 border border-[var(--rule)] bg-[var(--surface-card)] px-3 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)]/40 hover:bg-white sm:justify-start'

              const inner = (
                <>
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size={16} className="shrink-0 text-[var(--primary)]" strokeWidth={1.75} />
                    <span>{label}</span>
                  </span>
                  {(badge || external) && (
                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">
                      {badge}
                      {external && <ExternalLink size={12} className="text-[var(--muted)]" />}
                    </span>
                  )}
                </>
              )

              if (external) {
                return (
                  <a key={label} href={to} target="_blank" rel="noreferrer" className={chipClass}>
                    {inner}
                  </a>
                )
              }
              if (anchor) {
                return (
                  <a key={label} href={to} className={chipClass}>
                    {inner}
                  </a>
                )
              }
              return (
                <Link key={label} to={to} className={chipClass}>
                  {inner}
                </Link>
              )
            })}
          </div>
        </CollapsibleSection>

        {/* Today */}

        {todayEvents.length > 0 && (
          <ChapterRoomSection
            eyebrow="Schedule"
            title="Today"
            action={
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">
                {formatEventDay(TODAY)}
              </span>
            }
          >
            <ul className="list-editorial overflow-hidden rounded-xl border border-[var(--rule)]/80">

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
          </ChapterRoomSection>
        )}

        <ChapterRoomSection
          eyebrow="Chapter buzz"
          title={
            <span className="flex items-center gap-2">
              <Megaphone size={16} className="text-[var(--primary)]" />
              Announcements
            </span>
          }
        >

          {pinned && (

            <article className="mb-4 border border-[var(--primary)] bg-[var(--primary-subtle)] p-4">

              <div className="mb-2 flex items-center gap-2">

                <Pin size={12} className="text-[var(--primary)]" />

                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">

                  Pinned

                </span>

              </div>

              <h3 className="break-words font-serif text-lg tracking-tight text-[var(--ink)]">
                {pinned.title}
              </h3>

              <p className="mt-2 break-words text-[15px] leading-relaxed text-[var(--muted)]">
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
                <Link to="/announcements" className="block hover:opacity-90">
                  <p className="break-words text-[15px] font-semibold leading-snug text-[var(--ink)]">
                    {a.title}
                  </p>
                  <p className="mt-1.5 break-words text-sm leading-relaxed text-[var(--muted)]">
                    {a.body}
                  </p>
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
        </ChapterRoomSection>

        {activePolls.map((a) => (
          <ChapterRoomSection
            key={a.id}
            eyebrow="Poll"
            title={a.title}
            action={
              <Link
                to="/announcements"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
              >
                All polls
              </Link>
            }
          >
            <PollCard post={a} memberId={resolvedMemberId} compact />
          </ChapterRoomSection>
        ))}

        {activeSignups.map((a) => (
          <ChapterRoomSection
            key={a.id}
            eyebrow="Sign-up"
            title={a.title}
            action={
              <Link
                to="/announcements"
                className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
              >
                All sign-ups
              </Link>
            }
          >
            <SignupCard post={a} memberId={resolvedMemberId} compact />
          </ChapterRoomSection>
        ))}

        <ChapterRoomSection
          eyebrow="Calendar"
          title="Upcoming events"
          action={
            <Link
              to="/calendar"
              className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Full calendar
            </Link>
          }
        >
          <ul className="space-y-0 divide-y divide-[var(--rule)] overflow-hidden rounded-xl border border-[var(--rule)]/80">

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
                          className="break-words text-[15px] font-semibold leading-snug text-[var(--ink)] hover:underline"
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

                      <p className="mt-1 break-words text-sm text-[var(--muted)]">
                        {formatEventDay(event.date)} · {event.time}
                        {event.location ? ` · ${event.location}` : ''}
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

                  <div className="mt-3 flex flex-wrap gap-2">
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
        </ChapterRoomSection>

        <ChapterRoomSection eyebrow="Academics" title="Study hours" id="study-hours-wrap">
          <MemberStudyHoursPanel memberId={resolvedMemberId} embedded />
        </ChapterRoomSection>

      </main>

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

