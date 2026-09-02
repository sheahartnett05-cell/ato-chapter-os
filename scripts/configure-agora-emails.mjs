/**
 * Push Agora email templates + Resend SMTP to Supabase Auth.
 * Usage: npm run configure-agora-emails
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAgoraAuthEmailTemplates, getTemplateManifest } from '../supabase/email-templates/buildTemplates.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
const templates = getAgoraAuthEmailTemplates()
const outDir = join(__dirname, '..', 'supabase', 'email-templates', 'generated')

mkdirSync(outDir, { recursive: true })

for (const item of getTemplateManifest()) {
  writeFileSync(join(outDir, `${item.id}.subject.txt`), item.subject, 'utf8')
  writeFileSync(join(outDir, `${item.id}.html`), item.html, 'utf8')
}

console.log(`Wrote ${getTemplateManifest().length} templates → supabase/email-templates/generated/`)

if (!accessToken || !projectRef) {
  console.log(`
Cannot push automatically — add SUPABASE_ACCESS_TOKEN to .env.local.

Get one: https://supabase.com/dashboard/account/tokens (Administrator role)
Then re-run: npm run configure-agora-emails

Project ref: ${projectRef ?? '(missing VITE_SUPABASE_URL)'}
`)
  process.exit(1)
}

const payload = {
  ...templates,
  mailer_notifications_password_changed_enabled: true,
  mailer_notifications_email_changed_enabled: true,
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
    smtp_max_frequency: 1,
  })
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
  console.error(`Management API failed (${res.status}):`, body.slice(0, 600))
  process.exit(1)
}

console.log('✓ Supabase Auth updated (Agora email templates' + (resendKey ? ' + Resend SMTP' : '') + ')')
