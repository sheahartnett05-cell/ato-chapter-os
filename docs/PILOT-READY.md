# Pilot readiness

**Production URL:** https://chapteramanager.com  
**Canonical Supabase project:** `qfurjvkdbvjpvezsrddf`  
**Branch:** `sprint-fixes`  
**Latest prod ship:** `c1a5005` (roster heal from SQL memberships) → Vercel Ready

> Older refs to `oquqmoroihoksciiqwyt` are retired. Vercel `VITE_SUPABASE_URL` and `.env.local` must point at `qfurjvkdbvjpvezsrddf` only.

## Status (2026-11-05) — **CHAPTER BASE GO**

| Item | Status |
|------|--------|
| Site live at chapteramanager.com | **Yes** |
| `VITE_SUPABASE_URL` (local + Vercel prod) | `https://qfurjvkdbvjpvezsrddf.supabase.co` |
| Migrations through `20260405…` (profiles on join + one membership) | Applied |
| Unit tests (`npm test`) | **PASS** (27/27) |
| Gate A (`npm run test:phase-a`) | **PASS** (17/17) |
| Storage Gate (`npm run test:storage`) | **PASS** (16/16) |
| Combined (`npm run test:pilot-ready`) | Gate A + storage + units |
| Auth Site URL | `https://chapteramanager.com` |
| Resend send-from (working) | `Chaptera <auth@agoragreekmanagement.com>` (**verified**) |
| Resend domain `chapteramanager.com` | **Not verified** — Porkbun DNS still needed for branded From |
| Join → SQL membership + chapter_members | Working |
| Roster heal (SQL → KV) so founders see joiners | **Shipped** `c1a5005` |
| Onboarding requires signed-in session before Finish | **Shipped** |
| Password change requires email code | **Shipped** + Secure password change enabled |
| Role / officer seat permissions | Active (President, Treasurer, Standards, Recruitment, etc.) |
| SEO (`robots.txt`, sitemap, OG tags) | Shipped |
| Live chapter check (Eta Psi UWF) | Ty + Dustin both on memberships, SQL, and KV roster |

## Ready for ~20-member chapter join

**Yes — careful pilot.** Share Settings → Invites → chapter join link.

### Founder playbook
1. Settings → **Invites** → copy invite link / code
2. Members join at `/join/:code` (or the copied link) as Active Member
3. After they join, Members list refreshes on focus / ~20s (or hard refresh)
4. Assign officers in **Chapter Setup** (roles + seats unlock tools)
5. Event → **QR check-in** for attendance smoke

### Member playbook
1. Open join link → complete profile → verify email (OTP or password)
2. Finish only after signed in
3. Land in Chapter Room (`/my-dashboard`)
4. Optional: Profile → set password (email code required to change later)

## Email delivery

**Working now:** Supabase Auth → Resend SMTP, from `Chaptera <auth@agoragreekmanagement.com>`.

**Branding backlog (not blocking OTP):** add at Porkbun for `chapteramanager.com`:

| Type | Host | Value | Priority |
|------|------|-------|----------|
| TXT | `resend._domainkey` | (DKIM `p=…` from Resend) | — |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| CNAME | `rsend` | `send.forge.rmta.net` | — |

Then: `npm run configure-resend-domain -- verify` and switch `RESEND_FROM_EMAIL=auth@chapteramanager.com`.

## Honest product limits

- Dues: balances + pay **links** — not a card processor
- Announcement polls ≠ binding chapter votes
- QR check-in: chapter-scoped rotating codes; hydrate before validate
- Local PWA notifications only — not closed-app server Web Push
- Library hours: GPS geofence when location has coordinates
- Guest demo is local-only sample data
- One chapter per account (leave before joining another)

## Must-run smoke before blasting 20 invites

1. Founder sees current members on roster (hard refresh if needed)
2. One more fresh-phone join → appears on founder roster without manual DB repair
3. Event → QR check-in from a member phone
4. OTP inbox proof still delivering to a real mailbox
