/** Product brand — Chaptera (legacy Agora ids still resolve here). */
export const CHAPTERA_PRODUCT_NAME = 'Chaptera'
export const CHAPTERA_TAGLINE = 'Greek org management platform'
export const CHAPTERA_DOMAIN = 'chapteramanager.com'
export const CHAPTERA_SITE_URL = `https://${CHAPTERA_DOMAIN}`
export const CHAPTERA_AUTH_EMAIL = `auth@${CHAPTERA_DOMAIN}`

/** @deprecated Use CHAPTERA_PRODUCT_NAME */
export const AGORA_PRODUCT_NAME = CHAPTERA_PRODUCT_NAME
/** @deprecated Use CHAPTERA_TAGLINE */
export const AGORA_TAGLINE = CHAPTERA_TAGLINE

/** Canonical + legacy product org ids stored in localStorage / guest seed. */
export const PRODUCT_ORG_IDS = new Set(['chaptera', 'agora', 'chapter-os'])

export function isProductOrgId(id: string | null | undefined): boolean {
  return Boolean(id && PRODUCT_ORG_IDS.has(id))
}
