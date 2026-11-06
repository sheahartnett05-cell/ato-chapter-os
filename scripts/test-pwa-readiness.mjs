/**
 * Local PWA readiness checks against a running origin (preview or production).
 * Usage: node scripts/test-pwa-readiness.mjs [baseUrl]
 */
const base = (process.argv[2] || 'http://127.0.0.1:4173').replace(/\/$/, '')

const failures = []
const notes = []

function fail(msg) {
  failures.push(msg)
  console.log(`FAIL  ${msg}`)
}
function pass(msg) {
  console.log(`PASS  ${msg}`)
}
function note(msg) {
  notes.push(msg)
  console.log(`NOTE  ${msg}`)
}

async function get(path) {
  const res = await fetch(`${base}${path}`, { redirect: 'manual' })
  const buf = Buffer.from(await res.arrayBuffer())
  return { res, buf, text: buf.toString('utf8') }
}

function isPng(buf) {
  return (
    buf.length > 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
}

async function main() {
  console.log(`PWA readiness @ ${base}\n`)

  const html = await get('/')
  if (!html.res.ok) fail(`GET / → ${html.res.status}`)
  else pass('GET /')

  if (!html.text.includes('rel="manifest"')) fail('index missing manifest link')
  else pass('index links manifest')

  if (!html.text.includes('apple-touch-icon')) fail('index missing apple-touch-icon')
  else pass('index links apple-touch-icon')

  const man = await get('/manifest.webmanifest')
  if (!man.res.ok) fail(`manifest HTTP ${man.res.status}`)
  else pass(`manifest HTTP ${man.res.status}`)

  const ct = man.res.headers.get('content-type') || ''
  if (!/manifest|json/i.test(ct)) note(`manifest content-type is "${ct}" (prefer application/manifest+json)`)
  else pass(`manifest content-type ${ct}`)

  let manifest
  try {
    manifest = JSON.parse(man.text)
    pass('manifest JSON parses')
  } catch {
    fail('manifest is not valid JSON (SPA rewrite may be returning HTML)')
    console.log(man.text.slice(0, 200))
  }

  if (manifest) {
    for (const key of ['name', 'short_name', 'start_url', 'display', 'icons']) {
      if (manifest[key] == null || (Array.isArray(manifest[key]) && !manifest[key].length)) {
        fail(`manifest missing ${key}`)
      } else pass(`manifest.${key}`)
    }
    if (manifest.display !== 'standalone' && manifest.display !== 'fullscreen') {
      fail(`display should be standalone/fullscreen, got ${manifest.display}`)
    }
    const pngs = (manifest.icons || []).filter((i) => i.type === 'image/png')
    const has192 = pngs.some((i) => String(i.sizes).includes('192'))
    const has512 = pngs.some((i) => String(i.sizes).includes('512'))
    if (!has192) fail('manifest needs 192x192 PNG icon (Chrome installability)')
    else pass('manifest has 192 PNG')
    if (!has512) fail('manifest needs 512x512 PNG icon (Chrome installability)')
    else pass('manifest has 512 PNG')
  }

  for (const icon of ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png']) {
    const r = await get(icon)
    if (!r.res.ok) fail(`${icon} → ${r.res.status}`)
    else if (!isPng(r.buf)) fail(`${icon} is not a PNG`)
    else pass(`${icon} (${r.buf.length} bytes)`)
  }

  const sw = await get('/sw.js')
  if (!sw.res.ok) fail(`sw.js → ${sw.res.status}`)
  else pass('sw.js reachable')
  if (!sw.text.includes('addEventListener(') || !sw.text.includes('fetch')) {
    fail('sw.js missing fetch handler')
  } else pass('sw.js has fetch handler')
  if (!sw.text.includes('chaptera-shell-')) note('sw cache name not found')
  else pass(`sw cache token present`)

  console.log('\n---')
  if (failures.length) {
    console.log(`RESULT: FAIL (${failures.length})`)
    process.exitCode = 1
  } else {
    console.log('RESULT: PASS — installable criteria look good on this origin')
    console.log('Still verify on a phone: Settings → Install app / Add to Home Screen, then reopen standalone.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
