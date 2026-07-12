-- Each participant owns one immutable private check-in after a session ends.
-- The counterpart cannot read it; raw notes never enter session_events.
create table public.session_wrapups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome text not null check (outcome in (
    'completed_comfortably','ended_normally','soft_signal_used',
    'felt_uncomfortable','safety_concern'
  )),
  private_note text check (private_note is null or char_length(private_note) <= 2000),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 128),
  created_at timestamptz not null default now(),
  unique (session_id,user_id),
  unique (session_id,user_id,idempotency_key)
);

alter table public.session_wrapups enable row level security;
create policy "participants read own wrap-up" on public.session_wrapups
  for select to authenticated using (auth.uid()=user_id);
grant select on public.session_wrapups to authenticated;

create function public.submit_session_wrapup(
  p_session_id uuid,
  p_outcome text,
  p_private_note text,
  p_idempotency_key text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid:=auth.uid();
  v_session public.sessions%rowtype;
  v_existing uuid;
  v_id uuid;
begin
  if v_actor is null then raise exception using errcode='42501',message='authentication required'; end if;
  if p_outcome is null or p_outcome not in (
    'completed_comfortably','ended_normally','soft_signal_used','felt_uncomfortable','safety_concern'
  ) or p_idempotency_key is null or char_length(p_idempotency_key) not between 1 and 128
    or char_length(coalesce(p_private_note,''))>2000
  then raise exception using errcode='22023',message='invalid private wrap-up'; end if;

  select * into v_session from public.sessions
   where id=p_session_id and v_actor in (user_a,user_b) for share;
  if not found then raise exception using errcode='42501',message='session not found or access denied'; end if;
  if v_session.status not in ('completed','soft_signaled','safety_ended')
  then raise exception using errcode='55000',message='session is not ready for wrap-up'; end if;

  select id into v_existing from public.session_wrapups
   where session_id=p_session_id and user_id=v_actor;
  if found then return v_existing; end if;

  insert into public.session_wrapups(session_id,user_id,outcome,private_note,idempotency_key)
  values(p_session_id,v_actor,p_outcome,nullif(trim(p_private_note),''),p_idempotency_key)
  returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.submit_session_wrapup(uuid,text,text,text) from public,anon;
grant execute on function public.submit_session_wrapup(uuid,text,text,text) to authenticated;
