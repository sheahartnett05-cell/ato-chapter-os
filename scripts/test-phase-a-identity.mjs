/**
 * Gate A — server-owned identity / role tests.
 *
 * Requires LOCAL Supabase (`supabase start`) or an explicit staging project.
 * Refuses to run against production hosts.
 *
 * Env (staging):
 *   STAGING_SUPABASE_URL
 *   STAGING_SUPABASE_ANON_KEY
 *   STAGING_SUPABASE_SERVICE_ROLE_KEY   (creates two test users)
 *
 * Or local:
 *   uses `supabase status -o env` when STAGING_* unset and Docker is up.
 *
 * Usage: node scripts/test-phase-a-identity.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const PROD_HOST_MARKERS = ['chapteramanager', 'agoragreek', 'prod', 'production']

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

function looksProduction(url) {
  try {
    const host = new URL(url).host.toLowerCase()
    return PROD_HOST_MARKERS.some((m) => host.includes(m))
  } catch {
    return true
  }
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

const fileEnv = { ...process.env, ...loadEnvLocal() }

let url = fileEnv.STAGING_SUPABASE_URL || ''
let anon = fileEnv.STAGING_SUPABASE_ANON_KEY || ''
let service = fileEnv.STAGING_SUPABASE_SERVICE_ROLE_KEY || ''
let source = 'staging-env'

if (!url || !anon || !service) {
  const local = loadLocalSupabaseEnv()
  if (local.url && local.anon && local.service) {
    url = local.url
    anon = local.anon
    service = local.service
    source = local.source
  } else {
    console.error('Gate A blocked: no local Supabase and no STAGING_* env.')
    console.error('Install Docker Desktop, run `npx supabase start`, apply migrations, then re-run.')
    console.error('Or set STAGING_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY for a non-prod project.')
    if (local.error) console.error('Local status error:', local.error)
    process.exit(2)
  }
}

if (looksProduction(url)) {
  console.error('Gate A refused: URL looks like production:', new URL(url).host)
  console.error('Use local supabase or an explicit staging project only.')
  process.exit(2)
}

console.log('Gate A identity tests')
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
  const email = `gate-a-${label}-${randomUUID().slice(0, 8)}@example.test`
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
    token: session.session.access_token,
    sb: clientAs(session.session.access_token),
  }
}

async function cleanupUser(userId) {
  await admin.from('chapter_memberships').delete().eq('user_id', userId)
  await admin.auth.admin.deleteUser(userId)
}

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

let founder
let member
let treasurer
let chapterId
let joinCode

try {
  founder = await createUser('founder')
  member = await createUser('member')
  treasurer = await createUser('treasurer')

  const suffix = randomUUID().slice(0, 6)
  const designation = `GateA-${suffix}`
  const university = `Test U ${suffix}`

  // Create chapter as founder
  {
    const { data, error } = await founder.sb.rpc('create_chapter', {
      p_org_id: 'ato',
      p_designation: designation,
      p_university: university,
      p_org_name: 'ATO',
      p_app_member_id: 'm-founder',
      p_first_name: 'Founder',
      p_last_name: 'One',
      p_email: founder.email,
    })
    if (error || !data) {
      record('create_chapter as founder', false, error?.message || 'no id')
      throw new Error('create_chapter failed; aborting suite')
    }
    chapterId = data
    record('create_chapter as founder', true, chapterId)
  }

  // Fetch join code
  {
    const { data, error } = await admin
      .from('chapters')
      .select('join_code')
      .eq('id', chapterId)
      .single()
    joinCode = data?.join_code
    record('chapter has join_code', Boolean(joinCode) && !error, joinCode || error?.message)
  }

  // Joining without a code fails
  {
    const { error } = await member.sb.rpc('join_chapter', { p_code: '' })
    record('joining without a code fails', Boolean(error), error?.message)
  }

  // Wrong code fails
  {
    const { error } = await member.sb.rpc('join_chapter', {
      p_code: 'NOT-A-REAL-CODE-XYZ',
    })
    record('wrong code fails', Boolean(error), error?.message)
  }

  // claim_or_create_chapter must not exist / not be executable
  {
    const { error } = await member.sb.rpc('claim_or_create_chapter', {
      p_org_id: 'ato',
      p_designation: designation,
      p_university: university,
      p_role: 'President',
      p_is_founder: true,
      p_app_member_id: 'm-evil',
    })
    record(
      'claim/join RPC cannot set role/founder (claim removed)',
      Boolean(error),
      error?.message || 'UNEXPECTED success'
    )
  }

  // Self membership insert denied
  {
    const { error } = await member.sb.from('chapter_memberships').insert({
      chapter_id: chapterId,
      user_id: member.id,
      app_member_id: 'm-self',
      role: 'President',
      is_founder: true,
    })
    record('member cannot self-insert membership', Boolean(error), error?.message)
  }

  // Join with valid code
  {
    const { data, error } = await member.sb.rpc('join_chapter', {
      p_code: joinCode,
      p_app_member_id: 'm-member',
      p_first_name: 'Member',
      p_last_name: 'Two',
      p_email: member.email,
    })
    record('join with valid code', !error && data === chapterId, error?.message)
  }

  // Join always ActiveMember / not founder
  {
    const { data, error } = await admin
      .from('chapter_memberships')
      .select('role, is_founder')
      .eq('chapter_id', chapterId)
      .eq('user_id', member.id)
      .single()
    const ok =
      !error && data?.role === 'ActiveMember' && data?.is_founder === false
    record('join cannot set role or founder flag', ok, JSON.stringify(data))
  }

  // Self role update denied
  {
    const { error } = await member.sb
      .from('chapter_memberships')
      .update({ role: 'President' })
      .eq('chapter_id', chapterId)
      .eq('user_id', member.id)
    record('member cannot self-promote via update', Boolean(error), error?.message)

    const { data } = await admin
      .from('chapter_memberships')
      .select('role')
      .eq('chapter_id', chapterId)
      .eq('user_id', member.id)
      .single()
    record('role still ActiveMember after self-promote attempt', data?.role === 'ActiveMember')
  }

  // Promote treasurer via president, then treasurer cannot demote president
  {
    const { error: joinT } = await treasurer.sb.rpc('join_chapter', {
      p_code: joinCode,
      p_app_member_id: 'm-treas',
      p_first_name: 'Treas',
      p_last_name: 'Three',
      p_email: treasurer.email,
    })
    if (joinT) throw new Error(joinT.message)

    const { error: setRole } = await founder.sb.rpc('set_member_role', {
      p_chapter_id: chapterId,
      p_user_id: treasurer.id,
      p_role: 'Treasurer',
    })
    record('president can set member role', !setRole, setRole?.message)

    const { error: demote } = await treasurer.sb.rpc('set_member_role', {
      p_chapter_id: chapterId,
      p_user_id: founder.id,
      p_role: 'ActiveMember',
    })
    record('treasurer cannot demote president', Boolean(demote), demote?.message)
  }

  // Last president cannot be removed
  {
    const { error } = await founder.sb.rpc('set_member_role', {
      p_chapter_id: chapterId,
      p_user_id: founder.id,
      p_role: 'ActiveMember',
    })
    record('last president cannot be demoted', Boolean(error), error?.message)
  }

  // President can assign seats
  {
    const { error } = await founder.sb.rpc('assign_officer_seat', {
      p_chapter_id: chapterId,
      p_seat_id: 'pos-treas',
      p_member_user_id: treasurer.id,
      p_title: 'Treasurer',
      p_function: 'treasurer',
    })
    record('president can assign seats', !error, error?.message)
  }

  // Seat capabilities grant matching writes (dues/budget via has_capability)
  {
    const { data: hasDues, error: e1 } = await treasurer.sb.rpc('has_capability', {
      p_chapter_id: chapterId,
      p_cap: 'dues',
    })
    const { data: hasRecruit, error: e2 } = await treasurer.sb.rpc('has_capability', {
      p_chapter_id: chapterId,
      p_cap: 'recruitment',
    })
    const { data: memberSetup } = await member.sb.rpc('has_capability', {
      p_chapter_id: chapterId,
      p_cap: 'setup',
    })
    record(
      'seat capabilities grant exactly matching writes',
      !e1 && !e2 && hasDues === true && hasRecruit === false && memberSetup === false,
      `dues=${hasDues} recruit=${hasRecruit} memberSetup=${memberSetup}`
    )

    // Treasurer may write member-writable? No — setup required for non-member keys.
    // Insert a setup key should fail for treasurer without setup cap.
    const { error: kvErr } = await treasurer.sb.from('chapter_kv').upsert({
      chapter_id: chapterId,
      key: 'chapter-os-features',
      value: { probe: true },
      updated_at: new Date().toISOString(),
    })
    record(
      'treasurer without setup cannot write officer config kv',
      Boolean(kvErr),
      kvErr?.message
    )

    const { error: rsvpOk } = await member.sb.from('chapter_kv').upsert({
      chapter_id: chapterId,
      key: 'chapter-os-rsvps',
      value: { probe: true },
      updated_at: new Date().toISOString(),
    })
    record('member can write member-writable kv key', !rsvpOk, rsvpOk?.message)
  }
} catch (e) {
  record('suite aborted', false, e instanceof Error ? e.message : String(e))
} finally {
  // Cleanup chapter + users (service role)
  try {
    if (chapterId) {
      await admin.from('chapter_kv').delete().eq('chapter_id', chapterId)
      await admin.from('chapter_officer_seats').delete().eq('chapter_id', chapterId)
      await admin.from('chapter_memberships').delete().eq('chapter_id', chapterId)
      await admin.from('chapter_members').delete().eq('chapter_id', chapterId)
      await admin.from('chapters').delete().eq('id', chapterId)
    }
    for (const u of [founder, member, treasurer]) {
      if (u?.id) await cleanupUser(u.id)
    }
  } catch (e) {
    console.warn('cleanup warning:', e instanceof Error ? e.message : e)
  }
}

const failed = results.filter((r) => !r.ok)
console.log('\n── Gate A summary ──')
console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`)
if (failed.length) {
  console.log('Failed:')
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`)
  process.exit(1)
}
console.log('All Gate A checks passed.')
process.exit(0)
