-- Enforce one chapter per auth user (product: cannot be in two groups at once).
-- RPCs already refuse a second create/join; this closes the table-level hole.

-- Keep the newest membership if any duplicates exist.
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id
      order by joined_at desc nulls last, id desc
    ) as rn
  from public.chapter_memberships
)
delete from public.chapter_memberships m
using ranked r
where m.id = r.id
  and r.rn > 1;

create unique index if not exists chapter_memberships_user_id_uidx
  on public.chapter_memberships (user_id);

comment on index public.chapter_memberships_user_id_uidx is
  'One Supabase user may belong to only one chapter at a time.';
