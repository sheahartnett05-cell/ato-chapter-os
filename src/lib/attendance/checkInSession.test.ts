import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  chapterAttendanceKey,
  closeCheckInSession,
  getOpenCheckInSession,
  liveCheckInPayload,
  openCheckInSession,
  tryValidateCheckIn,
} from './checkInSession'

const store = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, String(v))
  },
  removeItem: (k: string) => {
    store.delete(k)
  },
  clear: () => store.clear(),
})

describe('chapterAttendanceKey', () => {
  it('normalizes org + designation for chapter scoping', () => {
    expect(chapterAttendanceKey('Org-1', 'Beta Nu')).toBe('org-1::beta nu')
  })
})

describe('check-in sessions', () => {
  beforeEach(() => {
    store.clear()
  })

  it('binds sessions to chapterKey so foreign chapters cannot validate', () => {
    const chapterA = chapterAttendanceKey('org-a', 'Alpha')
    const chapterB = chapterAttendanceKey('org-b', 'Beta')
    const session = openCheckInSession({ eventId: 'evt-1', chapterKey: chapterA })
    const { code } = liveCheckInPayload(session, 'https://chapteramanager.com')

    expect(tryValidateCheckIn({ eventId: 'evt-1', chapterKey: chapterA, code }).ok).toBe(true)
    expect(tryValidateCheckIn({ eventId: 'evt-1', chapterKey: chapterB, code }).ok).toBe(false)
    expect(getOpenCheckInSession('evt-1', chapterB)).toBeNull()
  })

  it('closes only the matching chapter session', () => {
    const chapterA = chapterAttendanceKey('org-a', 'Alpha')
    openCheckInSession({ eventId: 'evt-1', chapterKey: chapterA })
    closeCheckInSession('evt-1', chapterA)
    expect(getOpenCheckInSession('evt-1', chapterA)).toBeNull()
  })
})
