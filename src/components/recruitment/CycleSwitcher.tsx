import { useState } from 'react'
import { useRecruitment } from '../../context/RecruitmentContext'
import { currentTermLabel } from '../../lib/demoRelativeDates'
import { Modal } from '../ui/Modal'

export function CycleSwitcher() {
  const {
    cycles,
    activeCycle,
    viewCycleId,
    setViewCycleId,
    canEditRecruitment,
    archiveCurrentCycle,
    startNewCycle,
    isViewingArchived,
  } = useRecruitment()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  const sorted = [...cycles].sort((a, b) => b.startedAt.localeCompare(a.startedAt))

  const openArchiveFlow = () => {
    setNewLabel(currentTermLabel())
    setArchiveOpen(true)
  }

  const confirmArchiveAndStart = () => {
    archiveCurrentCycle()
    startNewCycle(newLabel.trim() || currentTermLabel())
    setArchiveOpen(false)
  }

  const needsNewCycle = !activeCycle || Boolean(activeCycle.archivedAt)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <span className="sr-only">Rush cycle</span>
        <select
          value={viewCycleId}
          onChange={(e) => setViewCycleId(e.target.value)}
          className="rounded-sm border border-black/10 bg-white px-2 py-1.5 text-sm"
        >
          {sorted.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
              {c.archivedAt ? ' · archived' : ' · active'}
            </option>
          ))}
        </select>
      </label>
      {isViewingArchived && (
        <span className="rounded-sm bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
          Read-only archive
        </span>
      )}
      {canEditRecruitment && activeCycle && !activeCycle.archivedAt && (
        <button
          type="button"
          onClick={openArchiveFlow}
          className="rounded-sm border border-black/10 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          Archive & start new
        </button>
      )}
      {canEditRecruitment && needsNewCycle && (
        <button
          type="button"
          onClick={() => {
            setNewLabel(currentTermLabel())
            setArchiveOpen(true)
          }}
          className="rounded-sm border border-black/10 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          Start new cycle
        </button>
      )}

      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title={needsNewCycle ? 'Start new cycle' : 'Archive & start new cycle'}
      >
        <p className="text-sm text-neutral-600">
          {needsNewCycle
            ? 'Create an empty rush cycle. Prior cycles stay available as archives.'
            : `Archive “${activeCycle?.label}” and open an empty board for the next term.`}
        </p>
        <label className="mt-4 block text-xs font-medium text-neutral-600">
          New cycle label
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="input-editorial mt-1 w-full"
            placeholder={currentTermLabel()}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            if (needsNewCycle) {
              startNewCycle(newLabel.trim() || currentTermLabel())
              setArchiveOpen(false)
            } else {
              confirmArchiveAndStart()
            }
          }}
          className="mt-4 w-full rounded-sm bg-accent py-2.5 text-sm font-semibold text-white"
        >
          {needsNewCycle ? 'Start cycle' : 'Archive & start'}
        </button>
      </Modal>
    </div>
  )
}
