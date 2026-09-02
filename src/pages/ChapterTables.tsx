import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Plus,
  Search,
  ArrowUpDown,
  Download,
  Columns,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import { useChapterTables } from '../context/ChapterTablesContext'
import { useChapterOps } from '../context/ChapterOpsContext'
import { SignatureCell } from '../components/forms/SignatureCell'
import type { TableColumn } from '../types'

const cellFieldClass =
  'w-full min-w-[120px] rounded-sm border border-black/10 bg-white px-2.5 py-1.5 text-sm text-neutral-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition placeholder:text-neutral-400 focus:border-accent/50 focus:ring-2 focus:ring-accent/15'

function cellPlaceholder(col: TableColumn) {
  if (col.type === 'member') return ''
  if (col.type === 'number') return '0'
  if (col.type === 'date') return 'mm/dd/yyyy'
  return `Enter ${col.name.toLowerCase()}…`
}

function CellEditor({
  col,
  value,
  onChange,
}: {
  col: TableColumn
  value: string | boolean | number
  onChange: (v: string | boolean | number) => void
}) {
  if (col.type === 'checkbox') {
    return (
      <div className="flex h-9 items-center justify-center rounded-sm border border-black/10 bg-white px-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-black/10 text-accent focus:ring-accent"
        />
      </div>
    )
  }
  if (col.type === 'dropdown' && col.options?.length) {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={cellFieldClass}
      >
        {col.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || '—'}
          </option>
        ))}
      </select>
    )
  }
  if (col.type === 'number') {
    return (
      <input
        type="number"
        value={Number(value) || ''}
        placeholder={cellPlaceholder(col)}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className={cellFieldClass}
      />
    )
  }
  if (col.type === 'date') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={cellFieldClass}
      />
    )
  }
  if (col.type === 'signature') {
    return (
      <div className="min-h-9 rounded-sm border border-black/10 bg-white px-2 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
        <SignatureCell value={value} onChange={(v) => onChange(v)} />
      </div>
    )
  }
  if (col.type === 'member') {
    return (
      <input
        type="text"
        value={String(value ?? '')}
        readOnly
        tabIndex={-1}
        placeholder="Added by you"
        className={`${cellFieldClass} cursor-default bg-neutral-50 text-neutral-800 focus:border-black/10 focus:ring-0`}
      />
    )
  }
  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      placeholder={cellPlaceholder(col)}
      className={cellFieldClass}
    />
  )
}

