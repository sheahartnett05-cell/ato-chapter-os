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
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import {
  findMemberColumnId,
  findRsvpColumnId,
  getFormRsvpsForEvent,
  eventHasRsvpForm,
  resolveEventRsvps,
  type EventFormRsvp,
} from '../lib/formRsvps'
import type { ChapterTableForm, RsvpEntry, TableColumn, TableRow } from '../types'

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

function rsvpToDropdown(status: 'Going' | 'Not Going' | string): string {
  if (status === 'Going' || status === 'Yes' || status === 'Maybe') return status === 'Maybe' ? 'Maybe' : 'Yes'
  if (status === 'Yes' || status === 'Maybe' || status === 'No') return status
  return status === 'Not Going' || status === 'No' ? 'No' : 'Yes'
}

function readLiveOpsRsvps(): Record<string, RsvpEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.rsvps)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, RsvpEntry[]>
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  return {}
}

function readRosterName(memberId: string): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.roster)
    if (!raw) return memberId
    const roster = JSON.parse(raw) as { id: string; firstName: string; lastName: string }[]
    const m = roster.find((x) => x.id === memberId)
    return m ? `${m.firstName} ${m.lastName}`.trim() : memberId
  } catch {
    return memberId
  }
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
  addRow: (
    tableId: string,
    addedBy?: { memberId?: string; memberName: string }
  ) => void
  addColumn: (tableId: string, col: Omit<TableColumn, 'id'>) => void
  syncGuestListFromEvent: (tableId: string) => void
  getEventRsvps: (eventId: string) => EventFormRsvp[]
  updateMemberFormRsvp: (
    eventId: string,
    memberId: string,
    memberName: string,
    rsvpValue: string
  ) => void
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
        formKind: template.formKind,
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
    (tableId: string, addedBy?: { memberId?: string; memberName: string }) => {
      persist(
        tables.map((t) => {
          if (t.id !== tableId) return t
          const hasMemberColumn = t.columns.some((c) => c.type === 'member')
          const cells: Record<string, string | boolean | number> = {}
          t.columns.forEach((c) => {
            if (c.type === 'member' && addedBy?.memberName) {
              cells[c.id] = addedBy.memberName
            } else {
              cells[c.id] = defaultCellValue(c)
            }
          })
          const row: TableRow = {
            id: uid('row'),
            cells,
            ...(hasMemberColumn && addedBy?.memberId ? { memberId: addedBy.memberId } : {}),
          }
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            rows: [...t.rows, row],
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

      // Prefer live form RSVPs for this event; else ChapterOps RSVPs from localStorage
      const formRsvps = getFormRsvpsForEvent(tables, table.eventId).filter((r) => r.memberId)
      const opsRsvps = readLiveOpsRsvps()[table.eventId] ?? []

      type SyncRow = { memberId: string; name: string; rsvp: string; guest?: string }
      const byMember = new Map<string, SyncRow>()

      for (const r of formRsvps) {
        if (!r.memberId) continue
        byMember.set(r.memberId, {
          memberId: r.memberId,
          name: r.memberName || readRosterName(r.memberId),
          rsvp: rsvpToDropdown(r.rsvp),
          guest: r.guest,
        })
      }
      for (const r of opsRsvps) {
        if (byMember.has(r.memberId)) continue
        byMember.set(r.memberId, {
          memberId: r.memberId,
          name: readRosterName(r.memberId),
          rsvp: rsvpToDropdown(r.status),
          guest: r.guest,
        })
      }

      const existingByMember = new Map(
        table.rows.filter((r) => r.memberId).map((r) => [r.memberId!, r])
      )

      const syncedRows: TableRow[] = [...byMember.values()].map((rsvp) => {
        const prev = existingByMember.get(rsvp.memberId)
        const cells = { ...(prev?.cells ?? {}) }
        cells[mapping.memberColumn] = rsvp.name
        cells[mapping.rsvpColumn] = rsvp.rsvp
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

  const getEventRsvps = useCallback(
    (eventId: string) => {
      const liveOps = readLiveOpsRsvps()
      if (eventHasRsvpForm(tables, eventId)) {
        return getFormRsvpsForEvent(tables, eventId)
      }
      return resolveEventRsvps(eventId, tables, liveOps)
    },
    [tables]
  )

  const updateMemberFormRsvp = useCallback(
    (eventId: string, memberId: string, memberName: string, rsvpValue: string) => {
      try {
        const legacy =
          rsvpValue === 'No' || rsvpValue.toLowerCase() === 'not going' ? 'Not Going' : 'Going'
        const raw = localStorage.getItem(STORAGE_KEYS.rsvps)
        const map = raw ? (JSON.parse(raw) as Record<string, RsvpEntry[]>) : {}
        const list = map[eventId] ?? []
        const existingOps = list.find((r) => r.memberId === memberId)
        const nextEntry: RsvpEntry = { memberId, status: legacy }
        map[eventId] = existingOps
          ? list.map((r) => (r.memberId === memberId ? { ...r, ...nextEntry } : r))
          : [...list, nextEntry]
        localStorage.setItem(STORAGE_KEYS.rsvps, JSON.stringify(map))
      } catch {
        /* ignore */
      }

      persist(
        tables.map((table) => {
          if (table.eventId !== eventId) return table

          const template = getTableTemplate(table.templateId)
          const rsvpColId = findRsvpColumnId(table, template)
          if (!rsvpColId) return table

          const memberColId = findMemberColumnId(table, template)
          const existing = table.rows.find((row) => row.memberId === memberId)

          if (existing) {
            return {
              ...table,
              updatedAt: new Date().toISOString(),
              rows: table.rows.map((row) =>
                row.id === existing.id
                  ? { ...row, cells: { ...row.cells, [rsvpColId]: rsvpValue } }
                  : row
              ),
            }
          }

          const cells: Record<string, string | boolean | number> = {}
          table.columns.forEach((col) => {
            if (col.id === rsvpColId) cells[col.id] = rsvpValue
            else if (memberColId && col.id === memberColId) cells[col.id] = memberName
            else cells[col.id] = defaultCellValue(col)
          })

          return {
            ...table,
            updatedAt: new Date().toISOString(),
            rows: [...table.rows, { id: uid('row'), memberId, cells }],
          }
        })
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
      getEventRsvps,
      updateMemberFormRsvp,
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
      getEventRsvps,
      updateMemberFormRsvp,
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
