/** Parse currency/number fields — returns null when invalid or non-positive. */
export function parsePositiveAmount(raw: string | number): number | null {
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function trimRequired(value: string): string {
  return value.trim()
}

export function isLikelyEmail(value: string): boolean {
  const v = value.trim()
  if (!v || v.includes(' ')) return false
  const parts = v.split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1]?.includes('.')) return false
  return true
}
