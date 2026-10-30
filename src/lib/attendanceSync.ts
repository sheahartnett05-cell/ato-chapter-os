import type { AttendanceEntry, Member } from '../types'
import {
  computeAttendancePctMap as computePctMap,
  syncMemberAttendanceStanding,
} from './attendance/attendanceMath'

/** @deprecated Prefer attendanceMath — kept for existing imports. */
export function computeAttendancePctMap(
  attendanceByEvent: Record<string, AttendanceEntry[]>
): Record<string, number | null> {
  return computePctMap(attendanceByEvent)
}

export function syncMemberAttendancePct(
  members: Member[],
  attendanceByEvent: Record<string, AttendanceEntry[]>,
  eventPointsById?: Record<string, number>
): Member[] {
  return syncMemberAttendanceStanding(members, attendanceByEvent, eventPointsById)
}
