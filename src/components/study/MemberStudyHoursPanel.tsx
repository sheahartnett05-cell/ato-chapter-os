import { useMemo, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useChapterOps } from '../../context/ChapterOpsContext'
import { resetFrequencyLabel, resetDayLabel } from '../../lib/studyHours'
import { localTodayIso } from '../../lib/liveAlerts'
import {
  getCurrentPosition,
  isWithinGeofence,
  locationHasGeofence,
} from '../../lib/study/geoFence'
import type { StudyHoursCheckIn } from '../../types/chapterOps'

interface MemberStudyHoursPanelProps {
  memberId: string
  /** Render inside Chapter Room section shell (no outer card chrome) */
  embedded?: boolean
}

export function MemberStudyHoursPanel({ memberId, embedded = false }: MemberStudyHoursPanelProps) {
  const {
    studyLogs,
    studyHoursReset,
    activeStudyLocations,
    logStudyHours,
    getMemberVerifiedHours,
    getMemberStudyHoursRequired,
  } = useChapterOps()

  const [logOpen, setLogOpen] = useState(false)
  const [form, setForm] = useState({
    date: localTodayIso(),
    hours: 2,
    locationId: '',
    notes: '',
  })
  const [gpsBusy, setGpsBusy] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [checkIn, setCheckIn] = useState<StudyHoursCheckIn | null>(null)

  const verifiedTotal = getMemberVerifiedHours(memberId)
  const requiredHours = getMemberStudyHoursRequired(memberId)
  const studyPct =
    requiredHours === null
      ? 0
      : Math.min(100, Math.round((verifiedTotal / Math.max(requiredHours, 1)) * 100))

  const myLogs = useMemo(
    () =>
      [...studyLogs]
        .filter((log) => log.memberId === memberId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [studyLogs, memberId]
  )

  const geofencedLocations = useMemo(
    () => activeStudyLocations.filter((l) => locationHasGeofence(l)),
    [activeStudyLocations]
  )

  const selectedLoc =
    geofencedLocations.find((l) => l.id === form.locationId) ?? geofencedLocations[0]

  const locationName = (id: string) =>
    activeStudyLocations.find((l) => l.id === id)?.name ?? 'Location'

  const resetForm = () => {
    setForm({ date: localTodayIso(), hours: 2, locationId: '', notes: '' })
    setCheckIn(null)
    setGpsError(null)
  }

  const runGpsCheckIn = async () => {
    setGpsError(null)
    setCheckIn(null)
    const loc = selectedLoc
    if (!loc || !locationHasGeofence(loc)) {
      setGpsError('Pick a location with a GPS pin set by scholarship.')
      return
    }
    setGpsBusy(true)
    try {
      const pos = await getCurrentPosition()
      const within = isWithinGeofence(loc, pos)
      const payload: StudyHoursCheckIn = {
        lat: pos.lat,
        lng: pos.lng,
        accuracyM: pos.accuracyM,
        at: new Date().toISOString(),
        withinGeofence: within,
      }
      setCheckIn(payload)
      if (!within) {
        setGpsError(
          `You are outside the ${loc.radiusMeters ?? 150}m geofence for ${loc.name}. Move closer and try again.`
        )
      }
    } catch (e) {
      setGpsError(e instanceof Error ? e.message : 'GPS check-in failed.')
    } finally {
      setGpsBusy(false)
    }
  }

  const submitLog = () => {
    const locationId = form.locationId || selectedLoc?.id
    if (!locationId) return
    if (!(form.hours > 0)) return
    if (!checkIn?.withinGeofence) {
      setGpsError('Complete a successful GPS check-in inside the location geofence first.')
      return
    }
    logStudyHours({
      memberId,
      date: form.date,
      hours: form.hours,
      locationId,
      notes: form.notes.trim() || undefined,
      checkIn,
    })
    setLogOpen(false)
    resetForm()
  }

  return (
    <>
      <section
        id="study-hours"
        className={embedded ? '' : 'border border-[var(--rule)] bg-[var(--surface-card)] p-4'}
      >
        <div className="mb-3 flex items-baseline justify-between">
          {!embedded && <h2 className="font-serif text-lg tracking-tight">Study hours</h2>}
          {embedded && <span className="sr-only">Study hours</span>}
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({
                ...f,
                locationId: geofencedLocations[0]?.id ?? '',
              }))
              setCheckIn(null)
              setGpsError(null)
              setLogOpen(true)
            }}
            className="inline-flex min-h-11 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--primary)] hover:underline"
          >
            <Plus size={12} />
            Log hours
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-serif text-3xl tracking-tight text-[var(--ink)]">
              {verifiedTotal}
              {requiredHours !== null ? (
                <span className="text-lg text-[var(--muted)]"> / {requiredHours}</span>
              ) : (
                <span className="text-lg text-[var(--muted)]"> hrs</span>
              )}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {requiredHours === null ? 'No hour requirement this period · ' : 'Verified · '}
              {resetFrequencyLabel(studyHoursReset.frequency).toLowerCase()}
              {studyHoursReset.frequency !== 'semester' &&
                ` · resets ${resetDayLabel(studyHoursReset).toLowerCase()} ${studyHoursReset.resetTime}`}
            </p>
          </div>
          <div className="h-16 w-16 border border-[var(--rule)] p-1">
            {requiredHours !== null && (
              <div
                className="h-full w-full transition-all"
                style={{
                  background: `linear-gradient(to top, var(--primary) ${studyPct}%, transparent ${studyPct}%)`,
                }}
                aria-hidden
              />
            )}
          </div>
        </div>

        <ul className="mt-4 divide-y divide-[var(--rule)] border border-[var(--rule)]">
          {myLogs.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-[var(--muted)]">
              No logs yet — tap Log hours and check in with GPS.
            </li>
          ) : (
            myLogs.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {entry.hours}h · {locationName(entry.locationId)}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {entry.date}
                    {entry.checkIn
                      ? entry.checkIn.withinGeofence
                        ? ' · GPS ok'
                        : ' · GPS outside'
                      : ' · No GPS'}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${
                    entry.verified
                      ? 'bg-emerald-100 text-emerald-800'
                      : entry.rejected
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {entry.verified ? 'Verified' : entry.rejected ? 'Denied' : 'Pending'}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log study hours">
        <div className="space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Location</span>
            <select
              className="input-editorial mt-1 min-h-11"
              value={form.locationId || selectedLoc?.id || ''}
              onChange={(e) => {
                setForm({ ...form, locationId: e.target.value })
                setCheckIn(null)
                setGpsError(null)
              }}
            >
              {geofencedLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {geofencedLocations.length === 0 && (
              <p className="mt-1 text-xs text-red-700">
                No GPS-pinned locations yet — ask scholarship chair to add a pin.
              </p>
            )}
          </label>

          <div className="rounded-sm border border-[var(--rule)] bg-[var(--surface-tint)] p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              GPS check-in
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              You must be inside the location radius to submit.
            </p>
            <button
              type="button"
              className="btn-ghost mt-3 min-h-11 w-full"
              disabled={gpsBusy || geofencedLocations.length === 0}
              onClick={() => void runGpsCheckIn()}
            >
              <MapPin size={14} className="mr-1 inline" />
              {gpsBusy ? 'Checking location…' : 'Check in with GPS'}
            </button>
            {checkIn?.withinGeofence ? (
              <p className="mt-2 text-sm font-medium text-emerald-800">Inside geofence — ready to submit.</p>
            ) : null}
            {gpsError ? <p className="mt-2 text-sm text-red-800">{gpsError}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="date"
              className="input-editorial min-h-11 font-mono"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              type="number"
              step="0.5"
              min={0.5}
              className="input-editorial min-h-11 font-mono"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
            />
          </div>
          <input
            className="input-editorial min-h-11"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            type="button"
            disabled={
              geofencedLocations.length === 0 ||
              !(form.hours > 0) ||
              !checkIn?.withinGeofence
            }
            onClick={submitLog}
            className="btn-primary min-h-11 w-full"
          >
            Submit log
          </button>
        </div>
      </Modal>
    </>
  )
}
