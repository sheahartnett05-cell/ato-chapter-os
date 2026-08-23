import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Search, ArrowUpDown, Download, Columns } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { fallFormalTable } from '../data/mockData'
import type { TableColumn } from '../types'

export default function ChapterTables() {
  const { id } = useParams<{ id: string }>()
  const [table, setTable] = useState(() => ({ ...fallFormalTable, rows: [...fallFormalTable.rows.map(r => ({ ...r, cells: { ...r.cells } }))], columns: [...fallFormalTable.columns] }))
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [showColModal, setShowColModal] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColType, setNewColType] = useState<TableColumn['type']>('text')
  const [filterRsvp, setFilterRsvp] = useState<string>('All')

  const filteredRows = useMemo(() => {
    let rows = [...table.rows]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((r) =>
        Object.values(r.cells).some((v) => String(v).toLowerCase().includes(q))
      )
    }
    if (filterRsvp !== 'All') {
      rows = rows.filter((r) => r.cells.rsvp === filterRsvp)
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
  }, [table.rows, search, sortCol, sortAsc, filterRsvp])

  const handleSort = (colId: string) => {
    if (sortCol === colId) setSortAsc(!sortAsc)
    else {
      setSortCol(colId)
      setSortAsc(true)
    }
  }

  const handleCellEdit = (rowId: string, colId: string, value: string | boolean | number) => {
    setTable((prev) => ({
      ...prev,
      rows: prev.rows.map((r) =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r
      ),
    }))
  }

  const addColumn = () => {
    if (!newColName.trim()) return
    const col: TableColumn = {
      id: `col_${Date.now()}`,
      name: newColName,
      type: newColType,
    }
    setTable((prev) => ({
      ...prev,
      columns: [...prev.columns, col],
      rows: prev.rows.map((r) => ({
        ...r,
        cells: { ...r.cells, [col.id]: col.type === 'checkbox' ? false : '' },
      })),
    }))
    setNewColName('')
    setShowColModal(false)
  }

  const addRow = () => {
    const cells: Record<string, string | boolean | number> = {}
    table.columns.forEach((c) => {
      cells[c.id] = c.type === 'checkbox' ? false : c.type === 'number' ? 0 : ''
    })
    setTable((prev) => ({
      ...prev,
      rows: [...prev.rows, { id: `r_${Date.now()}`, cells }],
    }))
  }

  if (id !== 't1') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-navy">Table not found — demo includes Fall Formal table only</p>
      </div>
    )
  }

  return (
    <>
      <TopBar
        title={table.name}
        subtitle={table.description}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-surface"
            >
              <Download size={15} />
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowColModal(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-surface"
            >
              <Columns size={15} />
              Add Column
            </button>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold-dark"
            >
              <Plus size={15} />
              Add Row
            </button>
          </div>
        }
      />

      <div className="p-8">
        <Card padding={false}>
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search table…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-gold"
              />
            </div>
            <select
              value={filterRsvp}
              onChange={(e) => setFilterRsvp(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="All">All RSVPs</option>
              <option value="Yes">RSVP: Yes</option>
              <option value="No">RSVP: No</option>
            </select>
            <span className="text-xs text-slate-500">{filteredRows.length} rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  {table.columns.map((col) => (
                    <th key={col.id} className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => handleSort(col.id)}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-navy"
                      >
                        {col.name}
                        <ArrowUpDown size={12} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface/30">
                    {table.columns.map((col) => (
                      <td key={col.id} className="px-4 py-2">
                        {col.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={Boolean(row.cells[col.id])}
                            onChange={(e) => handleCellEdit(row.id, col.id, e.target.checked)}
                            className="rounded border-border text-gold focus:ring-gold"
                          />
                        ) : col.type === 'dropdown' && col.id === 'rsvp' ? (
                          <select
                            value={String(row.cells[col.id])}
                            onChange={(e) => handleCellEdit(row.id, col.id, e.target.value)}
                            className="rounded border border-border px-2 py-1 text-sm"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Maybe">Maybe</option>
                          </select>
                        ) : col.type === 'dropdown' && col.id === 'transportation' ? (
                          <select
                            value={String(row.cells[col.id])}
                            onChange={(e) => handleCellEdit(row.id, col.id, e.target.value)}
                            className="rounded border border-border px-2 py-1 text-sm"
                          >
                            <option value="">—</option>
                            <option value="Own ride">Own ride</option>
                            <option value="Chapter van">Chapter van</option>
                            <option value="Need ride">Need ride</option>
                          </select>
                        ) : col.type === 'number' ? (
                          <input
                            type="number"
                            value={Number(row.cells[col.id]) || 0}
                            onChange={(e) =>
                              handleCellEdit(row.id, col.id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 rounded border border-border px-2 py-1 text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(row.cells[col.id] ?? '')}
                            onChange={(e) => handleCellEdit(row.id, col.id, e.target.value)}
                            className="w-full min-w-[100px] rounded border border-transparent px-2 py-1 text-sm hover:border-border focus:border-gold focus:outline-none"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={showColModal} onClose={() => setShowColModal(false)} title="Add Column">
        <div className="space-y-4">
          <input
            placeholder="Column name"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <select
            value={newColType}
            onChange={(e) => setNewColType(e.target.value as TableColumn['type'])}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="text">Text</option>
            <option value="dropdown">Dropdown</option>
            <option value="checkbox">Checkbox</option>
            <option value="date">Date</option>
            <option value="number">Number</option>
            <option value="member">Member Reference</option>
          </select>
          <button
            type="button"
            onClick={addColumn}
            className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white"
          >
            Add Column
          </button>
        </div>
      </Modal>
    </>
  )
}
