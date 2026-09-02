import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useChapterOps } from '../../context/ChapterOpsContext'
import { resetFrequencyLabel, resetDayLabel } from '../../lib/studyHours'
import { localTodayIso } from '../../lib/liveAlerts'

interface MemberStudyHoursPanelProps {
  memberId: string
}

export function MemberStudyHoursPanel({ memberId }: MemberStudyHoursPanelProps) {
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

  const locationName = (id: string) =>
    activeStudyLocations.find((l) => l.id === id)?.name ?? 'Location'

  const submitLog = () => {
    const locationId = form.locationId || activeStudyLocations[0]?.id
    if (!locationId) return
    if (!(form.hours > 0)) return
    logStudyHours({
      memberId,
      date: form.date,
      hours: form.hours,
      locationId,
      notes: form.notes.trim() || undefined,
    })
    setLogOpen(false)
    setForm({ date: localTodayIso(), hours: 2, locationId: '', notes: '' })
  }

  return (
    <>
      <section id="study-hours" className="border border-[var(--rule)] bg-[var(--surface-card)] p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-lg tracking-tight">Study hours</h2>
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({ ...f, locationId: activeStudyLocations[0]?.id ?? '' }))
              setLogOpen(true)
            }}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--primary)] hover:underline"
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
              No logs yet — tap Log hours to submit a session.
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
              className="input-editorial mt-1"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            >
              {activeStudyLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {activeStudyLocations.length === 0 && (
              <p className="mt-1 text-xs text-red-700">
                No approved locations yet — ask scholarship chair to add one.
              </p>
            )}
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="date"
              className="input-editorial font-mono"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              type="number"
              step="0.5"
              min={0.5}
              className="input-editorial font-mono"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
            />
          </div>
          <input
            className="input-editorial"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            type="button"
            disabled={activeStudyLocations.length === 0 || !(form.hours > 0)}
            onClick={submitLog}
            className="btn-primary w-full"
          >
            Submit log
          </button>
        </div>
      </Modal>
    </>
  )
}
