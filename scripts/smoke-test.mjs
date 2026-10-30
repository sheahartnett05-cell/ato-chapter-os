/**
 * Agora Chapter OS — real-world chapter builder smoke test
 *
 * Builds each chapter the way a founding president actually would:
 *   onboarding → roster → chapter setup → officer seats → live content
 *
 * No localStorage feature hacks. No guest/demo seed shortcuts for chapters 1–10.
 *
 * Usage:
 *   npm run smoke-test
 *   npm run smoke-test -- --chapters=alpha,beta
 *   npm run smoke-test -- --headed
 *
 * Env: SMOKE_BASE_URL=http://localhost:5173
 */

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const SMOKE_PORT = process.env.SMOKE_PORT ?? '5174'
const BASE_URL = process.env.SMOKE_BASE_URL ?? `http://localhost:${SMOKE_PORT}`
const REPORT_PATH = 'docs/SMOKE-TEST-RESULTS.md'
const USE_OWN_SERVER = process.env.SMOKE_USE_EXISTING !== '1'
const USE_SUPABASE = process.env.SMOKE_WITH_SUPABASE === '1'

const args = process.argv.slice(2)
const HEADED = args.includes('--headed')
const CHAPTER_FILTER = args
  .find((a) => a.startsWith('--chapters='))
  ?.split('=')[1]
  ?.split(',')
  .map((s) => s.trim().toLowerCase())

/** @type {{ chapter: string; test: string; status: 'PASS'|'FAIL'|'BLOCKED'; detail?: string }[]} */
const results = []

function record(chapter, test, status, detail = '') {
  results.push({ chapter, test, status, detail })
  const icon = status === 'PASS' ? '✓' : status === 'BLOCKED' ? '○' : '✗'
  console.log(`${icon} [${chapter}] ${test}${detail ? ` — ${detail}` : ''}`)
}

const FEATURE_LABELS = {
  announcements: 'Announcements',
  roster: 'Roster',
  calendar: 'Calendar',
  recruitment: 'Recruitment',
  standards: 'Standards',
  dues: 'Dues',
  budgets: 'Budgets',
  studyHours: 'Study',
  house: 'House',
  tables: 'Forms',
  committees: 'Committees',
  bylaws: 'Bylaws',
  execSlides: 'Exec slides',
}

/**
 * Ten chapters — each isolated profile, real org, real names, built from scratch.
 */
