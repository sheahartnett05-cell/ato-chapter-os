import { useMemo, useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { PageShell } from '../components/ui/Section'
import { Modal } from '../components/ui/Modal'
import { useChapterOps } from '../context/ChapterOpsContext'
import { usePermissions } from '../context/AuthContext'
import { getMember, members } from '../data/mockData'

export default function LibraryHoursPage() {
  const {
    studyLocations,
    studyLogs,
    studyHoursRequired,
    setStudyHoursRequired,
    activeStudyLocations,
    addStudyLocation,
    toggleStudyLocation,
    updateStudyLocation,
    logStudyHours,
    verifyStudyHours,
  } = useChapterOps()
  const permissions = usePermissions()
  const canManageLocations = permissions.canManageStudyLocations
  const canVerify = permissions.canVerifyStudyHours

  const [logOpen, setLogOpen] = useState(false)
  const [locOpen, setLocOpen] = useState(false)
  const [form, setForm] = useState({
    memberId: members[4]?.id ?? 'm5',
    date: '2025-08-23',
    hours: 2,
    locationId: '',
    notes: '',
  })
  const [newLoc, setNewLoc] = useState({ name: '', address: '' })

  const locationName = (id: string) =>
    studyLocations.find((l) => l.id === id)?.name ?? 'Unknown'

  const totals = useMemo(() => {
    const map: Record<string, number> = {}
    for (const log of studyLogs) {
      if (!log.verified) continue
      map[log.memberId] = (map[log.memberId] ?? 0) + log.hours
    }
    return map
  }, [studyLogs])

  const submitLog = () => {
    const locationId = form.locationId || activeStudyLocations[0]?.id
    if (!locationId) return
    logStudyHours({
      memberId: form.memberId,
      date: form.date,
      hours: form.hours,
      locationId,
      notes: form.notes.trim() || undefined,
    })
    setLogOpen(false)
  }

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

  return (
    <>
      <TopBar
        title="Study Hours"
        subtitle="Approved locations · verification · semester requirement"
        actions={
          <div className="flex gap-2">
            {canManageLocations && (
              <button type="button" onClick={() => setLocOpen(true)} className="btn-ghost text-xs">
                Locations
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  locationId: activeStudyLocations[0]?.id ?? '',
                }))
                setLogOpen(true)
              }}
              className="btn-primary gap-1.5 text-xs"
            >
              <Plus size={14} /> Log hours
            </button>
          </div>
        }
      />

      <PageShell className="space-y-8">
        <div className="ledger-bar grid-cols-2 lg:grid-cols-4">
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">{studyHoursRequired}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Hours required
            </p>
            {canManageLocations && (
              <input
                type="number"
                min={0}
                value={studyHoursRequired}
                onChange={(e) => setStudyHoursRequired(Number(e.target.value))}
                className="mt-2 w-20 border border-[var(--rule)] bg-white px-2 py-1 font-mono text-sm"
              />
            )}
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">{activeStudyLocations.length}</p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Active locations
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">
              {studyLogs.filter((l) => !l.verified).length}
            </p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Pending verify
            </p>
          </div>
          <div className="ledger-cell">
            <p className="font-serif text-3xl tracking-tight">
              {studyLogs.filter((l) => l.verified).reduce((s, l) => s + l.hours, 0)}
            </p>
            <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Verified hours
            </p>
          </div>
        </div>

        {canManageLocations && (
          <section>
            <div className="mb-3 border-b border-[var(--rule)] pb-2">
              <h2 className="font-serif text-xl tracking-tight">Approved locations</h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Scholarship Chair controls where hours count
              </p>
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
            <h2 className="font-serif text-xl tracking-tight">Hour log</h2>
          </div>
          <ul className="list-editorial">
            {studyLogs.map((entry) => {
              const member = getMember(entry.memberId)
              const verifiedTotal = totals[entry.memberId] ?? 0
              return (
                <li key={entry.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {member?.firstName} {member?.lastName}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {entry.date} · {locationName(entry.locationId)} · {entry.hours}h
                      {entry.verified ? ` · ${verifiedTotal}/${studyHoursRequired} verified` : ''}
                    </p>
                    {entry.notes && (
                      <p className="mt-1 text-xs text-[var(--muted)]">{entry.notes}</p>
                    )}
                  </div>
                  <span
                    className={`tag border px-1.5 py-0.5 text-[9px] uppercase ${
                      entry.verified
                        ? 'border-emerald-200 text-emerald-800'
                        : 'border-amber-200 text-amber-900'
                    }`}
                  >
                    {entry.verified ? 'Verified' : 'Pending'}
                  </span>
                  {canVerify && !entry.verified && (
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
            })}
          </ul>
        </section>
      </PageShell>

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log study hours">
        <div className="space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase text-[var(--muted)]">Member</span>
            <select
              className="input-editorial mt-1"
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            >
              {members
                .filter((m) => m.status === 'Active' || m.status === 'New Member')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
            </select>
          </label>
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
              <p className="mt-1 text-xs text-red-700">No active locations — Scholarship Chair must enable some.</p>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2">
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
            disabled={activeStudyLocations.length === 0}
            onClick={submitLog}
            className="btn-primary w-full"
          >
            Submit log
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
