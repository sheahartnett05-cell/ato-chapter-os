import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_EVENTS as seedEvents } from '../data/mockData'
import {
  SEED_ATTENDANCE,
  SEED_RSVP_EXCUSES,
  SEED_RSVPS,
} from '../data/eventParticipationData'
import {
  SEMESTER_STUDY_HOURS_REQUIRED,
  DEFAULT_STUDY_HOURS_RESET,
  DEFAULT_STUDY_HOURS_REQUIREMENTS,
  calendarExtraEvents,
  initialBillHighway,
  initialDuesCharges,
  initialDuesPayments,
  initialStudyLocations,
  initialStudyLogs,
} from '../data/chapterOpsData'
import { memberVerifiedHours, memberStudyHoursRequired } from '../lib/studyHours'
import { allowDemoData, EMPTY_BILL_HIGHWAY, STORAGE_KEYS } from '../lib/demoSeed'
import type { AttendanceEntry, Event, RsvpEntry } from '../types'
import type { RsvpExcuse } from '../types/features'
import type {
  BillHighwayConfig,
  DuesCharge,
  DuesPayment,
  StudyHoursLog,
  StudyHoursResetConfig,
  StudyHoursRequirementsConfig,
  StudyLocation,
} from '../types/chapterOps'

export interface ChapterOpsContextValue {
  events: Event[]
  getEvent: (id: string) => Event | undefined
  updateEventPoints: (eventId: string, points: number) => void
  updateEvent: (eventId: string, patch: Partial<Event>) => void
  addEvent: (event: Omit<Event, 'id'>) => string

  rsvps: Record<string, RsvpEntry[]>
  attendance: Record<string, AttendanceEntry[]>
  excuses: RsvpExcuse[]
  getEventRsvps: (eventId: string) => RsvpEntry[]
  getMemberRsvp: (eventId: string, memberId: string) => RsvpEntry | undefined
  setRsvp: (
    eventId: string,
    memberId: string,
    status: RsvpEntry['status'],
    guest?: string
  ) => void
  getEventAttendance: (eventId: string) => AttendanceEntry[]
  setAttendanceEntry: (
    eventId: string,
    memberId: string,
    status: AttendanceEntry['status'],
    pointsEarned?: number
  ) => void
  submitExcuse: (input: {
    eventId: string
    memberId: string
    reason: string
    attachmentNote?: string
  }) => RsvpExcuse
  updateExcuseStatus: (
    excuseId: string,
    status: RsvpExcuse['status'],
    reviewedBy?: string
  ) => void
  getEventExcuses: (eventId: string) => RsvpExcuse[]
  getMemberExcuses: (memberId: string) => RsvpExcuse[]

  studyLocations: StudyLocation[]
  activeStudyLocations: StudyLocation[]
  studyLogs: StudyHoursLog[]
  studyHoursRequirements: StudyHoursRequirementsConfig
  /** Default hours when mode is `all` (convenience alias). */
  studyHoursRequired: number
  setStudyHoursRequired: (n: number) => void
  setStudyHoursAssignmentMode: (mode: StudyHoursRequirementsConfig['mode']) => void
  assignStudyHoursToAllMembers: (hours: number) => void
  setMemberStudyHoursRequirement: (memberId: string, hours: number | null) => void
  updateMemberStudyHoursRequirements: (memberHours: Record<string, number>) => void
  getMemberStudyHoursRequired: (memberId: string) => number | null
  studyHoursReset: StudyHoursResetConfig
  updateStudyHoursReset: (patch: Partial<StudyHoursResetConfig>) => void
  getMemberVerifiedHours: (memberId: string) => number
  addStudyLocation: (loc: Omit<StudyLocation, 'id'>) => void
  updateStudyLocation: (id: string, patch: Partial<StudyLocation>) => void
  toggleStudyLocation: (id: string) => void
  logStudyHours: (entry: Omit<StudyHoursLog, 'id' | 'verified'>) => void
  verifyStudyHours: (id: string) => void

  duesCharges: DuesCharge[]
  duesPayments: DuesPayment[]
  billHighway: BillHighwayConfig
  updateBillHighway: (patch: Partial<BillHighwayConfig>) => void
  addDuesCharge: (charge: Omit<DuesCharge, 'id' | 'createdAt'>) => void
  recordDuesPayment: (
    chargeId: string,
    memberId: string,
    amount: number,
    method?: DuesPayment['method']
  ) => void
  memberDuesBalance: (memberId: string) => number
}

