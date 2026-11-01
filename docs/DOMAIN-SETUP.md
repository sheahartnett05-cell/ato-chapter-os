# chapteramanager.com — connect checklist

DNS is at **Porkbun** (or your registrar). Add the records below for the Chaptera app + auth email.

## 1. App (Vercel)

| Type | Host | Value |
|------|------|-------|
| **A** | `@` | `216.198.79.1` |
| **A** | `@` | `64.29.17.1` |

Optional: **CNAME** `www` → `cname.vercel-dns.com`

```bash
npx vercel domains add chapteramanager.com
npx vercel domains verify chapteramanager.com
```

After propagation: **https://chapteramanager.com**

## 2. Email (Resend) — customer OTP codes

| Type | Host | Value |
|------|------|-------|
| **TXT** | `resend._domainkey` | *(run `npm run configure-resend-domain` for full DKIM value)* |
| **MX** | `send` | `feedback-smtp.us-east-1.amazonses.com` — priority **10** |
| **TXT** | `send` | `v=spf1 include:amazonses.com ~all` |

Sender: `Chaptera <auth@chapteramanager.com>`

## 3. After DNS propagates (~15–30 min)

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
```

Test:

```bash
npm run configure-resend-domain -- --test you@gmail.com
```

Open https://chapteramanager.com/onboarding → Send login code.

## Status (2026-11-01)

- [x] Domain added to Resend (`chapteramanager.com`) — **still pending**: `resend._domainkey` / `send` / `rsend` CNAME to Porkbun parking (`uixie.porkbun.com`); replace with records in [`CHAPTERA_DNS_RECORDS.md`](./CHAPTERA_DNS_RECORDS.md)
- [x] Domain attached on Vercel → project `ato-chapter-os`
- [x] Canonical Supabase project `qfurjvkdbvjpvezsrddf` — migrations through Phase A + Chaptera email templates + Resend SMTP
- [x] Supabase `site_url` → https://chapteramanager.com
- [x] App live at https://chapteramanager.com — prod includes QR check-in (`d932a05`)
- See also [`PILOT-READY.md`](./PILOT-READY.md)
