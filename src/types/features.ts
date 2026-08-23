export type ExcuseStatus = 'pending' | 'approved' | 'denied'

export type PostKind = 'announcement' | 'poll' | 'signup'

export interface PollOption {
  id: string
  label: string
  voteCount: number
}

export interface ChapterPoll {
  question: string
  options: PollOption[]
  closesAt?: string
  allowMultiple: boolean
  /** memberId → selected option ids */
  voterIds: Record<string, string[]>
}

export interface SignupSlot {
  id: string
  label: string
  capacity: number
  memberIds: string[]
}

export interface ChapterSignup {
  slots: SignupSlot[]
  closesAt?: string
}

export interface Announcement {
  id: string
  kind: PostKind
  title: string
  body: string
  author: string
  authorRole: string
  createdAt: string
  pinned?: boolean
  poll?: ChapterPoll
  signup?: ChapterSignup
}

export interface AnnouncementTemplate {
  id: string
  name: string
  category: 'meeting' | 'event' | 'dues' | 'recruitment' | 'general' | 'poll' | 'signup'
  title: string
  body: string
  /** Prefill poll question + options for poll templates */
  pollQuestion?: string
  pollOptions?: string[]
  signupSlots?: string[]
}

export interface ExecSlide {
  id: string
  position: string
  title: string
  description: string
  responsibilities: string[]
  /** Markdown-ish bullet content for the slide deck */
  talkingPoints: string[]
}

export interface ChapterPosition {
  id: string
  title: string
  description?: string
  assignedMemberId?: string
  isCustom: boolean
}

export interface RsvpExcuse {
  id: string
  eventId: string
  memberId: string
  reason: string
  status: ExcuseStatus
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface LibraryHoursEntry {
  id: string
  memberId: string
  date: string
  hours: number
  location: string
  notes?: string
  verified: boolean
}

export interface RsvpEntry {
  memberId: string
  status: 'Going' | 'Not Going'
  guest?: string
  excuseId?: string
}
