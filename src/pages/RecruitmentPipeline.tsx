import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { AddProspectModal } from '../components/recruitment/AddProspectModal'
import { ClearCycleButton } from '../components/recruitment/ClearCycleButton'
import { CycleSwitcher } from '../components/recruitment/CycleSwitcher'
import { PipelineBoard } from '../components/recruitment/PipelineBoard'
import { PersistErrorNotice } from '../components/ui/PersistErrorNotice'
import { useRecruitment } from '../context/RecruitmentContext'
import { useChapter } from '../context/ChapterContext'
import { useMembers } from '../context/MembersContext'
import { transitionProspectStage } from '../lib/recruitment/transitions'
import { addDays, localTodayIso } from '../lib/demoRelativeDates'
import type { PipelineStage } from '../types'

export default function RecruitmentPipeline() {
  const { languagePack } = useChapter()
  const {
    boardProspects,
    updateProspect,
    canEditRecruitment,
    isViewingArchived,
    viewCycle,
    activeCycle,
  } = useRecruitment()
  const { members, promoteProspectToMember } = useMembers()
  const [addOpen, setAddOpen] = useState(false)
  const [promoteError, setPromoteError] = useState('')

  const readOnly = isViewingArchived || !canEditRecruitment
  const cycle = viewCycle ?? activeCycle

  const handleStageChange = (prospectId: string, newStage: PipelineStage) => {
    if (readOnly) return
    setPromoteError('')
    const p = boardProspects.find((x) => x.id === prospectId)
    if (!p || p.status === newStage) return

    const result = transitionProspectStage(p, newStage, {
      roster: members.map((m) => ({ id: m.id, email: m.email })),
      promote: promoteProspectToMember,
      pledgeClass: cycle?.label,
      bidDeadline: cycle?.bidDay ?? addDays(localTodayIso(), 3),
    })

    if (!result.ok) {
      setPromoteError(result.error)
      return
    }
    if (Object.keys(result.patch).length > 0) {
      updateProspect(prospectId, result.patch)
    }
  }

  return (
    <>
      <TopBar
        title={`${languagePack.recruitmentTerm} Pipeline`}
        subtitle={
          cycle
            ? `${cycle.label}${cycle.archivedAt ? ' · archived' : ' · active'}`
            : 'Drag prospects between stages'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ClearCycleButton />
            <Link
              to="/recruitment"
              className="rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              ← Dashboard
            </Link>
            {canEditRecruitment && !isViewingArchived && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Add PNM
              </button>
            )}
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-8">
        <PersistErrorNotice />
        <CycleSwitcher />
        {isViewingArchived && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Viewing an archived cycle — drag, add, and stage changes are disabled.
          </p>
        )}
        {promoteError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not add to roster: {promoteError}
          </p>
        )}

        <PipelineBoard
          prospects={boardProspects}
          readOnly={readOnly}
          canEdit={canEditRecruitment}
          onStageChange={handleStageChange}
        />
      </div>

      <AddProspectModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
