import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    store.set(k, String(v))
  },
  removeItem: (k: string) => {
    store.delete(k)
  },
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size
  },
})

describe('guest session backup isolation', () => {
  beforeEach(() => {
    store.clear()
    vi.resetModules()
  })

  it('clearDemoData does not remove the real-session backup', async () => {
    const { SESSION_BACKUP_KEY, clearDemoData, STORAGE_KEYS } = await import('./demoSeed')
    localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify({ 'chapter-os-roster-members': '[]' }))
    localStorage.setItem(STORAGE_KEYS.roster, '[{"id":"demo"}]')
    clearDemoData()
    expect(localStorage.getItem(SESSION_BACKUP_KEY)).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.roster)).toBeNull()
  })

  it('restoreRealSession restores bag then clears backup and guest flag', async () => {
    const { SESSION_BACKUP_KEY, restoreRealSession, STORAGE_KEYS } = await import('./demoSeed')
    const { GUEST_FLAG_KEY } = await import('./guestPreview')
    localStorage.setItem(GUEST_FLAG_KEY, '1')
    localStorage.setItem(
      SESSION_BACKUP_KEY,
      JSON.stringify({
        [STORAGE_KEYS.roster]: JSON.stringify([{ id: 'real-m1' }]),
        'chapter-os-onboarding': JSON.stringify({ completed: true, isGuest: false }),
      }),
    )
    localStorage.setItem(STORAGE_KEYS.roster, JSON.stringify([{ id: 'demo' }]))
    const ok = restoreRealSession()
    expect(ok).toBe(true)
    expect(localStorage.getItem(SESSION_BACKUP_KEY)).toBeNull()
    expect(localStorage.getItem(GUEST_FLAG_KEY)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.roster) || '[]')[0].id).toBe('real-m1')
  })
})
