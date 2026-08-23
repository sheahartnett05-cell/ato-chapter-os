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
  status: 'Going' | 'Maybe' | 'Not Going'
  guest?: string
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
}

export interface TableRow {
  id: string
  cells: Record<string, string | boolean | number>
}

export interface ChapterTable {
  id: string
  name: string
  description: string
  columns: TableColumn[]
  rows: TableRow[]
}

export interface Alert {
  id: string
  type: 'dues' | 'attendance' | 'task' | 'recruitment'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  link?: string
}
