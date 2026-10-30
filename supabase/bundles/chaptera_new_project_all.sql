-- Chaptera full schema bundle for NEW Supabase project
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
-- Generated: 2026-10-29T23:58:01.225Z

-- ========== 20260324000000_agora_initial.sql ==========
-- Agora initial schema
-- Apply in Supabase SQL editor or via: supabase db push

create extension if not exists "pgcrypto";

-- Chapters (tenant)
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  org_name text not null,
  nickname text,
  letters text,
  chapter_designation text not null default '',
  university text not null default '',
  semester text not null default '',
  primary_color text,
  secondary_color text,
  accent_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  phone text,
  avatar text,
  created_at timestamptz not null default now()
);

-- Membership of a user in a chapter
create table if not exists public.chapter_members (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  role text not null default 'ActiveMember',
  status text not null default 'Active',
  attendance_pct int not null default 100,
  dues_paid numeric(12,2) not null default 0,
  dues_expected numeric(12,2) not null default 0,
  dues_status text not null default 'Paid',
  created_at timestamptz not null default now(),
  unique (chapter_id, email)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  name text not null,
  date date not null,
  time text,
  location text,
  type text,
  description text,
  required boolean not null default false,
  rsvp_required boolean not null default false,
  points int not null default 0,
  dress_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.chapter_members (id) on delete cascade,
  status text not null check (status in ('Going', 'Not Going')),
  guest text,
  unique (event_id, member_id)
);

create table if not exists public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.chapter_members (id) on delete cascade,
  status text not null check (status in ('Present', 'Excused', 'Absent')),
  points_earned int not null default 0,
  unique (event_id, member_id)
);

create table if not exists public.rsvp_excuses (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.chapter_members (id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  submitted_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz
);

create table if not exists public.dues_charges (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  label text not null,
  amount numeric(12,2) not null,
  due_date date,
  semester text,
  created_at timestamptz not null default now()
);

create table if not exists public.dues_payments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  charge_id uuid references public.dues_charges (id) on delete set null,
  member_id uuid not null references public.chapter_members (id) on delete cascade,
  amount_paid numeric(12,2) not null,
  paid_at timestamptz not null default now(),
  method text
);

create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  position_id text,
  label text not null,
  amount numeric(12,2) not null,
  date date,
  created_at timestamptz not null default now()
);

