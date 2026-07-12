-- Chapter 4: list and cancel outgoing session requests (requester side).
-- Mirrors list_incoming_requests for user_a (requester). Cancel uses the
-- existing transition_session graph edge requested -> cancelled (either
-- participant may cancel; only recipient may accept/decline — migration 015).

create or replace function public.list_outgoing_requests()
returns table (
  id uuid,
  recipient_id uuid,
  created_at timestamptz,
  expires_at timestamptz
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

  with expired as (
    update public.sessions as s
       set status = 'expired'
     where s.status = 'requested'
       and s.user_a = v_actor_id
       and public.request_expires_at(s.created_at) <= now()
    returning s.id
  )
  insert into public.session_events (
    session_id,
    actor_id,
    event_type,
    prior_state,
    resulting_state,
    metadata
  )
  select
    expired.id,
    null,
    'session_transition',
    'requested',
    'expired',
    '{"source":"api","trigger":"system_expiration"}'::jsonb
  from expired;

  return query
  select
    s.id,
    s.user_b,
    s.created_at,
    public.request_expires_at(s.created_at) as expires_at
  from public.sessions as s
  where s.user_a = v_actor_id
    and s.status = 'requested'
  order by s.created_at desc;
end;
$$;

revoke all on function public.list_outgoing_requests() from public, anon;
grant execute on function public.list_outgoing_requests() to authenticated;

comment on function public.list_outgoing_requests() is
  'Returns outgoing requested sessions for the authenticated requester, auto-expiring any stale 24-hour requests before listing them.';
