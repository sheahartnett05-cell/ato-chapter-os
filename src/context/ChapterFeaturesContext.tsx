import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STORAGE_KEYS } from '../lib/demoSeed'
import {
  CHAPTER_FEATURES,
  EDITOR_CAPABILITIES,
  defaultChapterFeaturesState,
  type ChapterFeatureId,
  type ChapterFeaturesState,
  type EditorCapabilityId,
} from '../types/chapterFeatures'

const STORAGE_KEY = STORAGE_KEYS.chapterFeatures

function readState(): ChapterFeaturesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChapterFeaturesState
      const base = defaultChapterFeaturesState()
      return {
        enabled: { ...base.enabled, ...parsed.enabled },
        editors: { ...base.editors, ...parsed.editors },
      }
    }
  } catch {
    /* ignore */
  }
  return defaultChapterFeaturesState()
}

function writeState(state: ChapterFeaturesState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

interface ChapterFeaturesContextValue {
  features: ChapterFeaturesState
  catalog: typeof CHAPTER_FEATURES
  editorCatalog: typeof EDITOR_CAPABILITIES
  isFeatureEnabled: (id: ChapterFeatureId) => boolean
  setFeatureEnabled: (id: ChapterFeatureId, enabled: boolean) => void
  getEditors: (capability: EditorCapabilityId) => string[]
  setEditors: (capability: EditorCapabilityId, memberIds: string[]) => void
  toggleEditor: (capability: EditorCapabilityId, memberId: string) => void
  canMemberEdit: (capability: EditorCapabilityId, memberId: string | null) => boolean
}

const ChapterFeaturesContext = createContext<ChapterFeaturesContextValue | null>(null)

export function ChapterFeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<ChapterFeaturesState>(readState)

  const persist = useCallback((next: ChapterFeaturesState) => {
    setFeatures(next)
    writeState(next)
  }, [])

  const isFeatureEnabled = useCallback(
    (id: ChapterFeatureId) => features.enabled[id] !== false,
    [features.enabled]
  )

  const setFeatureEnabled = useCallback(
    (id: ChapterFeatureId, enabled: boolean) => {
      persist({
        ...features,
        enabled: { ...features.enabled, [id]: enabled },
      })
    },
    [features, persist]
  )

  const getEditors = useCallback(
    (capability: EditorCapabilityId) => features.editors[capability] ?? [],
    [features.editors]
  )

  const setEditors = useCallback(
    (capability: EditorCapabilityId, memberIds: string[]) => {
      persist({
        ...features,
        editors: { ...features.editors, [capability]: [...new Set(memberIds)] },
      })
    },
    [features, persist]
  )

  const toggleEditor = useCallback(
    (capability: EditorCapabilityId, memberId: string) => {
      const current = features.editors[capability] ?? []
      const next = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
      setEditors(capability, next)
    },
    [features.editors, setEditors]
  )

  const canMemberEdit = useCallback(
    (capability: EditorCapabilityId, memberId: string | null) => {
      if (!memberId) return false
      const def = EDITOR_CAPABILITIES.find((c) => c.id === capability)
      if (def?.featureId && features.enabled[def.featureId] === false) return false
      return (features.editors[capability] ?? []).includes(memberId)
    },
    [features]
  )

  const value = useMemo(
    () => ({
      features,
      catalog: CHAPTER_FEATURES,
      editorCatalog: EDITOR_CAPABILITIES,
      isFeatureEnabled,
      setFeatureEnabled,
      getEditors,
      setEditors,
      toggleEditor,
      canMemberEdit,
    }),
    [
      features,
      isFeatureEnabled,
      setFeatureEnabled,
      getEditors,
      setEditors,
      toggleEditor,
      canMemberEdit,
    ]
  )

  return (
    <ChapterFeaturesContext.Provider value={value}>{children}</ChapterFeaturesContext.Provider>
  )
}

export function useChapterFeatures(): ChapterFeaturesContextValue {
  const ctx = useContext(ChapterFeaturesContext)
  if (!ctx) throw new Error('useChapterFeatures must be used within ChapterFeaturesProvider')
  return ctx
}

/** Safe for hooks that may run during HMR before the provider remounts */
export function useChapterFeaturesOptional(): ChapterFeaturesContextValue | null {
  return useContext(ChapterFeaturesContext)
}
