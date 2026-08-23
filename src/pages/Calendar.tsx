import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  LayoutGrid,
  MapPin,
  Clock,
  Star,
  Users,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterOps } from '../context/ChapterOpsContext'
import { usePermissions } from '../context/AuthContext'
import {
  CALENDAR_EVENT_TYPES,
  EVENT_TYPE_COLORS,
  eventTypeColor,
} from '../lib/eventColors'
import type { Event } from '../types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DEMO_TODAY = '2025-08-23'

type ViewMode = 'month' | 'agenda'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

function toIsoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseEventDate(iso: string) {
  return new Date(iso + 'T12:00:00')
}

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDay(iso: string) {
  return parseEventDate(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function TypePill({ type }: { type: string }) {
  const color = eventTypeColor(type)
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em]"
      style={{ color }}
    >
      <span className="inline-block h-2 w-2 shrink-0" style={{ backgroundColor: color }} aria-hidden />
      {type}
    </span>
  )
}

function EventListItem({
  event,
  selected,
  onSelect,
}: {
  event: Event
  selected: boolean
  onSelect: () => void
}) {
  const color = eventTypeColor(event.type)
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
          selected ? 'bg-[var(--primary-subtle)]' : 'hover:bg-black/[0.02]'
        }`}
      >
        <div className="h-10 w-1 shrink-0" style={{ backgroundColor: color }} aria-hidden />
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-[var(--rule)] bg-[var(--surface-card)] font-mono">
          <span className="text-[8px] uppercase tracking-wider text-[var(--muted)]">
            {parseEventDate(event.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-sm font-semibold text-[var(--ink)]">
            {parseEventDate(event.date).getDate()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--ink)]">{event.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <TypePill type={event.type} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {event.time}
            </span>
          </div>
        </div>
      </button>
    </li>
  )
}

function EventDetails({
  event,
  canEditPoints,
  onEditPoints,
}: {
  event: Event
  canEditPoints: boolean
  onEditPoints: (e: Event) => void
}) {
  const color = eventTypeColor(event.type)
  return (
    <section className="border border-[var(--rule)] bg-[var(--surface-card)]">
      <div
        className="border-b border-[var(--rule)] px-5 py-4"
        style={{ borderLeftWidth: 4, borderLeftColor: color }}
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {formatDay(event.date)} · {event.time}
        </p>
        <h3 className="mt-1 font-serif text-2xl tracking-tight text-[var(--ink)]">{event.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TypePill type={event.type} />
          {event.required && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-red-700">Required</span>
          )}
          {event.rsvpRequired && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--primary)]">
              RSVP required
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {event.description && (
          <p className="text-sm leading-relaxed text-[var(--muted)]">{event.description}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, label: 'Time', value: event.time },
            { icon: MapPin, label: 'Location', value: event.location },
            { icon: Star, label: 'Points', value: `${event.points} pts` },
            { icon: Users, label: 'Dress', value: event.dressCode },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="border border-[var(--rule)] px-3 py-3">
              <div className="flex items-center gap-1.5 text-[var(--muted)]">
                <Icon size={14} />
                <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--ink)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--rule)] pt-4">
          <Link to={`/events/${event.id}`} className="btn-primary text-xs">
            Open full page · RSVP & attendance
          </Link>
          {canEditPoints && (
            <button
              type="button"
              onClick={() => onEditPoints(event)}
              className="btn-ghost text-xs"
            >
              Edit points ({event.points})
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function ColorLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-[var(--rule)] bg-[var(--surface-card)] px-4 py-3">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        Type key
      </span>
      {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
        <span
          key={type}
          className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[var(--ink)]"
        >
          <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: color }} aria-hidden />
          {type}
        </span>
      ))}
    </div>
  )
}

export default function CalendarPage() {
  const { events, updateEventPoints, addEvent } = useChapterOps()
  const permissions = usePermissions()
  const canEditPoints = permissions.canEditEventPoints

  const todayIso = DEMO_TODAY
  const [cursor, setCursor] = useState(() => startOfMonth(parseEventDate(DEMO_TODAY)))
  const [view, setView] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [pointsDraft, setPointsDraft] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    name: '',
    type: 'Chapter',
    date: '',
    time: '7:00 PM',
    location: '',
    description: '',
    points: 5,
    required: false,
    rsvpRequired: true,
  })

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const d = a.date.localeCompare(b.date)
        if (d !== 0) return d
        return a.time.localeCompare(b.time)
      }),
    [events]
  )

  const byDate = useMemo(() => {
    const map: Record<string, Event[]> = {}
    for (const e of sortedEvents) {
      ;(map[e.date] ??= []).push(e)
    }
    return map
  }, [sortedEvents])

  const upcomingAgenda = useMemo(
    () => sortedEvents.filter((e) => e.date >= todayIso),
    [sortedEvents, todayIso]
  )

  const listEvents = view === 'month'
    ? selectedDate
      ? byDate[selectedDate] ?? []
      : []
    : upcomingAgenda

  const selectedEvent = useMemo(() => {
    if (selectedEventId) {
      return sortedEvents.find((e) => e.id === selectedEventId) ?? listEvents[0] ?? null
    }
    return listEvents[0] ?? null
  }, [selectedEventId, sortedEvents, listEvents])

  const cells = useMemo(() => {
    const first = startOfMonth(cursor)
    const total = daysInMonth(cursor)
    const lead = first.getDay()
    const out: Array<{ date: Date | null; iso: string | null }> = []
    for (let i = 0; i < lead; i++) out.push({ date: null, iso: null })
    for (let day = 1; day <= total; day++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
      out.push({ date, iso: toIsoDate(date) })
    }
    while (out.length % 7 !== 0) out.push({ date: null, iso: null })
    return out
  }, [cursor])

  const goToday = () => {
    setCursor(startOfMonth(parseEventDate(todayIso)))
    setSelectedDate(todayIso)
    setSelectedEventId(null)
    setView('month')
  }

  const pickDate = (iso: string) => {
    setSelectedDate(iso)
    setSelectedEventId(null)
  }

  const pickEventFromGrid = (e: ReactMouseEvent, eventId: string, dateIso: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDate(dateIso)
    setSelectedEventId(eventId)
  }

  const openPointsEditor = (event: Event) => {
    setEditingEvent(event)
    setPointsDraft(event.points)
  }

  const savePoints = () => {
    if (!editingEvent) return
    updateEventPoints(editingEvent.id, pointsDraft)
    setEditingEvent(null)
  }

  const create = () => {
    if (!newEvent.name.trim() || !newEvent.date) return
    const id = addEvent({
      name: newEvent.name.trim(),
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location.trim() || 'TBD',
      description: newEvent.description.trim(),
      required: newEvent.required,
      points: newEvent.points,
      dressCode: 'Casual',
      rsvpRequired: newEvent.rsvpRequired,
      guestAllowed: false,
    })
    setCreateOpen(false)
    setSelectedDate(newEvent.date)
    setSelectedEventId(id)
    setCursor(startOfMonth(parseEventDate(newEvent.date)))
    setView('month')
    setNewEvent({
      name: '',
      type: 'Chapter',
      date: '',
      time: '7:00 PM',
      location: '',
      description: '',
      points: 5,
      required: false,
      rsvpRequired: true,
    })
  }

  const listTitle =
    view === 'month'
      ? selectedDate
        ? parseEventDate(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })
        : 'Select a day'
      : 'Upcoming events'

  return (
    <>
      <TopBar
        title="Calendar"
        subtitle={`${events.length} events · semester schedule`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-[var(--rule)]">
              <button
                type="button"
                onClick={() => setView('month')}
                className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider ${
                  view === 'month'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted)]'
                }`}
              >
                <LayoutGrid size={12} /> Month
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('agenda')
                  setSelectedEventId(null)
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider ${
                  view === 'agenda'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted)]'
                }`}
              >
                <List size={12} /> Agenda
              </button>
            </div>
            <button type="button" onClick={goToday} className="btn-ghost text-xs">
              Today
            </button>
            {canEditPoints && (
              <button
                type="button"
                onClick={() => {
                  setNewEvent((n) => ({ ...n, date: selectedDate ?? todayIso }))
                  setCreateOpen(true)
                }}
                className="btn-primary gap-1.5 text-xs"
              >
                <Plus size={14} /> Add event
              </button>
            )}
          </div>
        }
      />

      <PageShell className="space-y-6">
        <ColorLegend />

        {/* Events list — top */}
        <section>
          <div className="mb-2 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
            <h3 className="font-serif text-xl tracking-tight">{listTitle}</h3>
            <span className="metric text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {listEvents.length} event{listEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          {listEvents.length === 0 ? (
            <p className="border border-[var(--rule)] py-8 text-center font-mono text-xs text-[var(--muted)]">
              {view === 'month' ? 'No events this day.' : 'No upcoming events.'}
              {canEditPoints && view === 'month' && selectedDate && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setNewEvent((n) => ({ ...n, date: selectedDate }))
                      setCreateOpen(true)
                    }}
                  >
                    Add one
                  </button>
                </>
              )}
            </p>
          ) : (
            <ul className="list-editorial border border-[var(--rule)]">
              {listEvents.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  selected={selectedEvent?.id === event.id}
                  onSelect={() => setSelectedEventId(event.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Event details — below list */}
        {selectedEvent ? (
          <EventDetails
            event={selectedEvent}
            canEditPoints={canEditPoints}
            onEditPoints={openPointsEditor}
          />
        ) : listEvents.length > 0 ? null : (
          <p className="font-mono text-xs text-[var(--muted)]">Select an event to view details.</p>
        )}

        {/* Month grid — bottom (month view only) */}
        {view === 'month' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <button
                type="button"
                className="btn-ghost px-2 py-1"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="font-serif text-2xl tracking-tight">{monthLabel(cursor)}</h2>
              <button
                type="button"
                className="btn-ghost px-2 py-1"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 border-l border-t border-[var(--rule)]">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="border-b border-r border-[var(--rule)] bg-[var(--primary)] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--primary-foreground)]"
                >
                  {d}
                </div>
              ))}
              {cells.map((cell, i) => {
                const dayEvents = cell.iso ? byDate[cell.iso] ?? [] : []
                const isSelected = cell.iso === selectedDate
                const isToday = cell.iso === todayIso
                return (
                  <div
                    key={i}
                    role={cell.date ? 'button' : undefined}
                    tabIndex={cell.date ? 0 : undefined}
                    onClick={() => cell.iso && pickDate(cell.iso)}
                    onKeyDown={(ev) => {
                      if (!cell.iso) return
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        pickDate(cell.iso)
                      }
                    }}
                    className={`min-h-[88px] border-b border-r border-[var(--rule)] p-1.5 text-left align-top transition ${
                      !cell.date
                        ? 'bg-black/[0.02]'
                        : isSelected
                          ? 'bg-[var(--primary-subtle)]'
                          : 'cursor-pointer hover:bg-black/[0.02]'
                    }`}
                  >
                    {cell.date && (
                      <>
                        <span
                          className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center font-mono text-[11px] ${
                            isToday
                              ? 'bg-[var(--primary)] px-1 text-[var(--primary-foreground)]'
                              : 'text-[var(--muted)]'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        <ul className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 3).map((e) => {
                            const color = eventTypeColor(e.type)
                            const active = selectedEvent?.id === e.id
                            return (
                              <li key={e.id}>
                                <button
                                  type="button"
                                  onClick={(ev) => cell.iso && pickEventFromGrid(ev, e.id, cell.iso)}
                                  title={`${e.name} · ${e.type}`}
                                  className={`block w-full truncate px-1 py-0.5 text-left font-mono text-[9px] font-medium uppercase tracking-wide text-white hover:opacity-90 ${
                                    active ? 'ring-1 ring-white/80' : ''
                                  }`}
                                  style={{ backgroundColor: color }}
                                >
                                  {e.name}
                                </button>
                              </li>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <li className="px-0.5 font-mono text-[9px] text-[var(--muted)]">
                              +{dayEvents.length - 3} more
                            </li>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </PageShell>

      <Modal
        open={editingEvent != null}
        onClose={() => setEditingEvent(null)}
        title="Event points"
      >
        <p className="mb-3 text-sm text-[var(--muted)]">{editingEvent?.name}</p>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Points awarded
          </span>
          <input
            type="number"
            min={0}
            value={pointsDraft}
            onChange={(e) => setPointsDraft(Number(e.target.value))}
            className="input-editorial mt-1 font-mono"
          />
        </label>
        <button type="button" onClick={savePoints} className="btn-primary mt-4 w-full">
          Save points
        </button>
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New event">
        <div className="space-y-3">
          <input
            className="input-editorial"
            placeholder="Event name"
            value={newEvent.name}
            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
          />
          <select
            className="input-editorial"
            value={newEvent.type}
            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
          >
            {CALENDAR_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {newEvent.type && (
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <span
                className="inline-block h-2.5 w-2.5"
                style={{ backgroundColor: eventTypeColor(newEvent.type) }}
              />
              Calendar color · {newEvent.type}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="input-editorial font-mono"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <input
              className="input-editorial"
              placeholder="Time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            />
          </div>
          <input
            className="input-editorial"
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
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Points</span>
              <input
                type="number"
                className="input-editorial mt-1 font-mono"
                value={newEvent.points}
                onChange={(e) => setNewEvent({ ...newEvent, points: Number(e.target.value) })}
              />
            </label>
            <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvent.required}
                  onChange={(e) => setNewEvent({ ...newEvent, required: e.target.checked })}
                />
                Required
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvent.rsvpRequired}
                  onChange={(e) => setNewEvent({ ...newEvent, rsvpRequired: e.target.checked })}
                />
                RSVP required
              </label>
            </div>
          </div>
          <button type="button" onClick={create} className="btn-primary w-full">
            Create event
          </button>
        </div>
      </Modal>
    </>
  )
}
