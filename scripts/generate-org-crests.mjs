/**
 * Generate heraldic SVG crests for every org in nationalOrgs.ts.
 * Run: node scripts/generate-org-crests.mjs
 *
 * Optional enrichment with Wikimedia coat-of-arms PNGs:
 *   node scripts/enrich-org-crests-wikimedia.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'crests')

const source = fs.readFileSync(path.join(root, 'src', 'data', 'nationalOrgs.ts'), 'utf8')

const orgs = []

const ORG_RE =
  /mk(?:Frat|Sorority|Nphc|Mgc)\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*\[('#[^']+'),\s*('#[^']+'),\s*('#[^']+)'\]/g

let m
while ((m = ORG_RE.exec(source))) {
  const [, id, orgName, nickname, letters, primaryColor, secondaryColor, accentColor] = m
  const before = source.slice(Math.max(0, m.index - 20), m.index)
  let category = 'fraternity'
  let orgType = 'IFC'
  if (before.includes('mkSorority')) {
    category = 'sorority'
    orgType = 'NPC'
  } else if (before.includes('mkNphc')) {
    category = 'nphc'
    orgType = 'NPHC'
  } else if (before.includes('mkMgc')) {
    category = 'mgc'
    orgType = 'MGC'
  }
  orgs.push({ id, orgName, nickname, letters, category, orgType, primaryColor, secondaryColor, accentColor })
}

// Agora product mark
orgs.unshift({
  id: 'agora',
  orgName: 'Agora',
  nickname: 'Agora',
  letters: 'AG',
  category: 'fraternity',
  orgType: 'IFC',
  primaryColor: '#1a1a1a',
  secondaryColor: '#333333',
  accentColor: '#c4a35a',
})

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function fontSizeForLetters(letters) {
  const n = letters.trim().length
  if (n <= 2) return 26
  if (n === 3) return 20
  return 16
}

function crestSvg(org) {
  const fsz = fontSizeForLetters(org.letters)
  const ribbon = org.orgType
  const isAgora = org.id === 'agora'

  if (isAgora) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" role="img" aria-label="Agora">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
  </defs>
  <path d="M60 6 L106 24 V78 Q106 112 60 128 Q14 112 14 78 V24 Z" fill="url(#g)" stroke="${org.accentColor}" stroke-width="2.5"/>
  <rect x="38" y="38" width="44" height="44" rx="2" fill="none" stroke="${org.accentColor}" stroke-width="1.5" opacity="0.9"/>
  <rect x="46" y="46" width="6" height="3" fill="${org.accentColor}"/>
  <rect x="68" y="46" width="6" height="3" fill="${org.accentColor}"/>
  <rect x="47" y="50" width="4" height="22" fill="${org.accentColor}"/>
  <rect x="69" y="50" width="4" height="22" fill="${org.accentColor}"/>
  <path d="M50 58 Q60 52 70 58" stroke="${org.accentColor}" stroke-width="1.5" fill="none"/>
  <text x="60" y="102" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="600" fill="${org.accentColor}" letter-spacing="0.12em">AGORA</text>
  <rect x="28" y="118" width="64" height="14" rx="1" fill="${org.accentColor}" opacity="0.15"/>
  <text x="60" y="128" text-anchor="middle" font-family="ui-monospace, monospace" font-size="7" fill="${org.accentColor}" letter-spacing="0.08em">CHAPTER OS</text>
</svg>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" role="img" aria-label="${esc(org.orgName)} crest">
  <defs>
    <linearGradient id="g-${org.id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${org.primaryColor}"/>
      <stop offset="100%" stop-color="${org.secondaryColor}"/>
    </linearGradient>
    <linearGradient id="gold-${org.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${org.accentColor}"/>
      <stop offset="50%" stop-color="#e8d5a3"/>
      <stop offset="100%" stop-color="${org.accentColor}"/>
    </linearGradient>
  </defs>
  <path d="M60 5 L108 22 V76 Q108 114 60 132 Q12 114 12 76 V22 Z" fill="url(#g-${org.id})" stroke="url(#gold-${org.id})" stroke-width="2.8"/>
  <path d="M60 12 L100 26 V74 Q100 106 60 122 Q20 106 20 74 V26 Z" fill="none" stroke="${org.accentColor}" stroke-width="0.8" opacity="0.45"/>
  <text x="60" y="78" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fsz}" font-weight="700" fill="${org.accentColor}" letter-spacing="-0.04em">${esc(org.letters)}</text>
  <path d="M28 88 Q60 98 92 88" fill="none" stroke="${org.accentColor}" stroke-width="1" opacity="0.6"/>
  <text x="60" y="96" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="${org.accentColor}" opacity="0.85">${esc(org.nickname.slice(0, 14))}</text>
  <rect x="34" y="118" width="52" height="13" rx="2" fill="${org.accentColor}" opacity="0.22"/>
  <text x="60" y="127" text-anchor="middle" font-family="ui-monospace, monospace" font-size="7" font-weight="600" fill="${org.accentColor}" letter-spacing="0.06em">${esc(ribbon)}</text>
</svg>`
}

fs.mkdirSync(outDir, { recursive: true })

const manifest = {}
for (const org of orgs) {
  const svg = crestSvg(org)
  fs.writeFileSync(path.join(outDir, `${org.id}.svg`), svg, 'utf8')
  manifest[org.id] = {
    orgName: org.orgName,
    svg: `/crests/${org.id}.svg`,
  }
}

fs.writeFileSync(
  path.join(root, 'src', 'data', 'orgCrestManifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
)

console.log(`Generated ${orgs.length} SVG crests in public/crests/`)
