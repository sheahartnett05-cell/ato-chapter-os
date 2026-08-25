/**
 * Download professional coat-of-arms / crest images from Wikimedia Commons.
 *
 *   node scripts/enrich-org-crests-wikimedia.mjs           # manual map + search
 *   node scripts/enrich-org-crests-wikimedia.mjs --manual  # manual map only
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'crests')
const manualOnly = process.argv.includes('--manual')

const COMMONS_FILES = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'wikimedia-crest-map.json'), 'utf8')
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function commonsThumb(fileTitle) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(fileTitle) +
    '&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*'
  const res = await fetch(url)
  const text = await res.text()
  if (text.startsWith('You are making')) throw new Error('Wikimedia rate limit')
  const json = JSON.parse(text)
  const page = Object.values(json.query.pages)[0]
  if (page.missing) return null
  return page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url
}

async function searchCommons(orgName) {
  const q = `${orgName} coat of arms`
  await sleep(2500)
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(q) +
    '&srnamespace=6&format=json&origin=*&srlimit=6'
  const res = await fetch(url)
  const text = await res.text()
  if (text.startsWith('You are making')) return null
  const json = JSON.parse(text)
  const hits = json.query?.search ?? []
  const n = orgName.toLowerCase()
  return (
    hits.find((h) => {
      const t = h.title.toLowerCase()
      return (
        t.includes(n.split(' ')[0]) &&
        (t.includes('coat') || t.includes('crest') || t.includes('badge') || t.includes('shield'))
      )
    })?.title ?? null
  )
}

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

const source = fs.readFileSync(path.join(root, 'src', 'data', 'nationalOrgs.ts'), 'utf8')
const orgNames = { agora: 'Agora' }
for (const m of source.matchAll(/mk(?:Frat|Sorority|Nphc|Mgc)\('([^']+)',\s*'([^']+)'/g)) {
  orgNames[m[1]] = m[2]
}

fs.mkdirSync(outDir, { recursive: true })

let ok = 0
const ids = manualOnly ? Object.keys(COMMONS_FILES) : Object.keys(orgNames)

for (const id of ids) {
  const png = path.join(outDir, `${id}.png`)
  const jpg = path.join(outDir, `${id}.jpg`)
  if (fs.existsSync(png) || fs.existsSync(jpg)) continue

  const name = orgNames[id]
  let fileTitle = COMMONS_FILES[id] ?? null
  if (!fileTitle && !manualOnly && name) {
    fileTitle = await searchCommons(name)
  }
  if (!fileTitle) continue

  try {
    await sleep(2500)
    const thumb = await commonsThumb(fileTitle)
    if (!thumb) {
      console.warn('Missing:', id, fileTitle)
      continue
    }
    const ext =
      fileTitle.endsWith('.svg') || thumb.includes('.svg')
        ? 'svg'
        : thumb.includes('.jpg') || thumb.includes('.jpeg')
          ? 'jpg'
          : 'png'
    // Don't overwrite generated SVG with another SVG from commons unless it's a dedicated file
    if (ext === 'svg' && fs.existsSync(path.join(outDir, `${id}.svg`))) {
      const dest = path.join(outDir, `${id}-commons.svg`)
      await download(thumb, dest)
      console.log('OK (alt)', id)
    } else {
      await download(thumb, path.join(outDir, `${id}.${ext}`))
      console.log('OK', id, '←', fileTitle)
    }
    ok++
  } catch (e) {
    console.warn('FAIL', id, e.message)
  }
}

console.log(`Downloaded ${ok} Wikimedia crest(s)`)