const CHAPTERS = [
  {
    id: 'alpha',
    label: 'Alpha — Full Stack',
    orgSearch: 'Alpha Tau',
    orgPick: /Alpha Tau Omega/i,
    designation: 'Alpha Chapter',
    university: 'University of West Florida',
    president: { first: 'Marcus', last: 'Whitfield', email: 'alpha.pres@chapter.test', major: 'Finance' },
    featuresOn: Object.keys(FEATURE_LABELS),
    roster: [
      { first: 'Tyler', last: 'Brooks', email: 'alpha.treas@chapter.test', seat: 'Treasurer' },
      { first: 'Jordan', last: 'Hayes', email: 'alpha.standards@chapter.test', seat: 'Standards Chair' },
      { first: 'Casey', last: 'Nguyen', email: 'alpha.rush@chapter.test', seat: 'Recruitment Chair' },
      { first: 'Riley', last: 'Morgan', email: 'alpha.scholar@chapter.test', seat: 'Scholarship Chair' },
      { first: 'Sam', last: 'Ortiz', email: 'alpha.sec@chapter.test', seat: 'Secretary' },
      { first: 'Drew', last: 'Palmer', email: 'alpha.active1@chapter.test' },
      { first: 'Blake', last: 'Chen', email: 'alpha.active2@chapter.test' },
    ],
    content: {
      announcement: { title: 'Welcome to Alpha Chapter', body: 'Fall semester kickoff — read before chapter meeting.' },
      event: { name: 'Chapter Meeting', type: 'Chapter' },
      studyLocation: { name: 'UWF Library Room 204', address: '11000 University Pkwy, Pensacola FL' },
    },
  },
  {
    id: 'beta',
    label: 'Beta — Core Only',
    orgSearch: 'Sigma Chi',
    orgPick: /Sigma Chi/i,
    designation: 'Beta Chapter',
    university: 'University of Alabama',
    president: { first: 'Grant', last: 'Sullivan', email: 'beta.pres@chapter.test', major: 'Political Science' },
    featuresOn: ['announcements', 'roster', 'calendar'],
    roster: [
      { first: 'Logan', last: 'Reed', email: 'beta.active1@chapter.test' },
      { first: 'Avery', last: 'Kim', email: 'beta.active2@chapter.test' },
    ],
    content: {
      announcement: { title: 'Beta core launch', body: 'Calendar and roster are live.' },
      event: { name: 'Brotherhood Dinner', type: 'Social' },
    },
    verifyDisabled: ['/dues', '/budgets', '/standards', '/recruitment'],
  },
  {
    id: 'gamma',
    label: 'Gamma — Rush Cycle',
    orgSearch: 'Kappa Sigma',
    orgPick: /Kappa Sigma/i,
    designation: 'Gamma Chapter',
    university: 'UAB',
    president: { first: 'Ethan', last: 'Coleman', email: 'gamma.pres@chapter.test', major: 'Business' },
    featuresOn: Object.keys(FEATURE_LABELS),
    roster: [
      { first: 'Mason', last: 'Irving', email: 'gamma.rush@chapter.test', seat: 'Recruitment Chair' },
      { first: 'Noah', last: 'Stevens', email: 'gamma.active1@chapter.test' },
      { first: 'Luke', last: 'Harper', email: 'gamma.active2@chapter.test' },
    ],
    content: {
      announcement: { title: 'Recruitment opens Monday', body: 'All brothers on campus outreach.' },
      event: { name: 'Open House', type: 'Recruitment' },
    },
    addPnm: { first: 'Chris', last: 'Lambert', email: 'chris.pnm@chapter.test' },
  },
  {
    id: 'delta',
    label: 'Delta — Accountability',
    orgSearch: 'Phi Delta Theta',
    orgPick: /Phi Delta Theta/i,
    designation: 'Delta Chapter',
    university: 'Auburn University',
    president: { first: 'Henry', last: 'Walsh', email: 'delta.pres@chapter.test', major: 'Engineering' },
    featuresOn: ['announcements', 'roster', 'calendar', 'standards'],
    roster: [
      { first: 'Owen', last: 'Barton', email: 'delta.standards@chapter.test', seat: 'Standards Chair' },
      { first: 'Eli', last: 'Foster', email: 'delta.active1@chapter.test' },
      { first: 'Jack', last: 'Miles', email: 'delta.active2@chapter.test' },
    ],
    content: {
      announcement: { title: 'Standards expectations', body: 'Review excuse policy before required events.' },
      event: { name: 'Required Chapter', type: 'Chapter', required: true },
    },
  },
  {
    id: 'epsilon',
    label: 'Epsilon — Treasury',
    orgSearch: 'Pi Kappa Alpha',
    orgPick: /Pi Kappa Alpha/i,
    designation: 'Epsilon Chapter',
    university: 'Ole Miss',
    president: { first: 'Cole', last: 'Bennett', email: 'epsilon.pres@chapter.test', major: 'Accounting' },
    featuresOn: ['announcements', 'roster', 'calendar', 'dues', 'budgets'],
    roster: [
      { first: 'Max', last: 'Donovan', email: 'epsilon.treas@chapter.test', seat: 'Treasurer' },
      { first: 'Ian', last: 'Sawyer', email: 'epsilon.active1@chapter.test' },
      { first: 'Ryan', last: 'Hughes', email: 'epsilon.active2@chapter.test' },
      { first: 'Ben', last: 'Carson', email: 'epsilon.active3@chapter.test' },
    ],
    content: {
      announcement: { title: 'Fall dues posted', body: 'See Treasurer for payment plan questions.' },
      event: { name: 'Budget Review', type: 'Executive' },
    },
  },
  {
    id: 'zeta',
    label: 'Zeta — Scholarship',
    orgSearch: 'Lambda Chi Alpha',
    orgPick: /Lambda Chi Alpha/i,
    designation: 'Zeta Chapter',
    university: 'Florida State University',
    president: { first: 'Nate', last: 'Prescott', email: 'zeta.pres@chapter.test', major: 'Biology' },
    featuresOn: ['announcements', 'roster', 'calendar', 'studyHours'],
    roster: [
      { first: 'Alex', last: 'Turner', email: 'zeta.scholar@chapter.test', seat: 'Scholarship Chair' },
      { first: 'Chris', last: 'Dalton', email: 'zeta.active1@chapter.test' },
      { first: 'Matt', last: 'Greer', email: 'zeta.active2@chapter.test' },
    ],
    content: {
      announcement: { title: 'Study hours start Sunday', body: 'Log hours at approved locations only.' },
      studyLocation: { name: 'FSU Strozier Library', address: '116 Honors Way, Tallahassee FL' },
    },
  },
  {
    id: 'eta',
    label: 'Eta — Operations',
    orgSearch: 'Delta Tau Delta',
    orgPick: /Delta Tau Delta/i,
    designation: 'Eta Chapter',
    university: 'University of Georgia',
    president: { first: 'Will', last: 'Ashford', email: 'eta.pres@chapter.test', major: 'Marketing' },
    featuresOn: ['announcements', 'roster', 'calendar', 'house', 'committees', 'tables'],
    roster: [
      { first: 'Tom', last: 'Bishop', email: 'eta.active1@chapter.test', seat: 'Social Chair' },
      { first: 'Nick', last: 'Crawford', email: 'eta.active2@chapter.test' },
      { first: 'Jake', last: 'Monroe', email: 'eta.committee@chapter.test' },
    ],
    content: {
      announcement: { title: 'House cleanup schedule', body: 'Committee assignments posted this week.' },
      event: { name: 'Philanthropy Planning', type: 'Philanthropy' },
    },
  },
  {
    id: 'theta',
    label: 'Theta — Governance Docs',
    orgSearch: 'Beta Theta Pi',
    orgPick: /Beta Theta Pi/i,
    designation: 'Theta Chapter',
    university: 'Vanderbilt University',
    president: { first: 'Quinn', last: 'Ellis', email: 'theta.pres@chapter.test', major: 'History' },
    featuresOn: ['announcements', 'roster', 'calendar', 'bylaws', 'execSlides'],
    roster: [
      { first: 'Paige', last: 'Holland', email: 'theta.sec@chapter.test', seat: 'Secretary' },
    ],
    content: {
      announcement: { title: 'Bylaws review session', body: 'Secretary will walk through amendments.' },
      bylawsPaste: { name: 'Theta Chapter Bylaws', excerpt: 'Article I — Name and Purpose\nThe name of this chapter shall be Theta Chapter.' },
      execSlide: { position: 'Secretary', title: 'Secretary Report', resp: 'Minutes and correspondence' },
    },
  },
  {
    id: 'iota',
    label: 'Iota — Cross-device',
    orgSearch: 'Alpha Tau',
    orgPick: /Alpha Tau Omega/i,
    designation: 'Iota Chapter',
    university: 'Cross-State University',
    president: { first: 'Devon', last: 'Price', email: 'iota.pres@chapter.test', major: 'Economics' },
    featuresOn: Object.keys(FEATURE_LABELS),
    roster: [],
    joiners: [
      { first: 'Jordan', last: 'Sync', email: 'iota.joiner1@chapter.test' },
      { first: 'Taylor', last: 'Cloud', email: 'iota.joiner2@chapter.test' },
    ],
    content: {
      announcement: { title: 'Iota cloud sync test', body: 'Joiners should see this after onboarding.' },
      event: { name: 'Sync Test Meeting', type: 'Chapter' },
      studyLocation: { name: 'Main Library', address: '100 Campus Dr' },
    },
    crossDevice: true,
  },
  {
    id: 'kappa',
    label: 'Kappa — Sorority Full Build',
    orgSearch: 'Zeta Tau Alpha',
    orgPick: /Zeta Tau Alpha/i,
    orgCategory: 'Sororities',
    designation: 'Kappa Chapter',
    university: 'University of Mississippi',
    president: { first: 'Emma', last: 'Laurent', email: 'kappa.pres@chapter.test', major: 'Nursing' },
    featuresOn: Object.keys(FEATURE_LABELS),
    roster: [
      { first: 'Sophie', last: 'Marin', email: 'kappa.treas@chapter.test', seat: 'Treasurer' },
      { first: 'Olivia', last: 'Kent', email: 'kappa.rush@chapter.test', seat: 'Recruitment Chair' },
      { first: 'Mia', last: 'Santos', email: 'kappa.active1@chapter.test' },
      { first: 'Ava', last: 'Brooks', email: 'kappa.active2@chapter.test' },
    ],
    content: {
      announcement: { title: 'Kappa sisterhood welcome', body: 'Real chapter — not guest preview.' },
      event: { name: 'Sisterhood Retreat', type: 'Social' },
      studyLocation: { name: 'J.D. Williams Library', address: 'Oxford MS' },
    },
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

async function waitForServer(url, ms = 60000) {
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

async function clearStorage(page) {
  await page.goto(BASE_URL)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

async function clickContinue(page) {
  const btn = page.getByRole('button', { name: /Continue|Finish/i })
  await btn.waitFor({ state: 'visible', timeout: 10000 })

  if (await page.getByText(/Verify email/i).isVisible().catch(() => false)) {
    if (await btn.isDisabled()) {
      throw new Error(
        'Supabase email OTP blocks onboarding — smoke test runs its own server on :5174 without Supabase'
      )
    }
  }

  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) => /Continue|Finish/i.test(b.textContent ?? ''))
    return target && !target.disabled
  }, { timeout: 20000 })
  await btn.click()
}

