import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, List, LayoutGrid } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterOps } from '../context/ChapterOpsContext'
import { usePermissions } from '../context/AuthContext'
import type { Event } from '../types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EVENT_TYPES = ['Chapter', 'Social', 'Scholarship', 'Recruitment', 'Education', 'Philanthropy']
/** Align with mock semester data */
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

function EventRow({
  event,
  canEditPoints,
  onEditPoints,
}: {
  event: Event
  canEditPoints: boolean
  onEditPoints: (e: Event) => void
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <Link
          to={`/events/${event.id}`}
          className="text-[15px] font-medium text-[var(--ink)] hover:underline"
        >
          {event.name}
        </Link>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {event.time} · {event.location} · {event.type}
          {event.required ? ' · Required' : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="metric border border-[var(--rule)] px-2 py-1 text-[11px]">
          {event.points} pts
        </span>
        {canEditPoints && (
          <button
            type="button"
            onClick={() => onEditPoints(event)}
            className="btn-ghost px-2 py-1 text-[10px]"
          >
            Edit pts
          </button>
        )}
        <Link to={`/events/${event.id}`} className="btn-ghost px-2 py-1 text-[10px]">
          Open
        </Link>
      </div>
    </li>
  )
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { events, updateEventPoints, addEvent } = useChapterOps()
  const permissions = usePermissions()
  const canEditPoints = permissions.canEditEventPoints

  const todayIso = DEMO_TODAY
  const [cursor, setCursor] = useState(() => startOfMonth(parseEventDate(DEMO_TODAY)))
  const [view, setView] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso)
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

  const selectedEvents = selectedDate ? byDate[selectedDate] ?? [] : []

  const goToday = () => {
    setCursor(startOfMonth(parseEventDate(todayIso)))
    setSelectedDate(todayIso)
    setView('month')
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
    navigate(`/events/${id}`)
  }

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
                onClick={() => setView('agenda')}
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

      <PageShell className="space-y-8">
        {view === 'month' && (
          <>
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
                  <button
                    key={i}
                    type="button"
                    disabled={!cell.date}
                    onClick={() => cell.iso && setSelectedDate(cell.iso)}
                    className={`min-h-[96px] border-b border-r border-[var(--rule)] p-1.5 text-left align-top transition ${
                      !cell.date
                        ? 'bg-black/[0.02]'
                        : isSelected
                          ? 'bg-[var(--primary-subtle)]'
                          : 'hover:bg-black/[0.02]'
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
                          {dayEvents.slice(0, 3).map((e) => (
                            <li
                              key={e.id}
                              className="truncate font-mono text-[9px] uppercase tracking-wide text-[var(--ink)]"
                              style={{ borderLeft: `2px solid var(--primary)`, paddingLeft: 4 }}
                            >
                              {e.name}
                            </li>
                          ))}
                          {dayEvents.length > 3 && (
                            <li className="font-mono text-[9px] text-[var(--muted)]">
                              +{dayEvents.length - 3} more
                            </li>
                          )}
                        </ul>
                      </>
                    )}
                  </button>
                )
              })}
            </div>

            <section>
              <div className="mb-3 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
                <h3 className="font-serif text-xl tracking-tight">
                  {selectedDate
                    ? parseEventDate(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select a day'}
                </h3>
                <span className="metric text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {selectedEvents.length} event{selectedEvents.length === 1 ? '' : 's'}
                </span>
              </div>

              <ul className="list-editorial">
                {selectedEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    canEditPoints={canEditPoints}
                    onEditPoints={openPointsEditor}
                  />
                ))}
                {selectedDate && selectedEvents.length === 0 && (
                  <li className="py-6 font-mono text-xs text-[var(--muted)]">
                    No events this day.
                    {canEditPoints && (
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
                  </li>
                )}
              </ul>
            </section>
          </>
        )}

        {view === 'agenda' && (
          <section>
            <div className="mb-4 flex items-baseline justify-between border-b border-[var(--rule)] pb-2">
              <h3 className="font-serif text-xl tracking-tight">Upcoming agenda</h3>
              <span className="metric text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {upcomingAgenda.length} event{upcomingAgenda.length === 1 ? '' : 's'}
              </span>
            </div>

            {upcomingAgenda.length === 0 && (
              <p className="py-8 font-mono text-xs text-[var(--muted)]">
                No upcoming events. Create one from the calendar.
              </p>
            )}

            <div className="space-y-6">
              {Object.entries(
                upcomingAgenda.reduce<Record<string, Event[]>>((acc, e) => {
                  ;(acc[e.date] ??= []).push(e)
                  return acc
                }, {})
              ).map(([date, dayEvents]) => (
                <div key={date}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(date)
                      setCursor(startOfMonth(parseEventDate(date)))
                      setView('month')
                    }}
                    className="mb-2 flex w-full items-baseline justify-between border-b border-[var(--rule)] pb-1.5 text-left"
                  >
                    <span className="font-serif text-lg tracking-tight">
                      {parseEventDate(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    {date === todayIso && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">
                        Today
                      </span>
                    )}
                  </button>
                  <ul className="list-editorial">
                    {dayEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        canEditPoints={canEditPoints}
                        onEditPoints={openPointsEditor}
                      />
                    ))}
                  </ul>
                </div>
              ))}
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
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
            Create & open event
          </button>
          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Saves to chapter calendar · home · member room
          </p>
        </div>
      </Modal>
    </>
  )
}
