/** Claimable positions during onboarding */
export type UserRole =
  | 'President'
  | 'Treasurer'
  | 'JBoardChair'
  | 'RecruitmentChair'
  | 'ScholarshipChair'
  | 'ActiveMember'
  | 'NewMember'

/** Extended roles referenced in permission matrix (assigned by President) */
export type AssignableRole = UserRole | 'VicePresident' | 'Secretary'

export interface UserProfile {
  firstName: string
  lastName: string
  phone: string
  graduationYear: number
  avatar: string
}

export interface OnboardingData {
  completed: boolean
  profile: UserProfile
  orgId: string
  chapterDesignation: string
  university: string
  role: UserRole
  memberId: string
  userId: string
  inviteCodeId: string
}

export interface PermissionFlags {
  canManageFines: boolean
  canViewJBoardCases: boolean
  canManageRecruitment: boolean
  canPostAnnouncements: boolean
  canManageRoster: boolean
  canManageInvites: boolean
  canAccessTreasurerSettings: boolean
  canAccessJBoardSettings: boolean
  canAccessAdminSettings: boolean
  canAccessExecTools: boolean
  canManageStudyLocations: boolean
  canVerifyStudyHours: boolean
  canEditEventPoints: boolean
  isMemberView: boolean
}

const EXEC_OFFICERS: AssignableRole[] = [
  'President',
  'VicePresident',
  'Treasurer',
  'Secretary',
  'JBoardChair',
  'RecruitmentChair',
  'ScholarshipChair',
]

export const ONBOARDING_ROLES: { id: UserRole; label: string }[] = [
  { id: 'President', label: 'President' },
  { id: 'Treasurer', label: 'Treasurer' },
  { id: 'JBoardChair', label: 'J-Board Chair' },
  { id: 'RecruitmentChair', label: 'Recruitment Chair' },
  { id: 'ScholarshipChair', label: 'Scholarship Chair' },
  { id: 'ActiveMember', label: 'Active Member' },
  { id: 'NewMember', label: 'New Member' },
]

export function getPermissions(role: UserRole): PermissionFlags {
  const isExec = EXEC_OFFICERS.includes(role as AssignableRole)

  return {
    canManageFines: ['President', 'Treasurer', 'JBoardChair'].includes(role),
    canViewJBoardCases: ['President', 'JBoardChair', 'VicePresident'].includes(role),
    canManageRecruitment: ['President', 'RecruitmentChair'].includes(role),
    canPostAnnouncements: isExec,
    canManageRoster: ['President', 'VicePresident', 'Secretary'].includes(role),
    canManageInvites: ['President', 'VicePresident', 'Secretary'].includes(role),
    canAccessTreasurerSettings: role === 'Treasurer' || role === 'President',
    canAccessJBoardSettings: role === 'JBoardChair' || role === 'President',
    canAccessAdminSettings: role === 'President',
    canAccessExecTools: isExec,
    canManageStudyLocations: role === 'ScholarshipChair' || role === 'President',
    canVerifyStudyHours:
      role === 'ScholarshipChair' ||
      role === 'President' ||
      (role as AssignableRole) === 'Secretary',
    canEditEventPoints: isExec,
    isMemberView: role === 'ActiveMember' || role === 'NewMember',
  }
}

export function roleLabel(role: UserRole): string {
  return ONBOARDING_ROLES.find((r) => r.id === role)?.label ?? role
}
