# agoragreekmanagement.com — connect checklist

DNS is at **Porkbun** (`*.ns.porkbun.com`). Add the records below in Porkbun → Domain → DNS.

## 1. App (Vercel)

Replace existing **A** records on `@` (currently pointing to Porkbun parking IPs) with:

| Type | Host | Value |
|------|------|-------|
| **A** | `@` | `216.198.79.1` |
| **A** | `@` | `64.29.17.1` |

Optional: **CNAME** `www` → `cname.vercel-dns.com`

Verify: `npx vercel domains verify agoragreekmanagement.com`

After propagation, the app loads at **https://agoragreekmanagement.com**

## 2. Email (Resend) — customer OTP codes

| Type | Host | Value |
|------|------|-------|
| **TXT** | `resend._domainkey` | *(run `npm run configure-resend-domain` for full DKIM value)* |
| **MX** | `send` | `feedback-smtp.us-east-1.amazonses.com` — priority **10** |
| **TXT** | `send` | `v=spf1 include:amazonses.com ~all` |

Sender: `Agora <auth@agoragreekmanagement.com>`

## 3. After DNS propagates (~15–30 min)

```bash
npm run configure-resend-domain -- verify
npm run configure-resend-domain
```

Set Supabase site URL to the custom domain:

```bash
# .env.local
PILOT_SITE_URL=https://agoragreekmanagement.com
npm run configure-pilot
```

Test:

```bash
npm run configure-resend-domain -- --test you@gmail.com
```

Open https://agoragreekmanagement.com/onboarding → Send login code.

## Status

- [x] Domain added to Resend — **verified**
- [x] Domain added to Vercel — **verified**
- [x] DNS records at Porkbun
- [x] Supabase sends from `auth@agoragreekmanagement.com`
- [x] Supabase `site_url` → https://agoragreekmanagement.com
- [x] App live at https://agoragreekmanagement.com