create table if not exists public.fines (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  member_id uuid not null references public.chapter_members (id) on delete cascade,
  amount numeric(12,2) not null,
  reason text not null,
  date_issued date not null,
  due_date date not null,
  status text not null default 'Unpaid',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_chapter_members_chapter on public.chapter_members (chapter_id);
create index if not exists idx_events_chapter on public.events (chapter_id);
create index if not exists idx_excuses_chapter on public.rsvp_excuses (chapter_id);

-- RLS: enable; policies are starter stubs — tighten before production
alter table public.chapters enable row level security;
alter table public.profiles enable row level security;
alter table public.chapter_members enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_attendance enable row level security;
alter table public.rsvp_excuses enable row level security;
alter table public.dues_charges enable row level security;
alter table public.dues_payments enable row level security;
alter table public.budget_lines enable row level security;
alter table public.fines enable row level security;

-- Policies are idempotent (safe to re-run after a partial apply)
drop policy if exists "profiles_self" on public.profiles;
drop policy if exists "chapters_auth_all" on public.chapters;
drop policy if exists "chapter_members_auth_all" on public.chapter_members;
drop policy if exists "events_auth_all" on public.events;
drop policy if exists "event_rsvps_auth_all" on public.event_rsvps;
drop policy if exists "event_attendance_auth_all" on public.event_attendance;
drop policy if exists "rsvp_excuses_auth_all" on public.rsvp_excuses;
drop policy if exists "dues_charges_auth_all" on public.dues_charges;
drop policy if exists "dues_payments_auth_all" on public.dues_payments;
drop policy if exists "budget_lines_auth_all" on public.budget_lines;
drop policy if exists "fines_auth_all" on public.fines;

-- Authenticated users can manage their own profile
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Temporary open policies for chapter data while migrating from localStorage
-- Replace with chapter_members membership checks before launch
create policy "chapters_auth_all" on public.chapters
  for all to authenticated using (true) with check (true);

create policy "chapter_members_auth_all" on public.chapter_members
  for all to authenticated using (true) with check (true);

create policy "events_auth_all" on public.events
  for all to authenticated using (true) with check (true);

create policy "event_rsvps_auth_all" on public.event_rsvps
  for all to authenticated using (true) with check (true);

create policy "event_attendance_auth_all" on public.event_attendance
  for all to authenticated using (true) with check (true);

create policy "rsvp_excuses_auth_all" on public.rsvp_excuses
  for all to authenticated using (true) with check (true);

create policy "dues_charges_auth_all" on public.dues_charges
  for all to authenticated using (true) with check (true);

create policy "dues_payments_auth_all" on public.dues_payments
  for all to authenticated using (true) with check (true);

create policy "budget_lines_auth_all" on public.budget_lines
  for all to authenticated using (true) with check (true);

create policy "fines_auth_all" on public.fines
  for all to authenticated using (true) with check (true);

-- ========== 20260325000000_chapter_kv.sql ==========
-- Chapter KV store: sync all Agora localStorage blobs to Supabase
-- Apply after 20260324000000_agora_initial.sql
-- Safe to re-run

create extension if not exists "pgcrypto";

create table if not exists public.chapter_kv (
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  key text not null,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (chapter_id, key)
);

create index if not exists idx_chapter_kv_updated on public.chapter_kv (chapter_id, updated_at desc);

alter table public.chapter_kv enable row level security;

-- Dev / early migrate: allow anon + authenticated full access to chapter data.
-- Tighten to membership checks before production launch.
drop policy if exists "chapter_kv_all" on public.chapter_kv;
create policy "chapter_kv_all" on public.chapter_kv
  for all using (true) with check (true);

-- Allow browser (anon key) to create/read chapters while auth is still local
drop policy if exists "chapters_auth_all" on public.chapters;
drop policy if exists "chapters_public_all" on public.chapters;
create policy "chapters_public_all" on public.chapters
  for all using (true) with check (true);

drop policy if exists "chapter_members_auth_all" on public.chapter_members;
drop policy if exists "chapter_members_public_all" on public.chapter_members;
create policy "chapter_members_public_all" on public.chapter_members
  for all using (true) with check (true);

drop policy if exists "events_auth_all" on public.events;
drop policy if exists "events_public_all" on public.events;
create policy "events_public_all" on public.events
  for all using (true) with check (true);

drop policy if exists "event_rsvps_auth_all" on public.event_rsvps;
drop policy if exists "event_rsvps_public_all" on public.event_rsvps;
create policy "event_rsvps_public_all" on public.event_rsvps
  for all using (true) with check (true);

drop policy if exists "event_attendance_auth_all" on public.event_attendance;
drop policy if exists "event_attendance_public_all" on public.event_attendance;
create policy "event_attendance_public_all" on public.event_attendance
  for all using (true) with check (true);

drop policy if exists "rsvp_excuses_auth_all" on public.rsvp_excuses;
drop policy if exists "rsvp_excuses_public_all" on public.rsvp_excuses;
create policy "rsvp_excuses_public_all" on public.rsvp_excuses
  for all using (true) with check (true);

drop policy if exists "dues_charges_auth_all" on public.dues_charges;
drop policy if exists "dues_charges_public_all" on public.dues_charges;
create policy "dues_charges_public_all" on public.dues_charges
  for all using (true) with check (true);

drop policy if exists "dues_payments_auth_all" on public.dues_payments;
drop policy if exists "dues_payments_public_all" on public.dues_payments;
create policy "dues_payments_public_all" on public.dues_payments
  for all using (true) with check (true);

drop policy if exists "budget_lines_auth_all" on public.budget_lines;
drop policy if exists "budget_lines_public_all" on public.budget_lines;
create policy "budget_lines_public_all" on public.budget_lines
  for all using (true) with check (true);

drop policy if exists "fines_auth_all" on public.fines;
drop policy if exists "fines_public_all" on public.fines;
create policy "fines_public_all" on public.fines
  for all using (true) with check (true);

-- ========== 20260326000000_auth_membership_rls.sql ==========
-- Auth, chapter membership, and membership-scoped RLS
-- Run after 20260325000000_chapter_kv.sql

-- Link Supabase Auth users to app chapters
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

-- Prevent duplicate chapters for same org + campus + designation
create unique index if not exists idx_chapters_org_campus_designation
  on public.chapters (org_id, university, chapter_designation)
  where chapter_designation <> '' and university <> '';

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Membership helper (security definer avoids RLS recursion)
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

-- chapter_memberships RLS
alter table public.chapter_memberships enable row level security;

drop policy if exists "memberships_select_member" on public.chapter_memberships;
create policy "memberships_select_member" on public.chapter_memberships
  for select to authenticated
  using (public.is_chapter_member(chapter_id) or user_id = auth.uid());

drop policy if exists "memberships_insert_self" on public.chapter_memberships;
create policy "memberships_insert_self" on public.chapter_memberships
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "memberships_update_self" on public.chapter_memberships;
create policy "memberships_update_self" on public.chapter_memberships
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- chapters: members read; authenticated users can found a chapter
alter table public.chapters enable row level security;

drop policy if exists "chapters_public_all" on public.chapters;
drop policy if exists "chapters_auth_all" on public.chapters;
drop policy if exists "chapters_select_member" on public.chapters;
create policy "chapters_select_member" on public.chapters
  for select to authenticated
  using (public.is_chapter_member(id));

drop policy if exists "chapters_insert_founder" on public.chapters;
create policy "chapters_insert_founder" on public.chapters
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "chapters_update_member" on public.chapters;
create policy "chapters_update_member" on public.chapters
  using (public.is_chapter_member(id))
  with check (public.is_chapter_member(id));

-- chapter_kv: members only
alter table public.chapter_kv enable row level security;

drop policy if exists "chapter_kv_all" on public.chapter_kv;
drop policy if exists "chapter_kv_select" on public.chapter_kv;
drop policy if exists "chapter_kv_insert" on public.chapter_kv;
drop policy if exists "chapter_kv_update" on public.chapter_kv;
drop policy if exists "chapter_kv_delete" on public.chapter_kv;

create policy "chapter_kv_select" on public.chapter_kv
  for select to authenticated
  using (public.is_chapter_member(chapter_id));

create policy "chapter_kv_insert" on public.chapter_kv
  for insert to authenticated
  with check (public.is_chapter_member(chapter_id));

create policy "chapter_kv_update" on public.chapter_kv
  for update to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

create policy "chapter_kv_delete" on public.chapter_kv
  for delete to authenticated
  using (public.is_chapter_member(chapter_id));

-- profiles: self only (replace open policies if any)
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Normalized tables: membership-scoped (for future direct use)
drop policy if exists "chapter_members_public_all" on public.chapter_members;
drop policy if exists "chapter_members_auth_all" on public.chapter_members;
drop policy if exists "chapter_members_member" on public.chapter_members;
create policy "chapter_members_member" on public.chapter_members
  for all to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

drop policy if exists "events_public_all" on public.events;
drop policy if exists "events_auth_all" on public.events;
drop policy if exists "events_member" on public.events;
create policy "events_member" on public.events
  for all to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

drop policy if exists "event_rsvps_public_all" on public.event_rsvps;
drop policy if exists "event_rsvps_auth_all" on public.event_rsvps;
drop policy if exists "event_rsvps_member" on public.event_rsvps;
create policy "event_rsvps_member" on public.event_rsvps
  for all to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and public.is_chapter_member(e.chapter_id)
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and public.is_chapter_member(e.chapter_id)
    )
  );

