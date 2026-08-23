import type { UserRole } from '../types/permissions'

const STORAGE_KEY = 'chapter-os-onboarding'

function parseStoredOnboarding(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Sync read — avoids auth state lag right after onboarding finish */
export function isOnboardingCompleteInStorage(): boolean {
  const parsed = parseStoredOnboarding()
  return parsed?.completed === true
}

export function readOnboardingOrgId(): string | null {
  const parsed = parseStoredOnboarding()
  if (!parsed || parsed.completed !== true || typeof parsed.orgId !== 'string') return null
  return parsed.orgId
}

export function readOnboardingRole(): UserRole | null {
  const parsed = parseStoredOnboarding()
  if (!parsed || typeof parsed.role !== 'string') return null
  return parsed.role as UserRole
}

export function readOnboardingChapterMeta(): {
  chapterDesignation: string
  university: string
} {
  const parsed = parseStoredOnboarding()
  if (!parsed) return { chapterDesignation: '', university: '' }
  return {
    chapterDesignation:
      typeof parsed.chapterDesignation === 'string' ? parsed.chapterDesignation : '',
    university: typeof parsed.university === 'string' ? parsed.university : '',
  }
}

export function defaultHomePath(): '/home' | '/my-dashboard' {
  const role = readOnboardingRole()
  if (role === 'ActiveMember' || role === 'NewMember') return '/my-dashboard'
  return '/home'
}

export function readOnboardingMemberId(): string | null {
  const parsed = parseStoredOnboarding()
  if (!parsed || typeof parsed.memberId !== 'string') return null
  return parsed.memberId
}

export function readOnboardingUserId(): string | null {
  const parsed = parseStoredOnboarding()
  if (!parsed || typeof parsed.userId !== 'string') return null
  return parsed.userId
}
