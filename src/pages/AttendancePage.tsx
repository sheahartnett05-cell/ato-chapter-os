import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, Section } from '../components/ui/Section'
import { ExcuseApprovalsPanel } from '../components/attendance/ExcuseApprovalsPanel'
import { QrCheckInPicker } from '../components/attendance/QrCheckInPicker'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useMembers } from '../context/MembersContext'
import { useStandardsModuleConfig } from '../hooks/useStandardsModuleConfig'
import { localTodayIso } from '../lib/liveAlerts'
import {
  eventAttendancePct,
  formatAttendancePct,
  normalizeAttendanceEntries,
} from '../lib/attendance/attendanceMath'

type Tab = 'overview' | 'excuses'

function TabPills({
  active,
  pendingCount,
  onChange,
}: {
  active: Tab
  pendingCount: number
  onChange: (t: Tab) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => onChange('overview')}
        className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
          active === 'overview' ? 'theme-pill-active' : 'theme-pill-muted'
        }`}
      >
        Overview
      </button>
      <button
        type="button"
        onClick={() => onChange('excuses')}
        className={`rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
          active === 'excuses' ? 'theme-pill-active' : 'theme-pill-muted'
        }`}
      >
        Excuses
        {pendingCount > 0 && (
          <span className="ml-1.5 text-red-700">{pendingCount}</span>
        )}
      </button>
    </div>
  )
}

function formatEventDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'excuses' ? 'excuses' : 'overview'
  const statusFilter = searchParams.get('status')
  const focusEventId = searchParams.get('event')
  const today = localTodayIso()

  const { events, excuses, getEventAttendance } = useChapterOps()
  const { members } = useMembers()
  const { config } = useStandardsModuleConfig()

  const pendingCount = excuses.filter((e) => e.status === 'pending').length

  const setTab = (next: Tab) => {
    const nextParams = new URLSearchParams(searchParams)
    if (next === 'overview') {
      nextParams.delete('tab')
      nextParams.delete('status')
    } else {
      nextParams.set('tab', 'excuses')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const activeBrothers = useMemo(
    () => members.filter((m) => m.status === 'Active' || m.status === 'New Member'),
    [members]
  )

  const pastEventsWithRoll = useMemo(() => {
    return events
      .filter((e) => e.date < today && getEventAttendance(e.id).length > 0)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
  }, [events, getEventAttendance, today])

  const semesterMeetingAvg = useMemo(() => {
    const recent = pastEventsWithRoll.slice(0, 4)
    const pcts = recent
      .map((e) => eventAttendancePct(getEventAttendance(e.id)))
      .filter((p): p is number => p != null)
    if (!pcts.length) return null
    return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length)
  }, [pastEventsWithRoll, getEventAttendance])

  const chapterMemberAvg = useMemo(() => {
    const pcts = activeBrothers
      .map((m) => m.attendancePct)
      .filter((p): p is number => p != null && Number.isFinite(p))
    if (!pcts.length) return null
    return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length)
  }, [activeBrothers])

  const brotherRows = useMemo(() => {
    return [...activeBrothers].sort((a, b) => {
      const ap = a.attendancePct ?? 999
      const bp = b.attendancePct ?? 999
      return ap - bp
    })
  }, [activeBrothers])

  const eventRows = useMemo(() => {
    return pastEventsWithRoll.map((event) => {
      const entries = normalizeAttendanceEntries(getEventAttendance(event.id))
      const present = entries.filter((e) => e.status === 'Present').length
      const excused = entries.filter((e) => e.status === 'Excused').length
      const absent = entries.filter((e) => e.status === 'Absent').length
      const pct = eventAttendancePct(entries)
      return { event, entries: entries.length, present, excused, absent, pct }
    })
  }, [pastEventsWithRoll, getEventAttendance])

  useEffect(() => {
    if (!focusEventId || tab !== 'overview') return
    const el = document.getElementById(`attendance-event-${focusEventId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [focusEventId, tab, eventRows.length])

  const subtitle =
    tab === 'excuses'
      ? `${pendingCount} pending · ${config.excuse_policy.lead_time_hours}h lead time · deny may issue fine`
      : `${pastEventsWithRoll.length} events recorded · ${activeBrothers.length} active members`

  return (
    <>
      <TopBar title="Attendance & Excuses" subtitle={subtitle} />
      <PageShell>
        <TabPills active={tab} pendingCount={pendingCount} onChange={setTab} />

        {tab === 'overview' ? (
          <div className="mt-6">
            <QrCheckInPicker initialEventId={focusEventId} />
          </div>
        ) : null}

        {tab === 'excuses' ? (
          <div className="mt-8">
            {statusFilter === 'pending' && (
              <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Showing pending only ·{' '}
                <button
                  type="button"
                  className="text-[var(--accent)] hover:underline"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.delete('status')
                    setSearchParams(next, { replace: true })
                  }}
                >
                  View all
                </button>
              </p>
            )}
            <ExcuseApprovalsPanel statusFilter={statusFilter} />
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            <div className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
              {[
                {
                  label: 'Chapter average',
                  value: formatAttendancePct(chapterMemberAvg),
                  hint: 'Active members · semester',
                },
                {
                  label: 'Recent meetings',
                  value: formatAttendancePct(semesterMeetingAvg),
                  hint: 'Avg of last 4 recorded events',
                },
                {
                  label: 'Pending excuses',
                  value: String(pendingCount),
                  hint: pendingCount > 0 ? 'Needs review' : 'Queue clear',
                },
              ].map(({ label, value, hint }) => (
                <div
                  key={label}
                  className="bg-[var(--surface-card)] px-4 py-5 sm:px-5"
                >
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {label}
                  </p>
                  <p className="mt-2 font-serif text-3xl tracking-tight text-[var(--ink)]">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
                </div>
              ))}
            </div>

            <Section
              title="By member"
              subtitle="Semester attendance · lowest first"
              action={
                <Link
                  to="/members?filter=attendance"
                  className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Full roster
                </Link>
              }
            >
              <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="border-b border-[var(--rule)] bg-black/[0.02] font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Member</th>
                      <th className="px-4 py-2.5 font-medium">Attendance</th>
                      <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule)]">
                    {brotherRows.map((member) => (
                      <tr key={member.id} className="hover:bg-black/[0.015]">
                        <td className="px-4 py-3">
                          <Link
                            to={`/members/${member.id}`}
                            className="font-medium text-[var(--ink)] hover:underline"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-20 bg-[var(--rule)]">
                              {member.attendancePct != null && (
                                <div
                                  className="h-full bg-[var(--accent)]"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, member.attendancePct))}%`,
                                  }}
                                />
                              )}
                            </div>
                            <span className="font-mono text-xs tabular-nums text-[var(--ink)]">
                              {formatAttendancePct(member.attendancePct)}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-[var(--muted)] sm:table-cell">
                          {member.graduationYear}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="By event"
              subtitle="Recorded roll calls · most recent first"
              action={
                <Link
                  to="/calendar"
                  className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Calendar
                </Link>
              }
            >
              {eventRows.length === 0 ? (
                <p className="rounded-xl border border-[var(--rule)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No attendance recorded yet. Take roll call on an event from the calendar.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="border-b border-[var(--rule)] bg-black/[0.02] font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Event</th>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        <th className="px-4 py-2.5 font-medium">Rate</th>
                        <th className="hidden px-4 py-2.5 font-medium md:table-cell">Present</th>
                        <th className="hidden px-4 py-2.5 font-medium md:table-cell">Excused</th>
                        <th className="hidden px-4 py-2.5 font-medium md:table-cell">Absent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rule)]">
                      {eventRows.map(({ event, present, excused, absent, pct }) => {
                        const highlighted = focusEventId === event.id
                        return (
                          <tr
                            key={event.id}
                            id={`attendance-event-${event.id}`}
                            className={
                              highlighted
                                ? 'bg-[color-mix(in_srgb,var(--primary-subtle)_55%,white)]'
                                : 'hover:bg-black/[0.015]'
                            }
                          >
                            <td className="px-4 py-3">
                              <Link
                                to={`/events/${event.id}`}
                                className="font-medium text-[var(--ink)] hover:underline"
                              >
                                {event.name}
                              </Link>
                              {event.required && (
                                <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-red-700">
                                  Req
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                              {formatEventDay(event.date)}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums text-[var(--ink)]">
                              {formatAttendancePct(pct)}
                            </td>
                            <td className="hidden px-4 py-3 font-mono text-xs tabular-nums md:table-cell">
                              {present}
                            </td>
                            <td className="hidden px-4 py-3 font-mono text-xs tabular-nums md:table-cell">
                              {excused}
                            </td>
                            <td className="hidden px-4 py-3 font-mono text-xs tabular-nums md:table-cell">
                              {absent}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </div>
        )}
      </PageShell>
    </>
  )
}
