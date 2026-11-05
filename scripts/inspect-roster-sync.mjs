import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'

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
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    env[trimmed.slice(0, eq).trim()] = val
  }
  return env
}

const env = { ...process.env, ...loadEnvLocal() }
const url = env.VITE_SUPABASE_URL
const accessToken = env.SUPABASE_ACCESS_TOKEN
const ref = (url.match(/https:\/\/([^.]+)\.supabase\.co/) || [])[1]

const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
  headers: { Authorization: `Bearer ${accessToken}` },
})
const keys = await keysRes.json()
const service = keys.find((k) => k.name === 'service_role')?.api_key
const sb = createClient(url, service)

const { data: chapters } = await sb
  .from('chapters')
  .select('id, chapter_designation, university, created_at')
  .order('created_at', { ascending: false })
  .limit(5)

for (const c of chapters ?? []) {
  const { data: mem } = await sb
    .from('chapter_memberships')
    .select('user_id, app_member_id, role, is_founder, joined_at')
    .eq('chapter_id', c.id)
  const { data: cm } = await sb
    .from('chapter_members')
    .select('first_name, last_name, email, role, user_id')
    .eq('chapter_id', c.id)
  const { data: kv } = await sb
    .from('chapter_kv')
    .select('value, updated_at')
    .eq('chapter_id', c.id)
    .eq('key', 'chapter-os-roster-members')
    .maybeSingle()
  const roster = Array.isArray(kv?.value) ? kv.value : []
  console.log('\n===', c.chapter_designation, c.university, c.id)
  console.log(
    'memberships',
    mem?.map((m) => `${m.role} ${m.app_member_id} founder=${m.is_founder}`)
  )
  console.log(
    'chapter_members SQL',
    cm?.map((m) => `${m.first_name} ${m.last_name} <${m.email}> ${m.role}`)
  )
  console.log(
    'kv roster',
    roster.length,
    'updated',
    kv?.updated_at,
    roster.map((m) => `${m.firstName} ${m.lastName} (${m.id})`)
  )
}
