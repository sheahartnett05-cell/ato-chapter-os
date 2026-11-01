# Pilot readiness

**Production URL:** https://chapteramanager.com  
**Canonical Supabase project:** `qfurjvkdbvjpvezsrddf`  
**Branch:** `sprint-fixes`

> Older refs to `oquqmoroihoksciiqwyt` are retired. Vercel `VITE_SUPABASE_URL` and `.env.local` must point at `qfurjvkdbvjpvezsrddf` only.

## Status (2026-11-01)

| Item | Status |
|------|--------|
| Site live at chapteramanager.com | Yes (redeploy needed for latest `sprint-fixes`) |
| Migrations through Phase A (`20260401…`) | Applied to `qfurjvkdbvjpvezsrddf` |
| Gate A (`npm run test:phase-a`) | **Blocked** — needs Docker local Supabase or `STAGING_*` (script refuses production) |
| `verify-supabase` join RPCs | Pass (`CHAPTER-FOUNDER`, `sync_chapter_join_codes`) |
| Auth Site URL | `https://chapteramanager.com` |
| Chaptera Auth email templates + Resend SMTP | Configured on project |
| Resend domain `chapteramanager.com` | **DNS not verified** — see `docs/CHAPTERA_DNS_RECORDS.md` |
| Guest demo Officer Home | Fixed in `36fc518` |
| Attendance tracker `/attendance` | Shipped in `f41e93b` |
| Vercel deploy token | Often missing — paste `VERCEL_TOKEN` or `vercel login` |

## Must before inviting a real chapter

1. Add Resend DNS for `chapteramanager.com` at the registrar, then:
   ```bash
   npm run configure-resend-domain -- verify
   npm run configure-resend-domain
   ```
2. Run Gate A on **local or staging** (not prod):
   ```bash
   # Docker Desktop + local
   npx supabase start
   npm run apply-supabase-migrations   # against local if configured
   npm run test:phase-a
   # OR set STAGING_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY
   ```
3. Redeploy production with latest `sprint-fixes` (`npx vercel deploy --prod --yes`).
4. Manual smoke: create chapter → OTP → second device join with invite code.

## Founder / join smoke

1. Open https://chapteramanager.com/onboarding
2. Create chapter as President
3. Enter OTP from the Chaptera sign-in email
4. Share the join code from Settings → Invites

## Honest product limits

- Dues: balances + pay **links** — not a card processor
- Announcement polls ≠ binding chapter votes
- QR check-in: chapter-scoped rotating codes per event (Event → QR check-in). Cloud multi-device uses shared chapter storage; no geofence yet.
- No push notification delivery yet
- Guest demo is local-only sample data

## Optional before wider pilot

- [ ] Connect Vercel → GitHub for auto-deploy on push
- [ ] Revoke any exposed API tokens
- [ ] Cross-device invite-link test (phone + laptop)
- [ ] Minimal CI (typecheck + test + build)
