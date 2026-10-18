import type { PermissionFlags } from '../../types/permissions'
import type { UserRole } from '../../types/permissions'

export type ModuleId =
  | 'calendar'
  | 'committees'
  | 'announcements'
  | 'dues'
  | 'studyHours'
  | 'roster'
  | 'recruitment'
  | 'standards'
  | 'budgets'
  | 'house'
  | 'settings'

export type AccessAction =
  | 'view'
  | 'edit'
  | 'create'
  | 'manageRoster'
  | 'manageBudgets'
  | 'verifyStudyHours'
  | 'postAnnouncements'
  | 'execTools'

export function userIsExecCapable(role: UserRole | null, permissions: PermissionFlags): boolean {
  if (!role) return false
  if (role === 'ActiveMember' || role === 'NewMember') {
    return permissions.canAccessExecTools
  }
  return permissions.canAccessExecTools
}

export function canAccessModule(
  role: UserRole | null,
  permissions: PermissionFlags,
  action: AccessAction,
  _module: ModuleId
): boolean {
  switch (action) {
    case 'execTools':
      return userIsExecCapable(role, permissions)
    case 'manageRoster':
      return permissions.canManageRoster
    case 'manageBudgets':
      return permissions.canManageBudgets
    case 'verifyStudyHours':
      return permissions.canVerifyStudyHours
    case 'postAnnouncements':
      return permissions.canPostAnnouncements
    case 'edit':
    case 'create':
      return userIsExecCapable(role, permissions)
    case 'view':
    default:
      return true
  }
}