export default function ChapterTables() {
  const { id } = useParams<{ id: string }>()
  const { events } = useChapterOps()
  const { memberId, profile } = useAuth()
  const { getMemberById } = useMembers()
  const {
    getTable,
    updateRow,
    addRow,
    addColumn,
    syncGuestListFromEvent,
    templates,
  } = useChapterTables()

  const table = id ? getTable(id) : undefined
  const linkedEvent = table ? events.find((e) => e.id === table.eventId) : undefined
  const template = table ? templates.find((t) => t.id === table.templateId) : undefined

  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [showColModal, setShowColModal] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState<TableColumn['type']>('text')
  const [filterRsvp, setFilterRsvp] = useState<string>('All')
  const [synced, setSynced] = useState(false)

  const rsvpColumnId = template?.guestListMapping?.rsvpColumn ?? 'rsvp'
  const hasRsvpColumn = table?.columns.some((c) => c.id === rsvpColumnId) ?? false
  const isSignatureForm = (table?.formKind ?? template?.formKind) === 'signature'
  const canSyncGuestList = Boolean(template?.guestListMapping)

  const filteredRows = useMemo(() => {
    if (!table) return []
    let rows = [...table.rows]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((r) =>
        Object.values(r.cells).some((v) => String(v).toLowerCase().includes(q))
      )
    }
    if (filterRsvp !== 'All' && hasRsvpColumn) {
      rows = rows.filter((r) => r.cells[rsvpColumnId] === filterRsvp)
    }
    if (sortCol) {
      rows.sort((a, b) => {
        const av = a.cells[sortCol]
        const bv = b.cells[sortCol]
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
        return sortAsc ? cmp : -cmp
      })
    }
    return rows
  }, [table, search, sortCol, sortAsc, filterRsvp, rsvpColumnId, hasRsvpColumn])

  const handleSort = (colId: string) => {
    if (sortCol === colId) setSortAsc(!sortAsc)
    else {
      setSortCol(colId)
      setSortAsc(true)
    }
  }

  const handleSync = () => {
    if (!id) return
    syncGuestListFromEvent(id)
    setSynced(true)
    window.setTimeout(() => setSynced(false), 2000)
  }

  const addedByMember = useMemo(() => {
    const member = memberId ? getMemberById(memberId) : undefined
    const memberName =
      member != null
        ? `${member.firstName} ${member.lastName}`.trim()
        : [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'You'
    return { memberId: memberId ?? undefined, memberName }
  }, [memberId, getMemberById, profile.firstName, profile.lastName])

  const handleAddRow = () => {
    if (!table) return
    addRow(table.id, addedByMember)
  }

  if (!table) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-neutral-600">Form not found</p>
        <Link to="/tables" className="text-sm font-semibold text-accent hover:underline">
          ← Back to forms
        </Link>
      </div>
    )
  }

  return (
    <>
      <TopBar
        title={table.name}
        subtitle={table.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/tables"
              className="flex items-center gap-1.5 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <ChevronLeft size={15} />
              All forms
            </Link>
            {linkedEvent && (
              <Link
                to={`/events/${linkedEvent.id}`}
                className="flex items-center gap-2 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                <CalendarDays size={15} />
                {linkedEvent.name}
              </Link>
            )}
            {canSyncGuestList && (
              <button
                type="button"
                onClick={handleSync}
                className="flex items-center gap-2 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                <RefreshCw size={15} className={synced ? 'text-emerald-600' : ''} />
                {synced ? 'Synced' : isSignatureForm ? 'Sync roster' : 'Sync guest list'}
              </button>
            )}
            <button
              type="button"
              className="flex items-center gap-2 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <Download size={15} />
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowColModal(true)}
              className="flex items-center gap-2 rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <Columns size={15} />
              Add column
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              disabled={table.columns.length === 0}
              className="flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Add row
            </button>
          </div>
        }
      />

      <PageShell>
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-black/5 px-5 py-4">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="search"
                placeholder="Search table…"
                aria-label="Search table"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-sm border border-black/5 bg-neutral-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-accent/40"
              />
            </div>
            {hasRsvpColumn && (
              <select
                value={filterRsvp}
                onChange={(e) => setFilterRsvp(e.target.value)}
                className="rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
              >
                <option value="All">All RSVPs</option>
                <option value="Yes">RSVP: Yes</option>
                <option value="No">RSVP: No</option>
                <option value="Maybe">RSVP: Maybe</option>
              </select>
            )}
            <span className="text-xs text-neutral-500">{filteredRows.length} rows</span>
            {template && (
              <span className="ml-auto text-xs text-neutral-400">
                {isSignatureForm ? 'Signature' : 'Spreadsheet'} · {template.name}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50/80">
                  {table.columns.map((col) => (
                    <th
                      key={col.id}
                      className="border border-black/10 px-2 py-2.5 text-left"
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(col.id)}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-900"
                      >
                        {col.name}
                        <ArrowUpDown size={12} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(table.columns.length, 1)}
                      className="border border-black/10 px-4 py-12 text-center text-neutral-500"
                    >
                      {table.columns.length === 0
                        ? 'No columns yet — use "Add column" to define your grid, then add rows.'
                        : canSyncGuestList
                          ? `No rows yet — use "${isSignatureForm ? 'Sync roster' : 'Sync guest list'}" or Add row`
                          : 'No rows yet — use "Add row" to start filling in data.'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      {table.columns.map((col) => (
                        <td key={col.id} className="border border-black/10 bg-neutral-50/20 p-1.5 align-top">
                          <CellEditor
                            col={col}
                            value={row.cells[col.id] ?? ''}
                            onChange={(v) =>
                              updateRow(table.id, row.id, { ...row.cells, [col.id]: v })
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageShell>

      <Modal open={showColModal} onClose={() => setShowColModal(false)} title="Add column">
        <div className="space-y-4">
          <input
            placeholder="Column name"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            className="w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
          />
          <select
            value={newColType}
            onChange={(e) => setNewColType(e.target.value as TableColumn['type'])}
            className="w-full rounded-sm border border-black/5 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-accent/40"
          >
            <option value="text">Text</option>
            <option value="dropdown">Dropdown</option>
            <option value="checkbox">Checkbox</option>
            <option value="date">Date</option>
            <option value="number">Number</option>
            <option value="member">Member reference</option>
            <option value="signature">Signature</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (!newColName.trim()) return
              addColumn(table.id, { name: newColName.trim(), type: newColType })
              setNewColName('')
              setShowColModal(false)
            }}
            className="w-full rounded-sm bg-accent py-2.5 text-sm font-semibold text-white"
          >
            Add column
          </button>
        </div>
      </Modal>
    </>
  )
}
