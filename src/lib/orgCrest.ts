/**
 * Crest asset resolution.
 * Only real downloaded coats/crests (png/jpg/webp). Fake heraldic SVGs are not used.
 * Agora product mark remains SVG.
 */
export function orgCrestCandidates(orgId: string): string[] {
  if (orgId === 'agora' || orgId === 'chapter-os') {
    return [`/crests/agora.svg`, `/crests/agora.png`]
  }
  return [
    `/crests/${orgId}.png`,
    `/crests/${orgId}.jpg`,
    `/crests/${orgId}.webp`,
    `/crests/${orgId}.gif`,
    `/crests/${orgId}.svg`,
  ]
}

export function orgCrestSrc(orgId: string): string {
  return orgCrestCandidates(orgId)[0]
}
