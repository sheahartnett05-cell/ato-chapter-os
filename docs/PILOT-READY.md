# Pilot readiness

**Production URL:** https://ato-chapter-os.vercel.app  
**Supabase project:** `oquqmoroihoksciiqwyt`

## Done

- [x] Supabase migrations (join codes, invite sync RPC)
- [x] Agora auth email templates + Resend SMTP
- [x] Auth rate limits raised (100/hr email + OTP)
- [x] Site URL → `https://ato-chapter-os.vercel.app`
- [x] Vercel production deploy with `VITE_SUPABASE_*` env vars
- [x] Pilot chapter in cloud with join code (SQL seed for invite RPC)
- [x] Sprint fixes in `sprint-fixes` branch

## Pilot invite link (cloud-backed)

```
https://ato-chapter-os.vercel.app/join?code=CHAPTER-PILOT-KH34DM
```

`resolve_join_code` returns this chapter for any device.

## One manual step for full founder flow

Automated OTP seed failed because `onboarding@resend.dev` only delivers to your **Resend account email**.

For a real founding president (creates auth user + membership + KV sync):

1. Open https://ato-chapter-os.vercel.app/onboarding
2. Create chapter as President using **your Resend account email**
3. Enter OTP from the Agora sign-in email
4. Share the join code from Settings → Invites

## Optional before wider pilot

- [ ] Verify a domain in Resend → update `RESEND_FROM_EMAIL` → `npm run configure-pilot`
- [ ] Revoke exposed API tokens (Supabase PAT, Resend key from chat)
- [ ] Connect Vercel to GitHub for auto-deploy on push
- [ ] Run manual cross-device test (phone + laptop) with invite link

## Commands

```bash
npm run configure-pilot      # templates + SMTP + rate limits + site URL
npm run verify-supabase      # RPC + migration checks
npm run seed-cloud-chapter-sql  # emergency cloud join code (SQL)
npm run smoke-test:cloud     # Iota cross-device automation
```
