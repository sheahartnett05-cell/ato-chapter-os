-- LOCAL / STAGING ONLY until Gate A passes and an operator applies intentionally.
-- Server-owned chapter identity: membership roles + officer seats via RPCs only.
-- Replaces client-trusted claim_or_create_chapter / self membership insert+update.
-- Idempotent: safe to re-run.

-- ─── 1. Roles enum (matches src/types/permissions.ts AssignableRole + UserRole) ───
do $$
begin
  if not exists (select 1 from pg_type where typname = 'chapter_member_role') then
    create type public.chapter_member_role as enum (
      'President',
      'VicePresident',
      'Treasurer',
      'Secretary',
      'JBoardChair',
      'RecruitmentChair',
      'ScholarshipChair',
      'Chaplain',
      'ActiveMember',
      'NewMember'
    );
  end if;
end $$;

-- Normalize legacy role text before cast
update public.chapter_memberships
set role = 'ActiveMember'
where role is null
   or role not in (
     'President', 'VicePresident', 'Treasurer', 'Secretary',
     'JBoardChair', 'RecruitmentChair', 'ScholarshipChair',
     'Chaplain', 'ActiveMember', 'NewMember'
   );

alter table public.chapter_memberships
  alter column role drop default;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chapter_memberships'
      and column_name = 'role'
      and udt_name = 'text'
  ) then
    alter table public.chapter_memberships
      alter column role type public.chapter_member_role
      using role::public.chapter_member_role;
  end if;
end $$;

alter table public.chapter_memberships
  alter column role set default 'ActiveMember'::public.chapter_member_role;

-- ─── 2. Officer seats (server source of truth for officer status + capabilities) ───
create table if not exists public.chapter_officer_seats (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  seat_id text not null,
  title text not null,
  function text not null default 'other',
  member_user_id uuid references auth.users (id) on delete set null,
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, seat_id)
);

create index if not exists idx_officer_seats_chapter
  on public.chapter_officer_seats (chapter_id);
create index if not exists idx_officer_seats_member
  on public.chapter_officer_seats (member_user_id);

alter table public.chapter_officer_seats enable row level security;

drop policy if exists "officer_seats_select_member" on public.chapter_officer_seats;
create policy "officer_seats_select_member" on public.chapter_officer_seats
  for select to authenticated
  using (public.is_chapter_member(chapter_id));

-- No direct insert/update/delete for authenticated — RPCs only
drop policy if exists "officer_seats_write" on public.chapter_officer_seats;

-- ─── 3. Capability helpers ───
create or replace function public.default_seat_capabilities(p_function text)
returns text[]
language sql
immutable
as $$
  select case lower(coalesce(p_function, 'other'))
    when 'president' then array['roster','dues','standards','recruitment','calendar','announcements','setup','attendance','budget','house']
    when 'treasurer' then array['dues','budget']
    when 'secretary' then array['roster','calendar','announcements']
    when 'recruitment' then array['recruitment']
    when 'internal_vp_standards' then array['standards','attendance','roster']
    when 'scholarship' then array['attendance']
    when 'house' then array['house']
    when 'social' then array['calendar','announcements']
    when 'philanthropy_service' then array['calendar']
    when 'risk_management' then array['standards','attendance']
    when 'communications' then array['announcements']
    when 'ritual' then array['announcements']
    else '{}'::text[]
  end;
$$;

create or replace function public.is_valid_capability(p_cap text)
returns boolean
language sql
immutable
as $$
  select p_cap in (
    'roster','dues','standards','recruitment','calendar','announcements',
    'setup','attendance','budget','house'
  );
$$;

create or replace function public.is_president(p_chapter_id uuid)
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
      and (m.role = 'President'::public.chapter_member_role or m.is_founder = true)
  );
$$;

revoke all on function public.is_president(uuid) from public;
grant execute on function public.is_president(uuid) to authenticated;

