import type { BylawsDocument, HouseTask } from '../types/chapterResources'
import type { ExecSlide } from '../types/features'

export const DEMO_EXEC_SLIDES: ExecSlide[] = [
  {
    id: 's1',
    position: 'President',
    title: 'Chapter President',
    description: 'Leads the chapter, sets vision, and represents the org on campus.',
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
    talkingPoints: ['Keeps the chapter running day-to-day', 'Often leads standards board'],
  },
  {
    id: 's3',
    position: 'Treasurer',
    title: 'Treasurer',
    description: 'Manages chapter finances and payment platform reconciliation.',
    responsibilities: ['Dues collection & reminders', 'Budget tracking', 'Reimbursements & receipts'],
    talkingPoints: ['Transparent financial reporting', 'Works with scholarship board on hours'],
  },
  {
    id: 's4',
    position: 'Recruitment Chair',
    title: 'Recruitment Chair',
    description: 'Owns the rush cycle from first contact to bid day.',
    responsibilities: ['Pipeline management', 'Assign PNMs to members', 'Coordinate rush events'],
    talkingPoints: ['Drives chapter growth', 'Data-driven follow-ups'],
  },
  {
    id: 's5',
    position: 'Secretary',
    title: 'Secretary',
    description: 'Records, communications, and chapter documentation.',
    responsibilities: ['Meeting minutes', 'Announcements & email blasts', 'Roster accuracy'],
    talkingPoints: ['Information hub for the chapter'],
  },
  {
    id: 's6',
    position: 'Scholarship Chair',
    title: 'Scholarship Chair',
    description: 'Academic accountability and study hour verification.',
    responsibilities: ['Review study hours weekly', 'GPA reporting', 'Study session coordination'],
    talkingPoints: ['Gatekeeper for academic standards', 'Uses Study Hours dashboard'],
  },
]

export const DEMO_BYLAWS: BylawsDocument[] = [
  {
    id: 'bylaws-1',
    fileName: 'Chapter-Bylaws-2024.txt',
    content: `ARTICLE I — NAME AND PURPOSE
The name of this organization shall be the Sample Chapter of [National Organization].

ARTICLE II — MEMBERSHIP
Section 1. Active membership requires good standing with dues, attendance, and academic standards.
Section 2. New members shall complete the new member program as approved by exec board.

ARTICLE III — EXECUTIVE BOARD
The executive board consists of President, Vice President, Treasurer, Secretary, and appointed chairs.

ARTICLE IV — MEETINGS
Weekly chapter meetings are mandatory unless excused by the President or Standards Chair.

ARTICLE V — FINANCES
All expenditures over $250 require President and Treasurer approval.`,
    importedAt: '2025-08-01T12:00:00.000Z',
    importedBy: 'Marcus Chen',
  },
]

export const DEMO_HOUSE_TASKS: HouseTask[] = [
  {
    id: 'ht1',
    kind: 'cleanup',
    title: 'Kitchen deep clean',
    area: 'Kitchen',
    status: 'open',
    priority: 'high',
    assignedMemberId: 'm5',
    dueDate: '2025-08-24',
    notes: 'Counters, appliances, floors — checklist in group chat',
    createdAt: '2025-08-20T10:00:00.000Z',
  },
  {
    id: 'ht2',
    kind: 'cleanup',
    title: 'Main bathroom reset',
    area: 'Upstairs bath',
    status: 'in_progress',
    priority: 'medium',
    assignedMemberId: 'm6',
    dueDate: '2025-08-25',
    createdAt: '2025-08-21T14:00:00.000Z',
  },
  {
    id: 'ht3',
    kind: 'cleanup',
    title: 'Common room tidy + trash',
    area: 'Main room',
    status: 'open',
    priority: 'low',
    dueDate: '2025-08-26',
    createdAt: '2025-08-22T09:00:00.000Z',
  },
  {
    id: 'ht4',
    kind: 'maintenance',
    title: 'Back porch light out',
    area: 'Back porch',
    status: 'open',
    priority: 'high',
    notes: 'Needs bulb or fixture check — report to House Manager',
    createdAt: '2025-08-19T18:00:00.000Z',
  },
  {
    id: 'ht5',
    kind: 'maintenance',
    title: 'HVAC filter replacement',
    area: 'Chapter house',
    status: 'in_progress',
    priority: 'medium',
    assignedMemberId: 'm2',
    notes: 'Filters ordered — install by end of month',
    createdAt: '2025-08-15T11:00:00.000Z',
  },
]
