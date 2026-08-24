import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getPermissions,
  type OnboardingData,
  type PermissionFlags,
  type UserProfile,
  type UserRole,
} from '../types/permissions'
import { useChapterFeaturesOptional } from './ChapterFeaturesContext'
import type { EditorCapabilityId } from '../types/chapterFeatures'

const STORAGE_KEY = 'chapter-os-onboarding'

const DEFAULT_PROFILE: UserProfile = {
  firstName: '',
  lastName: '',
  phone: '',
  graduationYear: new Date().getFullYear() + 1,
  avatar: '',
}

function readOnboarding(): OnboardingData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OnboardingData & {
      chapterDesignation?: string
      university?: string
    }
    if (!parsed.completed) return null
    return {
      ...parsed,
      chapterDesignation: parsed.chapterDesignation ?? '',
      university: parsed.university ?? '',
    }
  } catch {
    return null
  }
}

function writeOnboarding(data: OnboardingData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable */
  }
}

import { markGuestPreview } from '../lib/guestPreview'
import { clearDemoData } from '../lib/demoSeed'

function clearOnboardingStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
  clearDemoData()
  markGuestPreview(false)
}

interface AuthContextValue {
  onboarding: OnboardingData | null
  isOnboarded: boolean
  profile: UserProfile
  role: UserRole | null
  memberId: string | null
  userId: string | null
  permissions: PermissionFlags
  completeOnboarding: (data: Omit<OnboardingData, 'completed'>) => void
  updateProfile: (patch: Partial<UserProfile>) => void
  /** President (or self) can change the signed-in user's role */
  updateRole: (role: UserRole) => void
  resetOnboarding: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(readOnboarding)

  const completeOnboarding = useCallback(
    (data: Omit<OnboardingData, 'completed'>) => {
      const next: OnboardingData = { ...data, completed: true }
      writeOnboarding(next)
      setOnboarding(next)
    },
    []
  )

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setOnboarding((prev) => {
      if (!prev) return prev
      const next = { ...prev, profile: { ...prev.profile, ...patch } }
      writeOnboarding(next)
      return next
    })
  }, [])

  const updateRole = useCallback((role: UserRole) => {
    setOnboarding((prev) => {
      if (!prev) return prev
      const next = { ...prev, role }
      writeOnboarding(next)
      return next
    })
  }, [])

  const resetOnboarding = useCallback(() => {
    clearOnboardingStorage()
    setOnboarding(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const role = onboarding?.role ?? null
    const permissions = role
      ? getPermissions(role)
      : getPermissions('ActiveMember')

    return {
      onboarding,
      isOnboarded: onboarding?.completed === true,
      profile: onboarding?.profile ?? DEFAULT_PROFILE,
      role,
      memberId: onboarding?.memberId ?? null,
      userId: onboarding?.userId ?? null,
      permissions,
      completeOnboarding,
      updateProfile,
      updateRole,
      resetOnboarding,
    }
  }, [onboarding, completeOnboarding, updateProfile, updateRole, resetOnboarding])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Boolean capability flags for the active user's role, plus president-assigned editors */
export function usePermissions(): PermissionFlags {
  const { permissions, memberId, role } = useAuth()
  const features = useChapterFeaturesOptional()

  if (role === 'President' || !memberId || !features) return permissions

  const { canMemberEdit, isFeatureEnabled } = features

  const or = (flag: boolean, capability: EditorCapabilityId, featureOk = true) =>
    flag || (featureOk && canMemberEdit(capability, memberId))

  return {
    ...permissions,
    canPostAnnouncements: or(
      permissions.canPostAnnouncements,
      'editAnnouncements',
      isFeatureEnabled('announcements')
    ),
    canManageRoster: or(permissions.canManageRoster, 'editRoster', isFeatureEnabled('roster')),
    canManageRecruitment: or(
      permissions.canManageRecruitment,
      'editRecruitment',
      isFeatureEnabled('recruitment')
    ),
    canViewJBoardCases: or(
      permissions.canViewJBoardCases,
      'editStandards',
      isFeatureEnabled('standards')
    ),
    canAccessJBoardSettings: or(
      permissions.canAccessJBoardSettings,
      'editStandards',
      isFeatureEnabled('standards')
    ),
    canManageFines:
      or(permissions.canManageFines, 'editStandards', isFeatureEnabled('standards')) ||
      or(permissions.canManageFines, 'editDues', isFeatureEnabled('dues')),
    canAccessTreasurerSettings: or(
      permissions.canAccessTreasurerSettings,
      'editDues',
      isFeatureEnabled('dues')
    ),
    canManageBudgets: or(
      permissions.canManageBudgets,
      'editBudgets',
      isFeatureEnabled('budgets')
    ),
    canManageStudyLocations: or(
      permissions.canManageStudyLocations,
      'editStudyHours',
      isFeatureEnabled('studyHours')
    ),
    canVerifyStudyHours: or(
      permissions.canVerifyStudyHours,
      'editStudyHours',
      isFeatureEnabled('studyHours')
    ),
    canAccessExecTools:
      permissions.canAccessExecTools ||
      canMemberEdit('editCalendar', memberId) ||
      canMemberEdit('editHouse', memberId) ||
      canMemberEdit('editTables', memberId),
    canAccessAdminSettings:
      permissions.canAccessAdminSettings || canMemberEdit('editChapterSetup', memberId),
    canManageInvites: or(permissions.canManageInvites, 'manageInvites'),
  }
}
