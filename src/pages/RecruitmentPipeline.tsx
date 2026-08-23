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
import { GripVertical, Star } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { prospects as initialProspects, PIPELINE_STAGES } from '../data/mockData'
import type { PipelineStage, Prospect } from '../types'

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
      className="rounded-lg border border-border bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => navigate(`/recruitment/pnm/${prospect.id}`)}
        >
          <p className="text-sm font-semibold text-navy">
            {prospect.firstName} {prospect.lastName}
          </p>
          <p className="text-xs text-slate-500">{prospect.major}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{prospect.assignedBrother}</span>
            {prospect.rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gold">
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
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-surface/50 transition ${
        isOver ? 'border-gold bg-gold/5' : 'border-border'
      }`}
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">{stage}</h3>
          <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
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
            <p className="py-8 text-center text-xs text-slate-400">Drop prospects here</p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function RecruitmentPipeline() {
  const [prospects, setProspects] = useState(initialProspects)
  const [activeId, setActiveId] = useState<string | null>(null)

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
      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? { ...p, status: newStage! } : p))
      )
    }
  }

  return (
    <>
      <TopBar
        title="Recruitment Pipeline"
        subtitle="Drag prospects between stages"
        actions={
          <Link
            to="/recruitment"
            className="rounded-lg border border-border px-3 py-2 text-sm text-slate-600 hover:bg-surface"
          >
            ← Dashboard
          </Link>
        }
      />

      <div className="p-8">
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
    </>
  )
}
