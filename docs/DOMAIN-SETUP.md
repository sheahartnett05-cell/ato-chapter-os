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

## Status (2026-10-29)

- [x] Domain added to Resend (`chapteramanager.com`) — pending DNS
- [ ] DNS records at registrar — see [`CHAPTERA_DNS_RECORDS.md`](./CHAPTERA_DNS_RECORDS.md)
- [x] Domain attached on Vercel → project `ato-chapter-os` (NS still Porkbun; A/CNAME or switch NS needed)
- [x] New Supabase project `qfurjvkdbvjpvezsrddf` — migrations applied + Chaptera email templates + Resend SMTP
- [x] Supabase `site_url` → https://chapteramanager.com
- [ ] App live at https://chapteramanager.com (needs Porkbun DNS)
