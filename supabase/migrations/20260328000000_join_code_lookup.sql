-- Public join-code lookup so members can redeem CHAPTER-JOIN-* before membership exists.
-- Safe to re-run.

alter table public.chapters
  add column if not exists join_code text;

create unique index if not exists idx_chapters_join_code
  on public.chapters (upper(join_code))
  where join_code is not null and join_code <> '';

-- Founders / members can set join_code on their chapter
drop policy if exists "chapters_update_member" on public.chapters;
create policy "chapters_update_member" on public.chapters
  for update to authenticated
  using (public.is_chapter_member(id) or founded_by = auth.uid())
  with check (public.is_chapter_member(id) or founded_by = auth.uid());

create or replace function public.resolve_join_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_id uuid;
  v_join text;
  v_label text;
  v_org text;
  v_desig text;
  v_uni text;
begin
  if v_code = '' then
    return null;
  end if;

  if v_code = 'CHAPTER-FOUNDER' then
    return jsonb_build_object(
      'code', 'CHAPTER-FOUNDER',
      'role', 'President',
      'label', 'Founding President (one-time)',
      'kind', 'founder'
    );
  end if;

  select c.id, c.join_code, c.org_id, c.chapter_designation, c.university,
         trim(both from concat_ws(' ', nullif(c.chapter_designation, ''), 'join code'))
    into v_id, v_join, v_org, v_desig, v_uni, v_label
  from public.chapters c
  where c.join_code is not null
    and upper(c.join_code) = v_code
  limit 1;

  if v_id is null then
    return null;
  end if;

  return jsonb_build_object(
    'code', upper(v_join),
    'role', 'ActiveMember',
    'label', coalesce(nullif(v_label, ''), 'Chapter join code'),
    'kind', 'join',
    'chapter_id', v_id,
    'org_id', v_org,
    'chapter_designation', coalesce(v_desig, ''),
    'university', coalesce(v_uni, '')
  );
end;
$$;

revoke all on function public.resolve_join_code(text) from public;
grant execute on function public.resolve_join_code(text) to anon, authenticated;
