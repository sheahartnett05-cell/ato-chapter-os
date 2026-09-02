/**
 * Verify Supabase join-code setup (run after migrations).
 * Usage: node scripts/verify-supabase-join.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  if (!existsSync('.env.local')) return {}
  let text = readFileSync('.env.local', 'utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }
  return env
}

const env = { ...process.env, ...loadEnvLocal() }
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Missing or empty Supabase env in .env.local')
  console.error('  VITE_SUPABASE_URL:', url ? 'set' : 'MISSING')
  console.error('  VITE_SUPABASE_ANON_KEY:', key ? 'set' : 'MISSING')
  console.error('Copy .env.example → .env.local and paste keys from Supabase → Project Settings → API')
  process.exit(1)
}

const sb = createClient(url, key)

console.log('Supabase join setup check')
console.log('Project:', url)

let ok = true

const { data: founder, error: founderErr } = await sb.rpc('resolve_join_code', {
  p_code: 'CHAPTER-FOUNDER',
})
if (founderErr) {
  console.error('✗ resolve_join_code RPC failed:', founderErr.message)
  ok = false
} else if (founder?.code === 'CHAPTER-FOUNDER') {
  console.log('✓ resolve_join_code — CHAPTER-FOUNDER works')
} else {
  console.error('✗ resolve_join_code — unexpected CHAPTER-FOUNDER response', founder)
  ok = false
}

const { data: bad, error: badErr } = await sb.rpc('resolve_join_code', {
  p_code: 'NOT-A-REAL-CODE-XYZ',
})
if (badErr) {
  console.error('✗ resolve_join_code (invalid) error:', badErr.message)
  ok = false
} else if (bad === null) {
  console.log('✓ resolve_join_code — invalid code returns null')
} else {
  console.error('✗ resolve_join_code — expected null for bad code, got', bad)
  ok = false
}

const { data: chapters, error: chErr } = await sb
  .from('chapters')
  .select('id, chapter_designation, university, join_code, invite_codes')
  .not('join_code', 'is', null)
  .limit(5)

const { count: chapterCount } = await sb
  .from('chapters')
  .select('id', { count: 'exact', head: true })

const { error: syncRpcErr } = await sb.rpc('sync_chapter_join_codes', {
  p_chapter_id: '00000000-0000-0000-0000-000000000000',
  p_join_code: null,
  p_invite_codes: [],
})

if (chErr) {
  if (/invite_codes|join_code|column/i.test(chErr.message)) {
    console.error('✗ chapters table missing join columns — run migrations 280 + 290')
  } else {
    console.error('✗ chapters query failed:', chErr.message)
  }
  ok = false
} else {
  console.log(
    `✓ chapters table OK (${chapterCount ?? 0} total, ${chapters?.length ?? 0} with join_code)`
  )
  for (const c of chapters ?? []) {
    const extras = Array.isArray(c.invite_codes) ? c.invite_codes.length : 0
    console.log(`  · ${c.chapter_designation} @ ${c.university} → ${c.join_code} (+${extras} in invite_codes)`)
  }
  if ((chapterCount ?? 0) > 0 && (chapters?.length ?? 0) === 0) {
    console.log('  → Chapters exist but join_code is empty. Open the app signed in — codes auto-publish on load.')
  }
}

if (syncRpcErr && /sync_chapter_join_codes|42883|does not exist/i.test(syncRpcErr.message)) {
  console.log('○ sync_chapter_join_codes RPC missing — using direct table update fallback')
  console.log('  Run: npm run apply-supabase-migrations -- 20260330000000')
} else if (syncRpcErr && !/not authorized|not authenticated/i.test(syncRpcErr.message)) {
  console.warn('○ sync_chapter_join_codes probe:', syncRpcErr.message)
} else {
  console.log('✓ sync_chapter_join_codes RPC installed')
}

if (!ok) process.exit(1)
console.log('\nAll checks passed. Found a chapter in the app to publish a join code to the cloud.')
