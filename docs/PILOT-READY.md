# Pilot readiness

**Production URL:** https://chapteramanager.com  
**Supabase project:** `oquqmoroihoksciiqwyt` (confirm in dashboard)

## Done

- [x] Supabase migrations (join codes, invite sync RPC)
- [x] Chaptera auth email templates + Resend SMTP (templates in repo)
- [x] Auth rate limits raised (100/hr email + OTP)
- [ ] Site URL → `https://chapteramanager.com`
- [ ] Vercel domain `chapteramanager.com` + `VITE_SUPABASE_*` env vars
- [x] Sprint fixes in `sprint-fixes` branch

## Domain cutover

See [`docs/DOMAIN-SETUP.md`](./DOMAIN-SETUP.md) and [`docs/CUSTOMER-EMAILS.md`](./CUSTOMER-EMAILS.md).

```bash
# .env.local
RESEND_DOMAIN=chapteramanager.com
RESEND_FROM_EMAIL=auth@chapteramanager.com
RESEND_FROM_NAME=Chaptera
PILOT_SITE_URL=https://chapteramanager.com

npm run configure-resend-domain -- add
npm run configure-resend-domain -- verify
npm run configure-resend-domain
npm run configure-pilot
npm run configure-chaptera-emails
```

## Founder / join smoke

1. Open https://chapteramanager.com/onboarding
2. Create chapter as President
3. Enter OTP from the Chaptera sign-in email
4. Share the join code from Settings → Invites

## Optional before wider pilot

- [ ] Customer emails verified on `chapteramanager.com` in Resend
- [ ] Revoke any exposed API tokens
- [ ] Connect Vercel to GitHub for auto-deploy on push
- [ ] Run manual cross-device test (phone + laptop) with invite link
