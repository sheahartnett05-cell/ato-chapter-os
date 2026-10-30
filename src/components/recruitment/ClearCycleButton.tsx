import { useState } from 'react'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useRecruitment } from '../../context/RecruitmentContext'
import { useChapter } from '../../context/ChapterContext'

export function ClearCycleButton() {
  const {
    boardProspects,
    clearActiveCycle,
    canEditRecruitment,
    activeCycle,
    isViewingArchived,
  } = useRecruitment()
  const { languagePack } = useChapter()
  const [open, setOpen] = useState(false)
  const count = boardProspects.length
  const term = languagePack.recruitmentTerm.toLowerCase()

  if (!canEditRecruitment || isViewingArchived || !activeCycle || activeCycle.archivedAt) {
    return null
  }

  return (
    <>
      <button
        type="button"
        disabled={count === 0}
        onClick={() => setOpen(true)}
        className="rounded-sm border border-black/10 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear cycle
      </button>
      <ConfirmDialog
        open={open}
        title={`Clear this ${term} cycle?`}
        message={
          count === 1
            ? `Removes 1 prospect from “${activeCycle.label}”. Archived cycles and roster members stay.`
            : `Removes ${count} prospects from “${activeCycle.label}”. Archived cycles and roster members stay.`
        }
        confirmLabel="Clear cycle"
        destructive
        onConfirm={clearActiveCycle}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
