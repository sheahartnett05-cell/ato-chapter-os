import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ClipboardCheck } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, Section, ListRow } from '../components/ui/Section'
import { SearchField } from '../components/ui/SearchField'
import { MemberAvatar } from '../components/ui/MemberAvatar'
import { StatusPill } from '../components/ui/StatusPill'
import { EmptyState } from '../components/ui/EmptyState'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useMembers } from '../context/MembersContext'
import { useChapter } from '../context/ChapterContext'
import {
  formatAttendancePct,
  normalizeAttendanceEntries,
} from '../lib/attendance/attendanceMath'
import type { AttendanceStatus, Member } from '../types'

type StandingFilter = 'all' | 'at_risk' | 'unrecorded'

type MemberStanding = {
  member: Member
  pct: number | null
  present: number
  excused: number
  absent: number
  recorded: number
  lastStatus: AttendanceStatus | null
  lastEventId: string | null
  lastEventName: string | null
  lastEventDate: string | null
}

function countStatuses(entries: { status: AttendanceStatus }[]) {
  let present = 0
  let excused = 0
  let absent = 0
  for (const e of entries) {
    if (e.status === 'Present') present += 1
    else if (e.status === 'Excused') excused += 1
    else if (e.status === 'Absent') absent += 1
  }
  return { present, excused, absent, recorded: entries.length }
}