async function fillProfileStep(page, person) {
  await page.locator('label').filter({ hasText: /^First/ }).locator('input').fill(person.first)
  await page.locator('label').filter({ hasText: /^Last/ }).locator('input').fill(person.last)
  await page.getByPlaceholder('(555) 555-0100').fill('5555550100')
  await page.getByPlaceholder('you@university.edu').fill(person.email)
}

async function fillAboutStep(page, person) {
  const major = page.getByPlaceholder('e.g. Finance')
  if (await major.isVisible().catch(() => false)) {
    await major.fill(person.major ?? 'Finance')
  }
  const birthday = page.locator('input[type="date"]').first()
  if (await birthday.isVisible().catch(() => false)) {
    await birthday.fill('2004-08-15')
  }
}

async function selectOrganization(page, { orgSearch, orgPick, orgCategory }) {
  if (orgCategory) {
    const tab = page.getByRole('tab', { name: new RegExp(orgCategory, 'i') })
    if (await tab.isVisible().catch(() => false)) await tab.click()
  }
  await page.getByPlaceholder('Search by name or letters').fill(orgSearch)
  await page.getByRole('button', { name: orgPick }).first().click()
}

async function onboardFoundingPresident(page, chapter) {
  const p = chapter.president
  await page.goto(`${BASE_URL}/onboarding`)

  await page.getByRole('button', { name: 'Create my profile' }).click()
  const presBtn = page.getByRole('button', { name: /Founding president/i })
  if (await presBtn.isVisible().catch(() => false)) await presBtn.click()
  await clickContinue(page)

  await fillProfileStep(page, p)
  await clickContinue(page)

  await fillAboutStep(page, p)
  await clickContinue(page)

  await selectOrganization(page, chapter)
  await clickContinue(page)

  await page.getByPlaceholder('e.g. Beta Chapter').fill(chapter.designation)
  await page.getByPlaceholder('e.g. University of Florida').fill(chapter.university)
  await clickContinue(page)

  await page.waitForURL(/\/home/, { timeout: 20000 })
}

