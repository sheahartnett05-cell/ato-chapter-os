import type { RsvpEntry, AttendanceEntry } from '../types'
import type { RsvpExcuse } from '../types/features'

/** Seed RSVP rows keyed by event id */
export const SEED_RSVPS: Record<string, RsvpEntry[]> = {
  e2: [
    { memberId: 'm1', status: 'Going' },
    { memberId: 'm2', status: 'Going' },
    { memberId: 'm3', status: 'Going' },
    { memberId: 'm4', status: 'Going' },
    { memberId: 'm6', status: 'Not Going' },
    { memberId: 'm7', status: 'Going' },
    { memberId: 'm8', status: 'Not Going' },
    { memberId: 'm9', status: 'Going' },
  ],
  e5: [
    { memberId: 'm1', status: 'Going', guest: 'Sarah Mitchell' },
    { memberId: 'm2', status: 'Going' },
    { memberId: 'm3', status: 'Going', guest: 'Emily Chen' },
    { memberId: 'm4', status: 'Going' },
    { memberId: 'm5', status: 'Going', guest: 'Jessica Torres' },
    { memberId: 'm6', status: 'Not Going' },
    { memberId: 'm7', status: 'Going' },
    { memberId: 'm9', status: 'Going', guest: 'Amanda Lee' },
  ],
}

export const SEED_ATTENDANCE: Record<string, AttendanceEntry[]> = {
  e1: [
    { memberId: 'm1', status: 'Present', pointsEarned: 5 },
    { memberId: 'm2', status: 'Present', pointsEarned: 5 },
    { memberId: 'm3', status: 'Present', pointsEarned: 5 },
    { memberId: 'm4', status: 'Present', pointsEarned: 5 },
    { memberId: 'm5', status: 'Excused', pointsEarned: 0 },
    { memberId: 'm6', status: 'Absent', pointsEarned: 0 },
    { memberId: 'm7', status: 'Present', pointsEarned: 5 },
    { memberId: 'm8', status: 'Absent', pointsEarned: 0 },
    { memberId: 'm9', status: 'Present', pointsEarned: 5 },
  ],
}

export const SEED_RSVP_EXCUSES: RsvpExcuse[] = [
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
