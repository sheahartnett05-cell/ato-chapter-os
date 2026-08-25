import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Star,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, Section, ListRow } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import {
  StatusPill,
  attendanceVariant,
} from '../components/ui/StatusPill'
import { getMember, attendance, CURRENT_MEMBER_ID } from '../data/mockData'
import { useChapterOps } from '../context/ChapterOpsContext'
import { useChapterTables } from '../context/ChapterTablesContext'
import { useAuth } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import {
  FORM_RSVP_OPTIONS,
  formRsvpButtonClass,
  formRsvpVariant,
  isAffirmativeFormRsvp,
  normalizeFormRsvp,
  type FormRsvpOption,
} from '../lib/formRsvps'
import { rsvpExcuses } from '../data/featureData'
import { eventTypeColor } from '../lib/eventColors'
import type { RsvpExcuse } from '../types/features'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const { events: chapterEvents } = useChapterOps()
  const { getTableForEvent, getEventRsvps, updateMemberFormRsvp } = useChapterTables()
  const { memberId, profile } = useAuth()
  const { getMemberById } = useMembers()
  const event = chapterEvents.find((e) => e.id === id)
  const eventTable = id ? getTableForEvent(id) : undefined
  const resolvedMemberId = memberId ?? CURRENT_MEMBER_ID
  const resolvedMember =
    getMemberById(resolvedMemberId) ?? getMember(resolvedMemberId)
  const resolvedMemberName = resolvedMember
    ? `${resolvedMember.firstName} ${resolvedMember.lastName}`.trim()
    : [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'You'

  const eventFormRsvps = id ? getEventRsvps(id) : []
  const myFormRsvp = eventFormRsvps.find((r) => r.memberId === resolvedMemberId)
  const myRsvp = myFormRsvp ? normalizeFormRsvp(myFormRsvp.rsvp) : null

  const [activeSection, setActiveSection] = useState<'rsvp' | 'attendance' | 'points'>('rsvp')
  const [showExcuseModal, setShowExcuseModal] = useState(false)
  const [excuseReason, setExcuseReason] = useState('')
  const [localExcuses, setLocalExcuses] = useState<RsvpExcuse[]>(rsvpExcuses)

  if (!event) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-neutral-900">Event not found</p>
        <Link to="/calendar" className="text-sm font-semibold text-[var(--accent)]">
          Back to calendar
        </Link>
      </div>
    )
  }

  const eventAttendance = attendance[event.id] ?? []
  const eventExcuses = localExcuses.filter((e) => e.eventId === event.id)

  const yesCount = eventFormRsvps.filter((r) => normalizeFormRsvp(r.rsvp) === 'Yes').length
  const maybeCount = eventFormRsvps.filter((r) => normalizeFormRsvp(r.rsvp) === 'Maybe').length
  const noCount = eventFormRsvps.filter((r) => normalizeFormRsvp(r.rsvp) === 'No').length

  const persistRsvp = (value: FormRsvpOption) => {
    if (!event.id) return
    updateMemberFormRsvp(event.id, resolvedMemberId, resolvedMemberName, value)
  }

  const handleRsvp = (value: FormRsvpOption) => {
    if (value === 'No' && event.required) {
      setShowExcuseModal(true)
      return
    }
    persistRsvp(value)
  }

  const submitExcuse = () => {
    if (!excuseReason.trim()) return
    const newExcuse: RsvpExcuse = {
      id: `ex-${Date.now()}`,
      eventId: event.id,
      memberId: resolvedMemberId,
      reason: excuseReason.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }
    setLocalExcuses((prev) => [...prev, newExcuse])
    persistRsvp('No')
    setShowExcuseModal(false)
    setExcuseReason('')
  }

  return (
    <>
      <TopBar
        title="Events"
        subtitle={`${chapterEvents.length} scheduled · select below`}
        actions={
          <Link
            to="/calendar"
            className="flex items-center gap-2 rounded-sm border border-[var(--rule)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-black/[0.02]"
          >
            <ArrowLeft size={16} />
            Calendar
          </Link>
        }
      />

      <PageShell className="space-y-8">
        {/* All events — top */}
        <Section
          title="All events"
          subtitle="Tap an event to view details below"
        >
          <div className="divide-y divide-[var(--rule)] border border-[var(--rule)]">
            {[...chapterEvents]
              .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
              .map((e) => {
                const color = eventTypeColor(e.type)
                const active = e.id === event.id
                return (
                  <ListRow key={e.id}>
                    <Link
                      to={`/events/${e.id}`}
                      className={`flex flex-1 items-center gap-4 px-2 py-1 transition ${
                        active ? 'bg-[var(--primary-subtle)]' : 'hover:bg-black/[0.02]'
                      }`}
                    >
                      <div
                        className="flex h-10 w-1 shrink-0 self-stretch"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-[var(--rule)] bg-[var(--surface-card)] font-mono">
                        <span className="text-[9px] font-medium uppercase text-[var(--muted)]">
                          {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                          })}
                        </span>
                        <span className="text-sm font-bold text-[var(--ink)]">
                          {new Date(e.date + 'T12:00:00').getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--ink)]">{e.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                          {e.time} · {e.type}
                        </p>
                      </div>
                      <Calendar size={14} className="shrink-0 text-[var(--muted)]" />
                    </Link>
                  </ListRow>
                )
              })}
          </div>
        </Section>

        {/* Selected event details — below */}
        <Section title="Event details" subtitle={event.name}>
        <div
          className="mb-4 flex items-center gap-2 border border-[var(--rule)] px-3 py-2"
          style={{ borderLeftWidth: 4, borderLeftColor: eventTypeColor(event.type) }}
        >
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: eventTypeColor(event.type) }}
          >
            {event.type}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            ·{' '}
            {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FORM_RSVP_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleRsvp(option)}
              className={formRsvpButtonClass(myRsvp === option, option, true)}
            >
              {option}
            </button>
          ))}
          {myRsvp === 'No' && eventExcuses.some((e) => e.memberId === resolvedMemberId) && (
            <StatusPill
              label={
                eventExcuses.find((e) => e.memberId === resolvedMemberId)?.status === 'pending'
                  ? 'Excuse pending'
                  : 'Excuse approved'
              }
              variant="maybe"
            />
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              <StatusPill label={event.type} variant="gold" />
              {event.required && <StatusPill label="Required" variant="high" />}
              {event.rsvpRequired && <StatusPill label="RSVP Required" variant="active" />}
            </div>
            <p className="text-sm leading-relaxed text-neutral-600">{event.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Clock, label: 'Time', value: event.time },
                { icon: MapPin, label: 'Location', value: event.location },
                { icon: Star, label: 'Points', value: `${event.points} pts` },
                { icon: Users, label: 'Dress', value: event.dressCode },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-neutral-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Icon size={16} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl bg-neutral-50 p-6">
            <p className="text-xs font-medium text-neutral-500">RSVP summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Yes</span>
                <span className="font-semibold text-emerald-600">{yesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Maybe</span>
                <span className="font-semibold text-amber-700">{maybeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">No</span>
                <span className="font-semibold text-neutral-600">{noCount}</span>
              </div>
            </div>
            {eventTable && (
              <Link
                to={`/tables/${eventTable.id}`}
                className="mt-4 block rounded-sm bg-accent/10 py-2.5 text-center text-sm font-semibold text-accent"
              >
                {eventTable.name} →
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-black/5">
          {(['rsvp', 'attendance', 'points'] as const).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize transition ${
                activeSection === section
                  ? 'border-accent text-accent'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        <Section title={activeSection === 'rsvp' ? 'RSVPs' : activeSection}>
          <div className="divide-y divide-black/5 rounded-2xl bg-neutral-50/60">
            {activeSection === 'rsvp' &&
              (eventFormRsvps.length === 0 ? (
                <p className="p-8 text-center text-sm text-neutral-500">No RSVPs yet</p>
              ) : (
                eventFormRsvps.map((rsvp) => {
                  const member = rsvp.memberId ? getMember(rsvp.memberId) : undefined
                  const displayName =
                    member != null
                      ? `${member.firstName} ${member.lastName}`
                      : rsvp.memberName || 'Unknown member'
                  const excuse = rsvp.memberId
                    ? eventExcuses.find((e) => e.memberId === rsvp.memberId)
                    : undefined
                  return (
                    <ListRow key={`${rsvp.tableId}-${rsvp.rowId}`}>
                      {member ? (
                        <Link
                          to={`/members/${member.id}`}
                          className="flex flex-1 items-center justify-between gap-4 px-2"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-sm text-xs font-bold text-white ring-2 ring-accent/30"
                              style={{ backgroundColor: 'var(--brand-primary)' }}
                            >
                              {member.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{displayName}</p>
                              {rsvp.guest && (
                                <p className="text-xs text-neutral-500">Guest: {rsvp.guest}</p>
                              )}
                              {excuse && (
                                <p className="text-xs text-neutral-500 line-clamp-1">
                                  Excuse: {excuse.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <StatusPill label={rsvp.rsvp} variant={formRsvpVariant(rsvp.rsvp)} />
                        </Link>
                      ) : (
                        <div className="flex flex-1 items-center justify-between gap-4 px-2">
                          <div>
                            <p className="font-semibold text-neutral-900">{displayName}</p>
                            {rsvp.guest && (
                              <p className="text-xs text-neutral-500">Guest: {rsvp.guest}</p>
                            )}
                          </div>
                          <StatusPill label={rsvp.rsvp} variant={formRsvpVariant(rsvp.rsvp)} />
                        </div>
                      )}
                    </ListRow>
                  )
                })
              ))}

            {activeSection === 'attendance' &&
              (eventAttendance.length === 0 ? (
                <p className="p-8 text-center text-sm text-neutral-500">
                  Attendance not recorded yet
                </p>
              ) : (
                eventAttendance.map((entry) => {
                  const member = getMember(entry.memberId)
                  if (!member) return null
                  return (
                    <ListRow key={entry.memberId}>
                      <div className="flex flex-1 items-center justify-between px-2">
                        <p className="font-semibold text-neutral-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <div className="flex items-center gap-2">
                          <StatusPill
                            label={entry.status}
                            variant={attendanceVariant(entry.status)}
                          />
                          {entry.status === 'Present' && (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          )}
                        </div>
                      </div>
                    </ListRow>
                  )
                })
              ))}

            {activeSection === 'points' &&
              (eventAttendance.length > 0
                ? eventAttendance.map((entry) => {
                    const member = getMember(entry.memberId)
                    if (!member) return null
                    return (
                      <ListRow key={entry.memberId}>
                        <div className="flex flex-1 justify-between px-2">
                          <span className="font-semibold text-neutral-900">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="font-semibold text-accent">+{entry.pointsEarned}</span>
                        </div>
                      </ListRow>
                    )
                  })
                : eventFormRsvps.map((entry) => {
                    const member = entry.memberId ? getMember(entry.memberId) : undefined
                    const displayName =
                      member != null
                        ? `${member.firstName} ${member.lastName}`
                        : entry.memberName || 'Unknown member'
                    const pts = isAffirmativeFormRsvp(entry.rsvp) ? event.points : 0
                    return (
                      <ListRow key={`${entry.tableId}-${entry.rowId}`}>
                        <div className="flex flex-1 justify-between px-2">
                          <span className="font-semibold text-neutral-900">{displayName}</span>
                          <span className="font-semibold text-accent">+{pts}</span>
                        </div>
                      </ListRow>
                    )
                  }))}
          </div>
        </Section>
        </Section>
      </PageShell>

      <Modal
        open={showExcuseModal}
        onClose={() => setShowExcuseModal(false)}
        title="Submit excuse"
      >
        <p className="mb-4 text-sm text-neutral-600">
          This event is required. Please explain why you cannot attend — your excuse will be sent
          for approval.
        </p>
        <textarea
          value={excuseReason}
          onChange={(e) => setExcuseReason(e.target.value)}
          placeholder="Reason for absence…"
          rows={4}
          className="w-full rounded-xl border border-black/5 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-accent/40"
        />
        <button
          type="button"
          onClick={submitExcuse}
          disabled={!excuseReason.trim()}
          className="mt-4 w-full rounded-sm bg-accent py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Submit for approval
        </button>
      </Modal>
    </>
  )
}