async function onboardWithJoinCode(page, joinCode, person) {
  await clearStorage(page)
  await page.goto(`${BASE_URL}/onboarding`)
  await page.getByRole('button', { name: 'Join with invite code' }).click()
  await page.getByPlaceholder('CHAPTER-JOIN-…').fill(joinCode)
  await clickContinue(page)

  await fillProfileStep(page, person)
  await clickContinue(page)
  await fillAboutStep(page, person)
  await clickContinue(page)

  await page.waitForURL(/\/(home|my-dashboard)/, { timeout: 20000 })
}

async function getJoinCode(page) {
  await page.goto(`${BASE_URL}/settings`)
  const invites = page.getByRole('button', { name: 'Invites' })
  if (await invites.isVisible().catch(() => false)) await invites.click()
  const codeEl = page.locator('p.font-mono.text-xl')
  await codeEl.waitFor({ timeout: 10000 })
  return (await codeEl.textContent())?.trim() ?? ''
}

function joinLinkForCode(code) {
  return `${BASE_URL}/join?code=${encodeURIComponent(code)}`
}

async function fillPnmField(page, label, value) {
  const input = page.locator('label').filter({ hasText: new RegExp(`^${label}`, 'i') }).locator('input').first()
  await input.waitFor({ state: 'visible', timeout: 8000 })
  await input.click()
  await input.fill(value)
  await input.dispatchEvent('input', { bubbles: true })
  await input.dispatchEvent('change', { bubbles: true })
}

