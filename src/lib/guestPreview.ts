import type { OnboardingData, UserRole } from '../types/permissions'

export const GUEST_FLAG_KEY = 'chapter-os-guest-preview'

export type GuestPreviewMode = 'exec' | 'member'

export const GUEST_PRESETS: Record<
  GuestPreviewMode,
  {
    role: UserRole
    profile: OnboardingData['profile']
    home: '/home' | '/my-dashboard'
    label: string
  }
> = {
  exec: {
    role: 'President',
    profile: {
      firstName: 'Guest',
      lastName: 'Exec',
      phone: '(850) 555-0100',
      graduationYear: 2026,
      avatar: 'GE',
    },
    home: '/home',
    label: 'Exec preview',
  },
  member: {
    role: 'ActiveMember',
    profile: {
      firstName: 'Guest',
      lastName: 'Member',
      phone: '(850) 555-0101',
      graduationYear: 2027,
      avatar: 'GM',
    },
    home: '/my-dashboard',
    label: 'Member preview',
  },
}

export const GUEST_CHAPTER = {
  /** Neutral product brand until a real chapter is chosen in onboarding */
  orgId: 'agora',
  chapterDesignation: 'Sample Chapter',
  university: 'Demo University',
} as const

export function markGuestPreview(active: boolean) {
  try {
    if (active) localStorage.setItem(GUEST_FLAG_KEY, '1')
    else localStorage.removeItem(GUEST_FLAG_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function isGuestPreviewActive(): boolean {
  try {
    return localStorage.getItem(GUEST_FLAG_KEY) === '1'
  } catch {
    return false
  }
}
