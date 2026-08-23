/** Standards & Accountability module setup (wizard output) */

export const MODULE_NAME_PRESETS = [
  'Judicial Board',
  'J-Board',
  'Standards',
  'Honor Board',
  'Ethics Committee',
] as const

export const STANDARDS_ADMIN_ROLE_OPTIONS = [
  'President',
  'VP of Standards',
  'Judicial Chair',
  'Risk Manager',
  'Chaplain',
  'Secretary',
  'Treasurer',
] as const

export type StandardsAdminRole = (typeof STANDARDS_ADMIN_ROLE_OPTIONS)[number]

export type InfractionPenaltyType = 'fine' | 'points' | 'both' | 'custom'

export const EXCUSE_CATEGORY_OPTIONS = [
  'Class/Exam Conflict',
  'Illness/Medical',
  'Work Shift',
  'Family Emergency',
  'Religious Obligation',
] as const

export type ExcuseCategory = (typeof EXCUSE_CATEGORY_OPTIONS)[number]

export const EXCUSE_LEAD_TIME_OPTIONS = [12, 24, 48, 72] as const
export const APPEAL_WINDOW_OPTIONS = [24, 48, 72, 168] as const

export interface FineMatrixItem {
  id: string
  title: string
  type: InfractionPenaltyType
  fine_amount: number
  point_penalty: number
  custom_penalty?: string
  is_active: boolean
}

export interface ExcusePolicy {
  lead_time_hours: number
  categories: string[]
  require_attachment: boolean
}

export interface AppealPolicy {
  window_hours: number
  auto_lock_fines: boolean
}

export interface StandardsConfig {
  custom_module_name: string
  admin_roles: string[]
  privacy_enabled: boolean
  fine_matrix: FineMatrixItem[]
  excuse_policy: ExcusePolicy
  appeal_policy: AppealPolicy
}

export interface StandardsConfigEnvelope {
  standards_config: StandardsConfig
}

export function defaultFineMatrix(): FineMatrixItem[] {
  return [
    {
      id: 'inf_01',
      title: 'Unexcused Chapter Absence',
      type: 'fine',
      fine_amount: 15,
      point_penalty: 0,
      is_active: true,
    },
    {
      id: 'inf_02',
      title: 'Unexcused Philanthropy Event Absence',
      type: 'fine',
      fine_amount: 25,
      point_penalty: 0,
      is_active: true,
    },
    {
      id: 'inf_03',
      title: 'Missed Sober Monitor Shift',
      type: 'fine',
      fine_amount: 50,
      point_penalty: 0,
      is_active: true,
    },
    {
      id: 'inf_04',
      title: 'Late Dues Payment (Weekly Penalty)',
      type: 'fine',
      fine_amount: 10,
      point_penalty: 0,
      is_active: true,
    },
    {
      id: 'inf_05',
      title: 'Unexcused Recruitment Event Absence',
      type: 'both',
      fine_amount: 30,
      point_penalty: 5,
      is_active: true,
    },
  ]
}

export function defaultStandardsConfig(): StandardsConfig {
  return {
    custom_module_name: 'Standards',
    admin_roles: ['President', 'VP of Standards', 'Judicial Chair'],
    privacy_enabled: true,
    fine_matrix: defaultFineMatrix(),
    excuse_policy: {
      lead_time_hours: 24,
      categories: [
        'Class/Exam Conflict',
        'Illness/Medical',
        'Work Shift',
        'Family Emergency',
        'Religious Obligation',
      ],
      require_attachment: true,
    },
    appeal_policy: {
      window_hours: 48,
      auto_lock_fines: true,
    },
  }
}

export function toStandardsEnvelope(config: StandardsConfig): StandardsConfigEnvelope {
  return { standards_config: config }
}

export function penaltyTypeLabel(type: InfractionPenaltyType): string {
  switch (type) {
    case 'fine':
      return 'Fine'
    case 'points':
      return 'Points'
    case 'both':
      return 'Both'
    case 'custom':
      return 'Custom'
  }
}

export function nextInfractionId(existing: FineMatrixItem[]): string {
  const n = existing.length + 1
  return `inf_${String(n).padStart(2, '0')}`
}
