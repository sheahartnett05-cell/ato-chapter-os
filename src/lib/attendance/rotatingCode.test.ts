import { describe, expect, it } from 'vitest'
import {
  checkInWindow,
  rotatingCheckInCode,
  validateRotatingCheckInCode,
} from './rotatingCode'

describe('rotatingCheckInCode', () => {
  it('is stable within a window and changes on the next', () => {
    const secret = 'abc123'
    const rot = 30
    // Align to window start so t0+10 stays inside the same 30s window
    const t0 = Math.floor(1_700_000_000 / rot) * rot
    const a = rotatingCheckInCode(secret, rot, t0)
    const b = rotatingCheckInCode(secret, rot, t0 + 10)
    const c = rotatingCheckInCode(secret, rot, t0 + 30)
    expect(a).toHaveLength(6)
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(checkInWindow(t0 + 30, rot)).toBe(checkInWindow(t0, rot) + 1)
  })

  it('accepts current and previous window codes', () => {
    const secret = 'door-secret'
    const rot = 30
    const t = 1_700_000_060
    const current = rotatingCheckInCode(secret, rot, t)
    const prev = rotatingCheckInCode(secret, rot, t - 30)
    expect(validateRotatingCheckInCode(secret, rot, current, t)).toBe(true)
    expect(validateRotatingCheckInCode(secret, rot, prev, t)).toBe(true)
    expect(validateRotatingCheckInCode(secret, rot, 'AAAAAA', t)).toBe(false)
  })
})
