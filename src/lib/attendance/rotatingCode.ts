/**
 * Short rotating door codes for event check-in.
 * code(secret, window) = base32(fnv1a(secret + ':' + window)).slice(0, 6)
 */

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function toBase32(n: number): string {
  let x = n >>> 0
  let out = ''
  for (let i = 0; i < 8; i++) {
    out = BASE32[x & 31] + out
    x >>>= 5
  }
  return out
}

export function checkInWindow(epochSec: number, rotateSeconds: number): number {
  const rot = Math.max(5, Math.floor(rotateSeconds))
  return Math.floor(epochSec / rot)
}

export function rotatingCheckInCode(
  secret: string,
  rotateSeconds: number,
  epochSec = Math.floor(Date.now() / 1000)
): string {
  const window = checkInWindow(epochSec, rotateSeconds)
  return toBase32(fnv1a(`${secret}:${window}`)).slice(0, 6)
}

/** Accept current or previous window (clock skew / mid-rotation scans). */
export function validateRotatingCheckInCode(
  secret: string,
  rotateSeconds: number,
  code: string,
  epochSec = Math.floor(Date.now() / 1000)
): boolean {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z2-7]/g, '')
  if (normalized.length !== 6) return false
  const current = rotatingCheckInCode(secret, rotateSeconds, epochSec)
  const prevWindow = checkInWindow(epochSec, rotateSeconds) - 1
  const previous =
    prevWindow >= 0
      ? toBase32(fnv1a(`${secret}:${prevWindow}`)).slice(0, 6)
      : ''
  return normalized === current || normalized === previous
}

export function secondsUntilNextRotation(
  rotateSeconds: number,
  epochSec = Math.floor(Date.now() / 1000)
): number {
  const rot = Math.max(5, Math.floor(rotateSeconds))
  return rot - (epochSec % rot)
}

export function newCheckInSecret(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
