-- Wipe leftover simulation/test chapters and fix founder claim race.
-- Safe to re-run. Includes prerequisites if 20260326000000 was skipped.

create extension if not exists "pgcrypto";

-- ─── 0. Prerequisites (no-op if already applied) ───
create table if not exists public.chapter_memberships (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  app_member_id text not null,
  role text not null default 'ActiveMember',
  is_founder boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (chapter_id, user_id),
  unique (chapter_id, app_member_id)
);

create index if not exists idx_chapter_memberships_user on public.chapter_memberships (user_id);
create index if not exists idx_chapter_memberships_chapter on public.chapter_memberships (chapter_id);

alter table public.chapters
  add column if not exists founded_by uuid references auth.users (id) on delete set null;

create unique index if not exists idx_chapters_org_campus_designation
  on public.chapters (org_id, university, chapter_designation)
  where chapter_designation <> '' and university <> '';

create or replace function public.is_chapter_member(p_chapter_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.chapter_memberships m
    where m.chapter_id = p_chapter_id
      and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_chapter_member(uuid) to authenticated;
grant execute on function public.is_chapter_member(uuid) to anon;

alter table public.chapter_memberships enable row level security;

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
alter table public.chapters enable row level security;

drop policy if exists "chapters_public_all" on public.chapters;
drop policy if exists "chapters_auth_all" on public.chapters;
drop policy if exists "chapters_select_member" on public.chapters;
create policy "chapters_select_member" on public.chapters
  for select to authenticated
  using (
    public.is_chapter_member(id)
    or founded_by = auth.uid()
  );

drop policy if exists "chapters_insert_founder" on public.chapters;
create policy "chapters_insert_founder" on public.chapters
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "chapters_update_member" on public.chapters;
create policy "chapters_update_member" on public.chapters
  for update to authenticated
  using (public.is_chapter_member(id) or founded_by = auth.uid())
  with check (public.is_chapter_member(id) or founded_by = auth.uid());

-- memberships: allow self insert/select (needed before claim finishes)
drop policy if exists "memberships_select_member" on public.chapter_memberships;
create policy "memberships_select_member" on public.chapter_memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_chapter_member(chapter_id));

drop policy if exists "memberships_insert_self" on public.chapter_memberships;
create policy "memberships_insert_self" on public.chapter_memberships
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "memberships_update_self" on public.chapter_memberships;
create policy "memberships_update_self" on public.chapter_memberships
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "memberships_delete_self" on public.chapter_memberships;
create policy "memberships_delete_self" on public.chapter_memberships
  for delete to authenticated
  using (user_id = auth.uid());

-- ─── 3. Atomic claim-or-create (avoids unique-index race + RLS hide) ───
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_or_create_chapter'
  loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;

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
    if coalesce(trim(p_app_member_id), '') <> '' then
      insert into public.chapter_memberships (
        chapter_id, user_id, app_member_id, role, is_founder
      ) values (
        v_id,
        v_uid,
        p_app_member_id,
        coalesce(nullif(trim(p_role), ''), 'ActiveMember'),
        coalesce(p_is_founder, false)
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
    begin
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
    exception
      when unique_violation then
        select c.id into v_id
        from public.chapters c
        where c.org_id = p_org_id
          and c.chapter_designation = coalesce(p_designation, '')
          and c.university = coalesce(p_university, '')
        limit 1;
        if v_id is null then
          raise;
        end if;
    end;
  end if;

  if coalesce(trim(p_app_member_id), '') <> '' then
    insert into public.chapter_memberships (
      chapter_id, user_id, app_member_id, role, is_founder
    ) values (
      v_id,
      v_uid,
      p_app_member_id,
      coalesce(nullif(trim(p_role), ''), 'President'),
      coalesce(p_is_founder, true)
    )
    on conflict (chapter_id, user_id) do update set
      app_member_id = excluded.app_member_id,
      role = excluded.role,
      is_founder = public.chapter_memberships.is_founder or excluded.is_founder;
  end if;

  return v_id;
end;
$$;

revoke all on function public.claim_or_create_chapter(
  text, text, text, text, text, text, text, text, text, text, text, text, boolean
) from public;
grant execute on function public.claim_or_create_chapter(
  text, text, text, text, text, text, text, text, text, text, text, text, boolean
) to authenticated;

-- Optional: leave all chapters (dev reset)
drop function if exists public.leave_all_chapters();
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

revoke all on function public.leave_all_chapters() from public;
grant execute on function public.leave_all_chapters() to authenticated;
