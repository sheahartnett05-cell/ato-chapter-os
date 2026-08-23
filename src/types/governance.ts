export type JBoardCategory =
  | 'Unexcused Absence'
  | 'Conduct'
  | 'Property Damage'
  | 'Risk Violation'

export type JBoardCaseStatus =
  | 'Pending'
  | 'Hearing Scheduled'
  | 'Resolved'
  | 'Dismissed'

export type SanctionType =
  | 'Fine'
  | 'Probation'
  | 'Social Suspension'
  | 'Community Service'

export type FineStatus = 'Unpaid' | 'Paid' | 'Waived' | 'Appealed'

export interface JBoardCase {
  id: string
  memberId: string
  incidentDate: string
  category: JBoardCategory
  description: string
  status: JBoardCaseStatus
  sanctionType: SanctionType
  fineAmount: number
  evidenceUrls: string[]
  hearingDate?: string
  appealSubmitted?: boolean
}

export interface Fine {
  id: string
  memberId: string
  caseId?: string
  amount: number
  reason: string
  dateIssued: string
  dueDate: string
  status: FineStatus
}

export interface Committee {
  id: string
  name: string
  description: string
  chairId: string
  memberIds: string[]
  isPrivate: boolean
  color: string
}

export interface GroupAnnouncement {
  id: string
  committeeId: string
  authorId: string
  title: string
  body: string
  timestamp: string
  isUrgent: boolean
}

export interface CommitteeTask {
  id: string
  committeeId: string
  title: string
  assigneeId?: string
  progress: number
  dueDate?: string
}

export interface FineScheduleRule {
  id: string
  label: string
  amount: number
  category: JBoardCategory
}

export interface GovernanceConfig {
  jBoardChairId: string
  jBoardMemberIds: string[]
  casesHiddenFromMembers: boolean
  standardsChairId: string
}
