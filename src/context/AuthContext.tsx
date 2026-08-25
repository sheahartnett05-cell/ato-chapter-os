import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearDemoData } from '../lib/demoSeed'
import { setCachedCloudChapterId } from '../lib/chapterCloud'
import { markGuestPreview } from '../lib/guestPreview'
import { writeJson, removeJson } from '../lib/persist'
import { applyPositionBoost, positionPermissionBoost } from '../lib/positionPermissions'
import {
  getAuthEmail,
  getAuthUserId,
  isEmailVerified,
  requiresSupabaseAuth,
  sendEmailOtp,
  signOutSupabase,
  upsertSupabaseProfile,
  verifyEmailOtp,
} from '../lib/supabaseAuth'
import {
  isSupabaseSessionReady,
  subscribeSupabaseSession,
} from '../lib/supabaseSession'
import type { EditorCapabilityId } from '../types/chapterFeatures'
import {
  getPermissions,
  type OnboardingData,
  type PermissionFlags,
  type UserProfile,
  type UserRole,
} from '../types/permissions'
import { useChapterFeaturesOptional } from './ChapterFeaturesContext'
import { useChapterPositions } from './ChapterPositionsContext'

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
  writeJson(STORAGE_KEY, data)
}

function clearOnboardingStorage() {
  removeJson(STORAGE_KEY)
  clearDemoData()
  markGuestPreview(false)
  setCachedCloudChapterId(null)
}

interface AuthContextValue {
  onboarding: OnboardingData | null
  isOnboarded: boolean
  profile: UserProfile
  role: UserRole | null
  memberId: string | null
  userId: string | null
  permissions: PermissionFlags
  /** Supabase email OTP required when env is configured */
  requiresSupabaseAuth: boolean
  authEmail: string | null
  emailVerified: boolean
  authReady: boolean
  sendEmailOtp: (email: string) => Promise<{ ok: boolean; error?: string }>
  verifyEmailOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
  completeOnboarding: (data: Omit<OnboardingData, 'completed'>) => void
  updateProfile: (patch: Partial<UserProfile>) => void
  updateRole: (role: UserRole) => void
  resetOnboarding: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(readOnboarding)
  const [, tick] = useState(0)

  useEffect(() => subscribeSupabaseSession(() => tick((n) => n + 1)), [])

  const supabaseAuth = requiresSupabaseAuth()
  const authUserId = getAuthUserId()
  const authEmail = getAuthEmail()

  const completeOnboarding = useCallback(
    (data: Omit<OnboardingData, 'completed'>) => {
      const resolvedUserId = authUserId ?? data.userId
      const next: OnboardingData = { ...data, userId: resolvedUserId, completed: true }
      writeOnboarding(next)
      setOnboarding(next)
      void upsertSupabaseProfile({ ...next.profile, email: next.profile.email ?? authEmail ?? undefined })
    },
    [authUserId, authEmail]
  )

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setOnboarding((prev) => {
        if (!prev) return prev
        const next = { ...prev, profile: { ...prev.profile, ...patch } }
        writeOnboarding(next)
        void upsertSupabaseProfile({ ...next.profile, email: next.profile.email ?? authEmail ?? undefined })
        return next
      })
    },
    [authEmail]
  )

  const updateRole = useCallback((role: UserRole) => {
    setOnboarding((prev) => {
      if (!prev) return prev
      const next = { ...prev, role }
      writeOnboarding(next)
      return next
    })
  }, [])

  const resetOnboarding = useCallback(async () => {
    if (supabaseAuth) {
      try {
        const { wipeLocalAndLeaveCloudChapters } = await import('../lib/chapterCloud')
        await wipeLocalAndLeaveCloudChapters()
      } catch {
        /* ignore */
      }
      await signOutSupabase()
    }
    clearOnboardingStorage()
    setOnboarding(null)
  }, [supabaseAuth])

  const signOut = useCallback(async () => {
    await signOutSupabase()
    clearOnboardingStorage()
    setOnboarding(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const role = onboarding?.role ?? null
    const permissions = role ? getPermissions(role) : getPermissions('ActiveMember')
    const userId = authUserId ?? onboarding?.userId ?? null

    return {
      onboarding,
      isOnboarded: onboarding?.completed === true,
      profile: onboarding?.profile ?? DEFAULT_PROFILE,
      role,
      memberId: onboarding?.memberId ?? null,
      userId,
      permissions,
      requiresSupabaseAuth: supabaseAuth,
      authEmail,
      emailVerified: supabaseAuth ? isEmailVerified() : true,
      authReady: !supabaseAuth || isSupabaseSessionReady(),
      sendEmailOtp,
      verifyEmailOtp,
      signOut,
      completeOnboarding,
      updateProfile,
      updateRole,
      resetOnboarding,
    }
  }, [
    onboarding,
    authUserId,
    authEmail,
    supabaseAuth,
    completeOnboarding,
    updateProfile,
    updateRole,
    resetOnboarding,
    signOut,
  ])

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
  const { positions } = useChapterPositions()

  const boost =
    memberId && role !== 'President'
      ? positionPermissionBoost(memberId, positions)
      : null

  if (role === 'President') return permissions

  if (!memberId || !features) {
    return boost ? applyPositionBoost(permissions, boost) : permissions
  }

  const { canMemberEdit, isFeatureEnabled } = features

  const or = (flag: boolean, capability: EditorCapabilityId, featureOk = true) =>
    flag || (featureOk && canMemberEdit(capability, memberId))

  const merged: PermissionFlags = {
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
    canEditEventPoints:
      or(permissions.canEditEventPoints, 'editCalendar', isFeatureEnabled('calendar')),
    canAccessAdminSettings:
      permissions.canAccessAdminSettings || canMemberEdit('editChapterSetup', memberId),
    canManageInvites: or(permissions.canManageInvites, 'manageInvites'),
  }

  return boost ? applyPositionBoost(merged, boost) : merged
}