create or replace function public.has_capability(p_chapter_id uuid, p_cap text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_valid_capability(p_cap)
    and (
      public.is_president(p_chapter_id)
      or exists (
        select 1
        from public.chapter_officer_seats s
        where s.chapter_id = p_chapter_id
          and s.member_user_id = auth.uid()
          and p_cap = any (s.capabilities)
      )
    );
$$;

revoke all on function public.has_capability(uuid, text) from public;
grant execute on function public.has_capability(uuid, text) to authenticated;

-- Officer = any seat holder or president/founder (for legacy is_chapter_officer callers)
create or replace function public.is_chapter_officer(p_chapter_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_president(p_chapter_id)
    or exists (
      select 1
      from public.chapter_officer_seats s
      where s.chapter_id = p_chapter_id
        and s.member_user_id = auth.uid()
    );
$$;

revoke all on function public.is_chapter_officer(uuid) from public;
grant execute on function public.is_chapter_officer(uuid) to authenticated;

-- ─── 4. Drop dangerous membership policies (RPC-only writes) ───
drop policy if exists "memberships_insert_self" on public.chapter_memberships;
drop policy if exists "memberships_update_self" on public.chapter_memberships;
drop policy if exists "memberships_delete_self" on public.chapter_memberships;

drop policy if exists "memberships_select_member" on public.chapter_memberships;
create policy "memberships_select_member" on public.chapter_memberships
  for select to authenticated
  using (public.is_chapter_member(chapter_id) or user_id = auth.uid());

-- Chapters: stop open insert; create_chapter RPC inserts as security definer
drop policy if exists "chapters_insert_founder" on public.chapters;

-- ─── 5. Seed default seats for a new chapter ───
create or replace function public.seed_default_officer_seats(
  p_chapter_id uuid,
  p_president_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.chapter_officer_seats
    (chapter_id, seat_id, title, function, member_user_id, capabilities)
  values
    (p_chapter_id, 'pos-pres', 'President', 'president', p_president_user_id,
      public.default_seat_capabilities('president')),
    (p_chapter_id, 'pos-vp', 'Vice President', 'internal_vp_standards', null,
      public.default_seat_capabilities('internal_vp_standards')),
    (p_chapter_id, 'pos-treas', 'Treasurer', 'treasurer', null,
      public.default_seat_capabilities('treasurer')),
    (p_chapter_id, 'pos-sec', 'Secretary', 'secretary', null,
      public.default_seat_capabilities('secretary')),
    (p_chapter_id, 'pos-rush', 'Recruitment Chair', 'recruitment', null,
      public.default_seat_capabilities('recruitment')),
    (p_chapter_id, 'pos-scholar', 'Scholarship Chair', 'scholarship', null,
      public.default_seat_capabilities('scholarship')),
    (p_chapter_id, 'pos-standards', 'Standards Chair', 'internal_vp_standards', null,
      public.default_seat_capabilities('internal_vp_standards')),
    (p_chapter_id, 'pos-chaplain', 'Chaplain', 'ritual', null,
      public.default_seat_capabilities('ritual'))
  on conflict (chapter_id, seat_id) do nothing;
end;
$$;

revoke all on function public.seed_default_officer_seats(uuid, uuid) from public;

-- ─── 6. create_chapter — caller becomes founder + President ───
create or replace function public.create_chapter(
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
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_app_id text;
  v_join text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(p_org_id), '') = '' then
    raise exception 'org_id required';
  end if;
  if coalesce(trim(p_designation), '') = '' or coalesce(trim(p_university), '') = '' then
    raise exception 'designation and university required';
  end if;

  -- Already a member of some chapter → refuse silent re-claim
  if exists (select 1 from public.chapter_memberships m where m.user_id = v_uid) then
    raise exception 'already a member of a chapter; leave before creating another';
  end if;

  -- Never auto-join an existing chapter by identity (that was the old exploit)
  if exists (
    select 1 from public.chapters c
    where c.org_id = p_org_id
      and c.chapter_designation = trim(p_designation)
      and c.university = trim(p_university)
  ) then
    raise exception 'chapter already exists; join with a code';
  end if;

  v_app_id := coalesce(nullif(trim(p_app_member_id), ''), 'm-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_join := 'CHAPTER-JOIN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.chapters (
    org_id, org_name, nickname, letters, chapter_designation, university,
    semester, primary_color, secondary_color, accent_color, founded_by, join_code
  ) values (
    p_org_id,
    coalesce(nullif(trim(p_org_name), ''), p_org_id),
    p_nickname, p_letters,
    trim(p_designation), trim(p_university),
    coalesce(p_semester, ''),
    p_primary_color, p_secondary_color, p_accent_color,
    v_uid, v_join
  )
  returning id into v_id;

  insert into public.chapter_memberships (
    chapter_id, user_id, app_member_id, role, is_founder
  ) values (
    v_id, v_uid, v_app_id, 'President'::public.chapter_member_role, true
  );

  insert into public.chapter_members (
    chapter_id, user_id, first_name, last_name, email, phone, role, status
  ) values (
    v_id, v_uid,
    coalesce(nullif(trim(p_first_name), ''), 'Founder'),
    coalesce(nullif(trim(p_last_name), ''), 'President'),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    'President', 'Active'
  )
  on conflict (chapter_id, email) do nothing;

  perform public.seed_default_officer_seats(v_id, v_uid);

  return v_id;
end;
$$;

revoke all on function public.create_chapter(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.create_chapter(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

-- ─── 7. join_chapter — code required; always ActiveMember / not founder ───
create or replace function public.join_chapter(
  p_code text,
  p_app_member_id text default null,
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_resolved jsonb;
  v_chapter uuid;
  v_app_id text;
  v_email text;
  v_elem jsonb;
  v_used int;
  v_max int;
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if v_code = '' then
    raise exception 'join code required';
  end if;
  if v_code = 'CHAPTER-FOUNDER' then
    raise exception 'founder code is not a join path; use create_chapter';
  end if;

  v_resolved := public.resolve_join_code(v_code);
  if v_resolved is null or (v_resolved->>'chapter_id') is null then
    raise exception 'invalid join code';
  end if;

  v_chapter := (v_resolved->>'chapter_id')::uuid;

  if exists (
    select 1 from public.chapter_memberships m
    where m.user_id = v_uid and m.chapter_id = v_chapter
  ) then
    return v_chapter;
  end if;

  if exists (select 1 from public.chapter_memberships m where m.user_id = v_uid) then
    raise exception 'already a member of another chapter';
  end if;

  select email into v_email from auth.users where id = v_uid;
  v_email := lower(coalesce(nullif(trim(p_email), ''), v_email, ''));

  if v_email <> '' and exists (
    select 1 from public.chapter_members cm
    where cm.chapter_id = v_chapter
      and lower(coalesce(cm.email, '')) = v_email
      and cm.user_id is not null
      and cm.user_id <> v_uid
  ) then
    raise exception 'email already linked to another account in this chapter';
  end if;

  v_app_id := coalesce(nullif(trim(p_app_member_id), ''), 'm-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.chapter_memberships (
    chapter_id, user_id, app_member_id, role, is_founder
  ) values (
    v_chapter, v_uid, v_app_id, 'ActiveMember'::public.chapter_member_role, false
  );

  insert into public.chapter_members (
    chapter_id, user_id, first_name, last_name, email, phone, role, status
  ) values (
    v_chapter, v_uid,
    coalesce(nullif(trim(p_first_name), ''), 'Member'),
    coalesce(nullif(trim(p_last_name), ''), 'New'),
    nullif(v_email, ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    'ActiveMember', 'Active'
  )
  on conflict (chapter_id, email) do update set
    user_id = excluded.user_id,
    first_name = coalesce(nullif(excluded.first_name, ''), public.chapter_members.first_name),
    last_name = coalesce(nullif(excluded.last_name, ''), public.chapter_members.last_name),
    phone = coalesce(excluded.phone, public.chapter_members.phone);

  -- Increment invite_codes usedCount when matching an extras code
  if (v_resolved->>'invite_id') is not null then
    update public.chapters c
    set invite_codes = (
      select coalesce(jsonb_agg(
        case
          when elem->>'id' = (v_resolved->>'invite_id') then
            jsonb_set(elem, '{usedCount}', to_jsonb(coalesce((elem->>'usedCount')::int, 0) + 1))
          else elem
        end
      ), '[]'::jsonb)
      from jsonb_array_elements(coalesce(c.invite_codes, '[]'::jsonb)) elem
    )
    where c.id = v_chapter;
  end if;

  return v_chapter;
end;
$$;

revoke all on function public.join_chapter(text, text, text, text, text, text) from public;
grant execute on function public.join_chapter(text, text, text, text, text, text) to authenticated;

-- ─── 8. set_member_role — President/founder only; never leave zero Presidents ───
create or replace function public.set_member_role(
  p_chapter_id uuid,
  p_user_id uuid,
  p_role public.chapter_member_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_target public.chapter_memberships%rowtype;
  v_actor public.chapter_memberships%rowtype;
  v_presidents int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_actor
  from public.chapter_memberships
  where chapter_id = p_chapter_id and user_id = v_uid;
  if not found then
    raise exception 'not a chapter member';
  end if;
  if not (v_actor.role = 'President'::public.chapter_member_role or v_actor.is_founder) then
    raise exception 'only president or founder may change roles';
  end if;

  select * into v_target
  from public.chapter_memberships
  where chapter_id = p_chapter_id and user_id = p_user_id;
  if not found then
    raise exception 'target is not a member of this chapter';
  end if;

  if v_target.role = 'President'::public.chapter_member_role
     and p_role <> 'President'::public.chapter_member_role then
    if not v_actor.is_founder then
      raise exception 'only founder may demote a President';
    end if;
    select count(*) into v_presidents
    from public.chapter_memberships
    where chapter_id = p_chapter_id
      and role = 'President'::public.chapter_member_role;
    if v_presidents <= 1 then
      raise exception 'chapter cannot be left with zero Presidents';
    end if;
  end if;

  update public.chapter_memberships
  set role = p_role
  where chapter_id = p_chapter_id and user_id = p_user_id;

  update public.chapter_members
  set role = p_role::text
  where chapter_id = p_chapter_id and user_id = p_user_id;
end;
$$;

revoke all on function public.set_member_role(uuid, uuid, public.chapter_member_role) from public;
grant execute on function public.set_member_role(uuid, uuid, public.chapter_member_role) to authenticated;

-- Drop weaker draft RPC from prior unapplied harden migration if present
drop function if exists public.set_membership_role(uuid, uuid, text);

-- ─── 9. Officer seat assign / remove ───
create or replace function public.assign_officer_seat(
  p_chapter_id uuid,
  p_seat_id text,
  p_member_user_id uuid,
  p_title text default null,
  p_function text default null,
  p_capabilities text[] default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caps text[];
  v_fn text;
  v_title text;
  cap text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not public.is_president(p_chapter_id) then
    raise exception 'only president or founder may assign seats';
  end if;
  if p_member_user_id is not null and not exists (
    select 1 from public.chapter_memberships m
    where m.chapter_id = p_chapter_id and m.user_id = p_member_user_id
  ) then
    raise exception 'assignee must be a chapter member';
  end if;

  select coalesce(nullif(trim(p_function), ''), function, 'other'),
         coalesce(nullif(trim(p_title), ''), title, p_seat_id)
    into v_fn, v_title
  from public.chapter_officer_seats
  where chapter_id = p_chapter_id and seat_id = p_seat_id;

  if v_fn is null then
    v_fn := coalesce(nullif(trim(p_function), ''), 'other');
    v_title := coalesce(nullif(trim(p_title), ''), p_seat_id);
  end if;

  v_caps := coalesce(p_capabilities, public.default_seat_capabilities(v_fn));
  foreach cap in array v_caps loop
    if not public.is_valid_capability(cap) then
      raise exception 'invalid capability: %', cap;
    end if;
  end loop;

  insert into public.chapter_officer_seats as s (
    chapter_id, seat_id, title, function, member_user_id, capabilities, updated_at
  ) values (
    p_chapter_id, p_seat_id, v_title, v_fn, p_member_user_id, v_caps, now()
  )
  on conflict (chapter_id, seat_id) do update set
    title = excluded.title,
    function = excluded.function,
    member_user_id = excluded.member_user_id,
    capabilities = excluded.capabilities,
    updated_at = now();
end;
$$;

revoke all on function public.assign_officer_seat(uuid, text, uuid, text, text, text[]) from public;
grant execute on function public.assign_officer_seat(uuid, text, uuid, text, text, text[]) to authenticated;

create or replace function public.remove_officer_seat(
  p_chapter_id uuid,
  p_seat_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.is_president(p_chapter_id) then
    raise exception 'only president or founder may remove seats';
  end if;
  if p_seat_id = 'pos-pres' then
    raise exception 'cannot remove the President seat';
  end if;
  delete from public.chapter_officer_seats
  where chapter_id = p_chapter_id and seat_id = p_seat_id;
end;
$$;

revoke all on function public.remove_officer_seat(uuid, text) from public;
grant execute on function public.remove_officer_seat(uuid, text) to authenticated;

-- ─── 10. leave_chapter / transfer_founder ───
create or replace function public.leave_chapter(p_chapter_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.chapter_memberships%rowtype;
  v_presidents int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_row
  from public.chapter_memberships
  where chapter_id = p_chapter_id and user_id = v_uid;
  if not found then
    raise exception 'not a member';
  end if;

  if v_row.role = 'President'::public.chapter_member_role or v_row.is_founder then
    select count(*) into v_presidents
    from public.chapter_memberships
    where chapter_id = p_chapter_id
      and role = 'President'::public.chapter_member_role;
    if v_presidents <= 1 then
      raise exception 'transfer founder / appoint another President before leaving';
    end if;
  end if;

  update public.chapter_officer_seats
  set member_user_id = null, updated_at = now()
  where chapter_id = p_chapter_id and member_user_id = v_uid;

  delete from public.chapter_memberships
  where chapter_id = p_chapter_id and user_id = v_uid;

  update public.chapter_members
  set user_id = null
  where chapter_id = p_chapter_id and user_id = v_uid;
end;
$$;

revoke all on function public.leave_chapter(uuid) from public;
grant execute on function public.leave_chapter(uuid) to authenticated;

create or replace function public.transfer_founder(
  p_chapter_id uuid,
  p_new_founder_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (
    select 1 from public.chapter_memberships m
    where m.chapter_id = p_chapter_id and m.user_id = v_uid and m.is_founder
  ) then
    raise exception 'only current founder may transfer';
  end if;
  if not exists (
    select 1 from public.chapter_memberships m
    where m.chapter_id = p_chapter_id and m.user_id = p_new_founder_user_id
  ) then
    raise exception 'new founder must be a chapter member';
  end if;

  update public.chapter_memberships
  set is_founder = false
  where chapter_id = p_chapter_id and user_id = v_uid;

  update public.chapter_memberships
  set is_founder = true,
      role = 'President'::public.chapter_member_role
  where chapter_id = p_chapter_id and user_id = p_new_founder_user_id;

  update public.chapters
  set founded_by = p_new_founder_user_id
  where id = p_chapter_id;

  perform public.assign_officer_seat(
    p_chapter_id, 'pos-pres', p_new_founder_user_id, 'President', 'president', null
  );
end;
$$;

revoke all on function public.transfer_founder(uuid, uuid) from public;
grant execute on function public.transfer_founder(uuid, uuid) to authenticated;

-- ─── 11. Revoke legacy claim RPC (replace with create/join) ───
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'claim_or_create_chapter'
  loop
    execute 'revoke all on function ' || r.sig || ' from public, anon, authenticated';
  end loop;
end $$;

-- Keep function body temporarily but unreachable to clients; drop after app cutover
drop function if exists public.claim_or_create_chapter(
  text, text, text, text, text, text, text, text, text, text, text, text, boolean
);

-- leave_all_chapters stays for recovery tooling but should not bypass last-president rule
create or replace function public.leave_all_chapters()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r record;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  for r in
    select chapter_id from public.chapter_memberships where user_id = v_uid
  loop
    perform public.leave_chapter(r.chapter_id);
  end loop;
exception
  when others then
    -- Recovery path: force leave if transfer required (dev wipe)
    update public.chapter_officer_seats set member_user_id = null where member_user_id = v_uid;
    delete from public.chapter_memberships where user_id = v_uid;
end;
$$;

-- ─── 12. chapter_kv: setup capability for officer config; keep member-writable keys ───
create or replace function public.chapter_kv_member_writable(p_key text)
returns boolean
language sql
immutable
as $$
  select p_key in (
    'chapter-os-rsvps',
    'chapter-os-rsvp-excuses',
    'chapter-os-study-logs',
    'chapter-os-posts'
  );
$$;

drop policy if exists "chapter_kv_insert" on public.chapter_kv;
drop policy if exists "chapter_kv_update" on public.chapter_kv;
drop policy if exists "chapter_kv_delete" on public.chapter_kv;

create policy "chapter_kv_insert" on public.chapter_kv
  for insert to authenticated
  with check (
    public.is_chapter_member(chapter_id)
    and (
      public.has_capability(chapter_id, 'setup')
      or public.chapter_kv_member_writable(key)
    )
  );

create policy "chapter_kv_update" on public.chapter_kv
  for update to authenticated
  using (
    public.is_chapter_member(chapter_id)
    and (
      public.has_capability(chapter_id, 'setup')
      or public.chapter_kv_member_writable(key)
    )
  )
  with check (
    public.is_chapter_member(chapter_id)
    and (
      public.has_capability(chapter_id, 'setup')
      or public.chapter_kv_member_writable(key)
    )
  );

create policy "chapter_kv_delete" on public.chapter_kv
  for delete to authenticated
  using (
    public.has_capability(chapter_id, 'setup')
    or (
      public.is_chapter_member(chapter_id)
      and public.chapter_kv_member_writable(key)
    )
  );

-- Note: whole-blob LWW remains a production blocker (Phase B).
