import { useEffect, useMemo } from 'react'
import { useChapterOps } from '../../context/ChapterOpsContext'
import { useMembers } from '../../context/MembersContext'

/** Keeps roster attendancePct + points in sync with recorded event attendance. */
export function AttendanceSyncBridge() {
  const { attendance, events } = useChapterOps()
  const { members, syncRosterAttendance } = useMembers()

  const eventPointsById = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of events) map[e.id] = e.points
    return map
  }, [events])

  useEffect(() => {
    syncRosterAttendance(attendance, eventPointsById)
  }, [attendance, eventPointsById, members.length, syncRosterAttendance])

  return null
}