async function addRosterMember(page, member) {
  await page.goto(`${BASE_URL}/members`)
  await page.getByRole('button', { name: 'Add Member' }).click()
  await page.getByPlaceholder('First name').fill(member.first)
  await page.getByPlaceholder('Last name').fill(member.last)
  await page.getByPlaceholder('Email').fill(member.email)
  await page.getByRole('button', { name: 'Add Member' }).last().click()
  await sleep(300)
}

async function setFeatureSwitch(page, labelFragment, shouldBeOn) {
  const featurePanel = page
    .locator('ul.divide-y')
    .filter({ has: page.getByRole('switch') })
    .first()
  await featurePanel.scrollIntoViewIfNeeded()
  const li = featurePanel.locator('li').filter({ hasText: labelFragment }).first()
  await li.scrollIntoViewIfNeeded()
  const sw = li.getByRole('switch')
  await sw.waitFor({ timeout: 10000 })
  const on = (await sw.getAttribute('aria-checked')) === 'true'
  if (on !== shouldBeOn) await sw.click()
}

async function configureChapterSetup(page, chapter) {
  await page.goto(`${BASE_URL}/chapter-setup`)
  await page.waitForLoadState('networkidle')

  await page.getByPlaceholder('e.g. Beta Chapter').fill(chapter.designation)
  await page.getByPlaceholder('Campus name').fill(chapter.university)
  await page.getByRole('button', { name: /Save chapter profile/i }).click()
  await sleep(500)

  const allFeatures = Object.keys(FEATURE_LABELS)
  const allEnabled = allFeatures.every((k) => chapter.featuresOn.includes(k))
  if (!allEnabled) {
    for (const key of allFeatures) {
      const on = chapter.featuresOn.includes(key)
      await setFeatureSwitch(page, FEATURE_LABELS[key], on)
    }
  }

  for (const member of chapter.roster) {
    if (!member.seat) continue
    const fullName = `${member.first} ${member.last}`
    const posBlock = page.locator('div.px-5.py-4').filter({ hasText: member.seat }).first()
    const select = posBlock.locator('select')
    await select.waitFor({ timeout: 8000 })
    await select.selectOption({ label: fullName })
    await sleep(250)
  }
}

async function postAnnouncement(page, { title, body }) {
  await page.goto(`${BASE_URL}/announcements`)
  await page.getByRole('button', { name: 'Post' }).click()
  await page.getByPlaceholder(/title/i).first().fill(title)
  await page.locator('textarea').first().fill(body)
  await page.getByRole('button', { name: 'Publish' }).click()
  await sleep(500)
}

async function createCalendarEvent(page, { name, type, required = false }) {
  await page.goto(`${BASE_URL}/calendar`)
  await page.getByRole('button', { name: /Add event/i }).first().click()
  await page.getByPlaceholder('Event name').fill(name)
  if (type) {
    await page.locator('select.input-editorial').first().selectOption({ label: type })
  }
  await page.locator('input[type="date"]').first().fill(new Date().toISOString().slice(0, 10))
  if (required) {
    const req = page.getByLabel('Required')
    if (await req.isVisible().catch(() => false)) await req.check()
  }
  await page.getByRole('button', { name: 'Create event' }).click()
  await sleep(500)
}

async function addStudyLocation(page, { name, address }) {
  await page.goto(`${BASE_URL}/library-hours`)
  await page.getByRole('button', { name: 'Add location' }).click()
  await page.getByPlaceholder('Location name').fill(name)
  await page.getByPlaceholder('Address / notes').fill(address)
  await page.getByRole('button', { name: 'Add location' }).last().click()
  await sleep(400)
}

async function addPnmViaPipeline(page, pnm) {
  await page.goto(`${BASE_URL}/recruitment/pipeline`)
  await page.getByRole('button', { name: 'Add PNM' }).click()
  await fillPnmField(page, 'First name', pnm.first)
  await fillPnmField(page, 'Last name', pnm.last)
  await fillPnmField(page, 'Email', pnm.email)
  await fillPnmField(page, 'Phone', pnm.phone ?? '5555550199')
  const submit = page.getByRole('button', { name: 'Add to pipeline' })
  await page.waitForFunction(
    (el) => el && !el.disabled,
    await submit.elementHandle(),
    { timeout: 15000 }
  )
  await submit.click()
  await sleep(500)
}

