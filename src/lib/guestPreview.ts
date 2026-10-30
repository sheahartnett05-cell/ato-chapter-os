import type { OnboardingData, UserRole } from '../types/permissions'
import type { OfficerFunction } from '../types/officerFunction'
import { officerFunctionLabel } from '../types/officerFunction'

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

/** Exec preview keyed by dashboard function (not display title). */
export type GuestExecFunctionPreset = {
  function: OfficerFunction
  role: UserRole
  memberId: string
  label: string
  hint: string
}

export const GUEST_EXEC_FUNCTION_PRESETS: GuestExecFunctionPreset[] = [
  {
    function: 'president',
    role: 'President',
    memberId: 'm1',
    label: 'President',
    hint: 'Next event, attendance, dues, action items',
  },
  {
    function: 'treasurer',
    role: 'Treasurer',
    memberId: 'm3',
    label: 'Treasurer',
    hint: 'Dues, budget, excuses',
  },
  {
    function: 'secretary',
    role: 'ActiveMember',
    memberId: 'm9',
    label: 'Secretary',
    hint: 'Minutes, roster changes, attendance',
  },
  {
    function: 'internal_vp_standards',
    role: 'JBoardChair',
    memberId: 'm7',
    label: 'Standards / VP',
    hint: 'Good standing, cases, absences',
  },
  {
    function: 'recruitment',
    role: 'RecruitmentChair',
    memberId: 'm4',
    label: officerFunctionLabel('recruitment'),
    hint: 'Rush pipeline, PNMs, events',
  },
  {
    function: 'scholarship',
    role: 'ScholarshipChair',
    memberId: 'm5',
    label: 'Scholarship',
    hint: 'Study hours, attendance',
  },
  {
    function: 'new_member_educator',
    role: 'ActiveMember',
    memberId: 'm10',
    label: 'New member educator',
    hint: 'NM class progress, requirements',
  },
  {
    function: 'house',
    role: 'ActiveMember',
    memberId: 'm2',
    label: 'House manager',
    hint: 'Maintenance, chores, bills',
  },
  {
    function: 'other',
    role: 'ActiveMember',
    memberId: 'm2',
    label: 'Other exec (VP)',
    hint: 'Default officer dashboard',
  },
]

export const GUEST_CHAPTER = {
  /** Neutral product brand until a real chapter is chosen in onboarding */
  orgId: 'chaptera',
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