const ChapterOpsContext = createContext<ChapterOpsContextValue | null>(null)

const EVENTS_KEY = 'chapter-os-events'

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function seedEventList(): Event[] {
  const byId = new Map<string, Event>()
  for (const e of [...seedEvents, ...calendarExtraEvents]) byId.set(e.id, e)
  return [...byId.values()]
}

function readEvents(): Event[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Event[]
      if (Array.isArray(stored)) return stored
    }
  } catch {
    /* ignore */
  }
  return allowDemoData() ? seedEventList() : []
}

function readRsvps(): Record<string, RsvpEntry[]> {
  const stored = readJson<Record<string, RsvpEntry[]> | null>(STORAGE_KEYS.rsvps, null)
  if (stored && typeof stored === 'object') return stored
  return allowDemoData() ? { ...SEED_RSVPS } : {}
}

function readAttendance(): Record<string, AttendanceEntry[]> {
  const stored = readJson<Record<string, AttendanceEntry[]> | null>(STORAGE_KEYS.attendance, null)
  if (stored && typeof stored === 'object') return stored
  return allowDemoData() ? { ...SEED_ATTENDANCE } : {}
}

function readExcuses(): RsvpExcuse[] {
  const stored = readJson<RsvpExcuse[] | null>(STORAGE_KEYS.rsvpExcuses, null)
  if (stored && Array.isArray(stored)) return stored
  return allowDemoData() ? [...SEED_RSVP_EXCUSES] : []
}

function writeEvents(next: Event[]) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* ignore */
  }
  return fallback
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

function readStudyHoursRequirements(): StudyHoursRequirementsConfig {
  const stored = readJson<StudyHoursRequirementsConfig | null>(
    STORAGE_KEYS.studyHoursRequirements,
    null
  )
  if (stored) return stored

  const legacy = readJson<number>(STORAGE_KEYS.studyRequired, SEMESTER_STUDY_HOURS_REQUIRED)
  return { ...DEFAULT_STUDY_HOURS_REQUIREMENTS, defaultHours: legacy }
}

