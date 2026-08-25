import type { AttendanceEntry, Member } from '../types'

/** Recompute each member's attendancePct from recorded attendance entries. */
export function computeAttendancePctMap(
  attendanceByEvent: Record<string, AttendanceEntry[]>
): Record<string, number> {
  const tallies = new Map<string, { good: number; total: number }>()

  for (const list of Object.values(attendanceByEvent)) {
    for (const entry of list) {
      const cur = tallies.get(entry.memberId) ?? { good: 0, total: 0 }
      cur.total += 1
      if (entry.status === 'Present' || entry.status === 'Excused') cur.good += 1
      tallies.set(entry.memberId, cur)
    }
  }

  const map: Record<string, number> = {}
  for (const [memberId, { good, total }] of tallies) {
    map[memberId] = total === 0 ? 100 : Math.round((good / total) * 100)
  }
  return map
}

export function syncMemberAttendancePct(
  members: Member[],
  attendanceByEvent: Record<string, AttendanceEntry[]>
): Member[] {
  const pctMap = computeAttendancePctMap(attendanceByEvent)
  const seasonStarted = Object.values(attendanceByEvent).some((list) => list.length > 0)

  return members.map((m) => {
    const next = pctMap[m.id]
    if (next !== undefined) {
      if (next === m.attendancePct) return m
      return { ...m, attendancePct: next }
    }
    // Never roll-called while others have records → 0%, not a fake 100%
    if (seasonStarted && m.attendancePct !== 0) {
      return { ...m, attendancePct: 0 }
    }
    return m
  })
}
