/**
 * Insert a pilot chapter row with join_code via Supabase Management API (SQL).
 * Enables resolve_join_code / cross-device invite validation without OTP inbox.
 * Real founders should still complete onboarding with a deliverable email.
 *
 * Usage: npm run seed-cloud-chapter-sql
 */
import { readFileSync, existsSync } from 'node:fs'

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

function projectRefFromUrl(url) {
  const m = url?.match(/https:\/\/([^.]+)\.supabase\.co/)
  return m?.[1] ?? null
}

const env = { ...process.env, ...loadEnvLocal() }
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = env.SUPABASE_PROJECT_REF || projectRefFromUrl(env.VITE_SUPABASE_URL)

if (!accessToken || !projectRef) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or VITE_SUPABASE_URL')
  process.exit(1)
}

const joinCode = `CHAPTER-PILOT-${Date.now().toString(36).slice(-6).toUpperCase()}`
const designation = 'Pilot Chapter'
const university = 'University of Florida'

const sql = `
INSERT INTO public.chapters (
  org_id, org_name, nickname, letters,
  chapter_designation, university, semester,
  primary_color, secondary_color, accent_color,
  join_code, invite_codes
)
SELECT
  'ato',
  'Alpha Tau Omega',
  'ATO',
  'ΑΤΩ',
  '${designation}',
  '${university}',
  'Fall 2026',
  '#1a1a1a',
  '#333333',
  '#c4a35a',
  '${joinCode}',
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.chapters
  WHERE join_code IS NOT NULL AND join_code <> ''
);
`

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const body = await res.text()
if (!res.ok) {
  console.error(`SQL failed (${res.status}):`, body.slice(0, 600))
  process.exit(1)
}

console.log('✓ Pilot chapter row inserted (if none existed with join_code)')
console.log('  join_code:', joinCode)
console.log('  invite link: https://ato-chapter-os.vercel.app/join?code=' + encodeURIComponent(joinCode))

const { spawnSync } = await import('node:child_process')
spawnSync('node', ['scripts/verify-supabase-join.mjs'], { stdio: 'inherit', cwd: process.cwd() })
