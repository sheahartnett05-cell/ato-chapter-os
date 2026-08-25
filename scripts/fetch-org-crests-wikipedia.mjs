/**
 * Fetch real coats of arms / crests from each org's English Wikipedia page images.
 * Prefers filenames containing "coat of arms", "crest", or "shield"; skips badges/flags/photos.
 *
 *   node scripts/fetch-org-crests-wikipedia.mjs
 *   node scripts/fetch-org-crests-wikipedia.mjs --limit=20
 *
 * Fair-use note: many Wikipedia crest files are used under enwiki fair use.
 * For production, replace with chapter/HQ licensed assets. See public/crests/SOURCES.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'crests')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const UA = 'AgoraChapterOS/1.0 (crest research; local demo)'

async function wikiJson(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    const text = await res.text()
    if (text.startsWith('You are making') || res.status === 429) {
      const wait = 8000 * (i + 1)
      console.warn('  rate limit — waiting', wait, 'ms')
      await sleep(wait)
      continue
    }
    return JSON.parse(text)
  }
  throw new Error('rate-limited')
}

function scoreImageTitle(fileTitle, orgName) {
  const t = fileTitle.toLowerCase()
  const nameBits = orgName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)

  // Hard rejects
  if (
    /badge|pin|flag|logo|wordmark|seal of|map|building|house|campus|photo|portrait|members|chapter house|commons-logo|edit[-_]?protected|padlock|ambox|question|disambig|wikimedia|red_pencil|information_icon|crystal|nuvola|folder/.test(
      t
    )
  ) {
    return -100
  }

  let s = 0
  if (t.includes('coat of arms') || t.includes('coat_of_arms')) s += 20
  else if (/\bcrest\b/.test(t) || t.includes('_crest') || t.includes(' crest')) s += 16
  else if (/\bshield\b/.test(t) || t.includes('coatofarms') || t.includes('arms')) s += 12
  else return -50

  // Prefer titles that mention the org
  const hits = nameBits.filter((b) => t.includes(b)).length
  s += hits * 3
  if (hits === 0 && !t.includes(orgName.split(' ')[0].toLowerCase())) s -= 8

  return s
}

async function pageImages(orgName) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(orgName) +
    '&prop=images&imlimit=80&format=json&origin=*&redirects=1'
  const j = await wikiJson(url)
  const page = Object.values(j.query.pages)[0]
  if (!page || page.missing) return []
  return (page.images || []).map((i) => i.title)
}

async function imageInfo(fileTitle) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(fileTitle) +
    '&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=512&format=json&origin=*'
  const j = await wikiJson(url)
  const page = Object.values(j.query.pages)[0]
  if (!page?.imageinfo?.[0]) return null
  const info = page.imageinfo[0]
  return {
    url: info.thumburl || info.url,
    fullUrl: info.url,
    mime: info.mime,
    fileTitle,
  }
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

function extFromMime(mime, url) {
  if (mime?.includes('gif') || url.includes('.gif')) return 'gif'
  if (mime?.includes('png') || url.includes('.png')) return 'png'
  if (mime?.includes('jpeg') || mime?.includes('jpg') || url.includes('.jpg')) return 'jpg'
  if (mime?.includes('webp')) return 'webp'
  if (mime?.includes('svg')) return 'svg'
  return 'png'
}

// Parse orgs
const source = fs.readFileSync(path.join(root, 'src', 'data', 'nationalOrgs.ts'), 'utf8')
const orgs = []
for (const m of source.matchAll(
  /mk(?:Frat|Sorority|Nphc|Mgc)\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/g
)) {
  orgs.push({ id: m[1], orgName: m[2], nickname: m[3], letters: m[4] })
}

// Title overrides when Wikipedia page title ≠ orgName
const TITLE_OVERRIDES = {
  farmhouse: 'FarmHouse',
  triangle: 'Triangle Fraternity',
  aka: 'Alpha Kappa Alpha',
  'kappa-alpha-order': 'Kappa Alpha Order',
  'phi-gamma-delta': 'Phi Gamma Delta',
  'lambda-upsilon-lambda': 'Lambda Upsilon Lambda',
  'sigma-lambda-beta': 'Sigma Lambda Beta',
  'sigma-lambda-gamma': 'Sigma Lambda Gamma',
  'delta-phi-omega': 'Delta Phi Omega',
  'kappa-delta-chi': 'Kappa Delta Chi',
  'lambda-theta-alpha': 'Lambda Theta Alpha',
}

fs.mkdirSync(outDir, { recursive: true })

const resume = process.argv.includes('--resume')
const wipe = !resume

// On full run, clear old fake/wrong assets. On --resume, keep existing downloads.
if (wipe) {
  for (const f of fs.readdirSync(outDir)) {
    if (f === 'SOURCES.json' || f === 'agora.svg' || f === 'agora.png') continue
    const p = path.join(outDir, f)
    if (f.endsWith('.svg') && f !== 'agora.svg') fs.unlinkSync(p)
    if (/\.(png|jpg|jpeg|webp|gif)$/i.test(f)) fs.unlinkSync(p)
  }
}

const sourcesPath = path.join(outDir, 'SOURCES.json')
const sources = resume && fs.existsSync(sourcesPath)
  ? JSON.parse(fs.readFileSync(sourcesPath, 'utf8'))
  : {}
let ok = 0
let miss = 0
let skip = 0
const queue = orgs.slice(0, limit)

for (const org of queue) {
  const existing = ['.png', '.jpg', '.webp', '.gif', '.svg'].find((ext) =>
    fs.existsSync(path.join(outDir, `${org.id}${ext}`))
  )
  if (existing) {
    skip++
    continue
  }

  const wikiTitle = TITLE_OVERRIDES[org.id] ?? org.orgName
  try {
    await sleep(1400)
    const images = await pageImages(wikiTitle)
    const ranked = images
      .map((t) => ({ t, s: scoreImageTitle(t, org.orgName) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)

    if (ranked.length === 0) {
      miss++
      console.log('MISS', org.id, `(${wikiTitle})`)
      continue
    }

    let picked = null
    for (const cand of ranked.slice(0, 6)) {
      await sleep(700)
      const info = await imageInfo(cand.t)
      if (!info?.url) continue
      picked = { ...info, score: cand.s }
      break
    }

    if (!picked) {
      miss++
      console.log('MISS', org.id)
      continue
    }

    const ext = extFromMime(picked.mime, picked.url)
    const dest = path.join(outDir, `${org.id}.${ext}`)
    await download(picked.url, dest)
    sources[org.id] = {
      orgName: org.orgName,
      wikipediaTitle: wikiTitle,
      file: picked.fileTitle,
      sourceUrl: picked.fullUrl,
      local: `/crests/${org.id}.${ext}`,
      score: picked.score,
    }
    ok++
    console.log('OK', org.id, '←', picked.fileTitle)
    fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2))
  } catch (e) {
    miss++
    console.warn('FAIL', org.id, e.message)
    await sleep(5000)
  }
}

sources.agora = {
  orgName: 'Agora',
  local: '/crests/agora.svg',
  note: 'Product mark (generated)',
}

fs.writeFileSync(path.join(outDir, 'SOURCES.json'), JSON.stringify(sources, null, 2))
console.log(
  `\nDone: ${ok} new, ${skip} already present, ${miss} missing (lettermark fallback). Manifest: public/crests/SOURCES.json`
)