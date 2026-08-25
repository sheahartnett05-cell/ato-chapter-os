import { isGuestPreviewActive } from '../lib/guestPreview'

function allowDemoData() {
  return isGuestPreviewActive()
}
import type {

  Announcement,

  ChapterPosition,

  ExecSlide,

  LibraryHoursEntry,

  RsvpExcuse,

} from '../types/features'

const DEMO_ANNOUNCEMENTS: Announcement[] = [

  {

    id: 'a1',

    kind: 'announcement',

    title: 'Chapter Meeting moved to 7 PM',

    body: 'Room change — we are in the main chapter room tonight. Business dress: chapter polo + khakis.',

    author: 'Marcus Chen',

    authorRole: 'President',

    createdAt: '2025-08-23T14:00:00',

    pinned: true,

  },

  {

    id: 'a2',

    kind: 'announcement',

    title: 'Fall Formal ticket deadline',

    body: 'Guest tickets close Friday at noon. Venmo the social chair with your name + guest count.',

    author: 'Tyler Brooks',

    authorRole: 'Social Chair',

    createdAt: '2025-08-22T10:30:00',

  },

  {

    id: 'a3',

    kind: 'announcement',

    title: 'Scholarship hours due Sunday',

    body: 'Log library hours in Agora before midnight. Scholarship board reviews Monday.',

    author: 'Ethan Walsh',

    authorRole: 'Treasurer',

    createdAt: '2025-08-21T09:00:00',

  },

  {

    id: 'a4',

    kind: 'poll',

    title: 'Fall Formal venue vote',

    body: 'Help social chair pick a venue — voting closes Aug 30.',

    author: 'Tyler Brooks',

    authorRole: 'Social Chair',

    createdAt: '2025-08-23T09:00:00',

    poll: {

      question: 'Which venue for Fall Formal?',

      options: [

        { id: 'opt-grand', label: 'Pensacola Grand Hotel', voteCount: 14 },

        { id: 'opt-marriott', label: 'Marriott on the Bay', voteCount: 9 },

        { id: 'opt-campus', label: 'On-campus ballroom', voteCount: 4 },

      ],

      closesAt: '2025-08-30',

      allowMultiple: false,

      voterIds: {},

    },

  },

  {

    id: 'a5',

    kind: 'signup',

    title: 'Brotherhood cookout — volunteer shifts',

    body: 'Claim a role for Saturday setup and cleanup.',

    author: 'Marcus Chen',

    authorRole: 'President',

    createdAt: '2025-08-22T15:00:00',

    signup: {

      closesAt: '2025-08-25',

      slots: [

        { id: 'slot-setup', label: 'Setup crew (10 AM)', capacity: 4, memberIds: ['m2', 'm5'] },

        { id: 'slot-grill', label: 'Grill master', capacity: 2, memberIds: ['m3'] },

        { id: 'slot-cleanup', label: 'Cleanup (after)', capacity: 6, memberIds: [] },

      ],

    },

  },

]

const DEMO_EXEC_SLIDES: ExecSlide[] = [
  {
    id: 's1',
    position: 'President',
    title: 'Chapter President',
    description: 'Leads the chapter, sets vision, and represents the organization on campus.',
    responsibilities: [
      'Run weekly exec meetings',
      'Approve major spending & events',
      'Liaison with nationals & advisors',
      'Oversee all committee chairs',
    ],
    talkingPoints: [
      'Sets the tone for the semester',
      'Accountable to members and nationals',
      'First point of contact for serious issues',
    ],
  },
  {
    id: 's2',
    position: 'Vice President',
    title: 'Vice President',
    description: 'Supports the President and owns internal operations.',
    responsibilities: [
      'Chapter meeting agendas',
      'Standards & member accountability',
      'Backup for President duties',
    ],
    talkingPoints: [
      'Keeps the chapter running day-to-day',
      'Often leads standards board',
    ],
  },
  {
    id: 's3',
    position: 'Treasurer',
    title: 'Treasurer',
    description: 'Manages chapter finances and Billhighway reconciliation.',
    responsibilities: [
      'Dues collection & reminders',
      'Budget tracking',
      'Reimbursements & receipts',
    ],
    talkingPoints: [
      'Transparent financial reporting',
      'Works closely with scholarship board on hours',
    ],
  },
  {
    id: 's4',
    position: 'Recruitment Chair',
    title: 'Recruitment Chair',
    description: 'Owns the rush cycle from first contact to bid day.',
    responsibilities: [
      'Pipeline management',
      'Assign PNMs to members',
      'Coordinate rush events',
    ],
    talkingPoints: [
      'Drives chapter growth',
      'Data-driven follow-ups',
    ],
  },
  {
    id: 's5',
    position: 'Secretary',
    title: 'Secretary',
    description: 'Records, communications, and chapter documentation.',
    responsibilities: [
      'Meeting minutes',
      'Announcements & email blasts',
      'Roster accuracy',
    ],
    talkingPoints: [
      'Information hub for the chapter',
    ],
  },
  {
    id: 's6',
    position: 'Scholarship Chair',
    title: 'Scholarship Chair',
    description: 'Academic accountability and library hour verification.',
    responsibilities: [
      'Review library hours weekly',
      'GPA reporting',
      'Study session coordination',
    ],
    talkingPoints: [
      'Gatekeeper for academic standards',
      'Uses Library Hours dashboard',
    ],
  },
]

