import type {
  BillHighwayConfig,
  DuesCharge,
  DuesPayment,
  StudyHoursLog,
  StudyLocation,
} from '../types/chapterOps'
import type { Event } from '../types'

export const calendarExtraEvents: Event[] = [
  {
    id: 'e7',
    name: 'Study Hours Block',
    type: 'Scholarship',
    date: '2025-08-26',
    time: '6:00 PM',
    location: 'John C. Pace Library',
    description: 'Required study block. Log hours at an approved location.',
    required: true,
    points: 3,
    dressCode: 'Casual',
    rsvpRequired: false,
    guestAllowed: false,
  },
  {
    id: 'e8',
    name: 'Study Hours Block',
    type: 'Scholarship',
    date: '2025-08-28',
    time: '6:00 PM',
    location: 'Engineering Building Quiet Floor',
    description: 'Optional study hours toward semester requirement.',
    required: false,
    points: 3,
    dressCode: 'Casual',
    rsvpRequired: false,
    guestAllowed: false,
  },
  {
    id: 'e9',
    name: 'New Member Education',
    type: 'Education',
    date: '2025-08-27',
    time: '8:00 PM',
    location: 'ATO Chapter House',
    description: 'Weekly new member education session.',
    required: true,
    points: 5,
    dressCode: 'Chapter polo',
    rsvpRequired: true,
    guestAllowed: false,
  },
]

export const initialStudyLocations: StudyLocation[] = [
  {
    id: 'loc1',
    name: 'John C. Pace Library',
    address: '11000 University Pkwy, Pensacola',
    active: true,
  },
  {
    id: 'loc2',
    name: 'Engineering Building Quiet Floor',
    address: 'Building 4 · 3rd Floor',
    active: true,
  },
  {
    id: 'loc3',
    name: 'Chapter House Study Room',
    address: 'ATO Chapter House',
    active: true,
  },
  {
    id: 'loc4',
    name: 'Starbucks — University Mall',
    address: 'Off-campus (not approved for credit)',
    active: false,
  },
]

export const initialStudyLogs: StudyHoursLog[] = [
  {
    id: 'sh1',
    memberId: 'm5',
    date: '2025-08-20',
    hours: 3,
    locationId: 'loc1',
    notes: 'Accounting study session',
    verified: false,
  },
  {
    id: 'sh2',
    memberId: 'm5',
    date: '2025-08-18',
    hours: 2.5,
    locationId: 'loc1',
    verified: true,
  },
  {
    id: 'sh3',
    memberId: 'm6',
    date: '2025-08-21',
    hours: 4,
    locationId: 'loc2',
    notes: 'Group project',
    verified: false,
  },
  {
    id: 'sh4',
    memberId: 'm2',
    date: '2025-08-19',
    hours: 2,
    locationId: 'loc1',
    verified: true,
  },
]

export const initialDuesCharges: DuesCharge[] = [
  {
    id: 'dc1',
    label: 'Fall 2025 Chapter Dues',
    amount: 850,
    dueDate: '2025-09-15',
    semester: 'Fall 2025',
    assignedMemberIds: [],
    createdAt: '2025-08-01T10:00:00',
  },
  {
    id: 'dc2',
    label: 'Fall Formal Assessment',
    amount: 65,
    dueDate: '2025-10-01',
    semester: 'Fall 2025',
    assignedMemberIds: [],
    createdAt: '2025-08-15T12:00:00',
  },
]

export const initialDuesPayments: DuesPayment[] = [
  {
    id: 'dp1',
    chargeId: 'dc1',
    memberId: 'm1',
    amountPaid: 850,
    status: 'Paid',
    paidAt: '2025-08-10',
    method: 'BillHighway',
  },
  {
    id: 'dp2',
    chargeId: 'dc1',
    memberId: 'm2',
    amountPaid: 850,
    status: 'Paid',
    paidAt: '2025-08-12',
    method: 'BillHighway',
  },
  {
    id: 'dp3',
    chargeId: 'dc1',
    memberId: 'm3',
    amountPaid: 850,
    status: 'Paid',
    paidAt: '2025-08-08',
    method: 'BillHighway',
  },
  {
    id: 'dp4',
    chargeId: 'dc1',
    memberId: 'm4',
    amountPaid: 850,
    status: 'Paid',
    paidAt: '2025-08-11',
    method: 'BillHighway',
  },
  {
    id: 'dp5',
    chargeId: 'dc1',
    memberId: 'm5',
    amountPaid: 425,
    status: 'Partial',
    method: 'BillHighway',
  },
  { id: 'dp6', chargeId: 'dc1', memberId: 'm6', amountPaid: 0, status: 'Open' },
  {
    id: 'dp7',
    chargeId: 'dc1',
    memberId: 'm7',
    amountPaid: 300,
    status: 'Partial',
    method: 'BillHighway',
  },
]

export const initialBillHighway: BillHighwayConfig = {
  enabled: true,
  payUrl: 'https://www.billhighway.co/pay',
  chapterCode: 'ATO-UWF-EP',
  lastSyncedAt: '2025-08-22T18:00:00',
}

export const SEMESTER_STUDY_HOURS_REQUIRED = 12
