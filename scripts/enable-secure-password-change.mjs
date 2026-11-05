/**
 * Turn on Supabase "Secure password change" so updateUser({ password })
 * requires the email nonce from auth.reauthenticate().
 *
 * Usage: node scripts/enable-secure-password-change.mjs
 */
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
const accessToken = env.SUPABASE_ACCESS_TOKEN
const url = env.VITE_SUPABASE_URL || env.STAGING_SUPABASE_URL || ''
const ref =
  env.SUPABASE_PROJECT_REF ||
  (url.match(/https:\/\/([^.]+)\.supabase\.co/) || [])[1]

if (!accessToken || !ref) {
  console.error('Need SUPABASE_ACCESS_TOKEN and VITE_SUPABASE_URL in .env.local')
  process.exit(1)
}

const candidates = [
  { security_update_password_require_reauthentication: true },
  { SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION: true },
]

let lastBody = ''
for (const payload of candidates) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  lastBody = await res.text()
  if (res.ok) {
    console.log('✓ Secure password change enabled on project', ref)
    console.log('  Key:', Object.keys(payload)[0])
    process.exit(0)
  }
  console.warn('Attempt failed', res.status, Object.keys(payload)[0], lastBody.slice(0, 200))
}

console.error('Could not enable secure password change:', lastBody.slice(0, 600))
process.exit(1)
