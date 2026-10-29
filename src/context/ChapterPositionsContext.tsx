import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_CHAPTER_POSITIONS } from '../data/featureData'
import {
  cloudIdentityEnabled,
  fetchCloudMembership,
  fetchCloudOfficerSeats,
  rpcAssignOfficerSeat,
  rpcRemoveOfficerSeat,
} from '../lib/cloudIdentity'
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import { writeJson } from '../lib/persist'
import type { ChapterPosition } from '../types/features'
import type { OfficerFunction } from '../types/officerFunction'
import type { UserRole } from '../types/permissions'
import { inferFunctionFromTitle } from '../lib/officerFunctions'
import { getCachedCloudChapterId } from '../lib/cloudChapterId'

const STORAGE_KEY = STORAGE_KEYS.positions

/** Map common position titles → app permission roles */
export function roleFromPositionTitle(title: string): UserRole | null {
  const t = title.trim().toLowerCase()
  if ((t === 'president' || t.includes('president')) && !t.includes('vice')) return 'President'
  if (t.includes('treasurer')) return 'Treasurer'
  if (t.includes('recruitment') || t.includes('rush')) return 'RecruitmentChair'
  if (t.includes('scholarship') || t.includes('academic')) return 'ScholarshipChair'
  if (t.includes('j-board') || t.includes('jboard') || t.includes('judicial') || t.includes('standards'))
    return 'JBoardChair'
  // Chaplain + common equivalents across orgs
  if (
    t.includes('chaplain') ||
    t.includes('spiritual') ||
    t.includes('religious') ||
    t.includes('faith advisor') ||
    t.includes('faith chair')
  )
    return 'Chaplain'
  return null
}

export const DEFAULT_POSITIONS: ChapterPosition[] = [
  { id: 'pos-pres', title: 'President', isCustom: false },
  { id: 'pos-vp', title: 'Vice President', isCustom: false },
  { id: 'pos-treas', title: 'Treasurer', isCustom: false },
  { id: 'pos-sec', title: 'Secretary', isCustom: false },
  { id: 'pos-rush', title: 'Recruitment Chair', isCustom: false },
  { id: 'pos-scholar', title: 'Scholarship Chair', isCustom: false },
  { id: 'pos-standards', title: 'Standards Chair', isCustom: false },
  { id: 'pos-chaplain', title: 'Chaplain', isCustom: false },
  { id: 'pos-social', title: 'Social Chair', isCustom: false },
  { id: 'pos-philanthropy', title: 'Philanthropy Chair', isCustom: false },
]

function withFunction(p: ChapterPosition): ChapterPosition {
  if (p.function) return p
  return { ...p, function: inferFunctionFromTitle(p.title) }
}

function readPositions(): ChapterPosition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChapterPosition[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(withFunction)
    }
  } catch {
    /* ignore */
  }
  if (allowDemoData()) {
    return DEMO_CHAPTER_POSITIONS.map((p) => withFunction({ ...p }))
  }
  return DEFAULT_POSITIONS.map((p) => withFunction({ ...p }))
}

function writePositions(positions: ChapterPosition[]) {
  writeJson(STORAGE_KEY, positions)
}

