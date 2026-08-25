-- Wipe leftover simulation/test chapters and fix founder claim race.
-- Apply in Supabase SQL Editor after prior migrations.

-- ─── 1. Wipe known test / simulation chapters (cascades memberships + kv) ───
delete from public.chapters
where
  chapter_designation ilike '%simulation%'
  or university ilike '%simulation%'
  or chapter_designation ilike '%mu omega%'
  or chapter_designation ilike '%test chapter%'
  or chapter_designation ilike 'test %'
  or chapter_designation = 'Test'
  or university ilike '%test university%'
  or university = 'Sim U'
  or (chapter_designation = '' and university = '')
  or (chapter_designation = 'Chapter' and university = 'Your University');

-- Orphans with no memberships (abandoned create attempts)
delete from public.chapters c
where not exists (
  select 1 from public.chapter_memberships m where m.chapter_id = c.id
);

-- ─── 2. Founders can always read chapters they founded ───
drop policy if exists "chapters_select_member" on public.chapters;
create policy "chapters_select_member" on public.chapters
  for select to authenticated
  using (
    public.is_chapter_member(id)
    or founded_by = auth.uid()
  );

-- ─── 3. Atomic claim-or-create (avoids unique-index race + RLS hide) ───
create or replace function public.claim_or_create_chapter(
  p_org_id text,
  p_designation text,
  p_university text,
  p_org_name text default null,
  p_nickname text default null,
  p_letters text default null,
  p_semester text default '',
  p_primary_color text default null,
  p_secondary_color text default null,
  p_accent_color text default null,
  p_app_member_id text default null,
  p_role text default 'President',
  p_is_founder boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if coalesce(trim(p_org_id), '') = '' then
    raise exception 'org_id required';
  end if;

  -- Prefer chapter the user already belongs to
  select m.chapter_id into v_id
  from public.chapter_memberships m
  where m.user_id = v_uid
  order by m.joined_at desc
  limit 1;

  if v_id is not null then
    if p_app_member_id is not null then
      insert into public.chapter_memberships (
        chapter_id, user_id, app_member_id, role, is_founder
      ) values (
        v_id, v_uid, p_app_member_id, coalesce(p_role, 'ActiveMember'), coalesce(p_is_founder, false)
      )
      on conflict (chapter_id, user_id) do update set
        app_member_id = excluded.app_member_id,
        role = excluded.role,
        is_founder = public.chapter_memberships.is_founder or excluded.is_founder;
    end if;
    return v_id;
  end if;

  -- Match existing by identity (bypasses RLS via security definer)
  if coalesce(trim(p_designation), '') <> '' and coalesce(trim(p_university), '') <> '' then
    select c.id into v_id
    from public.chapters c
    where c.org_id = p_org_id
      and c.chapter_designation = p_designation
      and c.university = p_university
    limit 1;
  end if;

  if v_id is null then
    insert into public.chapters (
      org_id,
      org_name,
      nickname,
      letters,
      chapter_designation,
      university,
      semester,
      primary_color,
      secondary_color,
      accent_color,
      founded_by
    ) values (
      p_org_id,
      coalesce(nullif(trim(p_org_name), ''), p_org_id),
      p_nickname,
      p_letters,
      coalesce(p_designation, ''),
      coalesce(p_university, ''),
      coalesce(p_semester, ''),
      p_primary_color,
      p_secondary_color,
      p_accent_color,
      v_uid
    )
    returning id into v_id;
  end if;

  if p_app_member_id is not null then
    insert into public.chapter_memberships (
      chapter_id, user_id, app_member_id, role, is_founder
    ) values (
      v_id, v_uid, p_app_member_id, coalesce(p_role, 'President'), coalesce(p_is_founder, true)
    )
    on conflict (chapter_id, user_id) do update set
      app_member_id = excluded.app_member_id,
      role = excluded.role,
      is_founder = public.chapter_memberships.is_founder or excluded.is_founder;
  end if;

  return v_id;
end;
$$;

grant execute on function public.claim_or_create_chapter(
  text, text, text, text, text, text, text, text, text, text, text, text, boolean
) to authenticated;

-- Optional: leave a chapter (dev reset) without deleting the chapter row for others
create or replace function public.leave_all_chapters()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  delete from public.chapter_memberships where user_id = v_uid;
end;
$$;

grant execute on function public.leave_all_chapters() to authenticated;
