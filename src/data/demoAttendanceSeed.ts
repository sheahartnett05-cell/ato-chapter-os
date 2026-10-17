import type { AttendanceEntry, Member } from '../types'

/**
 * Build attendance rows for a past meeting at roughly `presentRate` (Present + Excused).
 */
export function buildAttendanceForMeeting(
  members: Member[],
  presentRate: number
): AttendanceEntry[] {
  const active = members.filter((m) => m.status === 'Active' || m.status === 'New Member')
  if (!active.length) return []

  const target = Math.round(active.length * presentRate)
  const excusedCount = Math.max(1, Math.round(active.length * 0.04))
  const presentCount = Math.max(0, target - excusedCount)

  return active.map((m, index) => {
    if (index < presentCount) {
      return { memberId: m.id, status: 'Present' as const, pointsEarned: 5 }
    }
    if (index < presentCount + excusedCount) {
      return { memberId: m.id, status: 'Excused' as const, pointsEarned: 0 }
    }
    return { memberId: m.id, status: 'Absent' as const, pointsEarned: 0 }
  })
}
