import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { ChevronLeft, ChevronRight, GripVertical, Star } from 'lucide-react'
import { MemberAvatar } from '../ui/MemberAvatar'
import { PIPELINE_STAGES } from '../../data/pipelineStages'
import type { PipelineStage, Prospect } from '../../types'

const COLLAPSED_KEY = 'chapter-os-pipeline-collapsed'
const COMPACT_KEY = 'chapter-os-pipeline-compact'

function readStringSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeStringSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return desktop
}

function ProspectCard({
  prospect,
  isOverlay,
  compact,
  readOnly,
  canEdit,
  onMoveTo,
}: {
  prospect: Prospect
  isOverlay?: boolean
  compact?: boolean
  readOnly?: boolean
  canEdit?: boolean
  onMoveTo?: (stage: PipelineStage) => void
}) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
    disabled: readOnly || !canEdit,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  }

  const declined = prospect.bid?.response === 'declined'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-black/5 bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        {!readOnly && canEdit && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="-ml-1 mt-0.5 flex min-h-11 min-w-11 shrink-0 cursor-grab items-center justify-center text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
            aria-label={`Drag ${prospect.firstName} ${prospect.lastName}`}
          >
            <GripVertical size={14} />
          </button>
        )}
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => navigate(`/recruitment/pnm/${prospect.id}`)}
        >
          {compact ? (
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {prospect.firstName} {prospect.lastName}
              </p>
              {prospect.rating > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 text-xs text-accent">
                  <Star size={10} fill="currentColor" />
                  {prospect.rating}
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <MemberAvatar photoUrl={prospect.photoUrl} initials={prospect.avatar} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {prospect.firstName} {prospect.lastName}
                    {declined && (
                      <span className="ml-1 text-[10px] font-medium uppercase text-red-600">
                        Declined
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">{prospect.major || 'Undeclared'}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between pl-11">
                <span className="truncate text-[10px] text-neutral-400">
                  {prospect.assignedBrother || 'Unassigned'}
                </span>
                {prospect.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-accent">
                    <Star size={10} fill="currentColor" />
                    {prospect.rating}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {canEdit && !readOnly && onMoveTo && (
        <label className="mt-2 block">
          <span className="sr-only">Move to stage</span>
          <select
            value={prospect.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onMoveTo(e.target.value as PipelineStage)}
            className="w-full rounded border border-black/10 bg-neutral-50 px-2 py-1 text-[11px] text-neutral-700"
            aria-label={`Move ${prospect.firstName} ${prospect.lastName} to stage`}
          >
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

function PipelineColumn({
  stage,
  prospects,
  collapsed,
  onToggleCollapse,
  compact,
  readOnly,
  canEdit,
  onMoveTo,
}: {
  stage: PipelineStage
  prospects: Prospect[]
  collapsed: boolean
  onToggleCollapse: () => void
  compact: boolean
  readOnly: boolean
  canEdit: boolean
  onMoveTo: (prospectId: string, stage: PipelineStage) => void
}) {
  const stageProspects = prospects.filter((p) => p.status === stage)
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled: readOnly || !canEdit })

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex w-11 shrink-0 flex-col items-center rounded-xl border border-black/5 bg-neutral-50/60 py-3 hover:border-accent/40"
        title={`${stage} (${stageProspects.length})`}
        aria-label={`Expand ${stage} column`}
      >
        <span className="text-[10px] font-semibold text-neutral-500">{stageProspects.length}</span>
        <span
          className="mt-2 origin-center text-[10px] font-semibold uppercase tracking-wide text-neutral-700"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {stage}
        </span>
      </button>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[min(100%,18rem)] shrink-0 flex-col rounded-xl border bg-neutral-50/60 transition md:w-72 ${
        isOver ? 'border-accent bg-accent/5' : 'border-black/5'
      }`}
    >
      <div className="sticky top-0 z-[1] border-b border-black/5 bg-neutral-50/95 px-3 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate whitespace-nowrap text-sm font-semibold text-neutral-900" title={stage}>
            {stage}
          </h3>
          <div className="flex items-center gap-1">
            <span className="rounded-sm bg-neutral-900/10 px-2 py-0.5 text-xs font-medium text-neutral-900">
              {stageProspects.length}
            </span>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-black/5"
              aria-label={`Collapse ${stage}`}
              title="Collapse"
            >
              ◀
            </button>
          </div>
        </div>
      </div>
      <SortableContext items={stageProspects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div
          className="flex-1 space-y-2 overflow-y-auto p-3"
          style={{ minHeight: 200, maxHeight: 'calc(100vh - 280px)' }}
        >
          {stageProspects.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              compact={compact}
              readOnly={readOnly}
              canEdit={canEdit}
              onMoveTo={(stageTo) => onMoveTo(p.id, stageTo)}
            />
          ))}
          {stageProspects.length === 0 && (
            <p className="py-8 text-center text-xs text-neutral-400">Drop prospects here</p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function PipelineBoard({
  prospects,
  readOnly,
  canEdit,
  onStageChange,
}: {
  prospects: Prospect[]
  readOnly: boolean
  canEdit: boolean
  onStageChange: (prospectId: string, stage: PipelineStage) => void
}) {
  const isDesktop = useIsDesktop()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileStage, setMobileStage] = useState<PipelineStage>(PIPELINE_STAGES[0])
  const [collapsed, setCollapsed] = useState<Set<string>>(() => readStringSet(COLLAPSED_KEY))
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem(COMPACT_KEY) === '1'
    } catch {
      return false
    }
  })
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const activeProspect = prospects.find((p) => p.id === activeId)

  const updateScrollAffordance = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateScrollAffordance()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollAffordance, { passive: true })
    const ro = new ResizeObserver(updateScrollAffordance)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollAffordance)
      ro.disconnect()
    }
  }, [isDesktop, collapsed, prospects.length])

  const toggleCollapse = (stage: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(stage)) next.delete(stage)
      else next.add(stage)
      writeStringSet(COLLAPSED_KEY, next)
      return next
    })
  }

  const toggleCompact = () => {
    setCompact((v) => {
      const next = !v
      try {
        localStorage.setItem(COMPACT_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const scrollByColumn = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || readOnly || !canEdit) return

    const prospectId = String(active.id)
    let newStage: PipelineStage | null = null

    if (PIPELINE_STAGES.includes(over.id as PipelineStage)) {
      newStage = over.id as PipelineStage
    } else {
      const overProspect = prospects.find((p) => p.id === over.id)
      if (overProspect) newStage = overProspect.status
    }

    if (newStage) onStageChange(prospectId, newStage)
  }

  const stageCounts = useMemo(() => {
    const counts = {} as Record<PipelineStage, number>
    for (const stage of PIPELINE_STAGES) {
      counts[stage] = prospects.filter((p) => p.status === stage).length
    }
    return counts
  }, [prospects])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleCompact}
          className="rounded-sm border border-black/10 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          {compact ? 'Comfortable cards' : 'Compact cards'}
        </button>
        {isDesktop && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Scroll pipeline left"
              disabled={!canScrollLeft}
              onClick={() => scrollByColumn(-1)}
              className="rounded border border-black/10 p-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Scroll pipeline right"
              disabled={!canScrollRight}
              onClick={() => scrollByColumn(1)}
              className="rounded border border-black/10 p-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {!isDesktop ? (
          <div>
            <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
              {PIPELINE_STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setMobileStage(stage)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                    mobileStage === stage
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {stage} ({stageCounts[stage]})
                </button>
              ))}
            </div>
            <PipelineColumn
              stage={mobileStage}
              prospects={prospects}
              collapsed={false}
              onToggleCollapse={() => undefined}
              compact={compact}
              readOnly={readOnly}
              canEdit={canEdit}
              onMoveTo={onStageChange}
            />
          </div>
        ) : (
          <div className="relative">
            {canScrollLeft && (
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-8 bg-gradient-to-r from-[var(--bg,white)] to-transparent"
                aria-hidden
              />
            )}
            {canScrollRight && (
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-8 bg-gradient-to-l from-[var(--bg,white)] to-transparent"
                aria-hidden
              />
            )}
            <div ref={scrollerRef} className="flex gap-4 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map((stage) => (
                <PipelineColumn
                  key={stage}
                  stage={stage}
                  prospects={prospects}
                  collapsed={collapsed.has(stage)}
                  onToggleCollapse={() => toggleCollapse(stage)}
                  compact={compact}
                  readOnly={readOnly}
                  canEdit={canEdit}
                  onMoveTo={onStageChange}
                />
              ))}
            </div>
          </div>
        )}

        <DragOverlay>
          {activeProspect ? (
            <ProspectCard prospect={activeProspect} isOverlay compact={compact} canEdit={false} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
