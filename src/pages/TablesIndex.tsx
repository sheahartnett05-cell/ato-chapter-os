import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Table2, CalendarDays, Users, Grid3x3, PenLine } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell, Section } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterTables } from '../context/ChapterTablesContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { templatesForKind } from '../data/tableFormTemplates'
import type { FormKind } from '../types'
import { localTodayIso } from '../lib/liveAlerts'

export default function TablesIndex() {
  const navigate = useNavigate()
  const { tables, templates, createTable } = useChapterTables()
  const { events } = useChapterOps()

  const [createOpen, setCreateOpen] = useState(false)
  const [formKind, setFormKind] = useState<FormKind>('spreadsheet')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('spreadsheet-empty')
  const [formName, setFormName] = useState('')

  const eventsWithTables = useMemo(() => {
    const byEvent = new Map<string, typeof tables>()
    for (const table of tables) {
      const list = byEvent.get(table.eventId) ?? []
      list.push(table)
      byEvent.set(table.eventId, list)
    }
    return [...byEvent.entries()].sort(([a], [b]) => {
      const ea = events.find((e) => e.id === a)
      const eb = events.find((e) => e.id === b)
      return (ea?.date ?? '').localeCompare(eb?.date ?? '')
    })
  }, [tables, events])

  const eventName = (id: string) => events.find((e) => e.id === id)?.name ?? 'Unknown event'
  const eventDate = (id: string) => events.find((e) => e.id === id)?.date ?? ''

  const TODAY = localTodayIso()

  const linkableEvents = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= TODAY)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [events]
  )

  const formatEventOption = (event: (typeof events)[number]) => {
    const dateLabel = new Date(event.date + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    return `${event.name} — ${dateLabel}`
  }

  const kindTemplates = useMemo(() => templatesForKind(formKind), [formKind])

  const pickFormKind = (kind: FormKind) => {
    setFormKind(kind)
    const next = templatesForKind(kind)
    setSelectedTemplateId(next[0]?.id ?? '')
  }

  const handleCreate = () => {
    if (!selectedEventId) return
    const table = createTable({
      eventId: selectedEventId,
      templateId: selectedTemplateId,
      name: formName.trim() || undefined,
    })
    setCreateOpen(false)
    setFormName('')
    setSelectedEventId('')
    setFormKind('spreadsheet')
    setSelectedTemplateId('spreadsheet-empty')
    navigate(`/tables/${table.id}`)
  }

  const formKindLabel = (kind: FormKind) =>
    kind === 'spreadsheet' ? 'Spreadsheet' : 'Signature'

  const selectedTemplate = kindTemplates.find((t) => t.id === selectedTemplateId)

  return (
    <>
      <TopBar
        title="Forms"
        subtitle="Event forms — guest lists, logistics, and custom fields per event"
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-primary gap-2 px-5 py-2.5 text-sm font-bold shadow-sm"
          >
            <Plus size={18} />
            New event form
          </button>
        }
      />

      <PageShell>
        {tables.length === 0 ? (
          <Section title="No forms yet">
            <div className="rounded-2xl bg-neutral-50 px-8 py-12 text-center">
              <Table2 size={32} className="mx-auto text-neutral-300" />
              <p className="mt-4 text-sm text-neutral-600">
                Create a form for an event to track RSVPs, guests, payments, and custom columns.
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="btn-primary mt-6 gap-2 px-6 py-3 text-sm font-bold shadow-sm"
              >
                <Plus size={18} />
                Create first form
              </button>
            </div>
          </Section>
        ) : (
          eventsWithTables.map(([eventId, eventTables]) => (
            <Section
              key={eventId}
              title={eventName(eventId)}
              subtitle={eventDate(eventId) ? new Date(eventDate(eventId) + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : undefined}
              action={
                <Link
                  to={`/events/${eventId}`}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  View event →
                </Link>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {eventTables.map((table) => {
                  const template = templates.find((t) => t.id === table.templateId)
                  return (
                    <Link
                      key={table.id}
                      to={`/tables/${table.id}`}
                      className="group rounded-2xl border border-black/5 bg-neutral-50/60 p-5 transition hover:border-accent/30 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-neutral-900 group-hover:text-accent">
                            {table.name}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formKindLabel(table.formKind ?? template?.formKind ?? 'spreadsheet')}
                            {template ? ` · ${template.name}` : ''}
                          </p>
                        </div>
                        <Table2 size={18} className="shrink-0 text-neutral-300 group-hover:text-accent" />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-neutral-600">{table.description}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {table.rows.length} rows
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {table.columns.length} columns
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Section>
          ))
        )}

        <Section
          title="Form templates"
          subtitle="Spreadsheet grids and signature sheets — pick one when creating a new form"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl bg-neutral-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {formKindLabel(t.formKind)}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{t.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t.description}</p>
                <p className="mt-3 text-xs text-neutral-400">
                  {t.columns.length} fields
                  {t.eventTypes?.length ? ` · ${t.eventTypes.join(', ')}` : ''}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </PageShell>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New event form">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500">Form type</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => pickFormKind('spreadsheet')}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  formKind === 'spreadsheet'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                    : 'border-black/5 bg-neutral-50 hover:border-black/10'
                }`}
              >
                <Grid3x3
                  size={18}
                  className={formKind === 'spreadsheet' ? 'text-accent' : 'text-neutral-400'}
                />
                <p className="mt-2 text-sm font-semibold text-neutral-900">Spreadsheet</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Custom columns, rows, and cell data
                </p>
              </button>
              <button
                type="button"
                onClick={() => pickFormKind('signature')}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  formKind === 'signature'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                    : 'border-black/5 bg-neutral-50 hover:border-black/10'
                }`}
              >
                <PenLine
                  size={18}
                  className={formKind === 'signature' ? 'text-accent' : 'text-neutral-400'}
                />
                <p className="mt-2 text-sm font-semibold text-neutral-900">Signature</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Sign-off sheet with drawn signatures
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">Linked event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
            >
              <option value="">Select event…</option>
              {linkableEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {formatEventOption(e)}
                </option>
              ))}
            </select>
            {linkableEvents.length === 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                No upcoming calendar events yet.{' '}
                <Link to="/calendar" className="font-semibold text-accent hover:underline">
                  Create one on the Calendar
                </Link>
                .
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">
              {formKind === 'spreadsheet' ? 'Starting layout' : 'Signature template'}
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
            >
              {kindTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="mt-2 text-xs text-neutral-500">{selectedTemplate.description}</p>
            )}
            {formKind === 'spreadsheet' && selectedTemplateId === 'spreadsheet-empty' && (
              <p className="mt-2 text-xs text-neutral-500">
                After creating, use <span className="font-semibold">Add column</span> and{' '}
                <span className="font-semibold">Add row</span> to build your grid.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">Form name (optional)</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={selectedTemplate?.name ?? 'Event form'}
              className="mt-1 w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!selectedEventId}
            className="btn-primary w-full py-3 text-sm font-bold shadow-sm disabled:opacity-50"
          >
            Create form
          </button>
        </div>
      </Modal>
    </>
  )
}
