# Pilot readiness

**Production URL:** https://chapteramanager.com  
**Canonical Supabase project:** `qfurjvkdbvjpvezsrddf`  
**Branch:** `sprint-fixes`  
**Latest prod ship:** `d932a05` (QR check-in) → Vercel `dpl_3AgdnWtxCG5rGmQf71s6edcP72Ed`

> Older refs to `oquqmoroihoksciiqwyt` are retired. Vercel `VITE_SUPABASE_URL` and `.env.local` must point at `qfurjvkdbvjpvezsrddf` only.

## Status (2026-11-03)

| Item | Status |
|------|--------|
| Site live at chapteramanager.com | **Yes** — prod redeployed with `d932a05` (local uncommitted: login/password/PWA/GPS/storage sync) |
| `VITE_SUPABASE_URL` (local + Vercel prod) | `https://qfurjvkdbvjpvezsrddf.supabase.co` |
| Migrations through `20260402…` (one membership / user) | Applied to `qfurjvkdbvjpvezsrddf` |
| Unit tests (`npm test`) | **PASS** (24/24) |
| Gate A (`npm run test:phase-a`) | **PASS** (17/17) via Management API — ephemeral GateA-* cleaned up |
| Storage Gate (`npm run test:storage`) | **PASS** (16/16) — profiles ↔ membership ↔ `chapter_kv`, password auth, one-chapter exclusivity, RLS |
| Combined (`npm run test:pilot-ready`) | Gate A + storage + units |
| `verify-supabase` join RPCs | **Pass** (`CHAPTER-FOUNDER`, `sync_chapter_join_codes`) |
| Auth Site URL | `https://chapteramanager.com` |
| Chaptera Auth email templates + Resend SMTP | **Connected** — SMTP via Resend API key |
| Resend send-from (working) | `Chaptera <auth@agoragreekmanagement.com>` (**verified** domain) |
| Resend domain `chapteramanager.com` | **Not verified** — DNS still parked at Porkbun (`uixie.porkbun.com`); branding switch blocked until DNS fixed |
| Guest demo Officer Home | Fixed in `36fc518` |
| Attendance tracker `/attendance` | Shipped in `f41e93b` |
| Chapter QR check-in | Shipped in `d932a05` — Event → QR check-in; `/check-in/:eventId` |
| Founder / join smoke (OTP + password + 2nd device) | **Unblocked for delivery** via verified `agoragreekmanagement.com` sender — still needs a human OTP inbox proof |
| Vercel deploy | Working via CLI login (`vercel whoami`) |

## Email delivery (current)

**Working now:** Supabase Auth → Resend SMTP, from `Chaptera <auth@agoragreekmanagement.com>` (verified). OTP / password-reset can deliver to real inboxes.

**Branding backlog (not blocking OTP):** `chapteramanager.com` Resend hosts still **CNAME to Porkbun parking** (`uixie.porkbun.com`), so that domain cannot be the From address yet:

- `resend._domainkey.chapteramanager.com` → need **TXT** DKIM (not parking CNAME)
- `send.chapteramanager.com` → need **MX** + **TXT** SPF
- `rsend.chapteramanager.com` → need **CNAME** `send.forge.rmta.net`

Root site A records → Vercel are fine. After Porkbun is fixed: set `RESEND_FROM_EMAIL=auth@chapteramanager.com`, then `npm run configure-resend-domain -- verify` and `npm run configure-resend-domain`.

OTP proof: https://chapteramanager.com/login → Send login code (or password).

## Must before inviting a real chapter

1. **Human OTP/password proof** — real inbox receives Chaptera login mail (sender may be `@agoragreekmanagement.com` until chapteramanager DNS is fixed).
2. **Gate A + storage** — `npm run test:pilot-ready` (already green as of 2026-11-03).
3. **Full human smoke** (every feature → wipe): [`HUMAN-FULL-SMOKE.md`](./HUMAN-FULL-SMOKE.md).
4. **Founder smoke minimum:** create chapter → login → second device join; Event → QR check-in.
5. **Optional branding:** fix Porkbun Resend DNS so From becomes `auth@chapteramanager.com`.

## Founder / join smoke

1. Open https://chapteramanager.com/onboarding
2. Create chapter as President
3. Enter OTP from the Chaptera sign-in email
4. Share the join code from Settings → Invites
5. Second browser/phone: `/join/:code` as member

## Honest product limits

- Dues: balances + pay **links** — not a card processor
- Announcement polls ≠ binding chapter votes
- QR check-in: chapter-scoped rotating codes per event (Event → QR check-in / Attendance picker). Cloud multi-device uses shared chapter storage; attendance QR is not GPS-gated.
- Local PWA notifications only (`Notification` API / service worker) while the app or installed PWA is open or recently used — **not** closed-app server Web Push. Email preference is stored but not delivered.
- Library hours: hard GPS geofence required when a study location has coordinates (`lat`/`lng` + radius); members must check in inside the radius to submit a log. Locations without a pin cannot be used for geofenced logging.
- Guest demo is local-only sample data

## Optional before wider pilot

- [ ] Connect Vercel → GitHub for auto-deploy on push (`vercel git connect`)
- [ ] Revoke any exposed API tokens
- [ ] Cross-device invite-link test (phone + laptop)
- [x] Minimal CI (typecheck + test + build) — `.github/workflows/ci.yml`
