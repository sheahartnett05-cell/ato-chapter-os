-- Reliable join-code publish (bypasses RLS edge cases on chapters.update).
-- Safe to re-run.

create or replace function public.sync_chapter_join_codes(
  p_chapter_id uuid,
  p_join_code text,
  p_invite_codes jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := nullif(upper(trim(coalesce(p_join_code, ''))), '');
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if p_chapter_id is null then
    raise exception 'chapter_id required';
  end if;

  if not exists (
    select 1 from public.chapter_memberships m
    where m.chapter_id = p_chapter_id and m.user_id = v_uid
  ) and not exists (
    select 1 from public.chapters c
    where c.id = p_chapter_id and c.founded_by = v_uid
  ) then
    raise exception 'not authorized for chapter';
  end if;

  update public.chapters
  set
    join_code = v_code,
    invite_codes = coalesce(p_invite_codes, '[]'::jsonb),
    updated_at = now()
  where id = p_chapter_id;
end;
$$;

revoke all on function public.sync_chapter_join_codes(uuid, text, jsonb) from public;
grant execute on function public.sync_chapter_join_codes(uuid, text, jsonb) to authenticated;
