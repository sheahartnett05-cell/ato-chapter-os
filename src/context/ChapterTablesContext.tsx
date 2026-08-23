import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_CHAPTER_TABLES } from '../data/chapterTablesData'
import { getTableTemplate, TABLE_FORM_TEMPLATES } from '../data/tableFormTemplates'
import { getMember, rsvps as demoRsvps } from '../data/mockData'
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import type { ChapterTableForm, TableColumn, TableRow } from '../types'

const STORAGE_KEY = STORAGE_KEYS.tableForms

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function readTables(): ChapterTableForm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChapterTableForm[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    /* ignore */
  }
  return allowDemoData() ? DEMO_CHAPTER_TABLES : []
}

function writeTables(tables: ChapterTableForm[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables))
  } catch {
    /* storage unavailable */
  }
}

function defaultCellValue(col: TableColumn): string | boolean | number {
  if (col.type === 'checkbox') return false
  if (col.type === 'number') return 0
  if (col.type === 'dropdown' && col.options?.length) return col.options[0]
  return ''
}

function rsvpToDropdown(status: 'Going' | 'Not Going'): string {
  return status === 'Going' ? 'Yes' : 'No'
}

interface ChapterTablesContextValue {
  tables: ChapterTableForm[]
  templates: typeof TABLE_FORM_TEMPLATES
  getTable: (id: string) => ChapterTableForm | undefined
  getTableForEvent: (eventId: string) => ChapterTableForm | undefined
  createTable: (input: {
    eventId: string
    templateId: string
    name?: string
  }) => ChapterTableForm
  updateTable: (id: string, patch: Partial<ChapterTableForm>) => void
  deleteTable: (id: string) => void
  updateRow: (tableId: string, rowId: string, cells: TableRow['cells']) => void
  addRow: (tableId: string) => void
  addColumn: (tableId: string, col: Omit<TableColumn, 'id'>) => void
  syncGuestListFromEvent: (tableId: string) => void
}

const ChapterTablesContext = createContext<ChapterTablesContextValue | null>(null)

export function ChapterTablesProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<ChapterTableForm[]>(readTables)

  const persist = useCallback((next: ChapterTableForm[]) => {
    setTables(next)
    writeTables(next)
  }, [])

  const getTable = useCallback((id: string) => tables.find((t) => t.id === id), [tables])

  const getTableForEvent = useCallback(
    (eventId: string) => tables.find((t) => t.eventId === eventId),
    [tables]
  )

  const createTable = useCallback(
    (input: { eventId: string; templateId: string; name?: string }) => {
      const template = getTableTemplate(input.templateId)
      if (!template) throw new Error('Unknown template')
      const now = new Date().toISOString()
      const table: ChapterTableForm = {
        id: uid('tbl'),
        name: input.name ?? template.name,
        description: template.description,
        eventId: input.eventId,
        templateId: input.templateId,
        columns: template.columns.map((c) => ({ ...c })),
        rows: [],
        createdAt: now,
        updatedAt: now,
      }
      persist([table, ...tables])
      return table
    },
    [tables, persist]
  )

  const updateTable = useCallback(
    (id: string, patch: Partial<ChapterTableForm>) => {
      persist(
        tables.map((t) =>
          t.id === id
            ? { ...t, ...patch, updatedAt: new Date().toISOString() }
            : t
        )
      )
    },
    [tables, persist]
  )

  const deleteTable = useCallback(
    (id: string) => {
      persist(tables.filter((t) => t.id !== id))
    },
    [tables, persist]
  )

  const updateRow = useCallback(
    (tableId: string, rowId: string, cells: TableRow['cells']) => {
      persist(
        tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                updatedAt: new Date().toISOString(),
                rows: t.rows.map((r) => (r.id === rowId ? { ...r, cells } : r)),
              }
            : t
        )
      )
    },
    [tables, persist]
  )

  const addRow = useCallback(
    (tableId: string) => {
      persist(
        tables.map((t) => {
          if (t.id !== tableId) return t
          const cells: Record<string, string | boolean | number> = {}
          t.columns.forEach((c) => {
            cells[c.id] = defaultCellValue(c)
          })
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            rows: [...t.rows, { id: uid('row'), cells }],
          }
        })
      )
    },
    [tables, persist]
  )

  const addColumn = useCallback(
    (tableId: string, col: Omit<TableColumn, 'id'>) => {
      const newCol: TableColumn = { ...col, id: uid('col') }
      persist(
        tables.map((t) => {
          if (t.id !== tableId) return t
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            columns: [...t.columns, newCol],
            rows: t.rows.map((r) => ({
              ...r,
              cells: { ...r.cells, [newCol.id]: defaultCellValue(newCol) },
            })),
          }
        })
      )
    },
    [tables, persist]
  )

  const syncGuestListFromEvent = useCallback(
    (tableId: string) => {
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const template = getTableTemplate(table.templateId)
      const mapping = template?.guestListMapping
      if (!mapping) return

      const eventRsvps = demoRsvps[table.eventId] ?? []
      const existingByMember = new Map(
        table.rows.filter((r) => r.memberId).map((r) => [r.memberId!, r])
      )

      const syncedRows: TableRow[] = eventRsvps.map((rsvp) => {
        const member = getMember(rsvp.memberId)
        const name = member ? `${member.firstName} ${member.lastName}` : rsvp.memberId
        const prev = existingByMember.get(rsvp.memberId)

        const cells = { ...(prev?.cells ?? {}) }
        cells[mapping.memberColumn] = name
        cells[mapping.rsvpColumn] = rsvpToDropdown(rsvp.status)
        if (mapping.guestColumn) {
          cells[mapping.guestColumn] = rsvp.guest ?? ''
        }

        table.columns.forEach((col) => {
          if (cells[col.id] === undefined) {
            cells[col.id] = defaultCellValue(col)
          }
        })

        return {
          id: prev?.id ?? uid('row'),
          memberId: rsvp.memberId,
          cells,
        }
      })

      persist(
        tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                rows: syncedRows,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      )
    },
    [tables, persist]
  )

  const value = useMemo<ChapterTablesContextValue>(
    () => ({
      tables,
      templates: TABLE_FORM_TEMPLATES,
      getTable,
      getTableForEvent,
      createTable,
      updateTable,
      deleteTable,
      updateRow,
      addRow,
      addColumn,
      syncGuestListFromEvent,
    }),
    [
      tables,
      getTable,
      getTableForEvent,
      createTable,
      updateTable,
      deleteTable,
      updateRow,
      addRow,
      addColumn,
      syncGuestListFromEvent,
    ]
  )

  return (
    <ChapterTablesContext.Provider value={value}>{children}</ChapterTablesContext.Provider>
  )
}

export function useChapterTables(): ChapterTablesContextValue {
  const ctx = useContext(ChapterTablesContext)
  if (!ctx) throw new Error('useChapterTables must be used within ChapterTablesProvider')
  return ctx
}
