import { useEffect } from 'react'
import { useChapterOps } from '../../context/ChapterOpsContext'
import { useMembers } from '../../context/MembersContext'

/** Keeps roster attendancePct in sync with recorded event attendance. */
export function AttendanceSyncBridge() {
  const { attendance } = useChapterOps()
  const { members, syncRosterAttendance } = useMembers()

  useEffect(() => {
    syncRosterAttendance(attendance)
  }, [attendance, members.length, syncRosterAttendance])

  return null
}
