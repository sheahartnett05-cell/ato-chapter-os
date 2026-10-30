# Agora auth email templates

Branded Supabase Auth emails matching the app (`#1a1a1a` ink, `#c4a35a` gold stripe, editorial serif headings, mono OTP).

Copy is universal — the same templates work for every Agora user. No chapter, role, or org-specific language.

## Auto-deploy

```bash
npm run configure-agora-emails
```

Requires `SUPABASE_ACCESS_TOKEN` (Administrator) in `.env.local`.

## Manual paste (no token)

1. Run `npm run configure-agora-emails` — writes HTML to `generated/`
2. Supabase Dashboard → **Authentication → Email Templates**
3. For **Magic link / OTP** (onboarding login codes):
   - Subject: `generated/magic_link.subject.txt`
   - Body: paste `generated/magic_link.html`

## Templates

| File | Supabase template |
|------|-------------------|
| `magic_link` | Magic link / OTP — **Send login code** |
| `confirmation` | Confirm sign up |
| `recovery` | Reset password |
| `invite` | Invite user |

Edit `buildTemplates.mjs`, then re-run configure.
