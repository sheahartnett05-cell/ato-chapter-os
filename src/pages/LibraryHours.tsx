import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ExternalLink, Users } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterOps } from '../context/ChapterOpsContext'
import { usePermissions } from '../context/AuthContext'
import { useMembers } from '../context/MembersContext'
import {
  logInCurrentPeriod,
  nextResetLabel,
  resetDayLabel,
  resetFrequencyLabel,
} from '../lib/studyHours'
import {
  DEFAULT_GEOFENCE_RADIUS_M,
  getCurrentPosition,
  locationHasGeofence,
} from '../lib/study/geoFence'

type AssignmentDraft = Record<string, { included: boolean; hours: number }>

function buildAssignmentDraft(
  memberIds: string[],
  memberHours: Record<string, number>,
  defaultHours: number
): AssignmentDraft {
  const draft: AssignmentDraft = {}
  for (const id of memberIds) {
    const assigned = id in memberHours
    draft[id] = {
      included: assigned,
      hours: assigned ? memberHours[id] : defaultHours,
    }
  }
  return draft
}

export default function LibraryHoursPage() {
  const [searchParams] = useSearchParams()
  const rosterFilter = searchParams.get('filter')
  const {
    studyLocations,
    studyLogs,
    studyHoursRequirements,
    studyHoursRequired,
    assignStudyHoursToAllMembers,
    setStudyHoursAssignmentMode,
    updateMemberStudyHoursRequirements,
    getMemberStudyHoursRequired,
    studyHoursReset,
    updateStudyHoursReset,
    activeStudyLocations,
    addStudyLocation,
    toggleStudyLocation,
    updateStudyLocation,
    verifyStudyHours,
    getMemberVerifiedHours,
  } = useChapterOps()
  const permissions = usePermissions()
  const { members, getMemberById } = useMembers()

  const canManage = permissions.canManageStudyLocations || permissions.canVerifyStudyHours

  const [locOpen, setLocOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [newLoc, setNewLoc] = useState({
    name: '',
    address: '',
    lat: '' as string,
    lng: '' as string,
    radiusMeters: String(DEFAULT_GEOFENCE_RADIUS_M),
  })
  const [locGpsError, setLocGpsError] = useState<string | null>(null)
  const [locGpsBusy, setLocGpsBusy] = useState(false)
  const [allMembersHours, setAllMembersHours] = useState(studyHoursRequired)
  const [bulkHours, setBulkHours] = useState(studyHoursRequired)
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft>({})

  useEffect(() => {
    setAllMembersHours(studyHoursRequired)
    setBulkHours(studyHoursRequired)
  }, [studyHoursRequired])

  const eligibleMembers = useMemo(
    () => members.filter((m) => m.status === 'Active' || m.status === 'New Member'),
    [members]
  )

  const roster = useMemo(() => {
    let rows = eligibleMembers.map((member) => {
      const verified = getMemberVerifiedHours(member.id)
      const required = getMemberStudyHoursRequired(member.id)
      const pct =
        required === null
          ? 0
          : Math.min(100, Math.round((verified / Math.max(required, 1)) * 100))
      const pending = studyLogs.filter(
        (log) =>
          log.memberId === member.id &&
          !log.verified &&
          logInCurrentPeriod(log, studyHoursReset)
      ).length
      return { member, verified, required, pct, pending }
    })
    if (rosterFilter === 'below') {
      rows = rows.filter(
        (r) => r.required !== null && r.verified < (r.required as number)
      )
    }
    return rows.sort((a, b) => b.verified - a.verified)
  }, [
    eligibleMembers,
    getMemberVerifiedHours,
    getMemberStudyHoursRequired,
    studyLogs,
    studyHoursReset,
    rosterFilter,
  ])

  const membersWithRequirement = roster.filter((r) => r.required !== null)
  const membersComplete = membersWithRequirement.filter(
    (r) => r.required !== null && r.verified >= r.required
  ).length

  const pendingLogs = useMemo(
    () =>
      studyLogs.filter(
        (log) => !log.verified && logInCurrentPeriod(log, studyHoursReset)
      ),
    [studyLogs, studyHoursReset]
  )

  useEffect(() => {
    if (pendingLogs.length <= 0) return
    void import('../lib/notifications/localPush').then(({ notifyLocalOnce }) =>
      notifyLocalOnce({
        title: 'Study hours to verify',
        body: `${pendingLogs.length} log${pendingLogs.length === 1 ? '' : 's'} awaiting verification.`,
        tag: 'study-verify-queue',
        url: '/library-hours',
      })
    )
  }, [pendingLogs.length])

  const locationName = (id: string) =>
    studyLocations.find((l) => l.id === id)?.name ?? 'Unknown'

  const pinMyLocation = async () => {
    setLocGpsError(null)
    setLocGpsBusy(true)
    try {
      const pos = await getCurrentPosition()
      setNewLoc((prev) => ({
        ...prev,
        lat: pos.lat.toFixed(6),
        lng: pos.lng.toFixed(6),
      }))
    } catch (e) {
      setLocGpsError(e instanceof Error ? e.message : 'Could not read GPS.')
    } finally {
      setLocGpsBusy(false)
    }
  }

  const addLocation = () => {
    if (!newLoc.name.trim()) return
    const lat = newLoc.lat.trim() ? Number(newLoc.lat) : undefined
    const lng = newLoc.lng.trim() ? Number(newLoc.lng) : undefined
    const radiusMeters = newLoc.radiusMeters.trim()
      ? Number(newLoc.radiusMeters)
      : DEFAULT_GEOFENCE_RADIUS_M
    addStudyLocation({
      name: newLoc.name.trim(),
      address: newLoc.address.trim() || undefined,
      active: true,
      lat: lat != null && Number.isFinite(lat) ? lat : undefined,
      lng: lng != null && Number.isFinite(lng) ? lng : undefined,
      radiusMeters:
        Number.isFinite(radiusMeters) && radiusMeters > 0
          ? radiusMeters
          : DEFAULT_GEOFENCE_RADIUS_M,
    })
    setNewLoc({
      name: '',
      address: '',
      lat: '',
      lng: '',
      radiusMeters: String(DEFAULT_GEOFENCE_RADIUS_M),
    })
    setLocGpsError(null)
    setLocOpen(false)
  }

  const openAssignmentModal = () => {
    setBulkHours(studyHoursRequired)
    setAssignmentDraft(
      buildAssignmentDraft(
        eligibleMembers.map((m) => m.id),
        studyHoursRequirements.memberHours,
        studyHoursRequired
      )
    )
    setAssignOpen(true)
  }

  const applyAllMembersHours = () => {
    if (allMembersHours < 0) return
    assignStudyHoursToAllMembers(allMembersHours)
  }

  const applyCustomAssignments = () => {
    const memberHours: Record<string, number> = {}
    for (const [memberId, entry] of Object.entries(assignmentDraft)) {
      if (entry.included && entry.hours > 0) {
        memberHours[memberId] = entry.hours
      }
    }
    updateMemberStudyHoursRequirements(memberHours)
    setAssignOpen(false)
  }

  const setBulkHoursForChecked = (hours: number) => {
    setAssignmentDraft((prev) => {
      const next = { ...prev }
      for (const id of Object.keys(next)) {
        if (next[id].included) next[id] = { ...next[id], hours }
      }
      return next
    })
  }

  if (!canManage) {
    return <Navigate to="/my-dashboard#study-hours" replace />
  }

  return (
    <>
      <TopBar
        title="Library Hours"
        subtitle="Officer view · roster progress, verification, and reset schedule"
        actions={
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="btn-ghost min-h-11 px-3 text-xs"
          >
            Add location
          </button>
        }
      />

      <PageShell className="space-y-8 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="ledger-bar grid-cols-2 lg:grid-cols-4">
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">
              {studyHoursRequirements.mode === 'all'
                ? studyHoursRequired
                : membersWithRequirement.length}
            </p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {studyHoursRequirements.mode === 'all' ? 'Hours per member' : 'Members assigned'}
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">{membersComplete}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Members complete
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">{pendingLogs.length}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Pending verify
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">{activeStudyLocations.length}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Active locations
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-black/5 bg-neutral-50/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl tracking-tight">Hour requirements</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Set the same requirement for everyone, or assign different amounts per member.
              </p>
            </div>
            <div className="flex w-full rounded-sm border border-[var(--rule)] bg-white p-0.5 sm:w-auto">
              <button
                type="button"
                onClick={() => setStudyHoursAssignmentMode('all')}
                className={`min-h-11 flex-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider sm:flex-none ${
                  studyHoursRequirements.mode === 'all'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                All members
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudyHoursAssignmentMode('custom')
                  openAssignmentModal()
                }}
                className={`min-h-11 flex-1 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider sm:flex-none ${
                  studyHoursRequirements.mode === 'custom'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {studyHoursRequirements.mode === 'all' ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="block w-full sm:w-auto">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                  Hours required (each member)
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={allMembersHours}
                  onChange={(e) => setAllMembersHours(Number(e.target.value))}
                  className="input-editorial mt-1 min-h-11 w-full font-mono sm:w-28"
                />
              </label>
              <button
                type="button"
                onClick={applyAllMembersHours}
                className="btn-primary min-h-11 w-full text-xs sm:w-auto"
              >
                Apply to all members
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="text-sm text-neutral-700">
                {membersWithRequirement.length} of {eligibleMembers.length} members have hour
                requirements.
              </p>
              <button
                type="button"
                onClick={openAssignmentModal}
                className="btn-primary min-h-11 w-full text-xs sm:w-auto"
              >
                <Users size={14} />
                Manage assignments
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-black/5 bg-neutral-50/60 p-5">
          <h2 className="font-serif text-xl tracking-tight">Reset schedule</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Controls when member hour totals restart. Next reset:{' '}
            <span className="font-semibold text-neutral-900">{nextResetLabel(studyHoursReset)}</span>
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Frequency</span>
              <select
                className="input-editorial mt-1 min-h-11"
                value={studyHoursReset.frequency}
                onChange={(e) =>
                  updateStudyHoursReset({
                    frequency: e.target.value as typeof studyHoursReset.frequency,
                  })
                }
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="semester">Semester (no auto-reset)</option>
              </select>
            </label>
            {studyHoursReset.frequency === 'weekly' && (
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Reset day</span>
                <select
                  className="input-editorial mt-1 min-h-11"
                  value={studyHoursReset.resetDay}
                  onChange={(e) => updateStudyHoursReset({ resetDay: Number(e.target.value) })}
                >
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                    (day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    )
                  )}
                </select>
              </label>
            )}
            {studyHoursReset.frequency === 'monthly' && (
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Day of month</span>
                <select
                  className="input-editorial mt-1 min-h-11"
                  value={studyHoursReset.resetDay}
                  onChange={(e) => updateStudyHoursReset({ resetDay: Number(e.target.value) })}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {studyHoursReset.frequency !== 'semester' && (
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Reset time</span>
                <input
                  type="time"
                  className="input-editorial mt-1 min-h-11 font-mono"
                  value={studyHoursReset.resetTime}
                  onChange={(e) => updateStudyHoursReset({ resetTime: e.target.value })}
                />
              </label>
            )}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Current period: {resetFrequencyLabel(studyHoursReset.frequency)}
            {studyHoursReset.frequency !== 'semester' &&
              ` · ${resetDayLabel(studyHoursReset)} at ${studyHoursReset.resetTime}`}
          </p>
        </section>

        <section>
          <div className="mb-3 border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Member progress</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Verified hours in the current period
            </p>
          </div>
          <ul className="list-editorial">
            {roster.map(({ member, verified, required, pct, pending }) => (
              <li key={member.id} className="py-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {required === null
                        ? `${verified} verified · no requirement`
                        : `${verified} / ${required} verified`}
                      {pending > 0 ? ` · ${pending} pending` : ''}
                    </p>
                  </div>
                  {required === null ? (
                    <span className="tag border border-neutral-200 px-1.5 py-0.5 text-[9px] uppercase text-neutral-500">
                      Exempt
                    </span>
                  ) : (
                    <span
                      className={`tag border px-1.5 py-0.5 text-[9px] uppercase ${
                        verified >= required
                          ? 'border-emerald-200 text-emerald-800'
                          : verified >= required * 0.5
                            ? 'border-amber-200 text-amber-900'
                            : 'border-neutral-200 text-neutral-600'
                      }`}
                    >
                      {verified >= required ? 'Complete' : `${pct}%`}
                    </span>
                  )}
                </div>
                {required !== null && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-neutral-200">
                    <div
                      className="h-full rounded-sm bg-[var(--accent)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {permissions.canManageStudyLocations && (
          <section>
            <div className="mb-3 border-b border-[var(--rule)] pb-2">
              <h2 className="font-serif text-xl tracking-tight">Approved locations</h2>
            </div>
            <ul className="list-editorial">
              {studyLocations.map((loc) => (
                <li key={loc.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--ink)]">{loc.name}</p>
                    {loc.address && (
                      <p className="font-mono text-[10px] text-[var(--muted)]">{loc.address}</p>
                    )}
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {locationHasGeofence(loc)
                        ? `GPS · ${loc.radiusMeters ?? DEFAULT_GEOFENCE_RADIUS_M}m radius`
                        : 'No GPS pin — members cannot geofence-log here'}
                    </p>
                  </div>
                  <span
                    className={`tag border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                      loc.active
                        ? 'border-emerald-200 text-emerald-800'
                        : 'border-neutral-200 text-neutral-500'
                    }`}
                  >
                    {loc.active ? 'Active' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost min-h-11 px-2 py-1 text-[10px]"
                    onClick={() => {
                      void (async () => {
                        try {
                          const pos = await getCurrentPosition()
                          updateStudyLocation(loc.id, {
                            lat: pos.lat,
                            lng: pos.lng,
                            radiusMeters: loc.radiusMeters ?? DEFAULT_GEOFENCE_RADIUS_M,
                          })
                        } catch {
                          /* ignore */
                        }
                      })()
                    }}
                  >
                    Pin GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStudyLocation(loc.id)}
                    className="btn-ghost min-h-11 px-2 py-1 text-[10px]"
                  >
                    {loc.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateStudyLocation(loc.id, {
                        name: window.prompt('Location name', loc.name) || loc.name,
                      })
                    }
                    className="btn-ghost min-h-11 px-2 py-1 text-[10px]"
                  >
                    Rename
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="mb-3 border-b border-[var(--rule)] pb-2">
            <h2 className="font-serif text-xl tracking-tight">Pending verification</h2>
          </div>
          <ul className="list-editorial">
            {pendingLogs.length === 0 ? (
              <li className="py-4 text-sm text-neutral-500">No pending logs in this period.</li>
            ) : (
              pendingLogs.map((entry) => {
                const member = getMemberById(entry.memberId)
                const gpsLabel = !entry.checkIn
                  ? 'No GPS'
                  : entry.checkIn.withinGeofence
                    ? 'Within'
                    : 'Outside'
                const gpsClass = !entry.checkIn
                  ? 'border-neutral-200 text-neutral-600'
                  : entry.checkIn.withinGeofence
                    ? 'border-emerald-200 text-emerald-800'
                    : 'border-amber-200 text-amber-900'
                return (
                  <li key={entry.id} className="flex flex-wrap items-center gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {member?.firstName} {member?.lastName}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        {entry.date} · {locationName(entry.locationId)} · {entry.hours}h
                      </p>
                      {entry.notes && (
                        <p className="mt-1 text-xs text-[var(--muted)]">{entry.notes}</p>
                      )}
                    </div>
                    <span
                      className={`tag border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${gpsClass}`}
                    >
                      {gpsLabel}
                    </span>
                    {permissions.canVerifyStudyHours && (
                      <button
                        type="button"
                        onClick={() => verifyStudyHours(entry.id)}
                        className="btn-primary min-h-11 px-3 py-1.5 text-[10px]"
                      >
                        Verify
                      </button>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </section>
      </PageShell>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign study hours">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Check members who need hours this period and set how many each must complete.
          </p>

          <div className="flex flex-col gap-2 rounded-sm border border-[var(--rule)] bg-[var(--surface-card)] p-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block min-w-[120px] flex-1">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                Set checked to
              </span>
              <input
                type="number"
                min={0}
                step="0.5"
                value={bulkHours}
                onChange={(e) => setBulkHours(Number(e.target.value))}
                className="input-editorial mt-1 min-h-11 w-full font-mono"
              />
            </label>
            <button
              type="button"
              onClick={() => setBulkHoursForChecked(bulkHours)}
              className="btn-ghost min-h-11 w-full text-xs sm:w-auto"
            >
              Apply to checked
            </button>
          </div>

          <ul className="max-h-72 space-y-2 overflow-y-auto border border-[var(--rule)]">
            {eligibleMembers.map((member) => {
              const draft = assignmentDraft[member.id] ?? {
                included: false,
                hours: studyHoursRequired,
              }
              return (
                <li
                  key={member.id}
                  className="flex items-center gap-3 border-b border-[var(--rule)] px-3 py-2.5 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={draft.included}
                    onChange={(e) =>
                      setAssignmentDraft((prev) => ({
                        ...prev,
                        [member.id]: { ...draft, included: e.target.checked },
                      }))
                    }
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {member.firstName} {member.lastName}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    disabled={!draft.included}
                    value={draft.hours}
                    onChange={(e) =>
                      setAssignmentDraft((prev) => ({
                        ...prev,
                        [member.id]: { ...draft, hours: Number(e.target.value) },
                      }))
                    }
                    className="input-editorial min-h-11 w-20 font-mono text-xs disabled:opacity-40"
                  />
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={applyCustomAssignments}
            className="btn-primary min-h-11 w-full"
          >
            Save assignments
          </button>
        </div>
      </Modal>

      <Modal open={locOpen} onClose={() => setLocOpen(false)} title="Add study location">
        <div className="space-y-3">
          <input
            className="input-editorial min-h-11"
            placeholder="Location name"
            value={newLoc.name}
            onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
          />
          <input
            className="input-editorial min-h-11"
            placeholder="Address / notes"
            value={newLoc.address}
            onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })}
          />
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            GPS geofence (required for member check-in)
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              className="input-editorial min-h-11 font-mono"
              placeholder="Lat"
              value={newLoc.lat}
              onChange={(e) => setNewLoc({ ...newLoc, lat: e.target.value })}
            />
            <input
              className="input-editorial min-h-11 font-mono"
              placeholder="Lng"
              value={newLoc.lng}
              onChange={(e) => setNewLoc({ ...newLoc, lng: e.target.value })}
            />
            <input
              className="input-editorial min-h-11 font-mono"
              placeholder="Radius m"
              value={newLoc.radiusMeters}
              onChange={(e) => setNewLoc({ ...newLoc, radiusMeters: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="btn-ghost min-h-11 w-full"
            disabled={locGpsBusy}
            onClick={() => void pinMyLocation()}
          >
            {locGpsBusy ? 'Reading GPS…' : 'Use my location'}
          </button>
          {locGpsError ? <p className="text-sm text-red-800">{locGpsError}</p> : null}
          <button type="button" onClick={addLocation} className="btn-primary min-h-11 w-full">
            Add location
          </button>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]"
          >
            Open maps <ExternalLink size={10} />
          </a>
        </div>
      </Modal>
    </>
  )
}
