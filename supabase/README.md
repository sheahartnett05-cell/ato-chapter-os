# Agora — Supabase backend

## Status
**Production-ready for testing** with Supabase Auth + membership-scoped RLS.

- Email OTP sign-in during onboarding
- `chapter_memberships` links auth users → chapters
- `chapter_kv` dual-writes all chapter localStorage blobs
- Guest `/preview` stays local-only

## Setup
1. `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```
2. Run migrations **in order** in SQL Editor:
   - `20260324000000_agora_initial.sql`
   - `20260325000000_chapter_kv.sql`
   - `20260326000000_auth_membership_rls.sql`
   - `20260327000000_wipe_test_chapters_fix_claim.sql` (wipes simulation chapters + claim RPC)
3. Supabase Dashboard → **Authentication → Providers → Email**: enable Email, enable OTP/magic link
4. Restart `npm run dev`

## Wipe test chapters
If onboarding fails with a duplicate chapter / cloud link error after simulations:

1. Run `supabase/migrations/20260327000000_wipe_test_chapters_fix_claim.sql` in the SQL Editor (deletes simulation/test chapter rows).
2. In the app: **Settings → Wipe test chapter data** (or the error screen **Wipe chapter & restart**).
3. Complete onboarding again.

The claim RPC (`claim_or_create_chapter`) prevents the unique-index race where founders could not see an existing chapter under RLS and then failed on insert.

## User flow
1. Onboarding → Profile → enter email → **Send login code** → verify 6-digit OTP
2. Finish onboarding → chapter row + membership created → data pushed to cloud
3. Same email on another device → sign in → chapter hydrates from `chapter_kv`

## Security model
- RLS: users only read/write chapters they belong to (`chapter_memberships`)
- Anon key in browser is OK — policies enforce membership
- Before public launch at scale: rate limits, email domain allowlist optional, audit logs

## Tables
| Table | Purpose |
|-------|---------|
| `chapters` | Tenant row (org + campus + designation) |
| `chapter_memberships` | auth.users ↔ chapter + app member id |
| `chapter_kv` | JSON blobs mirroring localStorage keys |
| `profiles` | User profile from auth |
| Normalized tables | Ready for future direct queries |

## Pro tier
Upgrade when you need more DB size, daily active users, or dedicated support. Free tier is fine for multi-chapter QA (10–50 chapters).
