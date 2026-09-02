import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { DEMO_PNM_ACTIVITIES, DEMO_PROSPECTS } from '../data/mockData'
import { getRushTemplate, RUSH_FORM_TEMPLATES } from '../data/rushFormTemplates'
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import { readJson, writeJson } from '../lib/persist'
import type { ActivityItem, PipelineStage, Prospect } from '../types'

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
  prospects: Prospect[]
  templates: typeof RUSH_FORM_TEMPLATES
  getProspect: (id: string) => Prospect | undefined
  getActivities: (prospectId: string) => ActivityItem[]
  addProspectFromForm: (
    templateId: string,
    values: Record<string, string | boolean | number | string[]>
  ) => Prospect
  updateProspect: (id: string, patch: Partial<Prospect>) => void
  updateProspectStatus: (id: string, status: PipelineStage) => void
  addActivity: (prospectId: string, activity: Omit<ActivityItem, 'id'>) => void
  appendNote: (prospectId: string, note: string, author: string) => void
  archiveProspect: (id: string) => void
  unarchiveProspect: (id: string) => void
  deleteProspect: (id: string) => void
}

const RecruitmentContext = createContext<RecruitmentContextValue | null>(null)

export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const [prospects, setProspects] = useState<Prospect[]>(() => {
    const stored = readJson<Prospect[] | null>(STORAGE_KEYS.prospects, null)
    if (stored && stored.length > 0) return stored
    return allowDemoData() ? DEMO_PROSPECTS : []
  })

  const [activities, setActivities] = useState<Record<string, ActivityItem[]>>(() => {
    const stored = readJson<Record<string, ActivityItem[]> | null>(STORAGE_KEYS.pnmActivities, null)
    if (stored && Object.keys(stored).length > 0) return stored
    return allowDemoData() ? DEMO_PNM_ACTIVITIES : {}
  })

  const persistProspects = useCallback((next: Prospect[]) => {
    setProspects(next)
    writeJson(STORAGE_KEYS.prospects, next)
  }, [])

  const persistActivities = useCallback((next: Record<string, ActivityItem[]>) => {
    setActivities(next)
    writeJson(STORAGE_KEYS.pnmActivities, next)
  }, [])

  const getProspect = useCallback((id: string) => prospects.find((p) => p.id === id), [prospects])

  const getActivities = useCallback(
    (prospectId: string) => activities[prospectId] ?? [],
    [activities]
  )

  const addProspectFromForm = useCallback(
    (
      templateId: string,
      values: Record<string, string | boolean | number | string[]>
    ) => {
      const data = prospectFromFormValues(templateId, values)
      const prospect: Prospect = { ...data, id: uid('p') }
      persistProspects([prospect, ...prospects])
      persistActivities({
        ...activities,
        [prospect.id]: [
          {
            id: uid('act'),
            date: new Date().toISOString().slice(0, 10),
            type: 'Referral',
            description: `Added via ${getRushTemplate(templateId)?.name ?? 'intake form'}.`,
            author: 'Recruitment',
          },
        ],
      })
      return prospect
    },
    [prospects, activities, persistProspects, persistActivities]
  )

  const updateProspect = useCallback(
    (id: string, patch: Partial<Prospect>) => {
      persistProspects(
        prospects.map((p) => {
          if (p.id !== id) return p
          const next = { ...p, ...patch }
          if (patch.firstName || patch.lastName) {
            next.avatar = initialsFor(next.firstName, next.lastName)
          }
          return next
        })
      )
    },
    [prospects, persistProspects]
  )

  const updateProspectStatus = useCallback(
    (id: string, status: PipelineStage) => {
      updateProspect(id, { status })
    },
    [updateProspect]
  )

  const addActivity = useCallback(
    (prospectId: string, activity: Omit<ActivityItem, 'id'>) => {
      const entry: ActivityItem = { ...activity, id: uid('act') }
      persistActivities({
        ...activities,
        [prospectId]: [entry, ...(activities[prospectId] ?? [])],
      })
    },
    [activities, persistActivities]
  )

  const appendNote = useCallback(
    (prospectId: string, note: string, author: string) => {
      const prospect = prospects.find((p) => p.id === prospectId)
      if (!prospect) return
      const notes = prospect.notes ? `${prospect.notes}\n\n${note}` : note
      updateProspect(prospectId, { notes })
      addActivity(prospectId, {
        date: new Date().toISOString().slice(0, 10),
        type: 'Note',
        description: note,
        author,
      })
    },
    [prospects, updateProspect, addActivity]
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
      persistProspects(prospects.filter((p) => p.id !== id))
      const next = { ...activities }
      delete next[id]
      persistActivities(next)
    },
    [prospects, activities, persistProspects, persistActivities]
  )

  const value = useMemo<RecruitmentContextValue>(
    () => ({
      prospects,
      templates: RUSH_FORM_TEMPLATES,
      getProspect,
      getActivities,
      addProspectFromForm,
      updateProspect,
      updateProspectStatus,
      addActivity,
      appendNote,
      archiveProspect,
      unarchiveProspect,
      deleteProspect,
    }),
    [
      prospects,
      getProspect,
      getActivities,
      addProspectFromForm,
      updateProspect,
      updateProspectStatus,
      addActivity,
      appendNote,
      archiveProspect,
      unarchiveProspect,
      deleteProspect,
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
