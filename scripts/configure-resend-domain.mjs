/**
 * Verify Resend domain status and push customer-ready sender to Supabase Auth.
 *
 * Usage:
 *   npm run configure-resend-domain              # check + configure if verified
 *   npm run configure-resend-domain -- add       # add RESEND_DOMAIN in Resend
 *   npm run configure-resend-domain -- verify    # re-trigger DNS verification
 *   npm run configure-resend-domain -- --test you@example.com
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

function domainFromEmail(email) {
  const m = email?.match(/@([^>\s]+)/)
  return m?.[1] ?? null
}

async function resendFetch(key, path, init) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { res, json }
}

async function printDnsRecords(resendKey, domainId, domainName) {
  const { res, json } = await resendFetch(resendKey, `/domains/${domainId}`, { method: 'GET' })
  if (!res.ok) {
    console.warn('  Could not fetch DNS records:', json?.message)
    return
  }
  const records = json.records ?? []
  if (records.length === 0) {
    console.log(`  Open https://resend.com/domains/${domainId} for DNS records`)
    return
  }
  console.log(`\nDNS records for ${domainName} (add at your DNS host):`)
  console.log('  Host column = name relative to your domain\n')
  for (const r of records) {
    const host = r.name === '@' ? domainName : `${r.name}.${domainName}`
    console.log(`  ${r.type.padEnd(4)} ${host}`)
    console.log(`       → ${r.value}${r.priority != null ? ` (priority ${r.priority})` : ''}\n`)
  }
}

const mode = process.argv[2] ?? 'check'
const env = { ...process.env, ...loadEnvLocal() }
const resendKey = env.RESEND_API_KEY
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = env.SUPABASE_PROJECT_REF || projectRefFromUrl(env.VITE_SUPABASE_URL)
const resendDomain = env.RESEND_DOMAIN?.trim()
let fromEmail = env.RESEND_FROM_EMAIL?.trim()
const fromName = env.RESEND_FROM_NAME || 'Agora'
const siteUrl = (env.PILOT_SITE_URL || 'https://ato-chapter-os.vercel.app').replace(/\/$/, '')

if (!resendKey) {
  console.error('Missing RESEND_API_KEY in .env.local')
  process.exit(1)
}

const { res: listRes, json: listJson } = await resendFetch(resendKey, '/domains', { method: 'GET' })
if (!listRes.ok) {
  console.error('Could not list Resend domains:', listJson?.message ?? JSON.stringify(listJson).slice(0, 300))
  process.exit(1)
}

const domains = listJson?.data ?? []

if (mode === 'add') {
  if (!resendDomain) {
    console.error('Set RESEND_DOMAIN=mail.yourdomain.com in .env.local, then re-run.')
    process.exit(1)
  }
  const { res, json } = await resendFetch(resendKey, '/domains', {
    method: 'POST',
    body: JSON.stringify({ name: resendDomain }),
  })
  if (!res.ok) {
    console.error('Could not add domain:', json?.message ?? JSON.stringify(json).slice(0, 300))
    process.exit(1)
  }
  console.log(`✓ Domain added in Resend: ${resendDomain}`)
  await printDnsRecords(resendKey, json.id, resendDomain)
  process.exit(0)
}

if (mode === 'verify') {
  const target = resendDomain ?? domains[0]?.name
  const d = domains.find((x) => x.name === target)
  if (!d) {
    console.error(`Domain not found in Resend: ${target}`)
    process.exit(1)
  }
  const { res, json } = await resendFetch(resendKey, `/domains/${d.id}/verify`, { method: 'POST' })
  if (!res.ok) {
    console.error('Verify request failed:', json?.message ?? JSON.stringify(json).slice(0, 300))
    process.exit(1)
  }
  console.log(`✓ Verification triggered for ${d.name}`)
  console.log(`  Dashboard → https://resend.com/domains/${d.id}`)
  process.exit(0)
}

console.log('\nResend domains:')
if (domains.length === 0) {
  console.log('  (none yet)')
} else {
  for (const d of domains) {
    console.log(`  · ${d.name} — ${d.status}${d.region ? ` (${d.region})` : ''}`)
  }
}

const failed = domains.filter((d) => d.status !== 'verified')
if (failed.length > 0) {
  for (const d of failed) {
    await printDnsRecords(resendKey, d.id, d.name)
  }
  console.log('After DNS is added: npm run configure-resend-domain -- verify')
  console.log('When verified:        npm run configure-resend-domain')
}

const verified = domains.filter((d) => d.status === 'verified')
if (verified.length === 0) {
  console.log(`
Customer emails are blocked until a domain shows "verified" in Resend.
onboarding@resend.dev only delivers to your Resend account email.
`)
  process.exit(1)
}

const pick =
  verified.find((d) => resendDomain && d.name === resendDomain) ??
  verified.find((d) => fromEmail && domainFromEmail(fromEmail) === d.name) ??
  verified.find((d) => fromEmail && domainFromEmail(fromEmail)?.endsWith(d.name)) ??
  verified[0]

if (!fromEmail || fromEmail.endsWith('@resend.dev')) {
  fromEmail = `auth@${pick.name}`
  console.log(`\nUsing sender: ${fromEmail}`)
}

if (!accessToken || !projectRef) {
  console.error('\nMissing SUPABASE_ACCESS_TOKEN — cannot update Supabase SMTP sender.')
  process.exit(1)
}

const payload = {
  ...getAgoraAuthEmailTemplates(),
  mailer_notifications_password_changed_enabled: true,
  mailer_notifications_email_changed_enabled: true,
  rate_limit_email_sent: 100,
  rate_limit_otp: 100,
  rate_limit_verify: 100,
  smtp_max_frequency: 1,
  external_email_enabled: true,
  mailer_autoconfirm: false,
  smtp_host: 'smtp.resend.com',
  smtp_port: '465',
  smtp_user: 'resend',
  smtp_pass: resendKey,
  smtp_admin_email: fromEmail,
  smtp_sender_name: fromName,
  site_url: siteUrl,
  uri_allow_list: siteUrl,
}

const patch = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})

const patchBody = await patch.text()
if (!patch.ok) {
  console.error(`Supabase update failed (${patch.status}):`, patchBody.slice(0, 600))
  process.exit(1)
}

console.log('\n✓ Supabase Auth sends from:', `${fromName} <${fromEmail}>`)
console.log('  OTP emails can go to any customer address.')

if (process.argv.includes('--test')) {
  const testTo = process.argv[process.argv.indexOf('--test') + 1]
  if (!testTo) {
    console.error('Usage: npm run configure-resend-domain -- --test you@example.com')
    process.exit(1)
  }
  const { res, json } = await resendFetch(resendKey, '/emails', {
    method: 'POST',
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [testTo],
      subject: 'Agora — test email',
      html: '<p>If you received this, customer email delivery is working.</p>',
    }),
  })
  if (!res.ok) {
    console.error('Test send failed:', json?.message ?? JSON.stringify(json).slice(0, 300))
    process.exit(1)
  }
  console.log(`✓ Test email sent to ${testTo}`)
}

console.log(`
Keep in .env.local:
  RESEND_FROM_EMAIL=${fromEmail}
  RESEND_DOMAIN=${pick.name}
`)
