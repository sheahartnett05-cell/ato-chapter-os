-- Manual RLS check script (run in a non-prod project after applying
-- 20260331000000_harden_membership_and_kv_rls.sql).
-- Replace :chapter_id / :member_uid / :officer_uid with real UUIDs.
-- Expect: FAIL on unauthorized; SUCCESS on authorized.

-- As member (set JWT / role to member user):
-- Should FAIL:
--   insert into chapter_memberships (chapter_id, user_id, app_member_id, role)
--   values (:other_chapter_id, auth.uid(), 'hack', 'President');
-- Should FAIL:
--   update chapter_memberships set role = 'President' where user_id = auth.uid();
-- Should FAIL:
--   update chapter_kv set value = '{}'::jsonb
--   where chapter_id = :chapter_id and key = 'chapter-os-roster-members';
-- Should SUCCEED:
--   update chapter_kv set value = '{}'::jsonb
--   where chapter_id = :chapter_id and key = 'chapter-os-rsvps';

-- As officer:
-- Should SUCCEED officer key write (roster/dues).
-- Should SUCCEED select memberships for chapter.
-- Should SUCCEED select set_membership_role(:chapter_id, :member_uid, 'ActiveMember');

select 'See comments above for deny/allow cases' as instructions;
