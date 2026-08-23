export type {
  Announcement,
  ChapterPosition,
  ExecSlide,
  ExcuseStatus,
  LibraryHoursEntry,
  RsvpExcuse,
} from './features'

export type {
  JBoardCase,
  JBoardCategory,
  JBoardCaseStatus,
  SanctionType,
  Fine,
  FineStatus,
  Committee,
  GroupAnnouncement,
  CommitteeTask,
  FineScheduleRule,
  GovernanceConfig,
} from './governance'

export type {
  OrgType,
  MemberSingular,
  MemberPlural,
  RecruitmentTerm,
  CandidateTerm,
  LanguagePack,
  OrgTheme,
  OrganizationChapter,
} from './theme'

export type MemberStatus = 'Active' | 'New Member' | 'Alumni' | 'Inactive'
export type DuesStatus = 'Paid' | 'Partially Paid' | 'Outstanding' | 'Overdue'
export type PipelineStage =
  | 'New'
  | 'Contacted'
  | 'Met'
  | 'Interested'
  | 'Invited'
  | 'Bid'
  | 'Accepted'
  | 'New Member'

export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  major: string
  graduationYear: number
  pledgeClass: string
  status: MemberStatus
  isExec: boolean
  role?: string
  big?: string
  little?: string
  birthday: string
  shirtSize: string
  emergencyContact: string
  emergencyPhone: string
  duesStatus: DuesStatus
  duesPaid: number
  duesExpected: number
  attendancePct: number
  points: number
  committee?: string
  avatar: string
  /** Data URL or remote URL for profile photo */
  photoUrl?: string
}

export interface Event {
  id: string
  name: string
  type: string
  date: string
  time: string
  location: string
  description: string
  required: boolean
  points: number
  dressCode: string
  rsvpRequired: boolean
  guestAllowed: boolean
}

export interface RsvpEntry {
  memberId: string
  status: 'Going' | 'Not Going'
  guest?: string
  excuseId?: string
}

export interface AttendanceEntry {
  memberId: string
  status: 'Present' | 'Excused' | 'Absent'
  pointsEarned: number
}

export interface Prospect {
  id: string
  firstName: string
  lastName: string
  status: PipelineStage
  rating: number
  assignedBrother: string
  major: string
  graduationYear: number
  phone: string
  email: string
  instagram: string
  hometown: string
  source: string
  lastContact: string
  nextFollowUp: string
  interests: string[]
  notes: string
  avatar: string
  photoUrl?: string
  templateId?: string
  customFields?: Record<string, string | boolean | number>
}

export interface ActivityItem {
  id: string
  date: string
  type: string
  description: string
  author: string
}

export interface TableColumn {
  id: string
  name: string
  type: 'text' | 'dropdown' | 'checkbox' | 'date' | 'number' | 'member'
  /** Dropdown options when type is dropdown */
  options?: string[]
}

export interface TableRow {
  id: string
  /** Links row to roster for guest-list sync */
  memberId?: string
  cells: Record<string, string | boolean | number>
}

/** Event-linked spreadsheet form (chapter builder style) */
export interface ChapterTableForm {
  id: string
  name: string
  description: string
  eventId: string
  templateId: string
  columns: TableColumn[]
  rows: TableRow[]
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  type: 'dues' | 'attendance' | 'task' | 'recruitment'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  link?: string
}
