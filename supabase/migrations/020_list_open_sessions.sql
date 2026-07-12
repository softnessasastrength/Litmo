-- Chapter 4 connectivity recovery: list non-terminal mid-lifecycle sessions
-- so a participant can resume consent review or an active session after
-- restart. Does not invent consent — only returns rows the actor can already
-- read under participant rules. Requested-state traffic stays on
-- list_incoming/list_outgoing (ADRs 0018/0021).

create or replace function public.list_open_sessions()
returns table (
  id uuid,
  counterpart_id uuid,
  status text,
  started_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  return query
  select
    s.id,
    case
      when s.user_a = v_actor_id then s.user_b
      else s.user_a
    end as counterpart_id,
    s.status,
    s.started_at,
    s.created_at
  from public.sessions as s
  where v_actor_id in (s.user_a, s.user_b)
    and s.status in ('accepted', 'consent_pending', 'ready', 'active')
  order by s.created_at desc;
end;
$$;

revoke all on function public.list_open_sessions() from public, anon;
grant execute on function public.list_open_sessions() to authenticated;

comment on function public.list_open_sessions() is
  'Returns mid-lifecycle sessions for the authenticated participant so they can resume consent review or an active session after restart. Does not include requested (see list_incoming/list_outgoing) or terminal states.';
