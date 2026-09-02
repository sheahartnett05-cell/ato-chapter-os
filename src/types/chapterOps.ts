/** Study-hour locations managed by Scholarship Chair */
export interface StudyLocation {
  id: string
  name: string
  address?: string
  active: boolean
}

export interface StudyHoursLog {
  id: string
  memberId: string
  date: string
  hours: number
  locationId: string
  notes?: string
  verified: boolean
  rejected?: boolean
}

export type StudyHoursResetFrequency = 'weekly' | 'monthly' | 'semester'

export interface StudyHoursResetConfig {
  frequency: StudyHoursResetFrequency
  /** 0=Sun … 6=Sat when weekly; 1–28 when monthly */
  resetDay: number
  /** 24h HH:mm */
  resetTime: string
}

export type StudyHoursAssignmentMode = 'all' | 'custom'

/** Chapter-wide study hour requirements — same for everyone or per member. */
export interface StudyHoursRequirementsConfig {
  mode: StudyHoursAssignmentMode
  /** Hours each member must complete when mode is `all`. */
  defaultHours: number
  /** Per-member hours when mode is `custom`; members not listed are exempt. */
  memberHours: Record<string, number>
}

export type DuesPaymentStatus = 'Open' | 'Partial' | 'Paid' | 'Waived'

export interface DuesCharge {
  id: string
  label: string
  amount: number
  dueDate: string
  semester: string
  /** Empty = all active members */
  assignedMemberIds: string[]
  createdAt: string
}

export interface DuesPayment {
  id: string
  chargeId: string
  memberId: string
  amountPaid: number
  status: DuesPaymentStatus
  paidAt?: string
  method?: 'BillHighway' | 'Cash' | 'Check' | 'Other'
}

export interface BillHighwayConfig {
  enabled: boolean
  payUrl: string
  chapterCode: string
  lastSyncedAt?: string
}
