import type { Event } from '../types'
import type { Announcement } from '../types/features'
import type { RsvpExcuse } from '../types/features'
import type { StudyHoursLog } from '../types/chapterOps'
import type { DuesCharge } from '../types/chapterOps'

export function addDays(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + delta)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** e.g. "Fall 2026" from today's date */
export function currentTermLabel(reference = new Date()): string {
  const month = reference.getMonth()
  const year = reference.getFullYear()
  const season = month >= 7 || month <= 0 ? 'Fall' : month <= 4 ? 'Spring' : 'Summer'
  return `${season} ${year}`
}

export function localTodayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Shift demo events so one past meeting + upcoming window exist relative to today. */
export function buildRelativeDemoEvents(templates: Event[]): Event[] {
  const today = localTodayIso()
  const pastMeeting = addDays(today, -7)
  const pastRecruitment = addDays(today, -3)
  const upcoming1 = addDays(today, 2)
  const upcoming2 = addDays(today, 5)
  const upcoming3 = addDays(today, 10)
  const upcoming4 = addDays(today, 14)

  const dateById: Record<string, string> = {
    e1: pastMeeting,
    e2: pastRecruitment,
    e3: upcoming3,
    e4: upcoming4,
    e5: addDays(today, 45),
    e7: addDays(today, 1),
    e8: upcoming2,
    e9: upcoming1,
  }

  return templates.map((e) => ({
    ...e,
    date: dateById[e.id] ?? (e.date < today ? addDays(today, 3) : e.date),
  }))
}

export function shiftPostsRelative(posts: Announcement[], today = localTodayIso()): Announcement[] {
  return posts.map((p, i) => {
    const createdAt = new Date(`${addDays(today, -2 - i)}T14:00:00`).toISOString()
    const poll = p.poll
      ? {
          ...p.poll,
          closesAt: addDays(today, 7 + i),
        }
      : undefined
    const signup = p.signup?.closesAt
      ? {
          ...p.signup,
          closesAt: new Date(`${addDays(today, 10 + i)}T23:59:00`).toISOString(),
        }
      : p.signup
    return { ...p, createdAt, poll, signup }
  })
}

export function shiftExcusesRelative(
  excuses: RsvpExcuse[],
  today = localTodayIso()
): RsvpExcuse[] {
  return excuses.map((ex, i) => ({
    ...ex,
    submittedAt: new Date(`${addDays(today, -1 - i)}T16:00:00`).toISOString(),
  }))
}

export function shiftStudyLogsRelative(
  logs: StudyHoursLog[],
  today = localTodayIso()
): StudyHoursLog[] {
  return logs.map((log, i) => ({
    ...log,
    date: addDays(today, -3 - i),
  }))
}

export function shiftDuesChargesRelative(
  charges: DuesCharge[],
  today = localTodayIso()
): DuesCharge[] {
  return charges.map((c) => ({
    ...c,
    dueDate: addDays(today, 30),
    createdAt: new Date(`${addDays(today, -14)}T10:00:00`).toISOString(),
  }))
}

/** Authoring anchor for whole-blob date shifts (partner + seed versioning). */
export const DEMO_DATE_ANCHOR = '2025-08-22'
export const DEMO_SEED_VERSION = '5'

export function demoDateShiftDays(today = localTodayIso()): number {
  const anchor = new Date(`${DEMO_DATE_ANCHOR}T12:00:00`).getTime()
  const now = new Date(`${today}T12:00:00`).getTime()
  return Math.round((now - anchor) / 86_400_000)
}

function shiftIsoString(value: string, days: number): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})([\s\S]*)$/)
  if (!match) return value
  return addDays(match[1], days) + match[2]
}

function shiftCopy(value: string): string {
  const term = currentTermLabel()
  const year = String(new Date().getFullYear())
  return value
    .replaceAll('Fall 2025', term)
    .replaceAll('fall 2025', term.toLowerCase())
    .replaceAll('2025', year)
}

/** Deep-clone seed data with ISO dates and Fall 2025 labels moved to the current term. */
export function relativizeDemo<T>(value: T, days = demoDateShiftDays()): T {
  if (typeof value === 'string') {
    const dated = /^\d{4}-\d{2}-\d{2}/.test(value) ? shiftIsoString(value, days) : value
    return shiftCopy(dated) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => relativizeDemo(item, days)) as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      out[key] = relativizeDemo(child, days)
    }
    return out as T
  }
  return value
}