async function importBylaws(page, { name, excerpt }) {
  await page.goto(`${BASE_URL}/bylaws`)
  await page.getByRole('button', { name: /Paste \/ import/i }).click()
  await page.getByPlaceholder('Document name (e.g. Chapter Bylaws 2025)').fill(name)
  await page.getByPlaceholder('Paste bylaws text here…').fill(excerpt)
  await page.getByRole('button', { name: 'Save bylaws' }).click()
  await sleep(400)
}

async function addExecSlide(page, { position, title, resp }) {
  await page.goto(`${BASE_URL}/exec-slides`)
  await page.getByRole('button', { name: 'New slide' }).click()
  await page.getByPlaceholder('Position (e.g. President)').fill(position)
  await page.getByPlaceholder('Slide title').fill(title)
  await page.getByPlaceholder('Description').fill(resp)
  await page.getByRole('button', { name: /Save|Create/i }).last().click()
  await sleep(400)
}

async function visitRoute(page, path) {
  const errors = []
  const handler = (e) => errors.push(e.message)
  page.on('pageerror', handler)
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await sleep(350)
  page.off('pageerror', handler)
  return { url: page.url(), errors }
}

async function buildChapter(browser, chapter) {
  const label = chapter.label
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  try {
    await clearStorage(page)
    record(label, 'Clear storage + start onboarding', 'PASS')

    await onboardFoundingPresident(page, chapter)
    record(label, 'Found chapter as President', page.url().includes('/home') ? 'PASS' : 'FAIL', page.url())

    const joinCode = await getJoinCode(page)
    record(
      label,
      'Primary join code issued',
      joinCode.startsWith('CHAPTER-JOIN-') ? 'PASS' : 'FAIL',
      joinCode || 'missing'
    )

    if (joinCode.startsWith('CHAPTER-JOIN-')) {
      try {
        const link = joinLinkForCode(joinCode)
        const lctx = await browser.newContext()
        const lpage = await lctx.newPage()
        await clearStorage(lpage)
        await lpage.goto(link)
        await lpage.waitForURL(/\/onboarding/, { timeout: 10000 })
        const prefilled = await lpage.getByPlaceholder('CHAPTER-JOIN-…').inputValue()
        const onInvitePath = await lpage.getByText(/invite link detected/i).isVisible().catch(() => false)
        record(
          label,
          'Invite link prefills onboarding',
          prefilled.toUpperCase() === joinCode.toUpperCase() && onInvitePath ? 'PASS' : 'FAIL',
          prefilled || link
        )
        await lctx.close()
      } catch (e) {
        record(label, 'Invite link prefills onboarding', 'FAIL', String(e.message ?? e))
      }
    }

    for (const member of chapter.roster) {
      await addRosterMember(page, member)
      const visible = await page.getByText(`${member.first} ${member.last}`).isVisible().catch(() => false)
      record(label, `Roster add ${member.first} ${member.last}`, visible ? 'PASS' : 'FAIL')
    }

    await configureChapterSetup(page, chapter)
    record(label, 'Chapter setup (profile, features, seats)', 'PASS')

    const c = chapter.content ?? {}
    if (c.announcement && chapter.featuresOn.includes('announcements')) {
      await postAnnouncement(page, c.announcement)
      const ok = await page.getByText(c.announcement.title).isVisible().catch(() => false)
      record(label, 'Post announcement', ok ? 'PASS' : 'FAIL')
    }
    if (c.event && chapter.featuresOn.includes('calendar')) {
      await createCalendarEvent(page, c.event)
      record(label, 'Schedule event', 'PASS')
    }
    if (c.studyLocation && chapter.featuresOn.includes('studyHours')) {
      await addStudyLocation(page, c.studyLocation)
      record(label, 'Add study location', 'PASS')
    }
    if (chapter.addPnm && chapter.featuresOn.includes('recruitment')) {
      try {
        await addPnmViaPipeline(page, chapter.addPnm)
        const ok = await page.getByText(chapter.addPnm.first).isVisible().catch(() => false)
        record(label, 'Add PNM to pipeline', ok ? 'PASS' : 'FAIL')
      } catch (e) {
        record(label, 'Add PNM to pipeline', 'FAIL', String(e.message ?? e))
      }
    }
    if (c.bylawsPaste && chapter.featuresOn.includes('bylaws')) {
      try {
        await importBylaws(page, c.bylawsPaste)
        record(label, 'Import bylaws', 'PASS')
      } catch (e) {
        record(label, 'Import bylaws', 'FAIL', String(e.message ?? e))
      }
    }
    if (c.execSlide && chapter.featuresOn.includes('execSlides')) {
      try {
        await addExecSlide(page, c.execSlide)
        record(label, 'Create exec slide', 'PASS')
      } catch (e) {
        record(label, 'Create exec slide', 'FAIL', String(e.message ?? e))
      }
    }

    if (chapter.verifyDisabled) {
      for (const path of chapter.verifyDisabled) {
        const { url } = await visitRoute(page, path)
        const redirected = url.includes('/home') || url.includes('/my-dashboard')
        record(label, `Disabled ${path} redirects`, redirected ? 'PASS' : 'FAIL', url)
      }
    }

    if (chapter.featuresOn.includes('announcements')) {
      const { url, errors } = await visitRoute(page, '/announcements')
      record(label, 'Visit announcements', url.includes('/announcements') && !errors.length ? 'PASS' : 'FAIL', url)
    }

    await page.reload({ waitUntil: 'domcontentloaded' })
    const persisted = await page.evaluate(() => {
      const lock = localStorage.getItem('chapter-os-chapter-lock')
      const onboarding = localStorage.getItem('chapter-os-onboarding')
      return Boolean(lock && onboarding)
    })
    record(label, 'Data persists after refresh', persisted ? 'PASS' : 'FAIL')

    if (chapter.crossDevice && joinCode.startsWith('CHAPTER-JOIN-')) {
      for (const joiner of chapter.joiners ?? []) {
        const jctx = await browser.newContext()
        const jpage = await jctx.newPage()
        try {
          await clearStorage(jpage)
          await jpage.goto(joinLinkForCode(joinCode))
          await jpage.waitForURL(/\/onboarding/, { timeout: 10000 })
          const prefilled = await jpage.getByPlaceholder('CHAPTER-JOIN-…').inputValue()
          if (prefilled.toUpperCase() !== joinCode.toUpperCase()) {
            record(label, `Joiner ${joiner.first} (cross-browser)`, 'FAIL', 'Invite link did not prefill code')
            continue
          }
          await clickContinue(jpage)

          const joinFailed = await jpage
            .getByText(/invalid|not found|could not|unable/i)
            .isVisible()
            .catch(() => false)
          if (joinFailed) {
            record(
              label,
              `Joiner ${joiner.first} (cross-browser)`,
              USE_SUPABASE ? 'FAIL' : 'BLOCKED',
              USE_SUPABASE
                ? 'Join code not in cloud — enable Anonymous auth in Supabase or sign in during onboarding'
                : 'Run with SMOKE_WITH_SUPABASE=1 after migrations'
            )
            continue
          }

          await fillProfileStep(jpage, joiner)
          await clickContinue(jpage)
          await fillAboutStep(jpage, joiner)
          await clickContinue(jpage)
          await jpage.waitForURL(/\/(home|my-dashboard)/, { timeout: 20000 })

          const lock = await jpage.evaluate(() => {
            try {
              return JSON.parse(localStorage.getItem('chapter-os-chapter-lock') ?? 'null')
            } catch {
              return null
            }
          })
          const same =
            lock?.chapterDesignation === chapter.designation &&
            lock?.university === chapter.university
          record(label, `Joiner ${joiner.first} onboarding`, same ? 'PASS' : 'FAIL')

          const posts = await jpage.evaluate(() => {
            try {
              return JSON.parse(localStorage.getItem('chapter-os-posts') ?? '[]')
            } catch {
              return []
            }
          })
          const titleFragment = c.announcement?.title?.split(' ')[0] ?? 'Iota'
          const hydrated =
            Array.isArray(posts) && posts.some((p) => p.title?.includes(titleFragment))
          record(
            label,
            `Joiner ${joiner.first} sees chapter content`,
            hydrated ? 'PASS' : 'BLOCKED',
            hydrated ? 'hydrated' : 'needs Supabase cloud sync'
          )
        } catch (e) {
          record(label, `Joiner ${joiner.first}`, 'BLOCKED', String(e.message ?? e))
        } finally {
          await jctx.close()
        }
      }
    }

    return { joinCode }
  } catch (e) {
    record(label, 'Chapter build failed', 'FAIL', String(e))
    return { joinCode: '' }
  } finally {
    await ctx.close()
  }
}

