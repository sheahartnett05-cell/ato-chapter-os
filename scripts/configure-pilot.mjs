/**
 * Pilot prep: rate limits, site URL, auth templates + Resend SMTP.
 * Usage: npm run configure-pilot
 * Env:   PILOT_SITE_URL=https://your-app.vercel.app  (optional, set after deploy)
 */
import { existsSync, readFileSync } from 'node:fs'
import { getAgoraAuthEmailTemplates } from '../supabase/email-templates/buildTemplates.mjs'

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
const resendKey = env.RESEND_API_KEY
const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const fromName = env.RESEND_FROM_NAME || 'Agora'
const siteUrl = (env.PILOT_SITE_URL || env.VITE_APP_URL || '').replace(/\/$/, '')

if (!accessToken || !projectRef) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or project ref in .env.local')
  process.exit(1)
}

const payload = {
  ...getAgoraAuthEmailTemplates(),
  mailer_notifications_password_changed_enabled: true,
  mailer_notifications_email_changed_enabled: true,
  // QA-friendly rate limits (emails per hour, OTP per hour)
  rate_limit_email_sent: 100,
  rate_limit_otp: 100,
  rate_limit_verify: 100,
  smtp_max_frequency: 1,
}

if (resendKey) {
  Object.assign(payload, {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    smtp_host: 'smtp.resend.com',
    smtp_port: '465',
    smtp_user: 'resend',
    smtp_pass: resendKey,
    smtp_admin_email: fromEmail,
    smtp_sender_name: fromName,
  })
}

if (siteUrl) {
  payload.site_url = siteUrl
  payload.uri_allow_list = siteUrl
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})

const body = await res.text()
if (!res.ok) {
  console.error(`Management API failed (${res.status}):`, body.slice(0, 800))
  process.exit(1)
}

console.log('✓ Pilot Supabase Auth configured')
console.log('  • Agora email templates')
if (resendKey) console.log('  • Resend SMTP')
console.log('  • rate_limit_email_sent: 100/hr')
console.log('  • rate_limit_otp: 100/hr')
if (siteUrl) console.log(`  • site_url: ${siteUrl}`)
else console.log('  • site_url: unchanged (set PILOT_SITE_URL after deploy)')
