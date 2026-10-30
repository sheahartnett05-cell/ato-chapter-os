import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { DEMO_PNM_ACTIVITIES, DEMO_PROSPECTS } from '../data/demoFixtures'
import { getRushTemplate, RUSH_FORM_TEMPLATES } from '../data/rushFormTemplates'
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import { currentTermLabel, localTodayIso } from '../lib/demoRelativeDates'
import { readJson, writeJson } from '../lib/persist'
import { findActiveCycle, migrateCyclesAndProspects } from '../lib/recruitment/migrateCycles'
import { makeCycleId, type RushCycle } from '../lib/recruitment/types'
import type { ActivityItem, PipelineStage, Prospect } from '../types'
import { usePermissions } from './AuthContext'

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function initialsFor(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?'
}

function prospectFromFormValues(
  templateId: string,
  values: Record<string, string | boolean | number | string[]>
): Omit<Prospect, 'id'> {
  const template = getRushTemplate(templateId)
  const base: Omit<Prospect, 'id'> = {
    firstName: '',
    lastName: '',
    status: 'New',
    rating: 0,
    assignedBrother: '',
    major: '',
    graduationYear: new Date().getFullYear() + 1,
    phone: '',
    email: '',
    instagram: '',
    hometown: '',
    source: '',
    lastContact: new Date().toISOString().slice(0, 10),
    nextFollowUp: '',
    interests: [],
    notes: '',
    avatar: '?',
    templateId,
    customFields: {},
  }

  if (!template) return base

  for (const field of template.fields) {
    const raw = values[field.id]
    if (raw === undefined || raw === '') continue

    if (field.mapsTo === 'interests') {
      const tags = Array.isArray(raw)
        ? raw
        : String(raw)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
      base.interests = tags
    } else if (field.mapsTo === 'graduationYear') {
      base.graduationYear = Number(raw) || base.graduationYear
    } else if (field.mapsTo === 'photoUrl') {
      base.photoUrl = String(raw)
    } else if (field.mapsTo === 'firstName') {
      base.firstName = String(raw)
    } else if (field.mapsTo === 'lastName') {
      base.lastName = String(raw)
    } else if (field.mapsTo === 'email') {
      base.email = String(raw)
    } else if (field.mapsTo === 'phone') {
      base.phone = String(raw)
    } else if (field.mapsTo === 'major') {
      base.major = String(raw)
    } else if (field.mapsTo === 'instagram') {
      base.instagram = String(raw)
    } else if (field.mapsTo === 'hometown') {
      base.hometown = String(raw)
    } else if (field.mapsTo === 'source') {
      base.source = String(raw)
    } else if (field.mapsTo === 'assignedBrother') {
      base.assignedBrother = String(raw)
    } else if (field.mapsTo === 'notes') {
      base.notes = String(raw)
    } else {
      const val = Array.isArray(raw) ? raw.join(', ') : raw
      base.customFields = { ...base.customFields, [field.id]: val }
    }
  }

  base.avatar = initialsFor(base.firstName, base.lastName)
  return base
}

