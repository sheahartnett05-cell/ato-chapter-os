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
