/**
 * Configure Supabase Auth to send OTP emails via Resend SMTP.
 *
 * Requires .env.local:
 *   RESEND_API_KEY=re_...
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_ACCESS_TOKEN=sbp_...  (Dashboard → Account → Access Tokens, Admin role)
 *
 * Optional:
 *   RESEND_FROM_EMAIL=onboarding@resend.dev
 *   RESEND_FROM_NAME=Agora
 *
 * Usage: npm run configure-resend
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
const resendKey = env.RESEND_API_KEY
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = env.SUPABASE_PROJECT_REF || projectRefFromUrl(env.VITE_SUPABASE_URL)
const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const fromName = env.RESEND_FROM_NAME || 'Agora'

if (!resendKey) {
  console.error('Missing RESEND_API_KEY in .env.local')
  process.exit(1)
}
if (!projectRef) {
  console.error('Missing VITE_SUPABASE_URL (or SUPABASE_PROJECT_REF)')
  process.exit(1)
}

const smtpPayload = {
  external_email_enabled: true,
  mailer_autoconfirm: false,
  smtp_host: 'smtp.resend.com',
  smtp_port: '465',
  smtp_user: 'resend',
  smtp_pass: resendKey,
  smtp_admin_email: fromEmail,
  smtp_sender_name: fromName,
  // Minimum seconds between emails (default can feel like rate-limit during QA)
  smtp_max_frequency: 1,
}

console.log('Resend → Supabase SMTP configuration')
console.log('Project:', projectRef)
console.log('From:', `${fromName} <${fromEmail}>`)

if (!accessToken) {
  console.log(`
No SUPABASE_ACCESS_TOKEN in .env.local — configure manually:

1. Supabase Dashboard → Project → Authentication → SMTP Settings
2. Enable Custom SMTP
3. Host: smtp.resend.com
4. Port: 465
5. Username: resend
6. Password: (your RESEND_API_KEY from .env.local)
7. Sender email: ${fromEmail}
8. Sender name: ${fromName}

Or add SUPABASE_ACCESS_TOKEN to .env.local and re-run:
  npm run configure-resend

Then: npm run configure-agora-emails  (branded OTP/login templates)

Note: onboarding@resend.dev only delivers to your Resend account email until you verify a domain.
`)
  process.exit(0)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(smtpPayload),
})

const body = await res.text()
if (!res.ok) {
  console.error(`Management API failed (${res.status}):`, body.slice(0, 500))
  console.error(`
If 403: use an Administrator access token (Dashboard → Account → Access Tokens).
Fallback: paste SMTP settings manually (see above).
`)
  process.exit(1)
}

console.log('✓ Supabase Auth SMTP updated to use Resend')
console.log(`
Next:
1. npm run configure-agora-emails  (Agora-branded OTP / auth templates)
2. Authentication → Rate Limits → increase "Rate limit for sending emails" (e.g. 100/hour for QA)
3. Restart npm run dev
4. Onboarding → Send login code (use an email Resend can deliver to)

Domain tip: verify your chapter domain in Resend, then set RESEND_FROM_EMAIL=noreply@yourdomain.com
`)