interface RecruitmentContextValue {
  /** All stored prospects (every cycle). */
  allProspects: Prospect[]
  /** Active cycle ∧ !archived — Officer Home tiles / ledger / alerts scope here. */
  prospects: Prospect[]
  /** Visible board for the selected cycle (viewCycle) ∧ !archived. */
  boardProspects: Prospect[]
  cycles: RushCycle[]
  activeCycle: RushCycle | undefined
  /** Cycle currently shown in UI (defaults to active). */
  viewCycleId: string
  viewCycle: RushCycle | undefined
  isViewingArchived: boolean
  setViewCycleId: (id: string) => void
  templates: typeof RUSH_FORM_TEMPLATES
  canEditRecruitment: boolean
  getProspect: (id: string) => Prospect | undefined
  getActivities: (prospectId: string) => ActivityItem[]
  prospectsInCycle: (cycleId: string) => Prospect[]
  addProspectFromForm: (
    templateId: string,
    values: Record<string, string | boolean | number | string[]>
  ) => Prospect | null
  updateProspect: (id: string, patch: Partial<Prospect>) => boolean
  updateProspectStatus: (id: string, status: PipelineStage) => boolean
  addActivity: (prospectId: string, activity: Omit<ActivityItem, 'id'>) => boolean
  appendNote: (prospectId: string, note: string, author: string) => boolean
  archiveProspect: (id: string) => boolean
  unarchiveProspect: (id: string) => boolean
  deleteProspect: (id: string) => boolean
  /** Remove non-archived prospects on the active cycle. Archived cycles untouched. */
  clearActiveCycle: () => boolean
  archiveCurrentCycle: () => boolean
  startNewCycle: (label?: string) => boolean
  renameCycle: (id: string, label: string) => boolean
}

const RecruitmentContext = createContext<RecruitmentContextValue | null>(null)

function loadInitialState(): {
  allProspects: Prospect[]
  cycles: RushCycle[]
  viewCycleId: string
} {
  const storedProspects = readJson<Prospect[] | null>(STORAGE_KEYS.prospects, null)
  const seedProspects = allowDemoData() ? DEMO_PROSPECTS : []
  const baseProspects = storedProspects ?? seedProspects
  const storedCycles = readJson<RushCycle[] | null>(STORAGE_KEYS.rushCycles, null)
  const migrated = migrateCyclesAndProspects(storedCycles, baseProspects)

  if (migrated.changed) {
    writeJson(STORAGE_KEYS.rushCycles, migrated.cycles)
    writeJson(STORAGE_KEYS.prospects, migrated.prospects)
  }

  const active = findActiveCycle(migrated.cycles)
  return {
    allProspects: migrated.prospects,
    cycles: migrated.cycles,
    viewCycleId: active?.id ?? migrated.cycles[0]?.id ?? '',
  }
}