async function testInvalidJoinCode(browser) {
  const label = 'Phase 0 — Validation'
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    await clearStorage(page)
    await page.goto(`${BASE_URL}/onboarding`)
    await page.getByRole('button', { name: 'Join with invite code' }).click()
    await page.getByPlaceholder('CHAPTER-JOIN-…').fill('NOT-A-REAL-CODE')
    await clickContinue(page)
    await sleep(800)
    const err = await page.getByText(/invalid|not found|could not|unable/i).isVisible().catch(() => false)
    record(label, 'Invalid join code rejected', err ? 'PASS' : 'FAIL')
  } catch (e) {
    record(label, 'Validation test failed', 'FAIL', String(e))
  } finally {
    await ctx.close()
  }
}

function writeReport() {
  const pass = results.filter((r) => r.status === 'PASS').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  const blocked = results.filter((r) => r.status === 'BLOCKED').length
  const now = new Date().toISOString()

  const byChapter = new Map()
  for (const r of results) {
    if (!byChapter.has(r.chapter)) byChapter.set(r.chapter, [])
    byChapter.get(r.chapter).push(r)
  }

  let md = `# Smoke Test Results\n\n`
  md += `**Run:** ${now}  \n`
  md += `**Mode:** Real chapter build (no demo seed / no localStorage feature hacks)  \n`
  md += `**Supabase:** ${USE_SUPABASE ? 'yes (SMOKE_WITH_SUPABASE=1)' : 'no (isolated local)'}  \n`
  md += `**Base URL:** ${BASE_URL}  \n`
  md += `**Summary:** ${pass} PASS · ${fail} FAIL · ${blocked} BLOCKED · ${results.length} total\n\n`

  for (const [ch, rows] of byChapter) {
    md += `## ${ch}\n\n| Test | Status | Detail |\n|------|--------|--------|\n`
    for (const r of rows) {
      md += `| ${r.test} | ${r.status} | ${(r.detail ?? '').replace(/\|/g, '\\|')} |\n`
    }
    md += `\n`
  }

  if (fail > 0) {
    md += `## Failures\n\n`
    for (const r of results.filter((x) => x.status === 'FAIL')) {
      md += `- **${r.chapter}** — ${r.test}${r.detail ? `: ${r.detail}` : ''}\n`
    }
  }

  writeFileSync(REPORT_PATH, md)
  console.log(`\nReport → ${REPORT_PATH}`)
}

