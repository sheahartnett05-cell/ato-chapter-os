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