export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const permissions = usePermissions()
  const canEditRecruitment = permissions.canManageRecruitment

  const [boot] = useState(loadInitialState)
  const [allProspects, setAllProspects] = useState<Prospect[]>(() => boot.allProspects)
  const [cycles, setCycles] = useState<RushCycle[]>(() => boot.cycles)
  const [viewCycleId, setViewCycleId] = useState(() => boot.viewCycleId)

  const [activities, setActivities] = useState<Record<string, ActivityItem[]>>(() => {
    const stored = readJson<Record<string, ActivityItem[]> | null>(STORAGE_KEYS.pnmActivities, null)
    if (stored) return stored
    return allowDemoData() ? DEMO_PNM_ACTIVITIES : {}
  })

  const persistProspects = useCallback((next: Prospect[]) => {
    setAllProspects(next)
    writeJson(STORAGE_KEYS.prospects, next)
  }, [])

  const updateProspects = useCallback((recipe: (prev: Prospect[]) => Prospect[]) => {
    setAllProspects((prev) => {
      const next = recipe(prev)
      writeJson(STORAGE_KEYS.prospects, next)
      return next
    })
  }, [])

  /** Functional write so archive + start in one tick compose correctly. */
  const updateCycles = useCallback((recipe: (prev: RushCycle[]) => RushCycle[]) => {
    setCycles((prev) => {
      const next = recipe(prev)
      writeJson(STORAGE_KEYS.rushCycles, next)
      return next
    })
  }, [])

  const persistActivities = useCallback((next: Record<string, ActivityItem[]>) => {
    setActivities(next)
    writeJson(STORAGE_KEYS.pnmActivities, next)
  }, [])

  const activeCycle = useMemo(() => findActiveCycle(cycles), [cycles])
  const viewCycle = useMemo(() => {
    const selected = cycles.find((c) => c.id === viewCycleId)
    if (selected) return selected
    return activeCycle ?? [...cycles].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  }, [cycles, viewCycleId, activeCycle])
  const isViewingArchived = Boolean(viewCycle?.archivedAt)

  const prospects = useMemo(() => {
    const cycleId = activeCycle?.id
    if (!cycleId) return []
    return allProspects.filter((p) => p.cycleId === cycleId && !p.archived)
  }, [allProspects, activeCycle?.id])

  const boardProspects = useMemo(() => {
    const cycleId = viewCycle?.id
    if (!cycleId) return []
    return allProspects.filter((p) => p.cycleId === cycleId && !p.archived)
  }, [allProspects, viewCycle?.id])

  const getProspect = useCallback(
    (id: string) => allProspects.find((p) => p.id === id),
    [allProspects]
  )

  const getActivities = useCallback(
    (prospectId: string) => activities[prospectId] ?? [],
    [activities]
  )

  const prospectsInCycle = useCallback(
    (cycleId: string) => allProspects.filter((p) => p.cycleId === cycleId),
    [allProspects]
  )

  const addProspectFromForm = useCallback(
    (
      templateId: string,
      values: Record<string, string | boolean | number | string[]>
    ) => {
      if (!canEditRecruitment || isViewingArchived || !activeCycle) return null
      const data = prospectFromFormValues(templateId, values)
      const prospect: Prospect = { ...data, id: uid('p'), cycleId: activeCycle.id }
      persistProspects([prospect, ...allProspects])
      persistActivities({
        ...activities,
        [prospect.id]: [
          {
            id: uid('act'),
            date: localTodayIso(),
            type: 'Referral',
            description: `Added via ${getRushTemplate(templateId)?.name ?? 'intake form'}.`,
            author: 'Recruitment',
          },
        ],
      })
      return prospect
    },
    [
      canEditRecruitment,
      isViewingArchived,
      activeCycle,
      allProspects,
      activities,
      persistProspects,
      persistActivities,
    ]
  )

  const updateProspect = useCallback(
    (id: string, patch: Partial<Prospect>) => {
      if (!canEditRecruitment) return false
      let found = false
      updateProspects((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          found = true
          const next = { ...p, ...patch }
          if (patch.firstName || patch.lastName) {
            next.avatar = initialsFor(next.firstName, next.lastName)
          }
          return next
        })
      )
      return found
    },
    [canEditRecruitment, updateProspects]
  )

  const updateProspectStatus = useCallback(
    (id: string, status: PipelineStage) => updateProspect(id, { status }),
    [updateProspect]
  )

  const addActivity = useCallback(
    (prospectId: string, activity: Omit<ActivityItem, 'id'>) => {
      if (!canEditRecruitment) return false
      const entry: ActivityItem = { ...activity, id: uid('act') }
      persistActivities({
        ...activities,
        [prospectId]: [entry, ...(activities[prospectId] ?? [])],
      })
      return true
    },
    [canEditRecruitment, activities, persistActivities]
  )

  const appendNote = useCallback(
    (prospectId: string, note: string, author: string) => {
      if (!canEditRecruitment) return false
      const prospect = allProspects.find((p) => p.id === prospectId)
      if (!prospect) return false
      const notes = prospect.notes ? `${prospect.notes}\n\n${note}` : note
      updateProspect(prospectId, { notes })
      addActivity(prospectId, {
        date: localTodayIso(),
        type: 'Note',
        description: note,
        author,
      })
      return true
    },
    [canEditRecruitment, allProspects, updateProspect, addActivity]
  )

  const archiveProspect = useCallback(
    (id: string) => updateProspect(id, { archived: true }),
    [updateProspect]
  )

  const unarchiveProspect = useCallback(
    (id: string) => updateProspect(id, { archived: false }),
    [updateProspect]
  )

  const deleteProspect = useCallback(
    (id: string) => {
      if (!canEditRecruitment) return false
      persistProspects(allProspects.filter((p) => p.id !== id))
      const next = { ...activities }
      delete next[id]
      persistActivities(next)
      return true
    },
    [canEditRecruitment, allProspects, activities, persistProspects, persistActivities]
  )

  const clearActiveCycle = useCallback(() => {
    if (!canEditRecruitment || !activeCycle) return false
    const removing = new Set(
      allProspects
        .filter((p) => p.cycleId === activeCycle.id && !p.archived)
        .map((p) => p.id)
    )
    // Keep individually archived PNMs and every prospect on archived cycles
    persistProspects(allProspects.filter((p) => !removing.has(p.id)))
    const next = { ...activities }
    for (const id of removing) delete next[id]
    persistActivities(next)
    return true
  }, [
    canEditRecruitment,
    activeCycle,
    allProspects,
    activities,
    persistProspects,
    persistActivities,
  ])

  const archiveCurrentCycle = useCallback(() => {
    if (!canEditRecruitment) return false
    let did = false
    updateCycles((prev) => {
      const active = findActiveCycle(prev)
      if (!active || active.archivedAt) return prev
      did = true
      const today = localTodayIso()
      return prev.map((c) => (c.id === active.id ? { ...c, archivedAt: today } : c))
    })
    return did
  }, [canEditRecruitment, updateCycles])

  const startNewCycle = useCallback(
    (label?: string) => {
      if (!canEditRecruitment) return false
      let createdId: string | null = null
      updateCycles((prev) => {
        if (prev.some((c) => !c.archivedAt)) return prev
        const resolved = (label?.trim() || currentTermLabel()).trim()
        let id = makeCycleId(resolved)
        if (prev.some((c) => c.id === id)) {
          id = `${id}-${Date.now().toString(36)}`
        }
        createdId = id
        return [
          ...prev,
          {
            id,
            label: resolved,
            startedAt: localTodayIso(),
          },
        ]
      })
      if (createdId) setViewCycleId(createdId)
      return Boolean(createdId)
    },
    [canEditRecruitment, updateCycles]
  )

  const renameCycle = useCallback(
    (id: string, label: string) => {
      if (!canEditRecruitment) return false
      const trimmed = label.trim()
      if (!trimmed) return false
      updateCycles((prev) => prev.map((c) => (c.id === id ? { ...c, label: trimmed } : c)))
      return true
    },
    [canEditRecruitment, updateCycles]
  )

  const value = useMemo<RecruitmentContextValue>(
    () => ({
      allProspects,
      prospects,
      boardProspects,
      cycles,
      activeCycle,
      viewCycleId: viewCycle?.id ?? viewCycleId,
      viewCycle,
      isViewingArchived,
      setViewCycleId,
      templates: RUSH_FORM_TEMPLATES,
      canEditRecruitment,
      getProspect,
      getActivities,
      prospectsInCycle,
      addProspectFromForm,
      updateProspect,
      updateProspectStatus,
      addActivity,
      appendNote,
      archiveProspect,
      unarchiveProspect,
      deleteProspect,
      clearActiveCycle,
      archiveCurrentCycle,
      startNewCycle,
      renameCycle,
    }),
    [
      allProspects,
      prospects,
      boardProspects,
      cycles,
      activeCycle,
      viewCycle,
      viewCycleId,
      isViewingArchived,
      canEditRecruitment,
      getProspect,
      getActivities,
      prospectsInCycle,
      addProspectFromForm,
      updateProspect,
      updateProspectStatus,
      addActivity,
      appendNote,
      archiveProspect,
      unarchiveProspect,
      deleteProspect,
      clearActiveCycle,
      archiveCurrentCycle,
      startNewCycle,
      renameCycle,
    ]
  )

  return (
    <RecruitmentContext.Provider value={value}>{children}</RecruitmentContext.Provider>
  )
}

export function useRecruitment(): RecruitmentContextValue {
  const ctx = useContext(RecruitmentContext)
  if (!ctx) throw new Error('useRecruitment must be used within RecruitmentProvider')
  return ctx
}
