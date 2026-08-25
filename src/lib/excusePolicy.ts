import type { Event } from '../types'
import type { ExcusePolicy } from '../types/standardsConfig'

export function eventStartDate(event: Event): Date {
  const match = event.time.match(/^(\d{1,2}):(\d{2})/)
  const h = match ? Number(match[1]) : 12
  const m = match ? Number(match[2]) : 0
  const d = new Date(`${event.date}T12:00:00`)
  d.setHours(h, m, 0, 0)
  return d
}

export function excuseLeadTimeOk(
  event: Event,
  policy: ExcusePolicy,
  now = new Date()
): boolean {
  const start = eventStartDate(event).getTime()
  const minMs = policy.lead_time_hours * 60 * 60 * 1000
  return start - now.getTime() >= minMs
}

export function formatExcuseReason(
  category: string,
  detail: string,
  attachmentNote?: string
): string {
  const base = `[${category}] ${detail.trim()}`
  return attachmentNote?.trim()
    ? `${base} (Attachment: ${attachmentNote.trim()})`
    : base
}
