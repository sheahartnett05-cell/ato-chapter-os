-- LOCAL ONLY — do not apply to production until reviewed.
-- Hardens chapter_memberships (no self-insert / self role escalate)
-- and splits chapter_kv write access by key class.

-- Officer helper (President / Treasurer / JBoardChair / RecruitmentChair / founder)
create or replace function public.is_chapter_officer(p_chapter_id uuid)
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
      and (
        m.is_founder = true
        or m.role in (
          'President',
          'Treasurer',
          'JBoardChair',
          'RecruitmentChair',
          'ScholarshipChair'
        )
      )
  );
$$;

grant execute on function public.is_chapter_officer(uuid) to authenticated;

-- Remove dangerous self-service membership policies
drop policy if exists "memberships_insert_self" on public.chapter_memberships;
drop policy if exists "memberships_update_self" on public.chapter_memberships;

-- Members may still leave (delete own row) if that policy exists; keep select as-is.

-- President/founder sets another member's role
create or replace function public.set_membership_role(
  p_chapter_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_chapter_officer(p_chapter_id) then
    raise exception 'not authorized';
  end if;
  -- Only Presidents / founders may grant President
  if p_role = 'President' and not exists (
    select 1 from public.chapter_memberships m
    where m.chapter_id = p_chapter_id
      and m.user_id = auth.uid()
      and (m.is_founder or m.role = 'President')
  ) then
    raise exception 'only president/founder may assign President';
  end if;
  update public.chapter_memberships
  set role = p_role
  where chapter_id = p_chapter_id and user_id = p_user_id;
end;
$$;

grant execute on function public.set_membership_role(uuid, uuid, text) to authenticated;

-- Key classification for chapter_kv
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

create or replace function public.chapter_kv_officer_writable(p_key text)
returns boolean
language sql
immutable
as $$
  -- Officer may write any key; member-writable keys are also allowed for officers
  select true;
$$;

-- Replace blanket member write policies with split rules
drop policy if exists "chapter_kv_insert" on public.chapter_kv;
drop policy if exists "chapter_kv_update" on public.chapter_kv;
drop policy if exists "chapter_kv_delete" on public.chapter_kv;

create policy "chapter_kv_insert" on public.chapter_kv
  for insert to authenticated
  with check (
    public.is_chapter_member(chapter_id)
    and (
      public.is_chapter_officer(chapter_id)
      or public.chapter_kv_member_writable(key)
    )
  );

create policy "chapter_kv_update" on public.chapter_kv
  for update to authenticated
  using (
    public.is_chapter_member(chapter_id)
    and (
      public.is_chapter_officer(chapter_id)
      or public.chapter_kv_member_writable(key)
    )
  )
  with check (
    public.is_chapter_member(chapter_id)
    and (
      public.is_chapter_officer(chapter_id)
      or public.chapter_kv_member_writable(key)
    )
  );

create policy "chapter_kv_delete" on public.chapter_kv
  for delete to authenticated
  using (
    public.is_chapter_officer(chapter_id)
    or (
      public.is_chapter_member(chapter_id)
      and public.chapter_kv_member_writable(key)
    )
  );

-- Select remains membership-scoped (unchanged intent)
-- Joins continue to go through existing claim / join-code RPCs only.