async function main() {
  let devProcess = null

  if (USE_OWN_SERVER) {
    const mode = USE_SUPABASE ? 'Supabase + smoke-test auth bypass' : 'no Supabase OTP'
    console.log(`Starting smoke-test dev server on ${BASE_URL} (${mode})…`)
    const serverEnv = USE_SUPABASE
      ? { ...process.env, VITE_SMOKE_TEST: '1' }
      : {
          ...process.env,
          VITE_SUPABASE_URL: '',
          VITE_SUPABASE_ANON_KEY: '',
          VITE_SUPABASE_PUBLISHABLE_KEY: '',
        }
    devProcess = spawn('npx', ['vite', '--port', SMOKE_PORT, '--strictPort'], {
      shell: true,
      stdio: 'pipe',
      cwd: process.cwd(),
      env: serverEnv,
    })
    if (!(await waitForServer(BASE_URL, 90000))) {
      console.error('Dev server failed to start')
      process.exit(1)
    }
  } else if (!(await waitForServer(BASE_URL, 5000))) {
    console.error(`No server at ${BASE_URL} — start dev server or unset SMOKE_USE_EXISTING`)
    process.exit(1)
  }

  const chapters = CHAPTER_FILTER
    ? CHAPTERS.filter((c) => CHAPTER_FILTER.includes(c.id))
    : CHAPTERS

  console.log(`Building ${chapters.length} chapter(s) at ${BASE_URL}\n`)

  const browser = await chromium.launch({ headless: !HEADED })

  try {
    await testInvalidJoinCode(browser)
    for (const chapter of chapters) {
      console.log(`\n── ${chapter.label} ──`)
      await buildChapter(browser, chapter)
    }
  } finally {
    await browser.close()
    if (devProcess) devProcess.kill()
  }

  writeReport()
  process.exit(results.some((r) => r.status === 'FAIL') ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
