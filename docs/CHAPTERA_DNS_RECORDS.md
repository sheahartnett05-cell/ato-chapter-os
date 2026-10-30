# DNS records for chapteramanager.com

Add these at your registrar (Porkbun, etc.). Generated from Resend after `npm run configure-resend-domain -- add`.

## Resend (email OTP)

| Type | Host / Name | Value | Priority |
|------|-------------|-------|----------|
| **TXT** | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCjEabOjWshWQOlAe1mH9mFlrKPT0zXo3WsWl1HBCbEvzbPrzCmfGa5VoNbTyaB2B4y/ARC2YHHZw1WEY38M8sITpG115g991Iw/XBVQvOGXGsMWp0rkMd8rNpXUhW3EUbH3Ryih8PZJZJIvKEUp4xgzVhtORuEUxW7bqLfKw5WnQIDAQAB` | — |
| **MX** | `send` | `feedback-smtp.us-east-1.amazonses.com` | **10** |
| **TXT** | `send` | `v=spf1 include:amazonses.com ~all` | — |
| **CNAME** | `rsend` | `send.forge.rmta.net` | — |

Resend dashboard: https://resend.com/domains/2d639579-aeeb-4e9a-9aae-6c8033e4c0e2

After DNS propagates:

```bash
npm run configure-resend-domain -- verify
npm run configure-resend-domain
```

## Vercel (app)

| Type | Host | Value |
|------|------|-------|
| **A** | `@` | `216.198.79.1` |
| **A** | `@` | `64.29.17.1` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

Then in Vercel project → Domains → add `chapteramanager.com` (and optionally `www`).

## Env (already set in `.env.local`)

```
RESEND_DOMAIN=chapteramanager.com
RESEND_FROM_EMAIL=auth@chapteramanager.com
RESEND_FROM_NAME=Chaptera
PILOT_SITE_URL=https://chapteramanager.com
```
