import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_CHAPTER_POSITIONS } from '../data/featureData'
import { allowDemoData, STORAGE_KEYS } from '../lib/demoSeed'
import { writeJson } from '../lib/persist'
import type { ChapterPosition } from '../types/features'
import type { UserRole } from '../types/permissions'

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

function readPositions(): ChapterPosition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChapterPosition[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    /* ignore */
  }
  if (allowDemoData()) {
    return DEMO_CHAPTER_POSITIONS.map((p) => ({ ...p }))
  }
  return DEFAULT_POSITIONS.map((p) => ({ ...p }))
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

  const persist = useCallback((next: ChapterPosition[]) => {
    setPositions(next)
    writePositions(next)
  }, [])

  const addPosition = useCallback(
    (title: string, description?: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      persist([
        ...positions,
        {
          id: uid(),
          title: trimmed,
          description,
          isCustom: true,
        },
      ])
    },
    [positions, persist]
  )

  const removePosition = useCallback(
    (id: string) => {
      persist(positions.filter((p) => p.id !== id))
    },
    [positions, persist]
  )

  const assignPosition = useCallback(
    (positionId: string, memberId: string | undefined) => {
      persist(
        positions.map((p) =>
          p.id === positionId
            ? { ...p, assignedMemberId: memberId || undefined }
            : p
        )
      )
    },
    [positions, persist]
  )

  const updatePosition = useCallback(
    (id: string, patch: Partial<ChapterPosition>) => {
      persist(positions.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    [positions, persist]
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
