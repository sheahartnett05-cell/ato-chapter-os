# Pilot readiness

**Production URL:** https://chapteramanager.com  
**Canonical Supabase project:** `qfurjvkdbvjpvezsrddf`  
**Branch:** `sprint-fixes`  
**Latest prod ship:** `d932a05` (QR check-in) → Vercel `dpl_3AgdnWtxCG5rGmQf71s6edcP72Ed`

> Older refs to `oquqmoroihoksciiqwyt` are retired. Vercel `VITE_SUPABASE_URL` and `.env.local` must point at `qfurjvkdbvjpvezsrddf` only.

## Status (2026-11-01)

| Item | Status |
|------|--------|
| Site live at chapteramanager.com | **Yes** — prod redeployed with `d932a05` |
| `VITE_SUPABASE_URL` (local + Vercel prod) | `https://qfurjvkdbvjpvezsrddf.supabase.co` |
| Migrations through Phase A (`20260401…`) | Applied to `qfurjvkdbvjpvezsrddf` |
| Gate A (`npm run test:phase-a`) | **PASS** (17/17) via Management API + `SUPABASE_ACCESS_TOKEN` — no Docker. Ephemeral GateA-* chapter/users cleaned up. |
| Full-feature human smoke prompt | [`HUMAN-FULL-SMOKE.md`](./HUMAN-FULL-SMOKE.md) (wipe via Settings → Wipe test chapter data) |
| `verify-supabase` join RPCs | **Pass** (`CHAPTER-FOUNDER`, `sync_chapter_join_codes`) |
| Auth Site URL | `https://chapteramanager.com` |
| Chaptera Auth email templates + Resend SMTP | Configured on project |
| Resend domain `chapteramanager.com` | **Pending / STOP-SHIP** — DNS wrong (see below) |
| Guest demo Officer Home | Fixed in `36fc518` |
| Attendance tracker `/attendance` | Shipped in `f41e93b` |
| Chapter QR check-in | Shipped in `d932a05` — Event → QR check-in; `/check-in/:eventId` |
| Founder / join smoke (OTP + 2nd device) | **Not proven** — blocked on Resend DNS |
| Vercel deploy | Working via CLI login (`vercel whoami`) |

## STOP-SHIP: Resend DNS

Public DNS for the Resend hosts currently **CNAMEs to Porkbun parking** (`uixie.porkbun.com`), so verification cannot succeed:

- `resend._domainkey.chapteramanager.com` → CNAME `uixie.porkbun.com` (need **TXT** DKIM)
- `send.chapteramanager.com` → CNAME `uixie.porkbun.com` (need **MX** + **TXT** SPF)
- `rsend.chapteramanager.com` → CNAME `uixie.porkbun.com` (need **CNAME** `send.forge.rmta.net`)

Root `chapteramanager.com` A records → Vercel are fine (`216.198.79.1`, `64.29.17.1`).

**At Porkbun:** delete those parking aliases, then add exact records from [`CHAPTERA_DNS_RECORDS.md`](./CHAPTERA_DNS_RECORDS.md). Then:

```bash
npm run configure-resend-domain -- verify
npm run configure-resend-domain
npm run configure-pilot
npm run configure-resend-domain -- --test you@real-inbox.com
```

OTP proof: https://chapteramanager.com/onboarding → Send login code.

## Must before inviting a real chapter

1. **Fix Resend DNS** (above) until domain status is `verified` and a real inbox receives OTP.
2. **Gate A** — `npm run test:phase-a` (uses `SUPABASE_ACCESS_TOKEN` + project URL; Docker optional).
3. **Full human smoke** (every feature → wipe): paste prompt in [`HUMAN-FULL-SMOKE.md`](./HUMAN-FULL-SMOKE.md).
4. **Founder smoke minimum:** create chapter → OTP → second device join; Event → QR check-in.  
   Still **STOP-SHIP** until Resend DNS for `chapteramanager.com` is verified.

## Founder / join smoke

1. Open https://chapteramanager.com/onboarding
2. Create chapter as President
3. Enter OTP from the Chaptera sign-in email
4. Share the join code from Settings → Invites
5. Second browser/phone: `/join/:code` as member

## Honest product limits

- Dues: balances + pay **links** — not a card processor
- Announcement polls ≠ binding chapter votes
- QR check-in: chapter-scoped rotating codes per event (Event → QR check-in). Cloud multi-device uses shared chapter storage; no geofence yet.
- No push notification delivery yet
- Guest demo is local-only sample data

## Optional before wider pilot

- [ ] Connect Vercel → GitHub for auto-deploy on push (`vercel git connect`)
- [ ] Revoke any exposed API tokens
- [ ] Cross-device invite-link test (phone + laptop)
- [x] Minimal CI (typecheck + test + build) — `.github/workflows/ci.yml`
