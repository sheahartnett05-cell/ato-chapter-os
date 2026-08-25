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
import { useChapterOps } from '../context/ChapterOpsContext'
import { useChapterTables } from '../context/ChapterTablesContext'
import { useAuth, usePermissions } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import { useStandardsModuleConfig } from '../hooks/useStandardsModuleConfig'
import {
  FORM_RSVP_OPTIONS,
  formRsvpButtonClass,
  formRsvpVariant,
  isAffirmativeFormRsvp,
  normalizeFormRsvp,
  type FormRsvpOption,
} from '../lib/formRsvps'
import { eventTypeColor } from '../lib/eventColors'
import {
  excuseLeadTimeOk,
  formatExcuseReason,
} from '../lib/excusePolicy'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const {
    events: chapterEvents,
    getEventAttendance,
    getEventExcuses,
    submitExcuse: persistExcuse,
    setAttendanceEntry,
  } = useChapterOps()
  const { getTableForEvent, getEventRsvps, updateMemberFormRsvp } = useChapterTables()
  const { memberId, profile } = useAuth()
  const permissions = usePermissions()
  const canTakeRoll = permissions.canAccessExecTools || permissions.canEditEventPoints
  const { getMemberById, members } = useMembers()
  const { config } = useStandardsModuleConfig()
  const excusePolicy = config.excuse_policy
  const event = chapterEvents.find((e) => e.id === id)
  const eventTable = id ? getTableForEvent(id) : undefined
  const resolvedMemberId = memberId ?? ''
  const resolvedMember = resolvedMemberId ? getMemberById(resolvedMemberId) : undefined
  const resolvedMemberName = resolvedMember
    ? `${resolvedMember.firstName} ${resolvedMember.lastName}`.trim()
    : [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'You'

  const eventFormRsvps = id ? getEventRsvps(id) : []
  const myFormRsvp = eventFormRsvps.find((r) => r.memberId === resolvedMemberId)
  const myRsvp = myFormRsvp ? normalizeFormRsvp(myFormRsvp.rsvp) : null

  const [activeSection, setActiveSection] = useState<'rsvp' | 'attendance' | 'points'>('rsvp')
  const [showExcuseModal, setShowExcuseModal] = useState(false)
  const [excuseCategory, setExcuseCategory] = useState(excusePolicy.categories[0] ?? '')
  const [excuseReason, setExcuseReason] = useState('')
  const [attachmentNote, setAttachmentNote] = useState('')

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

  const eventAttendance = getEventAttendance(event.id)
  const eventExcuses = getEventExcuses(event.id)
  const leadTimeOk = excuseLeadTimeOk(event, excusePolicy)

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
    if (!resolvedMemberId || !excuseReason.trim() || !excuseCategory || !leadTimeOk) return
    persistExcuse({
      eventId: event.id,
      memberId: resolvedMemberId,
      reason: formatExcuseReason(excuseCategory, excuseReason, attachmentNote),
      attachmentNote: excusePolicy.require_attachment ? attachmentNote : undefined,
    })
    persistRsvp('No')
    setShowExcuseModal(false)
    setExcuseReason('')
    setAttachmentNote('')
  }

  const canSubmitExcuse =
    excuseReason.trim().length > 0 &&
    excuseCategory.length > 0 &&
    leadTimeOk &&
    (!excusePolicy.require_attachment || attachmentNote.trim().length > 0)

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
                  const member = rsvp.memberId ? getMemberById(rsvp.memberId) : undefined
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
              (() => {
                const rollMembers = members.filter(
                  (m) => m.status === 'Active' || m.status === 'New Member'
                )
                if (rollMembers.length === 0) {
                  return (
                    <p className="p-8 text-center text-sm text-neutral-500">
                      No active members on roster
                    </p>
                  )
                }
                return rollMembers.map((member) => {
                  const entry = eventAttendance.find((a) => a.memberId === member.id)
                  const status = entry?.status
                  return (
                    <ListRow key={member.id}>
                      <div className="flex flex-1 items-center justify-between gap-4 px-2">
                        <p className="font-semibold text-neutral-900">
                          {member.firstName} {member.lastName}
                        </p>
                        {canTakeRoll ? (
                          <div className="flex flex-wrap gap-1">
                            {(['Present', 'Excused', 'Absent'] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  setAttendanceEntry(
                                    event.id,
                                    member.id,
                                    s,
                                    s === 'Present' ? event.points : 0
                                  )
                                }
                                className={`rounded-sm px-2 py-1 text-xs font-semibold ${
                                  status === s
                                    ? s === 'Present'
                                      ? 'bg-emerald-600 text-white'
                                      : s === 'Excused'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-neutral-700 text-white'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        ) : status ? (
                          <div className="flex items-center gap-2">
                            <StatusPill label={status} variant={attendanceVariant(status)} />
                            {status === 'Present' && (
                              <CheckCircle2 size={14} className="text-emerald-600" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">Not recorded</span>
                        )}
                      </div>
                    </ListRow>
                  )
                })
              })()}

            {activeSection === 'points' &&
              (eventAttendance.length > 0
                ? eventAttendance.map((entry) => {
                    const member = getMemberById(entry.memberId)
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
                    const member = entry.memberId ? getMemberById(entry.memberId) : undefined
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
        {!leadTimeOk && (
          <p className="mb-3 text-xs text-red-600">
            Excuses must be submitted at least {excusePolicy.lead_time_hours} hours before the event.
          </p>
        )}
        <label className="mb-1 block text-xs font-medium text-neutral-600">Category</label>
        <select
          value={excuseCategory}
          onChange={(e) => setExcuseCategory(e.target.value)}
          className="input-editorial mb-3 w-full"
        >
          {excusePolicy.categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Reason</label>
        <textarea
          value={excuseReason}
          onChange={(e) => setExcuseReason(e.target.value)}
          placeholder="Reason for absence…"
          rows={4}
          className="input-editorial w-full"
        />
        {excusePolicy.require_attachment && (
          <>
            <label className="mb-1 mt-3 block text-xs font-medium text-neutral-600">
              Attachment note (required)
            </label>
            <input
              type="text"
              value={attachmentNote}
              onChange={(e) => setAttachmentNote(e.target.value)}
              placeholder="Describe what you will attach or where docs were sent"
              className="input-editorial w-full"
            />
          </>
        )}
        <button
          type="button"
          onClick={submitExcuse}
          disabled={!canSubmitExcuse}
          className="btn-primary mt-4 w-full disabled:opacity-40"
        >
          Submit for approval
        </button>
      </Modal>
    </>
  )
}
