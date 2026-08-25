import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
import { getMember } from '../data/mockData'

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
  const { members } = useMembers()

  const canManage = permissions.canManageStudyLocations || permissions.canVerifyStudyHours

  const [locOpen, setLocOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [newLoc, setNewLoc] = useState({ name: '', address: '' })
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
    return eligibleMembers
      .map((member) => {
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
      .sort((a, b) => b.verified - a.verified)
  }, [
    eligibleMembers,
    getMemberVerifiedHours,
    getMemberStudyHoursRequired,
    studyLogs,
    studyHoursReset,
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

  const locationName = (id: string) =>
    studyLocations.find((l) => l.id === id)?.name ?? 'Unknown'

  const addLocation = () => {
    if (!newLoc.name.trim()) return
    addStudyLocation({
      name: newLoc.name.trim(),
      address: newLoc.address.trim() || undefined,
      active: true,
    })
    setNewLoc({ name: '', address: '' })
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
          <button type="button" onClick={() => setLocOpen(true)} className="btn-ghost text-xs">
            Add location
          </button>
        }
      />

      <PageShell className="space-y-8">
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
            <div className="flex rounded-sm border border-[var(--rule)] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setStudyHoursAssignmentMode('all')}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider ${
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
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider ${
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
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                  Hours required (each member)
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={allMembersHours}
                  onChange={(e) => setAllMembersHours(Number(e.target.value))}
                  className="input-editorial mt-1 w-28 font-mono"
                />
              </label>
              <button
                type="button"
                onClick={applyAllMembersHours}
                className="btn-primary text-xs"
              >
                Apply to all members
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-neutral-700">
                {membersWithRequirement.length} of {eligibleMembers.length} members have hour
                requirements.
              </p>
              <button type="button" onClick={openAssignmentModal} className="btn-primary text-xs">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Frequency</span>
              <select
                className="input-editorial mt-1"
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
                  className="input-editorial mt-1"
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
                  className="input-editorial mt-1"
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
                  className="input-editorial mt-1 font-mono"
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
                    onClick={() => toggleStudyLocation(loc.id)}
                    className="btn-ghost px-2 py-1 text-[10px]"
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
                    className="btn-ghost px-2 py-1 text-[10px]"
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
                const member = getMember(entry.memberId)
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
                    {permissions.canVerifyStudyHours && (
                      <button
                        type="button"
                        onClick={() => verifyStudyHours(entry.id)}
                        className="btn-primary px-3 py-1.5 text-[10px]"
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

          <div className="flex flex-wrap items-end gap-2 rounded-sm border border-[var(--rule)] bg-[var(--surface-card)] p-3">
            <label className="block flex-1 min-w-[120px]">
              <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                Set checked to
              </span>
              <input
                type="number"
                min={0}
                step="0.5"
                value={bulkHours}
                onChange={(e) => setBulkHours(Number(e.target.value))}
                className="input-editorial mt-1 w-full font-mono"
              />
            </label>
            <button
              type="button"
              onClick={() => setBulkHoursForChecked(bulkHours)}
              className="btn-ghost text-xs"
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
                    className="input-editorial w-20 font-mono text-xs disabled:opacity-40"
                  />
                </li>
              )
            })}
          </ul>

          <button type="button" onClick={applyCustomAssignments} className="btn-primary w-full">
            Save assignments
          </button>
        </div>
      </Modal>

      <Modal open={locOpen} onClose={() => setLocOpen(false)} title="Add study location">
        <div className="space-y-3">
          <input
            className="input-editorial"
            placeholder="Location name"
            value={newLoc.name}
            onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
          />
          <input
            className="input-editorial"
            placeholder="Address / notes"
            value={newLoc.address}
            onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })}
          />
          <button type="button" onClick={addLocation} className="btn-primary w-full">
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
