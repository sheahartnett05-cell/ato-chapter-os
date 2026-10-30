import { describe, expect, it } from 'vitest'
import {
  attendancePatchForExcuseDecision,
  attendancePctFromEntries,
  buildRollCallEntry,
  eventAttendancePct,
  formatAttendancePct,
  memberAttendancePct,
  memberPoints,
  normalizeAttendanceEntries,
  normalizePoints,
  pointsFromEntry,
  syncMemberAttendanceStanding,
} from './attendanceMath'
import type { AttendanceEntry, Member } from '../../types'

function member(partial: Partial<Member> & { id: string }): Member {
  return {
    firstName: 'A',
    lastName: 'B',
    email: `${partial.id}@ex.com`,
    phone: '',
    status: 'Active',
    role: undefined,
    isExec: false,
    major: '',
    graduationYear: 2027,
    pledgeClass: '',
    birthday: '2000-01-01',
    shirtSize: 'M',
    emergencyContact: '',
    emergencyPhone: '',
    duesStatus: 'Paid',
    duesPaid: 0,
    duesExpected: 0,
    attendancePct: null,
    points: 0,
    avatar: 'AB',
    ...partial,
  }
}

describe('normalizePoints', () => {
  it('rejects non-finite and clamps negative', () => {
    expect(normalizePoints(NaN)).toBe(0)
    expect(normalizePoints(Infinity)).toBe(0)
    expect(normalizePoints(-3)).toBe(0)
    expect(normalizePoints(5)).toBe(5)
  })
})

describe('normalizeAttendanceEntries', () => {
  it('dedupes by latest timestamp', () => {
    const rows: AttendanceEntry[] = [
      {
        memberId: 'm1',
        status: 'Absent',
        pointsEarned: 0,
        recordedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        memberId: 'm1',
        status: 'Present',
        pointsEarned: 5,
        recordedAt: '2026-01-01T11:00:00.000Z',
      },
      {
        memberId: 'm1',
        status: 'Excused',
        pointsEarned: 0,
        recordedAt: '2026-01-01T10:30:00.000Z',
      },
    ]
    const out = normalizeAttendanceEntries(rows)
    expect(out).toHaveLength(1)
    expect(out[0].status).toBe('Present')
    expect(out[0].pointsEarned).toBe(5)
  })

  it('zeros invalid points on normalize', () => {
    const out = normalizeAttendanceEntries([
      { memberId: 'm1', status: 'Present', pointsEarned: Number.NaN },
      { memberId: 'm2', status: 'Present', pointsEarned: -10 },
    ])
    expect(out.find((e) => e.memberId === 'm1')?.pointsEarned).toBe(0)
    expect(out.find((e) => e.memberId === 'm2')?.pointsEarned).toBe(0)
  })
})

describe('denominator / attendancePct', () => {
  it('excludes unrecorded and returns null with empty denominator', () => {
    expect(attendancePctFromEntries([])).toBeNull()
    expect(formatAttendancePct(null)).toBe('—')
    expect(eventAttendancePct([])).toBeNull()
  })

  it('counts Present and Excused positively; never fabricates 0% for empty', () => {
    const rows: AttendanceEntry[] = [
      { memberId: 'm1', status: 'Present', pointsEarned: 5 },
      { memberId: 'm2', status: 'Excused', pointsEarned: 0 },
      { memberId: 'm3', status: 'Absent', pointsEarned: 0 },
    ]
    // 2 of 3 → 67%
    expect(attendancePctFromEntries(rows)).toBe(67)

    const byEvent = {
      e1: [{ memberId: 'm1', status: 'Present' as const, pointsEarned: 5 }],
      e2: [] as AttendanceEntry[],
    }
    expect(memberAttendancePct('m1', byEvent)).toBe(100)
    expect(memberAttendancePct('m9', byEvent)).toBeNull()
  })

  it('corrections replace prior status for the same member×event', () => {
    const byEvent = {
      e1: [
        {
          memberId: 'm1',
          status: 'Absent' as const,
          pointsEarned: 0,
          recordedAt: '2026-01-01T10:00:00.000Z',
        },
        {
          memberId: 'm1',
          status: 'Present' as const,
          pointsEarned: 10,
          recordedAt: '2026-01-01T12:00:00.000Z',
        },
      ],
    }
    expect(memberAttendancePct('m1', byEvent)).toBe(100)
    expect(memberPoints('m1', byEvent, { e1: 10 })).toBe(10)
  })
})

