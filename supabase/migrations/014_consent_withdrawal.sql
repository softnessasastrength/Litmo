-- Safety authority: starting requires both confirmations; stopping requires one
-- participant and no reason. Snapshot-first locking matches confirmation order.
create function public.withdraw_session_consent(
  p_session_id uuid,
  p_idempotency_key text
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid:=auth.uid();
  v_status text;
  v_target text;
  v_replayed text;
begin
  if v_actor is null then raise exception using errcode='42501',message='authentication required'; end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 1 and 128
  then raise exception using errcode='22023',message='invalid withdrawal request'; end if;

  perform cs.id from public.consent_snapshots cs join public.sessions s on s.id=cs.session_id
   where cs.session_id=p_session_id and v_actor in (s.user_a,s.user_b) for update of cs;
  select status into v_status from public.sessions
   where id=p_session_id and v_actor in (user_a,user_b) for update;
  if not found then raise exception using errcode='42501',message='session not found or access denied'; end if;

  select resulting_state into v_replayed from public.session_events
   where session_id=p_session_id and idempotency_key=p_idempotency_key;
  if found then return v_replayed; end if;
  if v_status in ('completed','declined','cancelled','expired','soft_signaled','safety_ended')
  then return v_status; end if;
  if v_status in ('requested','consent_pending','ready') then v_target:='cancelled';
  elsif v_status='active' then v_target:='soft_signaled';
  else raise exception using errcode='55000',message='session cannot be withdrawn in this state'; end if;

  update public.consent_snapshots set
    withdrawn_by=v_actor,withdrawn_at=coalesce(withdrawn_at,now())
   where session_id=p_session_id and invalidated_at is null;
  delete from public.consent_snapshot_confirmations c using public.consent_snapshots cs
   where c.snapshot_id=cs.id and cs.session_id=p_session_id;
  update public.sessions set status=v_target,
    ended_at=case when v_target='soft_signaled' then now() else ended_at end,
    exit_reason=case when v_target='soft_signaled' then 'soft_signal' else 'cancelled' end
   where id=p_session_id;
  insert into public.session_events(
    session_id,actor_id,event_type,prior_state,resulting_state,idempotency_key,metadata
  ) values(p_session_id,v_actor,'consent_withdrawal',v_status,v_target,p_idempotency_key,'{}');
  return v_target;
end; $$;

revoke all on function public.withdraw_session_consent(uuid,text) from public,anon;
grant execute on function public.withdraw_session_consent(uuid,text) to authenticated;
