import { daysUntil } from './dashboard/dashboardTypes'

/** Normalize "7:00 PM" style times for display. */
export function normalizeEventTime(time: string): string {
  const t = time.trim()
  if (!t) return ''
  return t.replace(/\s+(AM|PM)\b/i, '\u00a0$1')
}

/** e.g. "Sat, Oct 17 · 6:00 PM" */
export function formatHomeEventDateTime(isoDate: string, time?: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  const day = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const tm = time ? normalizeEventTime(time) : ''
  return tm ? `${day} · ${tm}` : day
}

/** e.g. "Oct 13" for ledger lines */
export function formatHomeEventDateShort(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function truncateTileText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen - 1).trim()}…`
}

/** Short value for next-event tile: Tonight / Tomorrow / In N days / time if today. */
export function nextEventTileValue(isoDate: string, time: string, today: string): string {
  const d = daysUntil(isoDate, today)
  if (d === 0) {
    const tm = normalizeEventTime(time)
    return tm || 'Tonight'
  }
  if (d === 1) return 'Tomorrow'
  if (d > 1 && d <= 14) return `In ${d} days`
  return formatHomeEventDateShort(isoDate)
}
