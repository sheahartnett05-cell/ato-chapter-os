import type {
  Announcement,
  ChapterPosition,
  ExecSlide,
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

export { DEMO_ANNOUNCEMENTS, DEMO_EXEC_SLIDES, DEMO_CHAPTER_POSITIONS }
