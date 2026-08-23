import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { events as seedEvents } from '../data/mockData'
import {
  SEMESTER_STUDY_HOURS_REQUIRED,
  calendarExtraEvents,
  initialBillHighway,
  initialDuesCharges,
  initialDuesPayments,
  initialStudyLocations,
  initialStudyLogs,
} from '../data/chapterOpsData'
import type { Event } from '../types'
import type {
  BillHighwayConfig,
  DuesCharge,
  DuesPayment,
  StudyHoursLog,
  StudyLocation,
} from '../types/chapterOps'

export interface ChapterOpsContextValue {
  events: Event[]
  getEvent: (id: string) => Event | undefined
  updateEventPoints: (eventId: string, points: number) => void
  updateEvent: (eventId: string, patch: Partial<Event>) => void
  addEvent: (event: Omit<Event, 'id'>) => string

  studyLocations: StudyLocation[]
  activeStudyLocations: StudyLocation[]
  studyLogs: StudyHoursLog[]
  studyHoursRequired: number
  setStudyHoursRequired: (n: number) => void
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
    if (!raw) return seedEventList()
    const stored = JSON.parse(raw) as Event[]
    if (!Array.isArray(stored) || stored.length === 0) return seedEventList()
    return stored
  } catch {
    return seedEventList()
  }
}

function writeEvents(next: Event[]) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
}

export function ChapterOpsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(readEvents)
  const [studyLocations, setStudyLocations] = useState(initialStudyLocations)
  const [studyLogs, setStudyLogs] = useState(initialStudyLogs)
  const [studyHoursRequired, setStudyHoursRequired] = useState(SEMESTER_STUDY_HOURS_REQUIRED)
  const [duesCharges, setDuesCharges] = useState(initialDuesCharges)
  const [duesPayments, setDuesPayments] = useState(initialDuesPayments)
  const [billHighway, setBillHighway] = useState(initialBillHighway)

  const persistEvents = useCallback((updater: (prev: Event[]) => Event[]) => {
    setEvents((prev) => {
      const next = updater(prev)
      writeEvents(next)
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

  const addStudyLocation = useCallback((loc: Omit<StudyLocation, 'id'>) => {
    setStudyLocations((prev) => [...prev, { ...loc, id: uid('loc') }])
  }, [])

  const updateStudyLocation = useCallback((id: string, patch: Partial<StudyLocation>) => {
    setStudyLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  const toggleStudyLocation = useCallback((id: string) => {
    setStudyLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l))
    )
  }, [])

  const logStudyHours = useCallback((entry: Omit<StudyHoursLog, 'id' | 'verified'>) => {
    setStudyLogs((prev) => [...prev, { ...entry, id: uid('sh'), verified: false }])
  }, [])

  const verifyStudyHours = useCallback((id: string) => {
    setStudyLogs((prev) => prev.map((l) => (l.id === id ? { ...l, verified: true } : l)))
  }, [])

  const updateBillHighway = useCallback((patch: Partial<BillHighwayConfig>) => {
    setBillHighway((prev) => ({ ...prev, ...patch, lastSyncedAt: new Date().toISOString() }))
  }, [])

  const addDuesCharge = useCallback((charge: Omit<DuesCharge, 'id' | 'createdAt'>) => {
    setDuesCharges((prev) => [
      ...prev,
      { ...charge, id: uid('dc'), createdAt: new Date().toISOString() },
    ])
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

        if (existing) {
          return prev.map((p) =>
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
        }

        return [
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
      studyLocations,
      activeStudyLocations,
      studyLogs,
      studyHoursRequired,
      setStudyHoursRequired,
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
      studyLocations,
      activeStudyLocations,
      studyLogs,
      studyHoursRequired,
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
