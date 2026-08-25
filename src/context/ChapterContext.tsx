import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_ORG_ID,
  NATIONAL_ORGS,
  buildOrganizationChapter,
  getNationalOrgById,
} from '../data/nationalOrgs'
import {
  readOnboardingChapterMeta,
  readOnboardingOrgId,
} from '../lib/onboardingStorage'
import { writeJson } from '../lib/persist'
import {
  contrastText,
  darkenHex,
  effectiveAccent,
  effectiveAccentText,
  lightenHex,
} from '../lib/themeUtils'
import type { LanguagePack, OrganizationChapter } from '../types/theme'

const STORAGE_KEY = 'chapter-os-selected-org'
const ONBOARDING_KEY = 'chapter-os-onboarding'

interface ChapterMeta {
  chapterDesignation: string
  university: string
}

interface ChapterContextValue {
  chapter: OrganizationChapter
  languagePack: LanguagePack
  orgDirectory: typeof NATIONAL_ORGS
  selectedOrgId: string
  setSelectedOrg: (id: string) => void
  setChapterMeta: (meta: ChapterMeta) => void
  /** Persist chapter designation / university (president settings) */
  saveChapterMeta: (meta: ChapterMeta) => void
}

const ChapterContext = createContext<ChapterContextValue | null>(null)

function readOnboardingMeta(): ChapterMeta {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    if (!raw) return { chapterDesignation: '', university: '' }
    const parsed = JSON.parse(raw) as {
      chapterDesignation?: string
      university?: string
    }
    return {
      chapterDesignation: parsed.chapterDesignation ?? '',
      university: parsed.university ?? '',
    }
  } catch {
    return { chapterDesignation: '', university: '' }
  }
}

function readStoredOrgId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      const id = typeof parsed === 'string' ? parsed : raw
      if (typeof id === 'string' && getNationalOrgById(id)) return getNationalOrgById(id)!.id
    }
  } catch {
    /* ignore */
  }
  const fromOnboarding = readOnboardingOrgId()
  if (fromOnboarding && getNationalOrgById(fromOnboarding)) {
    return getNationalOrgById(fromOnboarding)!.id
  }
  return DEFAULT_ORG_ID
}

function readInitialChapterMeta(): ChapterMeta {
  try {
    const raw = localStorage.getItem('chapter-os-chapter-meta')
    if (raw) {
      const parsed = JSON.parse(raw) as ChapterMeta
      if (parsed.chapterDesignation || parsed.university) return parsed
    }
  } catch {
    /* ignore */
  }
  const fromOnboarding = readOnboardingChapterMeta()
  if (fromOnboarding.chapterDesignation || fromOnboarding.university) {
    return fromOnboarding
  }
  return readOnboardingMeta()
}

function applyThemeCssVariables(org: OrganizationChapter) {
  const root = document.documentElement
  const { primaryColor, secondaryColor, accentColor, id } = org

  const accent = effectiveAccent(primaryColor, secondaryColor, accentColor)
  const accentFg = effectiveAccentText(primaryColor, secondaryColor, accentColor)
  const primaryFg = contrastText(primaryColor)
  const secondaryFg = contrastText(secondaryColor)

  root.style.setProperty('--primary', primaryColor)
  root.style.setProperty('--secondary', secondaryColor)
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-raw', accentColor)

  root.style.setProperty('--primary-foreground', primaryFg)
  root.style.setProperty('--secondary-foreground', secondaryFg)
  root.style.setProperty('--accent-foreground', accentFg)

  root.style.setProperty('--brand-primary', primaryColor)
  root.style.setProperty('--brand-secondary', secondaryColor)
  root.style.setProperty('--brand-accent', accent)
  root.style.setProperty('--brand-muted', lightenHex(primaryColor, 0.15))
  root.style.setProperty('--brand-accent-light', lightenHex(accent, 0.2))
  root.style.setProperty('--brand-accent-dark', darkenHex(accent, 0.12))

  root.style.setProperty('--color-primary', primaryColor)
  root.style.setProperty('--color-secondary', secondaryColor)
  root.style.setProperty('--color-accent', accent)

  root.style.setProperty('--surface-tint', lightenHex(primaryColor, 0.94))
  root.style.setProperty('--surface-card', '#faf9f7')
  root.style.setProperty('--accent-subtle', `${accent}18`)
  root.style.setProperty('--primary-subtle', `${primaryColor}10`)
  root.style.setProperty('--rule', 'rgb(0 0 0 / 0.12)')
  root.style.setProperty('--ink', '#141414')
  root.style.setProperty('--muted', '#6b6b6b')

  root.setAttribute('data-org', id)
  document.body.style.backgroundColor = lightenHex(primaryColor, 0.96)
  document.title = org.id === 'agora' || org.id === 'chapter-os' ? 'Agora' : `${org.nickname} · ${org.orgName}`
}

export function ChapterProvider({ children }: { children: ReactNode }) {
  const [selectedOrgId, setSelectedOrgIdState] = useState(readStoredOrgId)
  const [chapterMeta, setChapterMetaState] = useState<ChapterMeta>(readInitialChapterMeta)

  const nationalOrg = getNationalOrgById(selectedOrgId) ?? NATIONAL_ORGS[0]
  const chapter = buildOrganizationChapter(
    nationalOrg,
    chapterMeta.chapterDesignation || 'Chapter',
    chapterMeta.university || 'Your University'
  )

  const setSelectedOrg = useCallback((id: string) => {
    const org = getNationalOrgById(id)
    if (!org) return
    setSelectedOrgIdState(org.id)
    writeJson(STORAGE_KEY, org.id)
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        if (parsed.completed === true) {
          writeJson(ONBOARDING_KEY, { ...parsed, orgId: org.id })
        }
      }
    } catch {
      /* storage unavailable */
    }
  }, [])

  const setChapterMeta = useCallback((meta: ChapterMeta) => {
    setChapterMetaState(meta)
  }, [])

  const saveChapterMeta = useCallback((meta: ChapterMeta) => {
    setChapterMetaState(meta)
    writeJson('chapter-os-chapter-meta', meta)
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        writeJson(ONBOARDING_KEY, {
          ...parsed,
          chapterDesignation: meta.chapterDesignation,
          university: meta.university,
        })
      }
    } catch {
      /* storage unavailable */
    }
  }, [])

  useEffect(() => {
    applyThemeCssVariables(chapter)
  }, [chapter])

  const value = useMemo<ChapterContextValue>(
    () => ({
      chapter,
      languagePack: chapter.languagePack,
      orgDirectory: NATIONAL_ORGS,
      selectedOrgId: chapter.id,
      setSelectedOrg,
      setChapterMeta,
      saveChapterMeta,
    }),
    [chapter, setSelectedOrg, setChapterMeta, saveChapterMeta]
  )

  return (
    <ChapterContext.Provider value={value}>{children}</ChapterContext.Provider>
  )
}

export function useChapter(): ChapterContextValue {
  const ctx = useContext(ChapterContext)
  if (!ctx) {
    throw new Error('useChapter must be used within a ChapterProvider')
  }
  return ctx
}
