/**
 * Found a real Supabase-backed chapter via browser + disposable inbox OTP.
 * Publishes join_code to cloud so verify-supabase shows a code.
 *
 * Usage: node scripts/seed-supabase-chapter.mjs
 * Env: SEED_PORT=5176  SEED_BASE_URL=http://localhost:5176
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const SEED_PORT = process.env.SEED_PORT ?? '5176'
const BASE_URL = process.env.SEED_BASE_URL ?? `http://localhost:${SEED_PORT}`
const USE_OWN_SERVER = process.env.SEED_USE_EXISTING !== '1'

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

async function waitForServer(url, ms = 90000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return true
    } catch {
      /* retry */
    }
    await sleep(500)
  }
  return false
}

async function createMailbox() {
  const domainsRes = await fetch('https://api.mail.tm/domains')
  const domainsJson = await domainsRes.json()
  const domain = domainsJson['hydra:member']?.[0]?.domain
  if (!domain) throw new Error('No mail.tm domains')
  const user = `agora${Date.now()}`
  const email = `${user}@${domain}`
  const password = `SeedPass!${Date.now()}`
  const accRes = await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password }),
  })
  if (!accRes.ok) {
    const err = await accRes.text()
    throw new Error(`mail.tm account failed: ${err.slice(0, 200)}`)
  }
  const tokenRes = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password }),
  })
  const tokenJson = await tokenRes.json()
  if (!tokenJson.token) throw new Error('mail.tm token failed')
  return { email, token: tokenJson.token }
}

async function waitForOtp(token, timeoutMs = 120000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const res = await fetch('https://api.mail.tm/messages', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    const msgs = json['hydra:member'] ?? []
    if (msgs.length > 0) {
      const detail = await fetch(`https://api.mail.tm/messages/${msgs[0].id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json())
      const text = `${detail.subject ?? ''}\n${detail.intro ?? ''}\n${detail.text ?? ''}`
      const m = text.match(/\b(\d{6})\b/)
      if (m) return m[1]
    }
    await sleep(4000)
  }
  throw new Error('Timed out waiting for Supabase OTP email')
}

async function clickContinue(page) {
  const btn = page.getByRole('button', { name: /Continue|Finish/i })
  await btn.waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) => /Continue|Finish/i.test(b.textContent ?? ''))
    return target && !target.disabled
  })
  await btn.click()
}

async function main() {
  let devProcess = null
  const localEnv = loadEnvLocal()

  if (!localEnv.VITE_SUPABASE_URL || !localEnv.VITE_SUPABASE_ANON_KEY) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
  }

  if (USE_OWN_SERVER) {
    console.log(`Starting dev server on ${BASE_URL}…`)
    devProcess = spawn('npx', ['vite', '--port', SEED_PORT, '--strictPort'], {
      shell: true,
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env, ...localEnv },
    })
    if (!(await waitForServer(BASE_URL))) {
      console.error('Dev server did not start')
      process.exit(1)
    }
  }

  const mailbox = await createMailbox()
  console.log('Inbox:', mailbox.email)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(BASE_URL)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    await page.goto(`${BASE_URL}/onboarding`)
    await page.getByRole('button', { name: 'Create my profile' }).click()
    const presBtn = page.getByRole('button', { name: /Founding president/i })
    if (await presBtn.isVisible().catch(() => false)) await presBtn.click()
    await clickContinue(page)

    await page.locator('label').filter({ hasText: /^First/ }).locator('input').fill('Cloud')
    await page.locator('label').filter({ hasText: /^Last/ }).locator('input').fill('Founder')
    await page.getByPlaceholder('(555) 555-0100').fill('5555550100')
    await page.getByPlaceholder('you@university.edu').fill(mailbox.email)

    await page.getByRole('button', { name: /Send login code/i }).click()
    await sleep(2000)
    const sendErr = await page.locator('.text-red-600, .text-red-700').first().textContent().catch(() => '')
    if (sendErr && /rate limit|invalid|error|failed/i.test(sendErr)) {
      throw new Error(`Send login code failed: ${sendErr.trim()}`)
    }
    console.log('Waiting for OTP email…')
    const otp = await waitForOtp(mailbox.token)
    console.log('OTP received')

    await page.getByPlaceholder('123456').fill(otp)
    await page.getByRole('button', { name: /Verify & sign in/i }).click()
    await page.getByText(/signed in/i).waitFor({ timeout: 15000 }).catch(() => {})
    await sleep(1000)
    await clickContinue(page)

    await page.getByPlaceholder('e.g. Finance').fill('Computer Science')
    await page.locator('input[type="date"]').first().fill('2004-01-15')
    await clickContinue(page)

    await page.getByPlaceholder('Search by name or letters').fill('Alpha Tau')
    await page.getByRole('button', { name: /Alpha Tau Omega/i }).first().click()
    await clickContinue(page)

    const designation = `Cloud Seed ${Date.now().toString(36).slice(-4)}`
    await page.getByPlaceholder('e.g. Beta Chapter').fill(`Alpha ${designation}`)
    await page.getByPlaceholder('e.g. University of Florida').fill('University of Florida')
    await clickContinue(page)

    await page.waitForURL(/\/home/, { timeout: 30000 })
    console.log('Chapter founded:', page.url())

    await sleep(5000)

    const joinCode = await page.evaluate(() => {
      try {
        const lock = JSON.parse(localStorage.getItem('chapter-os-chapter-lock') ?? 'null')
        return lock?.primaryJoinCode ?? ''
      } catch {
        return ''
      }
    })
    console.log('Local join code:', joinCode || '(none)')
  } finally {
    await browser.close()
    if (devProcess) devProcess.kill('SIGTERM')
  }

  console.log('\nRunning verify-supabase…')
  const { spawnSync } = await import('node:child_process')
  const verify = spawnSync('node', ['scripts/verify-supabase-join.mjs'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  process.exit(verify.status ?? 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
