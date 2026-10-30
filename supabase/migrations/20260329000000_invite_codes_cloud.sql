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