export function ChapterOpsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(readEvents)
  const [rsvps, setRsvps] = useState<Record<string, RsvpEntry[]>>(readRsvps)
  const [attendance, setAttendance] = useState<Record<string, AttendanceEntry[]>>(readAttendance)
  const [excuses, setExcuses] = useState<RsvpExcuse[]>(readExcuses)
  const [studyLocations, setStudyLocations] = useState(() =>
    readJson(STORAGE_KEYS.studyLocations, allowDemoData() ? initialStudyLocations : [])
  )
  const [studyLogs, setStudyLogs] = useState(() =>
    readJson(STORAGE_KEYS.studyLogs, allowDemoData() ? initialStudyLogs : [])
  )
  const [studyHoursRequirements, setStudyHoursRequirementsState] = useState<StudyHoursRequirementsConfig>(
    readStudyHoursRequirements
  )
  const studyHoursRequired = studyHoursRequirements.defaultHours
  const [studyHoursReset, setStudyHoursResetState] = useState<StudyHoursResetConfig>(() =>
    readJson(STORAGE_KEYS.studyHoursReset, DEFAULT_STUDY_HOURS_RESET)
  )
  const [duesCharges, setDuesCharges] = useState<DuesCharge[]>(() =>
    readJson(STORAGE_KEYS.duesCharges, allowDemoData() ? initialDuesCharges : [])
  )
  const [duesPayments, setDuesPayments] = useState<DuesPayment[]>(() =>
    readJson(STORAGE_KEYS.duesPayments, allowDemoData() ? initialDuesPayments : [])
  )
  const [billHighway, setBillHighway] = useState<BillHighwayConfig>(() =>
    readJson(STORAGE_KEYS.billHighway, allowDemoData() ? initialBillHighway : EMPTY_BILL_HIGHWAY)
  )

  const persistEvents = useCallback((updater: (prev: Event[]) => Event[]) => {
    setEvents((prev) => {
      const next = updater(prev)
      writeEvents(next)
      return next
    })
  }, [])

  const persistRsvps = useCallback(
    (updater: (prev: Record<string, RsvpEntry[]>) => Record<string, RsvpEntry[]>) => {
      setRsvps((prev) => {
        const next = updater(prev)
        writeJson(STORAGE_KEYS.rsvps, next)
        return next
      })
    },
    []
  )

  const persistAttendance = useCallback(
    (updater: (prev: Record<string, AttendanceEntry[]>) => Record<string, AttendanceEntry[]>) => {
      setAttendance((prev) => {
        const next = updater(prev)
        writeJson(STORAGE_KEYS.attendance, next)
        return next
      })
    },
    []
  )

  const persistExcuses = useCallback((updater: (prev: RsvpExcuse[]) => RsvpExcuse[]) => {
    setExcuses((prev) => {
      const next = updater(prev)
      writeJson(STORAGE_KEYS.rsvpExcuses, next)
      return next
    })
  }, [])

  const updateEventPoints = useCallback(
    (eventId: string, points: number) => {
      persistEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, points: Math.max(0, points) } : e))
      )
    },
    [persistEvents]
  )

  const updateEvent = useCallback(
    (eventId: string, patch: Partial<Event>) => {
      persistEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...patch } : e)))
    },
    [persistEvents]
  )

  const addEvent = useCallback(
    (event: Omit<Event, 'id'>) => {
      const id = uid('e')
      persistEvents((prev) => [...prev, { ...event, id }])
      return id
    },
    [persistEvents]
  )

  const getEventRsvps = useCallback((eventId: string) => rsvps[eventId] ?? [], [rsvps])

  const getMemberRsvp = useCallback(
    (eventId: string, memberId: string) =>
      (rsvps[eventId] ?? []).find((r) => r.memberId === memberId),
    [rsvps]
  )

  const setRsvp = useCallback(
    (eventId: string, memberId: string, status: RsvpEntry['status'], guest?: string) => {
      persistRsvps((prev) => {
        const list = prev[eventId] ?? []
        const existing = list.find((r) => r.memberId === memberId)
        const nextEntry: RsvpEntry = { memberId, status, ...(guest ? { guest } : {}) }
        const nextList = existing
          ? list.map((r) => (r.memberId === memberId ? { ...r, ...nextEntry } : r))
          : [...list, nextEntry]
        return { ...prev, [eventId]: nextList }
      })
    },
    [persistRsvps]
  )

  const getEventAttendance = useCallback(
    (eventId: string) => attendance[eventId] ?? [],
    [attendance]
  )

  const setAttendanceEntry = useCallback(
    (
      eventId: string,
      memberId: string,
      status: AttendanceEntry['status'],
      pointsEarned = 0
    ) => {
      persistAttendance((prev) => {
        const list = prev[eventId] ?? []
        const existing = list.find((a) => a.memberId === memberId)
        const entry: AttendanceEntry = { memberId, status, pointsEarned }
        const nextList = existing
          ? list.map((a) => (a.memberId === memberId ? entry : a))
          : [...list, entry]
        return { ...prev, [eventId]: nextList }
      })
    },
    [persistAttendance]
  )

  const submitExcuse = useCallback(
    (input: {
      eventId: string
      memberId: string
      reason: string
      attachmentNote?: string
    }) => {
      const excuse: RsvpExcuse = {
        id: uid('ex'),
        eventId: input.eventId,
        memberId: input.memberId,
        reason: input.attachmentNote
          ? `${input.reason} [${input.attachmentNote}]`
          : input.reason,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }
      persistExcuses((prev) => [...prev, excuse])
      setRsvp(input.eventId, input.memberId, 'Not Going')
      return excuse
    },
    [persistExcuses, setRsvp]
  )

  const updateExcuseStatus = useCallback(
    (excuseId: string, status: RsvpExcuse['status'], reviewedBy?: string) => {
      persistExcuses((prev) =>
        prev.map((e) =>
          e.id === excuseId
            ? { ...e, status, reviewedBy, reviewedAt: new Date().toISOString() }
            : e
        )
      )
    },
    [persistExcuses]
  )

  const getEventExcuses = useCallback(
    (eventId: string) => excuses.filter((e) => e.eventId === eventId),
    [excuses]
  )

  const getMemberExcuses = useCallback(
    (memberId: string) => excuses.filter((e) => e.memberId === memberId),
    [excuses]
  )

  const persistStudyHoursRequirements = useCallback((next: StudyHoursRequirementsConfig) => {
    setStudyHoursRequirementsState(next)
    writeJson(STORAGE_KEYS.studyHoursRequirements, next)
    writeJson(STORAGE_KEYS.studyRequired, next.defaultHours)
  }, [])

  const setStudyHoursRequired = useCallback(
    (n: number) => {
      persistStudyHoursRequirements({
        ...studyHoursRequirements,
        defaultHours: n,
      })
    },
    [studyHoursRequirements, persistStudyHoursRequirements]
  )

  const setStudyHoursAssignmentMode = useCallback(
    (mode: StudyHoursRequirementsConfig['mode']) => {
      persistStudyHoursRequirements({ ...studyHoursRequirements, mode })
    },
    [studyHoursRequirements, persistStudyHoursRequirements]
  )

  const assignStudyHoursToAllMembers = useCallback(
    (hours: number) => {
      persistStudyHoursRequirements({
        mode: 'all',
        defaultHours: hours,
        memberHours: {},
      })
    },
    [persistStudyHoursRequirements]
  )

  const setMemberStudyHoursRequirement = useCallback(
    (memberId: string, hours: number | null) => {
      const nextHours = { ...studyHoursRequirements.memberHours }
      if (hours === null || hours <= 0) {
        delete nextHours[memberId]
      } else {
        nextHours[memberId] = hours
      }
      persistStudyHoursRequirements({
        ...studyHoursRequirements,
        mode: 'custom',
        memberHours: nextHours,
      })
    },
    [studyHoursRequirements, persistStudyHoursRequirements]
  )

  const updateMemberStudyHoursRequirements = useCallback(
    (memberHours: Record<string, number>) => {
      persistStudyHoursRequirements({
        ...studyHoursRequirements,
        mode: 'custom',
        memberHours,
      })
    },
    [studyHoursRequirements, persistStudyHoursRequirements]
  )

  const getMemberStudyHoursRequired = useCallback(
    (memberId: string) => memberStudyHoursRequired(studyHoursRequirements, memberId),
    [studyHoursRequirements]
  )

  const updateStudyHoursReset = useCallback((patch: Partial<StudyHoursResetConfig>) => {
    setStudyHoursResetState((prev) => {
      const next = { ...prev, ...patch }
      writeJson(STORAGE_KEYS.studyHoursReset, next)
      return next
    })
  }, [])

  const addStudyLocation = useCallback((loc: Omit<StudyLocation, 'id'>) => {
    setStudyLocations((prev) => {
      const next = [...prev, { ...loc, id: uid('loc') }]
      writeJson(STORAGE_KEYS.studyLocations, next)
      return next
    })
  }, [])

  const updateStudyLocation = useCallback((id: string, patch: Partial<StudyLocation>) => {
    setStudyLocations((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
      writeJson(STORAGE_KEYS.studyLocations, next)
      return next
    })
  }, [])

  const toggleStudyLocation = useCallback((id: string) => {
    setStudyLocations((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l))
      writeJson(STORAGE_KEYS.studyLocations, next)
      return next
    })
  }, [])

  const logStudyHours = useCallback((entry: Omit<StudyHoursLog, 'id' | 'verified'>) => {
    if (!(entry.hours > 0)) return
    setStudyLogs((prev) => {
      const next = [...prev, { ...entry, id: uid('sh'), verified: false }]
      writeJson(STORAGE_KEYS.studyLogs, next)
      return next
    })
  }, [])

  const verifyStudyHours = useCallback((id: string) => {
    setStudyLogs((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, verified: true } : l))
      writeJson(STORAGE_KEYS.studyLogs, next)
      return next
    })
  }, [])

  const getMemberVerifiedHours = useCallback(
    (memberId: string) => memberVerifiedHours(studyLogs, memberId, studyHoursReset),
    [studyLogs, studyHoursReset]
  )

  const updateBillHighway = useCallback((patch: Partial<BillHighwayConfig>) => {
    setBillHighway((prev) => {
      const next = { ...prev, ...patch, lastSyncedAt: new Date().toISOString() }
      writeJson(STORAGE_KEYS.billHighway, next)
      return next
    })
  }, [])

  const addDuesCharge = useCallback((charge: Omit<DuesCharge, 'id' | 'createdAt'>) => {
    setDuesCharges((prev) => {
      const next = [
        ...prev,
        { ...charge, id: uid('dc'), createdAt: new Date().toISOString() },
      ]
      writeJson(STORAGE_KEYS.duesCharges, next)
      return next
    })
  }, [])

  const recordDuesPayment = useCallback(
    (
      chargeId: string,
      memberId: string,
      amount: number,
      method: DuesPayment['method'] = 'BillHighway'
    ) => {
      setDuesPayments((prev) => {
        const charge = duesCharges.find((c) => c.id === chargeId)
        const existing = prev.find((p) => p.chargeId === chargeId && p.memberId === memberId)
        const nextPaid = (existing?.amountPaid ?? 0) + amount
        const total = charge?.amount ?? nextPaid
        const status: DuesPayment['status'] =
          nextPaid <= 0 ? 'Open' : nextPaid >= total ? 'Paid' : 'Partial'

        let next: DuesPayment[]
        if (existing) {
          next = prev.map((p) =>
            p.id === existing.id
              ? {
                  ...p,
                  amountPaid: nextPaid,
                  status,
                  method,
                  paidAt: status === 'Paid' ? new Date().toISOString().slice(0, 10) : p.paidAt,
                }
              : p
          )
        } else {
          next = [
            ...prev,
            {
              id: uid('dp'),
              chargeId,
              memberId,
              amountPaid: nextPaid,
              status,
              method,
              paidAt: status === 'Paid' ? new Date().toISOString().slice(0, 10) : undefined,
            },
          ]
        }
        writeJson(STORAGE_KEYS.duesPayments, next)
        return next
      })
    },
    [duesCharges]
  )

  const memberDuesBalance = useCallback(
    (memberId: string) => {
      return duesCharges.reduce((sum, charge) => {
        const applies =
          charge.assignedMemberIds.length === 0 ||
          charge.assignedMemberIds.includes(memberId)
        if (!applies) return sum
        const payment = duesPayments.find(
          (p) => p.chargeId === charge.id && p.memberId === memberId
        )
        const paid = payment?.amountPaid ?? 0
        return sum + Math.max(0, charge.amount - paid)
      }, 0)
    },
    [duesCharges, duesPayments]
  )

  const activeStudyLocations = useMemo(
    () => studyLocations.filter((l) => l.active),
    [studyLocations]
  )

  const getEvent = useCallback((id: string) => events.find((e) => e.id === id), [events])

  const value = useMemo<ChapterOpsContextValue>(
    () => ({
      events,
      getEvent,
      updateEventPoints,
      updateEvent,
      addEvent,
      rsvps,
      attendance,
      excuses,
      getEventRsvps,
      getMemberRsvp,
      setRsvp,
      getEventAttendance,
      setAttendanceEntry,
      submitExcuse,
      updateExcuseStatus,
      getEventExcuses,
      getMemberExcuses,
      studyLocations,
      activeStudyLocations,
      studyLogs,
      studyHoursRequirements,
      studyHoursRequired,
      setStudyHoursRequired,
      setStudyHoursAssignmentMode,
      assignStudyHoursToAllMembers,
      setMemberStudyHoursRequirement,
      updateMemberStudyHoursRequirements,
      getMemberStudyHoursRequired,
      studyHoursReset,
      updateStudyHoursReset,
      getMemberVerifiedHours,
      addStudyLocation,
      updateStudyLocation,
      toggleStudyLocation,
      logStudyHours,
      verifyStudyHours,
      duesCharges,
      duesPayments,
      billHighway,
      updateBillHighway,
      addDuesCharge,
      recordDuesPayment,
      memberDuesBalance,
    }),
    [
      events,
      getEvent,
      updateEventPoints,
      updateEvent,
      addEvent,
      rsvps,
      attendance,
      excuses,
      getEventRsvps,
      getMemberRsvp,
      setRsvp,
      getEventAttendance,
      setAttendanceEntry,
      submitExcuse,
      updateExcuseStatus,
      getEventExcuses,
      getMemberExcuses,
      studyLocations,
      activeStudyLocations,
      studyLogs,
      studyHoursRequirements,
      studyHoursRequired,
      setStudyHoursRequired,
      setStudyHoursAssignmentMode,
      assignStudyHoursToAllMembers,
      setMemberStudyHoursRequirement,
      updateMemberStudyHoursRequirements,
      getMemberStudyHoursRequired,
      studyHoursReset,
      addStudyLocation,
      updateStudyLocation,
      toggleStudyLocation,
      logStudyHours,
      verifyStudyHours,
      getMemberVerifiedHours,
      updateStudyHoursReset,
      duesCharges,
      duesPayments,
      billHighway,
      updateBillHighway,
      addDuesCharge,
      recordDuesPayment,
      memberDuesBalance,
    ]
  )

  return (
    <ChapterOpsContext.Provider value={value}>{children}</ChapterOpsContext.Provider>
  )
}

export function useChapterOps(): ChapterOpsContextValue {
  const ctx = useContext(ChapterOpsContext)
  if (!ctx) throw new Error('useChapterOps must be used within ChapterOpsProvider')
  return ctx
}
