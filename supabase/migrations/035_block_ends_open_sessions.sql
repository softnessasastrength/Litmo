-- ADR 0040: one-way block ends open matching work with the blocked pair.
-- Keeps rate limit from migration 026. Cancels requested + pre-activation;
-- safety-ends active sessions between the blocker and blocked account.

create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  r record;
  v_prior text;
  v_to text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_blocked_id is null or p_blocked_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid block target';
  end if;
  if not exists (select 1 from public.profiles where user_id = p_blocked_id) then
    raise exception using
      errcode = '42501',
      message = 'that person is not available';
  end if;

  perform public.assert_under_rate_limit(v_actor, 'block');

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_actor, p_blocked_id)
  on conflict do nothing;

  -- Cancel pending requests between the pair (either direction).
  for r in
    select s.id, s.status
      from public.sessions as s
     where s.status = 'requested'
       and (
             (s.user_a = v_actor and s.user_b = p_blocked_id)
          or (s.user_a = p_blocked_id and s.user_b = v_actor)
           )
     for update of s
  loop
    update public.sessions set status = 'cancelled' where id = r.id;
    insert into public.session_events (
      session_id, actor_id, event_type, prior_state, resulting_state, metadata
    ) values (
      r.id, v_actor, 'session_transition', 'requested', 'cancelled',
      jsonb_build_object(
        'source', 'api',
        'trigger', 'user_action',
        'reason', 'user_block'
      )
    );
  end loop;

  -- Fail-closed: pre-activation cancelled; active → safety_ended.
  for r in
    select s.id, s.status
      from public.sessions as s
     where s.status in (
             'accepted', 'consent_pending', 'ready', 'active'
           )
       and (
             (s.user_a = v_actor and s.user_b = p_blocked_id)
          or (s.user_a = p_blocked_id and s.user_b = v_actor)
           )
     for update of s
  loop
    v_prior := r.status;
    v_to := case
      when r.status = 'active' then 'safety_ended'
      else 'cancelled'
    end;
    update public.sessions set status = v_to where id = r.id;
    insert into public.session_events (
      session_id, actor_id, event_type, prior_state, resulting_state, metadata
    ) values (
      r.id, v_actor, 'session_transition', v_prior, v_to,
      jsonb_build_object(
        'source', 'api',
        'trigger', 'user_action',
        'reason', 'user_block'
      )
    );
  end loop;
end;
$$;

revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

comment on function public.block_user(uuid) is
  'One-way block (ADR 0024/0040). Rate-limited. Cancels pair requested/pre-activation; safety-ends active pair sessions. Non-disclosing to the blocked party.';
