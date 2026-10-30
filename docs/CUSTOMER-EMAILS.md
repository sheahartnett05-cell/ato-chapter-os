# Customer email delivery (Resend)

Chaptera login codes go through **Supabase Auth → Resend SMTP**. To email **any customer** (not just your Resend account inbox), you need a **verified domain** in Resend.

## Production domain

**`chapteramanager.com`** — add via `npm run configure-resend-domain -- add` if missing.

`onboarding@resend.dev` is test-only — Resend returns 403 if you send to anyone except your account email.

## Fix (one time, ~15 min)

### 1. Add these DNS records for `chapteramanager.com`

| Type | Host / Name | Value |
|------|-------------|-------|
| **TXT** | `resend._domainkey` | DKIM key from `npm run configure-resend-domain` |
| **MX** | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority **10**) |
| **TXT** | `send` | `v=spf1 include:amazonses.com ~all` |

`.env.local`:

```
RESEND_DOMAIN=chapteramanager.com
RESEND_FROM_EMAIL=auth@chapteramanager.com
RESEND_FROM_NAME=Chaptera
PILOT_SITE_URL=https://chapteramanager.com
```

Run this to print the exact values from Resend:

```bash
npm run configure-resend-domain
```

Or open [resend.com/domains](https://resend.com/domains) → `chapteramanager.com` → Records.

### 2. Verify the domain

```bash
npm run configure-resend-domain -- verify
```

Wait until Resend shows **verified** (often 15–30 minutes after DNS propagates).

### 3. Push sender to Supabase

```bash
npm run configure-resend-domain
npm run configure-chaptera-emails
npm run configure-pilot
```

### 4. Test to a real customer email

```bash
npm run configure-resend-domain -- --test customer@gmail.com
```

Then test onboarding at https://chapteramanager.com/onboarding

## Prefer a subdomain?

Add `mail.chapteramanager.com` in Resend instead of the root domain:

```
RESEND_DOMAIN=mail.chapteramanager.com
RESEND_FROM_EMAIL=auth@mail.chapteramanager.com
npm run configure-resend-domain -- add
```

Add the DNS records Resend shows, verify, then `npm run configure-resend-domain`.
