/**
 * Crest asset resolution.
 * Only real downloaded coats/crests (png/jpg/webp). Fake heraldic SVGs are not used.
 * Chaptera product mark remains SVG (legacy agora.svg kept as fallback).
 */
import { isProductOrgId } from './brandCopy'

export function orgCrestCandidates(orgId: string): string[] {
  if (isProductOrgId(orgId)) {
    return [`/crests/chaptera.svg`, `/crests/agora.svg`, `/crests/chaptera.png`, `/crests/agora.png`]
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
