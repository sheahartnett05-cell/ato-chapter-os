import { describe, expect, it } from 'vitest'
import { mergeRosterLists } from './rosterMerge'

describe('mergeRosterLists', () => {
  it('unions members by id without dropping either side', () => {
    const merged = mergeRosterLists(
      [{ id: 'm1', firstName: 'Pat', lastName: 'Lee', email: 'pat@school.edu' }],
      [{ id: 'm2', firstName: 'Sam', lastName: 'Kim', email: 'sam@school.edu' }]
    )
    expect(merged.map((m) => m.id).sort()).toEqual(['m1', 'm2'])
  })

  it('prefers non-empty person fields when merging the same id', () => {
    const merged = mergeRosterLists(
      [{ id: 'm1', firstName: '', lastName: 'Old', email: 'old@school.edu', phone: '' }],
      [{ id: 'm1', firstName: 'Alex', lastName: '', email: '', phone: '555' }]
    )
    expect(merged).toHaveLength(1)
    expect(merged[0].firstName).toBe('Alex')
    expect(merged[0].lastName).toBe('Old')
    expect(merged[0].email).toBe('old@school.edu')
    expect(merged[0].phone).toBe('555')
  })
})