export default function AttendanceTracker() {
  const [searchParams] = useSearchParams()
  const { members } = useMembers()
  const { events, attendance, excuses, getEventAttendance } = useChapterOps()
  const { chapter } = useChapter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StandingFilter>(
    searchParams.get('filter') === 'at_risk' ? 'at_risk' : 'all'
  )

  const today = new Date().toISOString().slice(0, 10)
  const pendingExcuses = excuses.filter((e) => e.status === 'pending').length

  const pastMeetings = useMemo(
    () =>
      [...events]
        .filter((e) => e.date <= today && (e.type === 'Chapter' || e.required))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [events, today]
  )

  const latestMeeting = pastMeetings[0] ?? null
  const latestRoll = latestMeeting ? getEventAttendance(latestMeeting.id) : []
  const activeRoster = useMemo(
    () => members.filter((m) => m.status === 'Active' || m.status === 'New Member'),
    [members]
  )
  const latestMissing =
    latestMeeting != null
      ? Math.max(0, activeRoster.length - latestRoll.length)
      : 0

  const standings = useMemo((): MemberStanding[] => {
    const eventMeta = new Map(events.map((e) => [e.id, e]))
    const byMember = new Map<
      string,
      Array<{ status: AttendanceStatus; date: string; eventId: string; name: string }>
    >()

    for (const [eventId, list] of Object.entries(attendance)) {
      const ev = eventMeta.get(eventId)
      if (!ev) continue
      for (const entry of normalizeAttendanceEntries(list ?? [])) {
        const rows = byMember.get(entry.memberId) ?? []
        rows.push({
          status: entry.status,
          date: ev.date,
          eventId,
          name: ev.name,
        })
        byMember.set(entry.memberId, rows)
      }
    }

    return activeRoster
      .map((member) => {
        const rows = (byMember.get(member.id) ?? []).sort((a, b) =>
          b.date.localeCompare(a.date)
        )
        const counts = countStatuses(rows)
        const last = rows[0]
        return {
          member,
          pct: member.attendancePct,
          present: counts.present,
          excused: counts.excused,
          absent: counts.absent,
          recorded: counts.recorded,
          lastStatus: last?.status ?? null,
          lastEventId: last?.eventId ?? null,
          lastEventName: last?.name ?? null,
          lastEventDate: last?.date ?? null,
        }
      })
      .sort((a, b) => {
        if (a.pct == null && b.pct == null) {
          return `${a.member.lastName}`.localeCompare(b.member.lastName)
        }
        if (a.pct == null) return 1
        if (b.pct == null) return -1
        return a.pct - b.pct
      })
  }, [activeRoster, attendance, events])

  const filtered = useMemo(() => {
    let rows = standings
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter((r) =>
        `${r.member.firstName} ${r.member.lastName}`.toLowerCase().includes(q)
      )
    }
    if (filter === 'at_risk') {
      rows = rows.filter((r) => r.pct != null && r.pct < 70)
    } else if (filter === 'unrecorded') {
      rows = rows.filter((r) => r.recorded === 0)
    }
    return rows
  }, [standings, search, filter])

  const atRiskCount = standings.filter((r) => r.pct != null && r.pct < 70).length
  const avg =
    standings.filter((r) => r.pct != null).length > 0
      ? Math.round(
          standings
            .filter((r) => r.pct != null)
            .reduce((sum, r) => sum + (r.pct as number), 0) /
            standings.filter((r) => r.pct != null).length
        )
      : null

  return (
    <>
      <TopBar
        title="Attendance"
        subtitle={`${formatAttendancePct(avg)} chapter avg · ${atRiskCount} under 70% · ${pendingExcuses} open excuse${pendingExcuses === 1 ? '' : 's'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/excuses?status=pending" className="btn-ghost text-xs">
              Excuses{pendingExcuses > 0 ? ` (${pendingExcuses})` : ''}
            </Link>
            {latestMeeting && (
              <Link to={`/events/${latestMeeting.id}`} className="btn-primary text-xs">
                <ClipboardCheck size={14} /> Open roll call
              </Link>
            )}
          </div>
        }
      />
      <PageShell>
        {latestMeeting && (
          <section className="border border-[var(--rule)] bg-[var(--surface-card)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              Latest required meeting
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
                  {latestMeeting.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {new Date(latestMeeting.date + 'T12:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' · '}
                  {latestRoll.length} recorded
                  {latestMissing > 0 ? ` · ${latestMissing} not marked` : ''}
                </p>
              </div>
              <Link
                to={`/events/${latestMeeting.id}`}
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[var(--ink)] underline-offset-2 hover:underline"
              >
                Take attendance <ArrowRight size={12} />
              </Link>
            </div>
          </section>
        )}

        <Section
          title="Semester standing"
          subtitle="Present and excused count toward %. Unrecorded meetings stay out of the denominator."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search members…"
              className="max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All'],
                  ['at_risk', 'Under 70%'],
                  ['unrecorded', 'No records'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`font-mono text-[10px] uppercase tracking-wider border px-3 py-2 transition ${
                    filter === id
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--primary-foreground)]'
                      : 'border-[var(--rule)] text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No members match"
              description="Try clearing filters, or open the calendar to record a meeting."
              action={
                <Link to="/calendar" className="btn-primary">
                  Calendar
                </Link>
              }
            />
          ) : (
            <div className="border border-[var(--rule)] bg-[var(--surface-card)]">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_5rem_4.5rem_4.5rem_4.5rem_minmax(0,1fr)] gap-3 border-b border-[var(--rule)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] md:grid">
                <span>Member</span>
                <span className="text-right">%</span>
                <span className="text-right">Present</span>
                <span className="text-right">Excused</span>
                <span className="text-right">Absent</span>
                <span>Last marked</span>
              </div>
              {filtered.map((row) => (
                <ListRow key={row.member.id} className="px-4">
                  <Link
                    to={`/members/${row.member.id}`}
                    className="grid w-full grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1.4fr)_5rem_4.5rem_4.5rem_4.5rem_minmax(0,1fr)]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <MemberAvatar
                        photoUrl={row.member.photoUrl}
                        initials={row.member.avatar}
                        size="sm"
                        accentColor={chapter.primaryColor}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--ink)]">
                          {row.member.firstName} {row.member.lastName}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                          {row.member.status} · {row.member.pledgeClass}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-serif text-xl tabular-nums md:text-right ${
                        row.pct != null && row.pct < 70
                          ? 'text-red-800'
                          : 'text-[var(--ink)]'
                      }`}
                    >
                      {formatAttendancePct(row.pct)}
                    </p>
                    <p className="hidden text-sm tabular-nums text-[var(--muted)] md:block md:text-right">
                      {row.present}
                    </p>
                    <p className="hidden text-sm tabular-nums text-[var(--muted)] md:block md:text-right">
                      {row.excused}
                    </p>
                    <p className="hidden text-sm tabular-nums text-[var(--muted)] md:block md:text-right">
                      {row.absent}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.lastStatus ? (
                        <>
                          <StatusPill
                            label={row.lastStatus}
                            variant={
                              row.lastStatus === 'Present'
                                ? 'present'
                                : row.lastStatus === 'Excused'
                                  ? 'maybe'
                                  : 'absent'
                            }
                          />
                          <span className="truncate text-xs text-[var(--muted)]">
                            {row.lastEventName}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">No meetings recorded</span>
                      )}
                      <span className="md:hidden font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        P {row.present} · E {row.excused} · A {row.absent}
                      </span>
                    </div>
                  </Link>
                </ListRow>
              ))}
            </div>
          )}
        </Section>
      </PageShell>
    </>
  )
}
