/**
 * Storage readiness Gate — profiles ↔ membership ↔ chapter_kv alignment
 * + one-chapter-per-user + password auth for real-chapter pilot.
 *
 * Same credential resolution as Gate A (Management API preferred).
 * Usage: node scripts/test-storage-readiness.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

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

function projectRefFromUrl(url) {
  const m = url?.match(/https:\/\/([^.]+)\.supabase\.co/)
  return m?.[1] ?? null
}

function loadLocalSupabaseEnv() {
  try {
    const out = execSync('npx supabase status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const env = {}
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!m) continue
      env[m[1]] = m[2].replace(/^"|"$/g, '')
    }
    return {
      url: env.API_URL || env.SUPABASE_URL,
      anon: env.ANON_KEY || env.SUPABASE_ANON_KEY,
      service: env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
      source: 'local-supabase',
    }
  } catch (e) {
    return { error: e.message || String(e) }
  }
}

async function loadCloudViaManagementApi(fileEnv) {
  const accessToken = fileEnv.SUPABASE_ACCESS_TOKEN
  const url = fileEnv.STAGING_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL || ''
  const ref =
    fileEnv.STAGING_SUPABASE_PROJECT_REF ||
    fileEnv.SUPABASE_PROJECT_REF ||
    projectRefFromUrl(url)
  if (!accessToken || !url || !ref) {
    return {
      error:
        'Need SUPABASE_ACCESS_TOKEN and VITE_SUPABASE_URL (or STAGING_SUPABASE_URL) in .env.local',
    }
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const body = await res.text()
  if (!res.ok) {
    return { error: `Management API keys ${res.status}: ${body.slice(0, 200)}` }
  }
  let keys
  try {
    keys = JSON.parse(body)
  } catch {
    return { error: 'Management API returned non-JSON api-keys payload' }
  }
  const anon =
    keys.find((k) => k.name === 'anon')?.api_key ||
    keys.find((k) => k.name === 'default' && String(k.api_key || '').startsWith('eyJ'))?.api_key
  const service = keys.find((k) => k.name === 'service_role')?.api_key
  if (!anon || !service) {
    return { error: 'Management API response missing anon or service_role key' }
  }
  return { url, anon, service, source: `management-api:${ref}` }
}

const fileEnv = { ...process.env, ...loadEnvLocal() }

let url = fileEnv.STAGING_SUPABASE_URL || ''
let anon = fileEnv.STAGING_SUPABASE_ANON_KEY || ''
let service = fileEnv.STAGING_SUPABASE_SERVICE_ROLE_KEY || ''
let source = 'staging-env'

if (!url || !anon || !service) {
  const cloud = await loadCloudViaManagementApi(fileEnv)
  if (cloud.url && cloud.anon && cloud.service) {
    url = cloud.url
    anon = cloud.anon
    service = cloud.service
    source = cloud.source
  } else {
    const local = loadLocalSupabaseEnv()
    if (local.url && local.anon && local.service) {
      url = local.url
      anon = local.anon
      service = local.service
      source = local.source
    } else {
      console.error('Storage Gate blocked: could not resolve Supabase credentials.')
      if (cloud.error) console.error('Cloud:', cloud.error)
      if (local.error) console.error('Local:', local.error)
      process.exit(2)
    }
  }
}

console.log('Storage readiness Gate')
console.log('Source:', source)
console.log('Host:', new URL(url).host)

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function clientAs(accessToken) {
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function createUser(label) {
  const email = `store-${label}-${randomUUID().slice(0, 8)}@example.test`
  const password = `Test-${randomUUID()}!aA1`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser ${label}: ${error.message}`)
  const { data: session, error: signErr } = await admin.auth.signInWithPassword({
    email,
    password,
  })
  if (signErr || !session.session) {
    throw new Error(`signIn ${label}: ${signErr?.message || 'no session'}`)
  }
  return {
    id: data.user.id,
    email,
    password,
    token: session.session.access_token,
    sb: clientAs(session.session.access_token),
  }
}

async function cleanupUser(userId) {
  await admin.from('chapter_memberships').delete().eq('user_id', userId)
  await admin.from('profiles').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)
}

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

let founder
let member
let outsider
let chapterId
let chapterB
let joinCode

try {
  founder = await createUser('founder')
  member = await createUser('member')
  outsider = await createUser('outsider')

  const suffix = randomUUID().slice(0, 6)
  const designation = `StoreGate-${suffix}`

  // ── Password auth works for returning users ──
  {
    const anonClient = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: founder.email,
      password: founder.password,
    })
    record(
      'password sign-in works',
      !error && Boolean(data.session?.access_token),
      error?.message
    )
  }

  // ── Create chapter + membership bridge ──
  {
    const { data, error } = await founder.sb.rpc('create_chapter', {
      p_org_id: 'ato',
      p_designation: designation,
      p_university: `Store U ${suffix}`,
      p_org_name: 'ATO',
      p_app_member_id: 'm-founder-store',
      p_first_name: 'Founder',
      p_last_name: 'Store',
      p_email: founder.email,
    })
    if (error || !data) {
      record('create_chapter', false, error?.message || 'no id')
      throw new Error('create_chapter failed')
    }
    chapterId = String(data)
    record('create_chapter', true, chapterId)
  }

  {
    const { data, error } = await founder.sb
      .from('chapter_memberships')
      .select('user_id, app_member_id, role, chapter_id, is_founder')
      .eq('user_id', founder.id)
      .maybeSingle()
    const ok =
      !error &&
      data?.chapter_id === chapterId &&
      data?.app_member_id === 'm-founder-store' &&
      data?.role === 'President' &&
      data?.is_founder === true
    record(
      'membership links user_id ↔ app_member_id ↔ chapter',
      ok,
      error?.message || JSON.stringify(data)
    )
  }

  // ── Profiles table (person identity) ──
  {
    const { error } = await founder.sb.from('profiles').upsert({
      id: founder.id,
      email: founder.email,
      first_name: 'Founder',
      last_name: 'Store',
      phone: '555-1000',
      avatar: 'FS',
    })
    record('profiles upsert for signed-in user', !error, error?.message)

    const { data, error: readErr } = await founder.sb
      .from('profiles')
      .select('id, email, first_name, last_name, phone')
      .eq('id', founder.id)
      .maybeSingle()
    const ok =
      !readErr &&
      data?.email === founder.email &&
      data?.first_name === 'Founder' &&
      data?.phone === '555-1000'
    record('profiles read matches written person fields', ok, JSON.stringify(data))
  }

  // ── chapter_kv roster blob (shared chapter data) ──
  {
    const roster = [
      {
        id: 'm-founder-store',
        firstName: 'Founder',
        lastName: 'Store',
        email: founder.email,
        phone: '555-1000',
      },
    ]
    const { error } = await founder.sb.from('chapter_kv').upsert({
      chapter_id: chapterId,
      key: 'chapter-os-roster-members',
      value: roster,
      updated_at: new Date().toISOString(),
    })
    record('founder can write roster to chapter_kv', !error, error?.message)

    const { data, error: readErr } = await founder.sb
      .from('chapter_kv')
      .select('key, value')
      .eq('chapter_id', chapterId)
      .eq('key', 'chapter-os-roster-members')
      .maybeSingle()
    const rows = data?.value
    const ok =
      !readErr &&
      Array.isArray(rows) &&
      rows[0]?.id === 'm-founder-store' &&
      rows[0]?.email === founder.email
    record('chapter_kv roster round-trip accurate', ok, JSON.stringify(rows?.[0]))
  }

  // ── Join code + member join aligns membership + can read kv ──
  {
    const { data, error } = await founder.sb
      .from('chapters')
      .select('join_code')
      .eq('id', chapterId)
      .maybeSingle()
    joinCode = data?.join_code ? String(data.join_code) : ''
    record('chapter join_code present', Boolean(joinCode) && !error, joinCode || error?.message)
  }

  {
    const { data, error } = await member.sb.rpc('join_chapter', {
      p_code: joinCode,
      p_app_member_id: 'm-member-store',
      p_first_name: 'Member',
      p_last_name: 'Store',
      p_email: member.email,
    })
    record('member join_chapter', !error && data === chapterId, error?.message)

    await member.sb.from('profiles').upsert({
      id: member.id,
      email: member.email,
      first_name: 'Member',
      last_name: 'Store',
      phone: '555-2000',
    })

    const { data: mem } = await member.sb
      .from('chapter_memberships')
      .select('app_member_id, role')
      .eq('user_id', member.id)
      .maybeSingle()
    record(
      'joined member app_member_id lined up',
      mem?.app_member_id === 'm-member-store' && mem?.role === 'ActiveMember',
      JSON.stringify(mem)
    )

    // Member can read roster kv after join
    const { data: kv, error: kvErr } = await member.sb
      .from('chapter_kv')
      .select('value')
      .eq('chapter_id', chapterId)
      .eq('key', 'chapter-os-roster-members')
      .maybeSingle()
    record(
      'joined member can read chapter roster kv',
      !kvErr && Array.isArray(kv?.value),
      kvErr?.message
    )
  }

  // ── Outsider cannot read chapter_kv ──
  {
    const { data, error } = await outsider.sb
      .from('chapter_kv')
      .select('key')
      .eq('chapter_id', chapterId)
    const empty = !error && (data?.length ?? 0) === 0
    record(
      'non-member cannot read chapter_kv rows',
      empty || Boolean(error),
      error?.message || `rows=${data?.length}`
    )
  }

  // ── One chapter per user (RPC) ──
  {
    const { error } = await founder.sb.rpc('create_chapter', {
      p_org_id: 'ato',
      p_designation: `StoreGate-B-${suffix}`,
      p_university: `Other U ${suffix}`,
      p_app_member_id: 'm-founder-b',
      p_first_name: 'Founder',
      p_last_name: 'Two',
      p_email: founder.email,
    })
    record(
      'second create_chapter blocked (one chapter)',
      Boolean(error) && /already a member/i.test(error.message),
      error?.message
    )
  }

  {
    // Outsider creates another chapter, then member (already in first) cannot join it
    const { data: bId, error: bErr } = await outsider.sb.rpc('create_chapter', {
      p_org_id: 'ato',
      p_designation: `StoreGate-C-${suffix}`,
      p_university: `Third U ${suffix}`,
      p_app_member_id: 'm-out',
      p_first_name: 'Out',
      p_last_name: 'Sider',
      p_email: outsider.email,
    })
    if (bErr || !bId) {
      record('outsider create second chapter for exclusivity test', false, bErr?.message)
    } else {
      chapterB = String(bId)
      const { data: ch } = await outsider.sb
        .from('chapters')
        .select('join_code')
        .eq('id', chapterB)
        .maybeSingle()
      const codeB = ch?.join_code
      const { error } = await member.sb.rpc('join_chapter', {
        p_code: codeB,
        p_app_member_id: 'm-member-b',
        p_first_name: 'Member',
        p_last_name: 'Two',
        p_email: member.email,
      })
      record(
        'second join_chapter blocked (one chapter)',
        Boolean(error) && /already a member/i.test(error.message),
        error?.message
      )
    }
  }

  // ── Membership count (as founder — memberships are RLS-scoped) ──
  {
    const { data: rows, error } = await founder.sb
      .from('chapter_memberships')
      .select('id, chapter_id, app_member_id')
      .eq('user_id', founder.id)
    record(
      'founder has exactly one membership row',
      !error && Array.isArray(rows) && rows.length === 1,
      error?.message || `count=${rows?.length} ${JSON.stringify(rows)}`
    )
  }

  // ── UNIQUE(user_id): RPC already blocks; also confirm direct insert cannot add a 2nd row ──
  {
    const { error: dupErr } = await founder.sb.from('chapter_memberships').insert({
      chapter_id: chapterB || chapterId,
      user_id: founder.id,
      app_member_id: `m-dup-${randomUUID().slice(0, 6)}`,
      role: 'ActiveMember',
      is_founder: false,
    })
    record(
      'direct membership insert blocked for second chapter',
      Boolean(dupErr),
      dupErr?.message || 'UNEXPECTED allowed duplicate membership'
    )
  }
} catch (e) {
  record('suite aborted', false, e instanceof Error ? e.message : String(e))
} finally {
  try {
    for (const id of [chapterId, chapterB]) {
      if (!id) continue
      await admin.from('chapter_kv').delete().eq('chapter_id', id)
      await admin.from('chapter_officer_seats').delete().eq('chapter_id', id)
      await admin.from('chapter_memberships').delete().eq('chapter_id', id)
      await admin.from('chapter_members').delete().eq('chapter_id', id)
      await admin.from('chapters').delete().eq('id', id)
    }
    for (const u of [founder, member, outsider]) {
      if (u?.id) await cleanupUser(u.id)
    }
  } catch (e) {
    console.warn('cleanup warning:', e instanceof Error ? e.message : e)
  }
}

const failed = results.filter((r) => !r.ok)
console.log('\n── Storage readiness summary ──')
console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`)
if (failed.length) {
  console.log('Failed:')
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`)
  process.exit(1)
}
console.log('All storage readiness checks passed.')
process.exit(0)
