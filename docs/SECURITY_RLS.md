# Agora Supabase RLS — exposure and remediation plan

**Status:** Production blocker until Phase A identity migration is applied and Gate A passes.  
**Prepared migrations (local only, not applied):**
- `supabase/migrations/20260331000000_harden_membership_and_kv_rls.sql` (superseded by Phase A for membership writes)
- `supabase/migrations/20260401000000_server_owned_identity_roles.sql` (**Phase A** — roles enum, officer seats, create/join/role/seat RPCs)
**Gate A test:** `npm run test:phase-a` → `scripts/test-phase-a-identity.mjs` (local Supabase or `STAGING_*` only; refuses production hosts)

## Verified exposure (current policies)

### 1. `chapter_memberships` — self-insert into any chapter
Defined in `20260326…_auth_membership_rls.sql` / reaffirmed in `20260327…`:

- Policy `memberships_insert_self`: any authenticated user may `INSERT` a row with `user_id = auth.uid()` for **any** `chapter_id`.
- **Impact:** Join without a valid join code / claim RPC. Attacker who knows a chapter UUID becomes a member.

### 2. `chapter_memberships` — self role update
- Policy `memberships_update_self`: user may `UPDATE` their own membership row, including `role` → `President`.
- **Impact:** Privilege escalation to founder/officer capabilities that the app trusts from membership role.

### 3. `chapter_kv` — any member full CRUD
- Policies `chapter_kv_insert|update|delete|select` allow any chapter member to write **any** key blob.
- **Impact:** Member can overwrite roster, dues, governance, positions, features, prospects, attendance.

## Affected product flows
| Flow | Risk |
|------|------|
| Join with code / founder claim | Bypassed by direct membership insert |
| Officer seat / role assignment | Bypassed by self role UPDATE |
| Dues, roster, rush, standards | Corrupted via `chapter_kv` key overwrite |
| Guest preview | Must stay local-only (app-side); RLS still required for real accounts |

## Remediation in prepared migration
1. Drop `memberships_insert_self` and `memberships_update_self`.
2. Joins only via existing security-definer join-code / claim RPCs.
3. Role changes via `set_membership_role(chapter_id, user_id, role)` callable by President / founder only.
4. Add `is_chapter_officer(chapter_id)`.
5. Split `chapter_kv` writes:
   - **Officer-only keys:** roster, dues, governance, positions, features, standards config, prospects, attendance, rush cycles, budgets, …
   - **Member-writable keys:** RSVPs, excuses, study logs, posts (when members may post), personal profile-adjacent blobs if any.
6. Do **not** blanket officer-only all keys — that would break member RSVP / excuse / poll / study writes.

## Additional production blocker — whole-blob LWW
`chapter_kv` stores one JSON blob per key. Concurrent member writes (RSVPs, excuses, attendance) last-write-wins and can silently drop updates. Hydration is boot-time only.

**Plan (later pass, not this migration):** per-row tables + RPCs for RSVPs, attendance, excuses; keep coarse blobs only for rarely-contended config. Do not implement in this pass.

## Frontend note
UI permission gates are **not** authorization. RLS must deny unauthorized writes even when the SPA is compromised or outdated.
