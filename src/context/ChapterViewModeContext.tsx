import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  defaultViewModeForViewport,
  readStoredViewMode,
  writeStoredViewMode,
  type ChapterViewMode,
} from '../lib/chapterViewMode'

interface ChapterViewModeContextValue {
  viewMode: ChapterViewMode
  setViewMode: (mode: ChapterViewMode) => void
  isChapterRoom: boolean
}

const ChapterViewModeContext = createContext<ChapterViewModeContextValue | null>(null)

export function ChapterViewModeProvider({ children }: { children: ReactNode }) {
  const { userId, onboarding } = useAuth()
  const resolvedUserId = userId ?? onboarding?.userId ?? 'local'

  const [viewMode, setViewModeState] = useState<ChapterViewMode>(() => {
    const stored = readStoredViewMode(resolvedUserId)
    return stored ?? defaultViewModeForViewport()
  })

  useEffect(() => {
    const stored = readStoredViewMode(resolvedUserId)
    if (stored) setViewModeState(stored)
    else setViewModeState(defaultViewModeForViewport())
  }, [resolvedUserId])

  const setViewMode = useCallback(
    (mode: ChapterViewMode) => {
      setViewModeState(mode)
      writeStoredViewMode(resolvedUserId, mode)
    },
    [resolvedUserId]
  )

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
      isChapterRoom: viewMode === 'chapter-room',
    }),
    [viewMode, setViewMode]
  )

  return (
    <ChapterViewModeContext.Provider value={value}>{children}</ChapterViewModeContext.Provider>
  )
}

export function useChapterViewMode(): ChapterViewModeContextValue {
  const ctx = useContext(ChapterViewModeContext)
  if (!ctx) {
    throw new Error('useChapterViewMode must be used within ChapterViewModeProvider')
  }
  return ctx
}
