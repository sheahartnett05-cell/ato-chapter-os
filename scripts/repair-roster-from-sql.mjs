/**
 * One-shot: rebuild chapter_kv roster from chapter_memberships + chapter_members
 * for chapters where joiners exist in SQL but not in KV.
 */
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

function mergeById(a, b) {
  const map = new Map()
  for (const row of a) if (row?.id) map.set(row.id, row)
  for (const row of b) {
    if (!row?.id) continue
    const prev = map.get(row.id)
    if (!prev) map.set(row.id, row)
    else {
      map.set(row.id, {
        ...prev,
        ...row,
        firstName: row.firstName || prev.firstName,
        lastName: row.lastName || prev.lastName,
        email: row.email || prev.email,
        phone: row.phone || prev.phone,
      })
    }
  }
  return [...map.values()]
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

const { data: chapters } = await sb.from('chapters').select('id, chapter_designation, university')
for (const c of chapters ?? []) {
  const { data: memberships } = await sb
    .from('chapter_memberships')
    .select('user_id, app_member_id, role, is_founder')
    .eq('chapter_id', c.id)
  const { data: people } = await sb
    .from('chapter_members')
    .select('user_id, first_name, last_name, email, phone, role, status')
    .eq('chapter_id', c.id)
  const byUser = new Map((people ?? []).map((p) => [p.user_id, p]))
  const sqlRoster = (memberships ?? []).map((m) => {
    const p = byUser.get(m.user_id)
    const firstName = p?.first_name?.trim() || 'Member'
    const lastName = p?.last_name?.trim() || ''
    const role = m.role || 'ActiveMember'
    return {
      id: m.app_member_id,
      firstName,
      lastName,
      email: p?.email || `${m.app_member_id}@chapter.local`,
      phone: p?.phone || '',
      major: 'Undeclared',
      graduationYear: new Date().getFullYear() + 1,
      pledgeClass: 'Fall 2026',
      status: role === 'NewMember' ? 'New Member' : 'Active',
      isExec: !['ActiveMember', 'NewMember'].includes(role),
      role,
      birthday: '2000-01-01',
      shirtSize: 'M',
      emergencyContact: '',
      emergencyPhone: '',
      duesStatus: 'Outstanding',
      duesPaid: 0,
      duesExpected: 850,
      attendancePct: null,
      points: 0,
      avatar: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?',
    }
  })

  const { data: kv } = await sb
    .from('chapter_kv')
    .select('value')
    .eq('chapter_id', c.id)
    .eq('key', 'chapter-os-roster-members')
    .maybeSingle()
  const existing = Array.isArray(kv?.value) ? kv.value : []
  const merged = mergeById(existing, sqlRoster)

  const { error } = await sb.from('chapter_kv').upsert(
    {
      chapter_id: c.id,
      key: 'chapter-os-roster-members',
      value: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'chapter_id,key' }
  )
  if (error) {
    console.error('FAIL', c.chapter_designation, error.message)
    continue
  }
  console.log(
    '✓',
    c.chapter_designation,
    `kv ${existing.length} → ${merged.length}`,
    merged.map((m) => `${m.firstName} ${m.lastName}`).join(', ')
  )
}