function uid() {
  return `pos-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
}

interface ChapterPositionsContextValue {
  positions: ChapterPosition[]
  addPosition: (title: string, description?: string) => void
  removePosition: (id: string) => void
  assignPosition: (positionId: string, memberId: string | undefined) => void
  updatePosition: (id: string, patch: Partial<ChapterPosition>) => void
}

const ChapterPositionsContext = createContext<ChapterPositionsContextValue | null>(null)

export function ChapterPositionsProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<ChapterPosition[]>(readPositions)
  const [cloudChapterId, setCloudChapterId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function hydrateSeats() {
      if (!cloudIdentityEnabled()) {
        if (!cancelled) setCloudChapterId(null)
        return
      }
      const membership = await fetchCloudMembership()
      const chapterId = membership?.chapterId ?? getCachedCloudChapterId()
      if (!chapterId || cancelled) return
      setCloudChapterId(chapterId)
      const seats = await fetchCloudOfficerSeats(chapterId)
      if (cancelled || seats.length === 0) return
      // Merge server seats into local display; keep assignedMemberId from local until accounts map exists
      setPositions((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]))
        const next = seats.map((s) => {
          const local = byId.get(s.seatId)
          return withFunction({
            id: s.seatId,
            title: s.title,
            isCustom: !s.seatId.startsWith('pos-'),
            function: (s.function as OfficerFunction) || inferFunctionFromTitle(s.title),
            assignedMemberId: local?.assignedMemberId,
            description: local?.description,
          })
        })
        writePositions(next)
        return next
      })
    }
    void hydrateSeats()
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback((next: ChapterPosition[]) => {
    setPositions(next)
    writePositions(next)
  }, [])

  const addPosition = useCallback(
    (title: string, description?: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const id = uid()
      const fn = inferFunctionFromTitle(trimmed)
      persist([
        ...positions,
        {
          id,
          title: trimmed,
          description,
          isCustom: true,
          function: fn,
        },
      ])
      if (cloudChapterId) {
        void rpcAssignOfficerSeat({
          chapterId: cloudChapterId,
          seatId: id,
          memberUserId: null,
          title: trimmed,
          function: fn,
        })
      }
    },
    [positions, persist, cloudChapterId]
  )

  const removePosition = useCallback(
    (id: string) => {
      persist(positions.filter((p) => p.id !== id))
      if (cloudChapterId) void rpcRemoveOfficerSeat(cloudChapterId, id)
    },
    [positions, persist, cloudChapterId]
  )

  const assignPosition = useCallback(
    (positionId: string, memberId: string | undefined) => {
      const pos = positions.find((p) => p.id === positionId)
      persist(
        positions.map((p) =>
          p.id === positionId
            ? { ...p, assignedMemberId: memberId || undefined }
            : p
        )
      )
      if (cloudChapterId && pos) {
        // Resolve auth user id from local accounts storage when available
        let memberUserId: string | null = null
        try {
          const raw = localStorage.getItem('chapter-os-member-accounts')
          if (raw && memberId) {
            const accounts = JSON.parse(raw) as { userId: string; memberId: string }[]
            memberUserId = accounts.find((a) => a.memberId === memberId)?.userId ?? null
          }
        } catch {
          /* ignore */
        }
        void rpcAssignOfficerSeat({
          chapterId: cloudChapterId,
          seatId: positionId,
          memberUserId,
          title: pos.title,
          function: pos.function ?? inferFunctionFromTitle(pos.title),
        })
      }
    },
    [positions, persist, cloudChapterId]
  )

  const updatePosition = useCallback(
    (id: string, patch: Partial<ChapterPosition>) => {
      const next = positions.map((p) => (p.id === id ? { ...p, ...patch } : p))
      persist(next)
      const pos = next.find((p) => p.id === id)
      if (cloudChapterId && pos) {
        let memberUserId: string | null = null
        try {
          const raw = localStorage.getItem('chapter-os-member-accounts')
          if (raw && pos.assignedMemberId) {
            const accounts = JSON.parse(raw) as { userId: string; memberId: string }[]
            memberUserId =
              accounts.find((a) => a.memberId === pos.assignedMemberId)?.userId ?? null
          }
        } catch {
          /* ignore */
        }
        void rpcAssignOfficerSeat({
          chapterId: cloudChapterId,
          seatId: id,
          memberUserId,
          title: pos.title,
          function: pos.function ?? inferFunctionFromTitle(pos.title),
        })
      }
    },
    [positions, persist, cloudChapterId]
  )

  const value = useMemo(
    () => ({
      positions,
      addPosition,
      removePosition,
      assignPosition,
      updatePosition,
    }),
    [positions, addPosition, removePosition, assignPosition, updatePosition]
  )

  return (
    <ChapterPositionsContext.Provider value={value}>{children}</ChapterPositionsContext.Provider>
  )
}

export function useChapterPositions(): ChapterPositionsContextValue {
  const ctx = useContext(ChapterPositionsContext)
  if (!ctx) throw new Error('useChapterPositions must be used within ChapterPositionsProvider')
  return ctx
}