drop policy if exists "event_attendance_public_all" on public.event_attendance;
drop policy if exists "event_attendance_auth_all" on public.event_attendance;
drop policy if exists "event_attendance_member" on public.event_attendance;
create policy "event_attendance_member" on public.event_attendance
  for all to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and public.is_chapter_member(e.chapter_id)
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and public.is_chapter_member(e.chapter_id)
    )
  );

drop policy if exists "rsvp_excuses_public_all" on public.rsvp_excuses;
drop policy if exists "rsvp_excuses_auth_all" on public.rsvp_excuses;
drop policy if exists "rsvp_excuses_member" on public.rsvp_excuses;
create policy "rsvp_excuses_member" on public.rsvp_excuses
  for all to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

drop policy if exists "dues_charges_public_all" on public.dues_charges;
drop policy if exists "dues_charges_auth_all" on public.dues_charges;
drop policy if exists "dues_charges_member" on public.dues_charges;
create policy "dues_charges_member" on public.dues_charges
  for all to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

drop policy if exists "dues_payments_public_all" on public.dues_payments;
drop policy if exists "dues_payments_auth_all" on public.dues_payments;
drop policy if exists "dues_payments_member" on public.dues_payments;
create policy "dues_payments_member" on public.dues_payments
  for all to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

drop policy if exists "budget_lines_public_all" on public.budget_lines;
drop policy if exists "budget_lines_auth_all" on public.budget_lines;
drop policy if exists "budget_lines_member" on public.budget_lines;
create policy "budget_lines_member" on public.budget_lines
  for all to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

