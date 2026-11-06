import { describe, expect, it } from 'vitest'
import { isMobileNavActive } from './mobileNavActive'

describe('isMobileNavActive', () => {
  it('matches exact home ends', () => {
    expect(isMobileNavActive('/home', '/home', true)).toBe(true)
    expect(isMobileNavActive('/home/extra', '/home', true)).toBe(false)
    expect(isMobileNavActive('/my-dashboard', '/my-dashboard', true)).toBe(true)
  })

  it('treats event detail as calendar tab', () => {
    expect(isMobileNavActive('/events/abc', '/calendar')).toBe(true)
    expect(isMobileNavActive('/calendar', '/calendar')).toBe(true)
  })

  it('treats excuses as attendance tab', () => {
    expect(isMobileNavActive('/excuses', '/attendance')).toBe(true)
    expect(isMobileNavActive('/attendance', '/attendance')).toBe(true)
  })
})
