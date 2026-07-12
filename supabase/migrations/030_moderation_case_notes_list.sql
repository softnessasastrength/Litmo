-- Staff-only note listing for the moderator console (ADR 0032).
-- Complements 025 claim/add/resolve RPCs with a readable notes trail.

create or replace function public.list_moderation_case_notes(p_case_id uuid)
returns table (
  id uuid,
  author_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_case_id is null then
    raise exception using errcode = '22023', message = 'case id required';
  end if;
  if not exists (
    select 1 from public.moderation_cases as c where c.id = p_case_id
  ) then
    raise exception using errcode = 'P0002', message = 'case not found';
  end if;

  return query
  select n.id, n.author_id, n.body, n.created_at
    from public.moderation_case_notes as n
   where n.case_id = p_case_id
   order by n.created_at asc;
end;
$$;

revoke all on function public.list_moderation_case_notes(uuid) from public, anon;
grant execute on function public.list_moderation_case_notes(uuid) to authenticated;

comment on function public.list_moderation_case_notes(uuid) is
  'Staff-only append-only note trail for a moderation case. Never exposed to reporters or reported parties.';
