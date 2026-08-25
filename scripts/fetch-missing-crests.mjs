/**
 * Second-pass fetch for orgs Wikipedia didn't match on first strict pass.
 *   node scripts/fetch-missing-crests.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'crests')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const UA = 'AgoraChapterOS/1.0 (crest research)'

const missing = [
  ['alpha-gamma-rho', 'Alpha Gamma Rho'],
  ['farmhouse', 'FarmHouse'],
  ['sigma-alpha-epsilon', 'Sigma Alpha Epsilon'],
  ['sigma-phi-epsilon', 'Sigma Phi Epsilon'],
  ['theta-delta-chi', 'Theta Delta Chi'],
  ['alpha-omicron-pi', 'Alpha Omicron Pi'],
  ['delta-phi-epsilon', 'Delta Phi Epsilon'],
  ['gamma-phi-beta', 'Gamma Phi Beta'],
  ['gamma-sigma-sigma', 'Gamma Sigma Sigma'],
  ['sigma-delta-tau', 'Sigma Delta Tau'],
  ['alpha-phi-alpha', 'Alpha Phi Alpha'],
  ['delta-sigma-theta', 'Delta Sigma Theta'],
  ['iota-phi-theta', 'Iota Phi Theta'],
  ['kappa-alpha-psi', 'Kappa Alpha Psi'],
  ['omega-psi-phi', 'Omega Psi Phi'],
  ['phi-beta-sigma', 'Phi Beta Sigma'],
  ['zeta-phi-beta', 'Zeta Phi Beta'],
  ['sigma-lambda-beta', 'Sigma Lambda Beta'],
  ['delta-phi-omega', 'Delta Phi Omega'],
]

async function wikiJson(url) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const text = await res.text()
    if (text.startsWith('You are') || res.status === 429) {
      await sleep(10000 * (i + 1))
      continue
    }
    return JSON.parse(text)
  }
  throw new Error('rate')
}

function score(t, name) {
  const x = t.toLowerCase()
  if (
    /badge|flag|logo|map|building|photo|portrait|commons-logo|padlock|ambox|wikimedia|wordmark|edit|chapter house|hq|headquarters/.test(
      x
    )
  ) {
    return -100
  }
  // Reject generic "house" photos, but allow FarmHouse org
  if (/\bhouse\b/.test(x) && !x.includes('farmhouse') && name !== 'FarmHouse') return -100
  let s = 0
  if (/coat of arms|coat_of_arms/.test(x)) s += 20
  if (/\bcrest\b|_crest| crest/.test(x)) s += 16
  if (/\bshield\b|_shield/.test(x)) s += 14
  if (/\barms\b/.test(x)) s += 10
  const bits = name.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  s += bits.filter((b) => x.includes(b)).length * 3
  return s >= 8 ? s : -1
}

async function pageImages(title) {
  const u =
    'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(title) +
    '&prop=images&imlimit=80&format=json&origin=*&redirects=1'
  const j = await wikiJson(u)
  const p = Object.values(j.query.pages)[0]
  return (p.images || []).map((i) => i.title)
}

async function imageInfo(file) {
  const u =
    'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(file) +
    '&prop=imageinfo&iiprop=url|mime&iiurlwidth=512&format=json&origin=*'
  const j = await wikiJson(u)
  const p = Object.values(j.query.pages)[0]
  return p.imageinfo?.[0] || null
}

async function commonsSearch(q) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(q) +
    '&srnamespace=6&format=json&origin=*&srlimit=8'
  const j = await wikiJson(u)
  return (j.query?.search || []).map((h) => h.title)
}

const sources = JSON.parse(fs.readFileSync(path.join(outDir, 'SOURCES.json'), 'utf8'))

for (const [id, name] of missing) {
  if (['.png', '.jpg', '.gif', '.webp', '.svg'].some((e) => fs.existsSync(path.join(outDir, id + e)))) {
    console.log('SKIP', id)
    continue
  }
  try {
    await sleep(1600)
    let imgs = await pageImages(name)
    let ranked = imgs
      .map((t) => ({ t, s: score(t, name) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)

    if (!ranked.length) {
      await sleep(1200)
      const commons = await commonsSearch(`"${name}" (crest OR "coat of arms" OR shield)`)
      ranked = commons
        .map((t) => ({ t, s: score(t, name) + 5 }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
    }

    console.log(id, '→', ranked[0]?.t ?? 'none')
    if (!ranked.length) continue

    await sleep(900)
    const ii = await imageInfo(ranked[0].t)
    if (!ii) continue
    const url = ii.thumburl || ii.url
    let ext = 'png'
    if (ii.mime?.includes('gif') || url.includes('.gif')) ext = 'gif'
    else if (ii.mime?.includes('jpeg') || url.includes('.jpg')) ext = 'jpg'
    else if (ii.mime?.includes('webp')) ext = 'webp'
    // SVG thumbs come back as PNG
    const dest = path.join(outDir, `${id}.${ext}`)
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    sources[id] = {
      orgName: name,
      file: ranked[0].t,
      sourceUrl: ii.url,
      local: `/crests/${id}.${ext}`,
    }
    console.log('OK', id)
    fs.writeFileSync(path.join(outDir, 'SOURCES.json'), JSON.stringify(sources, null, 2))
  } catch (e) {
    console.log('FAIL', id, e.message)
    await sleep(8000)
  }
}

console.log('done')
