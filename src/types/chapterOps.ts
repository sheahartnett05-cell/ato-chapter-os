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
