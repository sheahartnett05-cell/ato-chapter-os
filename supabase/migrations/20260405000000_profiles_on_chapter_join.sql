-- Keep public.profiles in sync when founding / joining a chapter so
-- restoreSession can rebuild names even before chapter_kv has the roster row.

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

  if exists (select 1 from public.chapter_memberships m where m.user_id = v_uid) then
    raise exception 'already a member of a chapter; leave before creating another';
  end if;

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

  insert into public.profiles (id, email, first_name, last_name, phone, avatar)
  values (
    v_uid,
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_first_name, '')), ''),
    nullif(trim(coalesce(p_last_name, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(
      upper(left(coalesce(nullif(trim(p_first_name), ''), 'F'), 1)) ||
      upper(left(coalesce(nullif(trim(p_last_name), ''), 'P'), 1)),
      ''
    )
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar = coalesce(excluded.avatar, public.profiles.avatar);

  perform public.seed_default_officer_seats(v_id, v_uid);

  return v_id;
end;
$$;

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

  insert into public.profiles (id, email, first_name, last_name, phone, avatar)
  values (
    v_uid,
    nullif(v_email, ''),
    nullif(trim(coalesce(p_first_name, '')), ''),
    nullif(trim(coalesce(p_last_name, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(
      upper(left(coalesce(nullif(trim(p_first_name), ''), 'M'), 1)) ||
      upper(left(coalesce(nullif(trim(p_last_name), ''), 'N'), 1)),
      ''
    )
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar = coalesce(excluded.avatar, public.profiles.avatar);

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