describe('points', () => {
  it('only Present earns event points; RSVP-less Absent earns 0', () => {
    const entryPresent = buildRollCallEntry('m1', 'Present', 99, '2026-01-01T12:00:00.000Z')
    const entryExcused = buildRollCallEntry('m2', 'Excused', 99, '2026-01-01T12:00:00.000Z')
    expect(pointsFromEntry(entryPresent, 10)).toBe(10)
    expect(pointsFromEntry(entryExcused, 10)).toBe(0)
    expect(
      memberPoints(
        'm1',
        { e1: [entryPresent], e2: [entryExcused] },
        { e1: 10, e2: 10 }
      )
    ).toBe(10)
  })
})

describe('excuse transitions', () => {
  it('approve → Excused unless Present already', () => {
    const present = buildRollCallEntry('m1', 'Present', 5, '2026-01-01T10:00:00.000Z')
    expect(
      attendancePatchForExcuseDecision('approved', 'm1', present, '2026-01-02T00:00:00.000Z')
    ).toEqual({ kind: 'noop' })

    const absent = buildRollCallEntry('m1', 'Absent', 0, '2026-01-01T10:00:00.000Z')
    const patch = attendancePatchForExcuseDecision(
      'approved',
      'm1',
      absent,
      '2026-01-02T00:00:00.000Z'
    )
    expect(patch.kind).toBe('upsert')
    if (patch.kind === 'upsert') {
      expect(patch.entry.status).toBe('Excused')
      expect(patch.entry.source).toBe('excuse')
      expect(patch.entry.rollCallStatus).toBe('Absent')
      expect(patch.entry.pointsEarned).toBe(0)
    }
  })

  it('reject/reopen reverts Excused to unrecorded or Absent if roll call marked', () => {
    const excusedFromExcuse: AttendanceEntry = {
      memberId: 'm1',
      status: 'Excused',
      pointsEarned: 0,
      recordedAt: '2026-01-02T00:00:00.000Z',
      source: 'excuse',
    }
    expect(
      attendancePatchForExcuseDecision(
        'denied',
        'm1',
        excusedFromExcuse,
        '2026-01-03T00:00:00.000Z'
      )
    ).toEqual({ kind: 'remove' })

    const excusedOverAbsent: AttendanceEntry = {
      ...excusedFromExcuse,
      rollCallStatus: 'Absent',
    }
    const restored = attendancePatchForExcuseDecision(
      'reopened',
      'm1',
      excusedOverAbsent,
      '2026-01-03T00:00:00.000Z'
    )
    expect(restored.kind).toBe('upsert')
    if (restored.kind === 'upsert') {
      expect(restored.entry.status).toBe('Absent')
      expect(restored.entry.source).toBe('roll_call')
    }
  })

  it('pending deny with no Excused row marks Absent', () => {
    const patch = attendancePatchForExcuseDecision(
      'denied',
      'm1',
      undefined,
      '2026-01-03T00:00:00.000Z'
    )
    expect(patch.kind).toBe('upsert')
    if (patch.kind === 'upsert') {
      expect(patch.entry.status).toBe('Absent')
    }
  })
})

describe('syncMemberAttendanceStanding', () => {
  it('writes null attendancePct when member has no recorded rows', () => {
    const roster = [member({ id: 'm1', attendancePct: 90, points: 12 }), member({ id: 'm2' })]
    const next = syncMemberAttendanceStanding(
      roster,
      {
        e1: [buildRollCallEntry('m1', 'Present', 5, '2026-01-01T12:00:00.000Z')],
      },
      { e1: 5 }
    )
    expect(next[0].attendancePct).toBe(100)
    expect(next[0].points).toBe(5)
    expect(next[1].attendancePct).toBeNull()
    expect(next[1].points).toBe(0)
  })
})
