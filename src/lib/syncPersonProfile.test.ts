import { describe, expect, it } from 'vitest'
import { mergePersonAndRosterProfile } from './syncPersonProfile'

describe('mergePersonAndRosterProfile', () => {
  it('prefers SQL profiles for person fields', () => {
    const merged = mergePersonAndRosterProfile(
      {
        firstName: 'Pat',
        lastName: 'Lee',
        phone: '555-0100',
        email: 'pat@school.edu',
        avatar: 'PL',
      },
      {
        firstName: 'Old',
        lastName: 'Name',
        phone: '000',
        email: 'old@school.edu',
        graduationYear: 2027,
        major: 'Finance',
        shirtSize: 'L',
      }
    )
    expect(merged.firstName).toBe('Pat')
    expect(merged.lastName).toBe('Lee')
    expect(merged.phone).toBe('555-0100')
    expect(merged.email).toBe('pat@school.edu')
    expect(merged.graduationYear).toBe(2027)
    expect(merged.major).toBe('Finance')
    expect(merged.shirtSize).toBe('L')
  })

  it('falls back to roster when profiles empty', () => {
    const merged = mergePersonAndRosterProfile(
      {},
      { firstName: 'Sam', lastName: 'Kim', phone: '111', graduationYear: 2028 }
    )
    expect(merged.firstName).toBe('Sam')
    expect(merged.lastName).toBe('Kim')
    expect(merged.phone).toBe('111')
    expect(merged.graduationYear).toBe(2028)
  })

  it('does not let blank SQL strings wipe roster names', () => {
    const merged = mergePersonAndRosterProfile(
      { firstName: '  ', lastName: '', phone: '' },
      { firstName: 'Alex', lastName: 'Rivera', phone: '222', photoUrl: 'data:image/png;base64,abc' }
    )
    expect(merged.firstName).toBe('Alex')
    expect(merged.lastName).toBe('Rivera')
    expect(merged.phone).toBe('222')
    expect(merged.photoUrl).toBe('data:image/png;base64,abc')
    expect(merged.avatar).toBe('AR')
  })
})