const DEMO_CHAPTER_POSITIONS: ChapterPosition[] = [
  { id: 'p1', title: 'President', assignedMemberId: 'm1', isCustom: false },
  { id: 'p2', title: 'Vice President', assignedMemberId: 'm2', isCustom: false },
  { id: 'p3', title: 'Treasurer', assignedMemberId: 'm3', isCustom: false },
  { id: 'p4', title: 'Recruitment Chair', assignedMemberId: 'm4', isCustom: false },
  { id: 'p5', title: 'Secretary', isCustom: false },
  { id: 'p6', title: 'Scholarship Chair', isCustom: false },
  { id: 'p6b', title: 'Standards Chair', isCustom: false },
  { id: 'p6c', title: 'Chaplain', isCustom: false },
  { id: 'p7', title: 'Social Chair', assignedMemberId: 'm2', isCustom: false },
  { id: 'p8', title: 'Philanthropy Chair', isCustom: false },
]

const DEMO_RSVP_EXCUSES: RsvpExcuse[] = [
  {
    id: 'ex1',
    eventId: 'e2',
    memberId: 'm5',
    reason: 'Work shift until 8 PM — can send schedule screenshot if needed.',
    status: 'pending',
    submittedAt: '2025-08-22T16:00:00',
  },
  {
    id: 'ex2',
    eventId: 'e1',
    memberId: 'm6',
    reason: 'Family emergency out of town.',
    status: 'approved',
    submittedAt: '2025-08-18T09:00:00',
    reviewedBy: 'Marcus Chen',
    reviewedAt: '2025-08-18T11:00:00',
  },
]

const DEMO_LIBRARY_HOURS: LibraryHoursEntry[] = [
  {
    id: 'lh1',
    memberId: 'm5',
    date: '2025-08-20',
    hours: 3,
    location: 'John C. Pace Library',
    notes: 'Accounting study session',
    verified: false,
  },
  {
    id: 'lh2',
    memberId: 'm5',
    date: '2025-08-18',
    hours: 2.5,
    location: 'John C. Pace Library',
    verified: true,
  },
  {
    id: 'lh3',
    memberId: 'm6',
    date: '2025-08-21',
    hours: 4,
    location: 'Engineering Building',
    notes: 'Group project',
    verified: false,
  },
  {
    id: 'lh4',
    memberId: 'm2',
    date: '2025-08-19',
    hours: 2,
    location: 'John C. Pace Library',
    verified: true,
  },
]


function gateArray<T>(demo: T[]): T[] {
  return new Proxy([] as T[], {
    get(_t, prop) {
      const src = allowDemoData() ? demo : []
      const v = Reflect.get(src, prop)
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(src) : v
    },
    ownKeys: () => Reflect.ownKeys(allowDemoData() ? demo : []),
    getOwnPropertyDescriptor: (_t, p) =>
      Reflect.getOwnPropertyDescriptor(allowDemoData() ? demo : [], p),
    has: (_t, p) => Reflect.has(allowDemoData() ? demo : [], p),
  })
}

export const announcements = gateArray(DEMO_ANNOUNCEMENTS)
export const execSlides = gateArray(DEMO_EXEC_SLIDES)
export const chapterPositions = gateArray(DEMO_CHAPTER_POSITIONS)
export const rsvpExcuses = gateArray(DEMO_RSVP_EXCUSES)
export const libraryHours = gateArray(DEMO_LIBRARY_HOURS)

export { DEMO_ANNOUNCEMENTS, DEMO_EXEC_SLIDES, DEMO_CHAPTER_POSITIONS }
