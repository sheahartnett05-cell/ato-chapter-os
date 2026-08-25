/**
 * Org crest display: real coat-of-arms/crest images when present,
 * otherwise polished lettermark (never fake heraldic SVG).
 */
import { useState } from 'react'
import type { NationalOrg } from '../../data/nationalOrgs'
import { orgCrestCandidates } from '../../lib/orgCrest'
import { OrgLetterBadge } from './OrgLetterBadge'

export function OrgCrest({
  org,
  size = 42,
  className = '',
  showLetterFallback = true,
}: {
  org: Pick<NationalOrg, 'id' | 'letters' | 'primaryColor' | 'accentColor' | 'orgName'>
  size?: number
  className?: string
  showLetterFallback?: boolean
}) {
  const candidates = orgCrestCandidates(org.id)
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)

  if (failed || candidates.length === 0 || idx >= candidates.length) {
    if (!showLetterFallback) return null
    return (
      <OrgLetterBadge
        letters={org.letters}
        backgroundColor={org.primaryColor}
        size={size}
        className={className}
      />
    )
  }

  return (
    <img
      src={candidates[idx]}
      alt={`${org.orgName} crest`}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(3, Math.round(size * 0.08)),
        background: 'rgba(255,255,255,0.92)',
      }}
      onError={() => {
        if (idx + 1 < candidates.length) setIdx(idx + 1)
        else setFailed(true)
      }}
    />
  )
}
