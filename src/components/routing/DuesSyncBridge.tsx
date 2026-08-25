import { useEffect } from 'react'
import { useChapterOps } from '../../context/ChapterOpsContext'
import { useMembers } from '../../context/MembersContext'

/** Keeps roster duesPaid / duesExpected / duesStatus in sync with ops ledger. */
export function DuesSyncBridge() {
  const { duesCharges, duesPayments } = useChapterOps()
  const { syncRosterDues } = useMembers()

  useEffect(() => {
    syncRosterDues(duesCharges, duesPayments)
  }, [duesCharges, duesPayments, syncRosterDues])

  return null
}