drop policy if exists "fines_public_all" on public.fines;
drop policy if exists "fines_auth_all" on public.fines;
drop policy if exists "fines_member" on public.fines;
create policy "fines_member" on public.fines
  for all to authenticated
  using (public.is_chapter_member(chapter_id))
  with check (public.is_chapter_member(chapter_id));

-- ========== 20260327000000_wipe_test_chapters_fix_claim.sql ==========
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

-- ========== 20260328000000_join_code_lookup.sql ==========
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

-- ========== 20260329000000_invite_codes_cloud.sql ==========
-- Cloud-backed invite codes (primary + extras) for cross-device resolve_join_code.
-- Safe to re-run.

alter table public.chapters
  add column if not exists invite_codes jsonb not null default '[]'::jsonb;

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
  v_elem jsonb;
  v_used int;
  v_max int;
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

  -- Primary join_code column
  select c.id, c.join_code, c.org_id, c.chapter_designation, c.university,
         trim(both from concat_ws(' ', nullif(c.chapter_designation, ''), 'join code'))
    into v_id, v_join, v_org, v_desig, v_uni, v_label
  from public.chapters c
  where c.join_code is not null
    and upper(c.join_code) = v_code
  limit 1;

  if v_id is not null then
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
  end if;

  -- Extra codes in invite_codes jsonb array
  select c.id, elem, c.org_id, c.chapter_designation, c.university
    into v_id, v_elem, v_org, v_desig, v_uni
  from public.chapters c,
       jsonb_array_elements(coalesce(c.invite_codes, '[]'::jsonb)) elem
  where upper(coalesce(elem->>'code', '')) = v_code
    and coalesce((elem->>'active')::boolean, true)
  limit 1;

  if v_id is null then
    return null;
  end if;

  v_used := coalesce((v_elem->>'usedCount')::int, 0);
  v_max := nullif(v_elem->>'maxUses', '')::int;
  if v_max is not null and v_used >= v_max then
    return null;
  end if;

  return jsonb_build_object(
    'code', v_code,
    'role', coalesce(v_elem->>'role', 'ActiveMember'),
    'label', coalesce(nullif(v_elem->>'label', ''), 'Chapter join code'),
    'kind', 'join',
    'chapter_id', v_id,
    'org_id', v_org,
    'chapter_designation', coalesce(v_desig, ''),
    'university', coalesce(v_uni, ''),
    'invite_id', v_elem->>'id',
    'used_count', v_used,
    'max_uses', v_max
  );
end;
$$;

revoke all on function public.resolve_join_code(text) from public;
grant execute on function public.resolve_join_code(text) to anon, authenticated;

-- ========== 20260330000000_sync_chapter_join_codes.sql ==========
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

-- SKIPPED (superseded): 20260331000000_harden_membership_and_kv_rls.sql

-- ========== 20260401000000_server_owned_identity_roles.sql ==========
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

