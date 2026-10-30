/** Shareable invite URLs — `/join?code=CHAPTER-JOIN-…` or `/join/CHAPTER-JOIN-…` */

export const JOIN_LINK_PARAM = 'code'

export function normalizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase()
}

export function buildJoinLink(
  code: string,
  origin = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  const normalized = normalizeJoinCode(code)
  const base = origin || 'http://localhost'
  const url = new URL('/join', base)
  url.searchParams.set(JOIN_LINK_PARAM, normalized)
  return url.toString()
}

export function parseJoinCodeFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const raw = params.get(JOIN_LINK_PARAM) ?? params.get('join') ?? params.get('invite')
  if (!raw?.trim()) return null
  return normalizeJoinCode(raw)
}

export function parseJoinCodeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/join\/([^/?#]+)/i)
  if (!match?.[1]) return null
  try {
    return normalizeJoinCode(decodeURIComponent(match[1]))
  } catch {
    return normalizeJoinCode(match[1])
  }
}
