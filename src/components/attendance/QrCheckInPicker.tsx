import { useMemo, useState } from 'react'
import { QrCode } from 'lucide-react'
import { CheckInQrPanel } from './CheckInQrPanel'
import { chapterAttendanceKey } from '../../lib/attendance/checkInSession'
import { useAuth, useAuthOptional, usePermissions } from '../../context/AuthContext'
import { useChapter } from '../../context/ChapterContext'
import { useChapterFeaturesOptional } from '../../context/ChapterFeaturesContext'
import { useChapterOps } from '../../context/ChapterOpsContext'
import { useMembers } from '../../context/MembersContext'
import { localTodayIso } from '../../lib/liveAlerts'
import type { Event } from '../../types'

function eventOptionLabel(event: Event) {
  const day = new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const req = event.required ? ' · required' : ''
  return `${event.name} · ${day}${req}`
}

/** Eligible check-in events: today ± 7 days, required first, then by date. */
function checkInEventChoices(events: Event[], today: string): Event[] {
  const start = new Date(`${today}T12:00:00`)
  start.setDate(start.getDate() - 7)
  const end = new Date(`${today}T12:00:00`)
  end.setDate(end.getDate() + 7)
  const startIso = start.toISOString().slice(0, 10)
  const endIso = end.toISOString().slice(0, 10)

  return [...events]
    .filter((e) => e.date >= startIso && e.date <= endIso)
    .sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1
      const byDate = b.date.localeCompare(a.date)
      if (byDate !== 0) return byDate
      return a.time.localeCompare(b.time)
    })
}

type Props = {
  initialEventId?: string | null
}

/** Guard so missing AuthProvider never throws into the error boundary. */
export function QrCheckInPicker(props: Props) {
  const auth = useAuthOptional()
  if (!auth) return null
  return <QrCheckInPickerInner {...props} />
}

function QrCheckInPickerInner({ initialEventId = null }: Props) {
  const today = localTodayIso()
  const { events, getEventAttendance } = useChapterOps()
  const { members } = useMembers()
  const { chapter, selectedOrgId } = useChapter()
  const { memberId, profile } = useAuth()
  const permissions = usePermissions()
  const features = useChapterFeaturesOptional()

  const choices = useMemo(() => checkInEventChoices(events, today), [events, today])
  const preferredId =
    (initialEventId && choices.some((e) => e.id === initialEventId) && initialEventId) ||
    choices.find((e) => e.date === today && e.required)?.id ||
    choices.find((e) => e.required)?.id ||
    choices[0]?.id ||
    ''

  const [selectedId, setSelectedId] = useState(preferredId)
  const effectiveId = choices.some((e) => e.id === selectedId) ? selectedId : preferredId
  const selected = choices.find((e) => e.id === effectiveId) ?? null

  const attendanceOn = features?.isFeatureEnabled('attendancePoints') !== false
  const canManage =
    attendanceOn &&
    (permissions.canAccessExecTools ||
      permissions.canEditEventPoints ||
      Boolean(memberId && features?.canMemberEdit('editAttendance', memberId)))

  const chapterKey = chapterAttendanceKey(
    selectedOrgId || chapter.id,
    chapter.chapterDesignation
  )
  const rosterCount = members.filter(
    (m) => m.status === 'Active' || m.status === 'New Member'
  ).length
  const checkedInCount = selected
    ? getEventAttendance(selected.id).filter((a) => a.status === 'Present').length
    : 0
  const openedBy = `${profile.firstName} ${profile.lastName}`.trim() || undefined

  if (!canManage) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border border-[var(--rule)] bg-[var(--surface-card)] p-5">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            <QrCode size={12} className="mr-1 inline" />
            QR check-in
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Select an event, then open the rotating chapter QR.
          </p>
        </div>
        <div className="w-full min-w-[16rem] sm:w-80">
          <label
            className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
            htmlFor="qr-checkin-event"
          >
            Event
          </label>
          <select
            id="qr-checkin-event"
            value={effectiveId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-editorial w-full text-sm"
            disabled={choices.length === 0}
          >
            {choices.length === 0 ? (
              <option value="">No events this week</option>
            ) : (
              choices.map((event) => (
                <option key={event.id} value={event.id}>
                  {eventOptionLabel(event)}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {choices.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Create a calendar event for today or this week, then choose it from the list above.
        </p>
      ) : selected ? (
        <CheckInQrPanel
          key={selected.id}
          eventId={selected.id}
          eventName={selected.name}
          chapterKey={chapterKey}
          canManage={canManage}
          checkedInCount={checkedInCount}
          rosterCount={rosterCount}
          openedBy={openedBy}
        />
      ) : null}
    </div>
  )
}
