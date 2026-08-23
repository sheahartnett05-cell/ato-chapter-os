import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Star } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { MemberAvatar } from '../components/ui/MemberAvatar'
import { AddProspectModal } from '../components/recruitment/AddProspectModal'
import { PIPELINE_STAGES } from '../data/mockData'
import { useRecruitment } from '../context/RecruitmentContext'
import type { PipelineStage, Prospect } from '../types'
import { useChapter } from '../context/ChapterContext'

function ProspectCard({ prospect, isOverlay }: { prospect: Prospect; isOverlay?: boolean }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-black/5 bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => navigate(`/recruitment/pnm/${prospect.id}`)}
        >
          <div className="flex items-center gap-2">
            <MemberAvatar
              photoUrl={prospect.photoUrl}
              initials={prospect.avatar}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {prospect.firstName} {prospect.lastName}
              </p>
              <p className="text-xs text-neutral-500">{prospect.major || 'Undeclared'}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between pl-11">
            <span className="truncate text-[10px] text-neutral-400">{prospect.assignedBrother || 'Unassigned'}</span>
            {prospect.rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-accent">
                <Star size={10} fill="currentColor" />
                {prospect.rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PipelineColumn({
  stage,
  prospects,
}: {
  stage: PipelineStage
  prospects: Prospect[]
}) {
  const stageProspects = prospects.filter((p) => p.status === stage)
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-neutral-50/60 transition ${
        isOver ? 'border-accent bg-accent/5' : 'border-black/5'
      }`}
    >
      <div className="border-b border-black/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">{stage}</h3>
          <span className="rounded-sm bg-neutral-900/10 px-2 py-0.5 text-xs font-medium text-neutral-900">
            {stageProspects.length}
          </span>
        </div>
      </div>
      <SortableContext items={stageProspects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div
          className="flex-1 space-y-2 overflow-y-auto p-3"
          style={{ minHeight: 200, maxHeight: 'calc(100vh - 280px)' }}
        >
          {stageProspects.map((p) => (
            <ProspectCard key={p.id} prospect={p} />
          ))}
          {stageProspects.length === 0 && (
            <p className="py-8 text-center text-xs text-neutral-400">Drop prospects here</p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function RecruitmentPipeline() {
  const { languagePack } = useChapter()
  const { prospects, updateProspectStatus, templates } = useRecruitment()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const activeProspect = prospects.find((p) => p.id === activeId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const prospectId = String(active.id)
    let newStage: PipelineStage | null = null

    if (PIPELINE_STAGES.includes(over.id as PipelineStage)) {
      newStage = over.id as PipelineStage
    } else {
      const overProspect = prospects.find((p) => p.id === over.id)
      if (overProspect) newStage = overProspect.status
    }

    if (newStage) {
      updateProspectStatus(prospectId, newStage)
    }
  }

  return (
    <>
      <TopBar
        title={`${languagePack.recruitmentTerm} Pipeline`}
        subtitle="Drag prospects between stages · intake forms with photos"
        actions={
          <div className="flex gap-2">
            <Link
              to="/recruitment"
              className="rounded-sm border border-black/5 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              ← Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Add PNM
            </button>
          </div>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl bg-neutral-50 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
              <p className="mt-1 text-xs text-neutral-500">{t.description}</p>
              <p className="mt-2 text-xs text-neutral-400">{t.fields.length} fields</p>
            </div>
          ))}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => (
              <PipelineColumn key={stage} stage={stage} prospects={prospects} />
            ))}
          </div>

          <DragOverlay>
            {activeProspect ? (
              <ProspectCard prospect={activeProspect} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AddProspectModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
