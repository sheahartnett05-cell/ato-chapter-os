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
