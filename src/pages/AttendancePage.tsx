import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, Section } from '../components/ui/Section'
import { ExcuseApprovalsPanel } from '../components/attendance/ExcuseApprovalsPanel'
import { QrCheckInPicker } from '../components/attendance/QrCheckInPicker'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useMembers } from '../context/MembersContext'
import { useStandardsModuleConfig } from '../hooks/useStandardsModuleConfig'
import { CALENDAR_EVENT_TYPES, eventTypeColor } from '../lib/eventColors'
import { localTodayIso } from '../lib/liveAlerts'
import {
  eventAttendancePct,
  formatAttendancePct,
  normalizeAttendanceEntries,
} from '../lib/attendance/attendanceMath'

type Tab = 'overview' | 'excuses' | 'new'

const EMPTY_NEW_EVENT = {
  name: '',
  type: 'Chapter',
  date: '',
  time: '7:00 PM',
  location: '',
  description: '',
  points: 5,
  required: true,
  rsvpRequired: true,
}

function TabPills({
  active,
  pendingCount,
  onChange,
}: {
  active: Tab
  pendingCount: number
  onChange: (t: Tab) => void
}) {
  const tabClass = (isActive: boolean) =>
    `min-h-11 flex-1 rounded-sm px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider transition sm:flex-none ${
      isActive ? 'theme-pill-active' : 'theme-pill-muted'
    }`
  return (
    <div className="-mx-4 border-b border-[var(--rule)] bg-[var(--surface-card)] px-4 py-2 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <div className="flex gap-1">
        <button type="button" onClick={() => onChange('overview')} className={tabClass(active === 'overview')}>
          Overview
        </button>
        <button type="button" onClick={() => onChange('excuses')} className={tabClass(active === 'excuses')}>
          Excuses
          {pendingCount > 0 && <span className="ml-1.5 text-red-700">{pendingCount}</span>}
        </button>
        <button type="button" onClick={() => onChange('new')} className={tabClass(active === 'new')}>
          New event
        </button>
      </div>
    </div>
  )
}

function formatEventDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function tabFromSearch(raw: string | null): Tab {
  if (raw === 'excuses') return 'excuses'
  if (raw === 'new') return 'new'
  return 'overview'
}

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = tabFromSearch(searchParams.get('tab'))
  const statusFilter = searchParams.get('status')
  const focusEventId = searchParams.get('event')
  const today = localTodayIso()

  const { events, excuses, getEventAttendance, addEvent } = useChapterOps()
  const { members } = useMembers()
  const { config } = useStandardsModuleConfig()
  const [newEvent, setNewEvent] = useState(() => ({
    ...EMPTY_NEW_EVENT,
    date: today,
  }))
  const [createError, setCreateError] = useState<string | null>(null)

  const pendingCount = excuses.filter((e) => e.status === 'pending').length

  const setTab = (next: Tab) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('status')
    if (next === 'overview') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', next)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const createEvent = () => {
    setCreateError(null)
    if (!newEvent.name.trim()) {
      setCreateError('Name is required.')
      return
    }
    if (!newEvent.date) {
      setCreateError('Date is required.')
      return
    }
    const id = addEvent({
      name: newEvent.name.trim(),
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time.trim() || '7:00 PM',
      location: newEvent.location.trim() || 'TBD',
      description: newEvent.description.trim(),
      required: newEvent.required,
      points: Number.isFinite(newEvent.points) ? Math.max(0, newEvent.points) : 0,
      dressCode: 'Casual',
      rsvpRequired: newEvent.rsvpRequired,
      guestAllowed: false,
    })
    setNewEvent({ ...EMPTY_NEW_EVENT, date: today })
    const next = new URLSearchParams()
    next.set('event', id)
    setSearchParams(next, { replace: true })
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

  useEffect(() => {
    if (pendingCount <= 0) return
    void import('../lib/notifications/localPush').then(({ notifyLocalOnce }) =>
      notifyLocalOnce({
        title: 'Pending excuses',
        body: `${pendingCount} excuse${pendingCount === 1 ? '' : 's'} waiting for review.`,
        tag: 'excuse-queue',
        url: '/attendance?tab=excuses&status=pending',
      })
    )
  }, [pendingCount])

  const subtitle =
    tab === 'excuses'
      ? `${pendingCount} pending · ${config.excuse_policy.lead_time_hours}h lead time · deny may issue fine`
      : tab === 'new'
        ? 'Schedule a meeting for roll call or QR check-in'
        : `${pastEventsWithRoll.length} events recorded · ${activeBrothers.length} active members`

  return (
    <>
      <TopBar title="Attendance & Excuses" subtitle={subtitle} />
      <PageShell className="pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <TabPills active={tab} pendingCount={pendingCount} onChange={setTab} />

        {tab === 'overview' ? (
          <div className="mt-6">
            <QrCheckInPicker initialEventId={focusEventId} />
          </div>
        ) : null}

        {tab === 'new' ? (
          <div className="mt-8 max-w-lg space-y-3 border border-[var(--rule)] bg-[var(--surface-card)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              New event
            </p>
            <p className="text-sm text-[var(--muted)]">
              Creates a calendar event here so you can take roll or open QR without leaving
              attendance.
            </p>
            <input
              className="input-editorial min-h-11"
              placeholder="Event name"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
            <select
              className="input-editorial min-h-11"
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
            >
              {CALENDAR_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {newEvent.type ? (
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <span
                  className="inline-block h-2.5 w-2.5"
                  style={{ backgroundColor: eventTypeColor(newEvent.type) }}
                />
                Calendar color · {newEvent.type}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="date"
                className="input-editorial min-h-11 font-mono"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
              <input
                className="input-editorial min-h-11"
                placeholder="Time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              />
            </div>
            <input
              className="input-editorial min-h-11"
              placeholder="Location"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            />
            <textarea
              className="input-editorial min-h-[72px] resize-none"
              placeholder="Description (optional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Points</span>
                <input
                  type="number"
                  className="input-editorial mt-1 min-h-11 font-mono"
                  value={newEvent.points}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, points: Number(e.target.value) })
                  }
                />
              </label>
              <div className="flex flex-col justify-end gap-3 pb-1 text-sm">
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={newEvent.required}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, required: e.target.checked })
                    }
                  />
                  Required
                </label>
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={newEvent.rsvpRequired}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, rsvpRequired: e.target.checked })
                    }
                  />
                  RSVP required
                </label>
              </div>
            </div>
            {createError ? <p className="text-sm text-red-800">{createError}</p> : null}
            <button type="button" onClick={createEvent} className="btn-primary min-h-11 w-full">
              Create event
            </button>
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
        ) : null}

        {tab === 'overview' ? (
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
              <ul className="divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)] sm:hidden">
                {brotherRows.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <Link
                        to={`/members/${member.id}`}
                        className="font-medium text-[var(--ink)] hover:underline"
                      >
                        {member.firstName} {member.lastName}
                      </Link>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Class of {member.graduationYear}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-[var(--ink)]">
                      {formatAttendancePct(member.attendancePct)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto rounded-xl border border-[var(--rule)] sm:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--rule)] bg-black/[0.02] font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Member</th>
                      <th className="px-4 py-2.5 font-medium">Attendance</th>
                      <th className="px-4 py-2.5 font-medium">Class</th>
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
                        <td className="px-4 py-3 text-[var(--muted)]">{member.graduationYear}</td>
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
                <>
                  <ul className="divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)] sm:hidden">
                    {eventRows.map(({ event, present, excused, absent, pct }) => {
                      const highlighted = focusEventId === event.id
                      return (
                        <li
                          key={event.id}
                          id={`attendance-event-${event.id}`}
                          className={`px-4 py-3.5 ${
                            highlighted
                              ? 'bg-[color-mix(in_srgb,var(--primary-subtle)_55%,white)]'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
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
                              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                                {formatEventDay(event.date)} · P {present} · E {excused} · A{' '}
                                {absent}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-[var(--ink)]">
                              {formatAttendancePct(pct)}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="hidden overflow-x-auto rounded-xl border border-[var(--rule)] sm:block">
                    <table className="w-full text-left text-sm">
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
                              id={`attendance-event-${event.id}-table`}
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
                </>
              )}
            </Section>
          </div>
        ) : null}
      </PageShell>
    </>
  )
}
