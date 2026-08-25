import { getTableTemplate, type TableFormTemplate } from '../data/tableFormTemplates'
import type { ChapterTableForm, RsvpEntry } from '../types'

export const FORM_RSVP_OPTIONS = ['Yes', 'No', 'Maybe'] as const
export type FormRsvpOption = (typeof FORM_RSVP_OPTIONS)[number]

export function normalizeFormRsvp(value: string): FormRsvpOption | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'yes' || normalized === 'going') return 'Yes'
  if (normalized === 'no' || normalized === 'not going') return 'No'
  if (normalized === 'maybe') return 'Maybe'
  return null
}

export function formRsvpBadgeClass(rsvp: FormRsvpOption | null): string {
  if (rsvp === 'Yes') return 'bg-emerald-100 text-emerald-800'
  if (rsvp === 'Maybe') return 'bg-amber-100 text-amber-900'
  if (rsvp === 'No') return 'bg-neutral-200 text-neutral-600'
  return 'bg-neutral-100 text-neutral-500'
}

export function formRsvpButtonClass(
  selected: boolean,
  option: FormRsvpOption,
  inline = false
): string {
  const width = inline ? 'px-4' : 'flex-1'
  if (!selected) {
    return inline
      ? `${width} rounded-sm border border-black/10 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50`
      : 'btn-ghost flex-1 py-2 text-xs'
  }
  if (option === 'Yes') {
    return `${width} rounded-sm bg-emerald-600 py-2 text-sm font-semibold text-white`
  }
  if (option === 'Maybe') {
    return `${width} rounded-sm bg-amber-500 py-2 text-sm font-semibold text-white`
  }
  return `${width} rounded-sm bg-neutral-600 py-2 text-sm font-semibold text-white`
}

export interface EventFormRsvp {
  memberId?: string
  memberName: string
  rsvp: string
  guest?: string
  tableId: string
  rowId: string
}

function findRsvpColumnId(
  table: ChapterTableForm,
  template: TableFormTemplate | undefined
): string | undefined {
  const mapped = template?.guestListMapping?.rsvpColumn
  if (mapped && table.columns.some((c) => c.id === mapped)) return mapped
  return table.columns.find(
    (c) => c.id === 'rsvp' || c.name.toLowerCase() === 'rsvp'
  )?.id
}

function findMemberColumnId(
  table: ChapterTableForm,
  template: TableFormTemplate | undefined
): string | undefined {
  const mapped = template?.guestListMapping?.memberColumn
  if (mapped && table.columns.some((c) => c.id === mapped)) return mapped
  return table.columns.find(
    (c) => c.type === 'member' || c.id === 'member' || c.name.toLowerCase() === 'member'
  )?.id
}

function findGuestColumnId(
  table: ChapterTableForm,
  template: TableFormTemplate | undefined
): string | undefined {
  const mapped = template?.guestListMapping?.guestColumn
  if (mapped && table.columns.some((c) => c.id === mapped)) return mapped
  return table.columns.find((c) => c.id === 'guest')?.id
}

export function eventHasRsvpForm(tables: ChapterTableForm[], eventId: string): boolean {
  return tables.some((table) => {
    if (table.eventId !== eventId) return false
    return Boolean(findRsvpColumnId(table, getTableTemplate(table.templateId)))
  })
}

export function getFormRsvpsForEvent(
  tables: ChapterTableForm[],
  eventId: string
): EventFormRsvp[] {
  const byMember = new Map<string, EventFormRsvp>()

  for (const table of tables.filter((t) => t.eventId === eventId)) {
    const template = getTableTemplate(table.templateId)
    const rsvpColId = findRsvpColumnId(table, template)
    if (!rsvpColId) continue

    const memberColId = findMemberColumnId(table, template)
    const guestColId = findGuestColumnId(table, template)

    for (const row of table.rows) {
      const rsvp = String(row.cells[rsvpColId] ?? '').trim()
      if (!rsvp) continue

      const memberName = memberColId
        ? String(row.cells[memberColId] ?? '').trim()
        : ''
      const guest = guestColId ? String(row.cells[guestColId] ?? '').trim() : undefined

      const entry: EventFormRsvp = {
        memberId: row.memberId,
        memberName,
        rsvp,
        guest: guest || undefined,
        tableId: table.id,
        rowId: row.id,
      }

      const key = row.memberId ?? `${memberName}:${row.id}`
      byMember.set(key, entry)
    }
  }

  return [...byMember.values()]
}

export function resolveEventRsvps(
  eventId: string,
  tables: ChapterTableForm[],
  seedRsvps: Record<string, RsvpEntry[]>
): EventFormRsvp[] {
  const eventTables = tables.filter((t) => t.eventId === eventId)
  if (eventHasRsvpForm(eventTables, eventId)) {
    return getFormRsvpsForEvent(eventTables, eventId)
  }

  return (seedRsvps[eventId] ?? []).map((entry) => ({
    memberId: entry.memberId,
    memberName: '',
    rsvp: legacyStatusToFormRsvp(entry.status),
    guest: entry.guest,
    tableId: '',
    rowId: entry.memberId,
  }))
}

export function legacyStatusToFormRsvp(status: RsvpEntry['status']): string {
  return status === 'Going' ? 'Yes' : 'No'
}

export function formRsvpToLegacyStatus(rsvp: string): RsvpEntry['status'] | null {
  const value = rsvp.trim().toLowerCase()
  if (value === 'yes' || value === 'going' || value === 'maybe') return 'Going'
  if (value === 'no' || value === 'not going') return 'Not Going'
  return null
}

export function isAffirmativeFormRsvp(rsvp: string): boolean {
  const value = rsvp.trim().toLowerCase()
  return value === 'yes' || value === 'going' || value === 'maybe'
}

export function isNegativeFormRsvp(rsvp: string): boolean {
  const value = rsvp.trim().toLowerCase()
  return value === 'no' || value === 'not going'
}

export function formRsvpVariant(rsvp: string): 'going' | 'notGoing' | 'maybe' | 'default' {
  const value = rsvp.trim().toLowerCase()
  if (value === 'yes' || value === 'going') return 'going'
  if (value === 'maybe') return 'maybe'
  if (value === 'no' || value === 'not going') return 'notGoing'
  return 'default'
}

export {
  findRsvpColumnId,
  findMemberColumnId,
  findGuestColumnId,
}
