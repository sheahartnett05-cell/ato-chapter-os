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
  return posts.map((p, i) => ({
    ...p,
    createdAt: new Date(`${addDays(today, -2 - i)}T14:00:00`).toISOString(),
  }))
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
