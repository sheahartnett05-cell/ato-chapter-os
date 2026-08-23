import { members } from './mockData'
import type {
  Committee,
  CommitteeTask,
  Fine,
  FineScheduleRule,
  GovernanceConfig,
  GroupAnnouncement,
  JBoardCase,
} from '../types/governance'

export const CURRENT_EXEC_ID = 'm1'

export const governanceConfig: GovernanceConfig = {
  jBoardChairId: 'm2',
  standardsChairId: 'm2',
  jBoardMemberIds: ['m1', 'm2', 'm4'],
  casesHiddenFromMembers: true,
}

export const fineSchedule: FineScheduleRule[] = [
  { id: 'fs1', label: 'Missed Chapter', amount: 50, category: 'Unexcused Absence' },
  { id: 'fs2', label: 'Late Dues', amount: 25, category: 'Conduct' },
  { id: 'fs3', label: 'Clean Up No-Show', amount: 100, category: 'Property Damage' },
  { id: 'fs4', label: 'Risk Violation', amount: 75, category: 'Risk Violation' },
]

export const jBoardCases: JBoardCase[] = [
  {
    id: 'jc1',
    memberId: 'm5',
    incidentDate: '2025-08-18',
    category: 'Unexcused Absence',
    description: 'Missed required chapter meeting Aug 18',
    status: 'Resolved',
    sanctionType: 'Fine',
    fineAmount: 25,
    evidenceUrls: [],
  },
  {
    id: 'jc2',
    memberId: 'm6',
    incidentDate: '2025-08-20',
    category: 'Conduct',
    description: 'Disruptive behavior at philanthropy event',
    status: 'Hearing Scheduled',
    sanctionType: 'Probation',
    fineAmount: 0,
    evidenceUrls: [],
    hearingDate: '2025-08-28T19:00:00',
  },
  {
    id: 'jc3',
    memberId: 'm8',
    incidentDate: '2025-08-22',
    category: 'Unexcused Absence',
    description: 'No-show work day Aug 22',
    status: 'Pending',
    sanctionType: 'Fine',
    fineAmount: 50,
    evidenceUrls: [],
  },
  {
    id: 'jc4',
    memberId: 'm5',
    incidentDate: '2025-08-21',
    category: 'Risk Violation',
    description: 'Unauthorized guest at chapter house',
    status: 'Pending',
    sanctionType: 'Fine',
    fineAmount: 75,
    evidenceUrls: [],
    appealSubmitted: false,
  },
]

export const fines: Fine[] = [
  {
    id: 'f1',
    memberId: 'm5',
    caseId: 'jc1',
    amount: 25,
    reason: 'Unexcused Absence — Chapter Aug 18',
    dateIssued: '2025-08-19',
    dueDate: '2025-09-01',
    status: 'Unpaid',
  },
  {
    id: 'f2',
    memberId: 'm5',
    caseId: 'jc4',
    amount: 75,
    reason: 'Risk Violation — Unauthorized guest',
    dateIssued: '2025-08-22',
    dueDate: '2025-09-05',
    status: 'Unpaid',
  },
  {
    id: 'f3',
    memberId: 'm8',
    caseId: 'jc3',
    amount: 50,
    reason: 'Unexcused Absence — Work day',
    dateIssued: '2025-08-23',
    dueDate: '2025-09-01',
    status: 'Unpaid',
  },
  {
    id: 'f4',
    memberId: 'm6',
    amount: 25,
    reason: 'Late Dues — August',
    dateIssued: '2025-08-15',
    dueDate: '2025-08-30',
    status: 'Appealed',
  },
  {
    id: 'f5',
    memberId: 'm5',
    amount: 15,
    reason: 'House cleanup no-show',
    dateIssued: '2025-08-10',
    dueDate: '2025-08-20',
    status: 'Paid',
  },
]

export const committees: Committee[] = [
  {
    id: 'c-jboard',
    name: 'Judicial Board',
    description: 'Standards & accountability',
    chairId: 'm2',
    memberIds: ['m1', 'm2', 'm4'],
    isPrivate: true,
    color: '#64748b',
  },
  {
    id: 'c-rush',
    name: 'Rush Team',
    description: 'Recruitment operations',
    chairId: 'm4',
    memberIds: ['m4', 'm1', 'm2', 'm9', 'm7'],
    isPrivate: false,
    color: 'var(--accent)',
  },
  {
    id: 'c-formal',
    name: 'Formal Committee',
    description: 'Fall formal planning',
    chairId: 'm2',
    memberIds: ['m2', 'm3', 'm5', 'm9'],
    isPrivate: false,
    color: '#a855f7',
  },
  {
    id: 'c-phil',
    name: 'Philanthropy',
    description: 'Service & fundraising',
    chairId: 'm5',
    memberIds: ['m5', 'm6', 'm8', 'm3'],
    isPrivate: false,
    color: '#22c55e',
  },
  {
    id: 'c-social',
    name: 'Social Committee',
    description: 'Events & mixers',
    chairId: 'm2',
    memberIds: ['m2', 'm4', 'm7', 'm9'],
    isPrivate: false,
    color: '#f59e0b',
  },
]

export const groupAnnouncements: GroupAnnouncement[] = [
  {
    id: 'ga1',
    committeeId: 'c-jboard',
    authorId: 'm2',
    title: 'Hearing Aug 28 — Room B',
    body: 'Derek Nguyen case · 7 PM',
    timestamp: '2025-08-23T10:00:00',
    isUrgent: true,
  },
  {
    id: 'ga2',
    committeeId: 'c-rush',
    authorId: 'm4',
    title: 'Cookout setup 4:30 PM',
    body: 'Arrive early · polos required',
    timestamp: '2025-08-22T14:00:00',
    isUrgent: false,
  },
  {
    id: 'ga3',
    committeeId: 'c-formal',
    authorId: 'm2',
    title: 'Venue deposit due Aug 26',
    body: '$500 to hotel · Tyler collecting',
    timestamp: '2025-08-21T09:00:00',
    isUrgent: true,
  },
  {
    id: 'ga4',
    committeeId: 'c-phil',
    authorId: 'm5',
    title: 'Habitat signup open',
    body: 'Sep 6 · 8 AM departure',
    timestamp: '2025-08-20T11:00:00',
    isUrgent: false,
  },
]

export const committeeTasks: CommitteeTask[] = [
  {
    id: 'ct1',
    committeeId: 'c-formal',
    title: 'Confirm venue contract',
    assigneeId: 'm2',
    progress: 80,
    dueDate: '2025-08-26',
  },
  {
    id: 'ct2',
    committeeId: 'c-formal',
    title: 'Guest ticket sales',
    assigneeId: 'm3',
    progress: 45,
    dueDate: '2025-08-30',
  },
  {
    id: 'ct3',
    committeeId: 'c-rush',
    title: 'PNM follow-up calls',
    assigneeId: 'm4',
    progress: 60,
  },
  {
    id: 'ct4',
    committeeId: 'c-jboard',
    title: 'Review pending cases',
    assigneeId: 'm2',
    progress: 30,
    dueDate: '2025-08-25',
  },
]

export function getCommittee(id: string): Committee | undefined {
  return committees.find((c) => c.id === id)
}

export function isJBoardMember(memberId: string): boolean {
  return governanceConfig.jBoardMemberIds.includes(memberId)
}

export function isExecMember(memberId: string): boolean {
  return members.find((m) => m.id === memberId)?.isExec ?? false
}

export function canViewAllCases(viewerId: string): boolean {
  return isJBoardMember(viewerId) || isExecMember(viewerId)
}
