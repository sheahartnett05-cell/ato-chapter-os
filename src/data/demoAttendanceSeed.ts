import type { AttendanceEntry, Member } from '../types'
import type { RsvpExcuse } from '../types/features'

/**
 * Build attendance rows for a past meeting at roughly `presentRate` (Present + Excused).
 * Honors approved excuses for this event; Present rows use `eventPoints`.
 * Demo-only — do not call against live chapter history.
 */
export function buildAttendanceForMeeting(
  members: Member[],
  presentRate: number,
  opts: {
    eventPoints: number
    approvedExcuseMemberIds?: Iterable<string>
    recordedAt?: string
  }
): AttendanceEntry[] {
  const active = members.filter((m) => m.status === 'Active' || m.status === 'New Member')
  if (!active.length) return []

  const approved = new Set(opts.approvedExcuseMemberIds ?? [])
  const target = Math.round(active.length * presentRate)
  const excusedCount = Math.max(1, Math.round(active.length * 0.04))
  const presentCount = Math.max(0, target - excusedCount)
  const recordedAt = opts.recordedAt ?? new Date().toISOString()
  const eventPoints = Math.max(0, opts.eventPoints)

  return active.map((m, index) => {
    if (approved.has(m.id)) {
      return {
        memberId: m.id,
        status: 'Excused' as const,
        pointsEarned: 0,
        recordedAt,
        source: 'excuse' as const,
      }
    }
    if (index < presentCount) {
      return {
        memberId: m.id,
        status: 'Present' as const,
        pointsEarned: eventPoints,
        recordedAt,
        source: 'roll_call' as const,
      }
    }
    if (index < presentCount + excusedCount) {
      return {
        memberId: m.id,
        status: 'Excused' as const,
        pointsEarned: 0,
        recordedAt,
        source: 'roll_call' as const,
      }
    }
    return {
      memberId: m.id,
      status: 'Absent' as const,
      pointsEarned: 0,
      recordedAt,
      source: 'roll_call' as const,
    }
  })
}

/** Approved excuse member ids for an event from the seed / demo excuse list. */
export function approvedExcuseMemberIdsForEvent(
  excuses: RsvpExcuse[],
  eventId: string
): string[] {
  return excuses
    .filter((e) => e.eventId === eventId && e.status === 'approved')
    .map((e) => e.memberId)
}
