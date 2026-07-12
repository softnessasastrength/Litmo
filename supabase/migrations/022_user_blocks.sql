-- Chapter 5 first slice (ADR 0024): one-way user blocks.
-- Immediate, non-disclosing to the blocked party. Either direction blocks
-- discovery and session requests. Pending requested sessions between the
-- pair are cancelled safely. No free-text reasons on the block record.

create table public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index user_blocks_blocked_id_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

-- Blocker can read only their own outbound blocks. The blocked person cannot
-- read rows about them (non-disclosing).
create policy "blockers read own blocks"
  on public.user_blocks
  for select
  to authenticated
  using (blocker_id = auth.uid());

grant select on public.user_blocks to authenticated;
-- Writes only via security-definer functions.
revoke insert, update, delete on public.user_blocks from authenticated, anon, public;

create or replace function public.pair_is_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_blocks as b
    where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
       or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
$$;

revoke all on function public.pair_is_blocked(uuid, uuid) from public, anon;
grant execute on function public.pair_is_blocked(uuid, uuid) to authenticated;

create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  r record;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_blocked_id is null or p_blocked_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid block target';
  end if;
  if not exists (select 1 from public.profiles where user_id = p_blocked_id) then
    -- Opaque: do not reveal whether the account exists.
    raise exception using
      errcode = '42501',
      message = 'that person is not available';
  end if;

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
      '{"source":"api","trigger":"user_action"}'::jsonb
    );
  end loop;
end;
$$;

revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  delete from public.user_blocks
   where blocker_id = v_actor and blocked_id = p_blocked_id;
end;
$$;

revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;

create or replace function public.list_blocked_users()
returns table (blocked_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  return query
  select b.blocked_id, b.created_at
    from public.user_blocks as b
   where b.blocker_id = v_actor
   order by b.created_at desc;
end;
$$;

revoke all on function public.list_blocked_users() from public, anon;
grant execute on function public.list_blocked_users() to authenticated;

-- Discovery hides blocked accounts in either direction (non-disclosing).
create or replace function public.discovery_profiles()
returns table (
  user_id uuid,
  display_name text,
  pronouns text,
  bio text,
  vibe_archetype text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.display_name,
    p.pronouns,
    p.bio,
    p.vibe_archetype
  from public.profiles as p
  where p.onboarding_completed_at is not null
    and p.user_id <> auth.uid()
    and not public.pair_is_blocked(auth.uid(), p.user_id);
$$;

revoke all on function public.discovery_profiles() from public, anon;
grant execute on function public.discovery_profiles() to authenticated;

-- request_session: opaque rejection when either party blocked the other.
-- Body based on migration 017, with pair_is_blocked check after existence.
create or replace function public.request_session(
  p_recipient_id uuid,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_existing_id uuid;
  v_new_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  if p_recipient_id is null then
    raise exception using
      errcode = '22023',
      message = 'a recipient is required';
  end if;

  if p_recipient_id = v_actor_id then
    raise exception using
      errcode = '22023',
      message = 'you cannot request a session with yourself';
  end if;

  if p_idempotency_key is not null and (
    length(p_idempotency_key) < 1 or length(p_idempotency_key) > 128
  ) then
    raise exception using
      errcode = '22023',
      message = 'idempotency key must contain between 1 and 128 characters';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_recipient_id)
    or public.pair_is_blocked(v_actor_id, p_recipient_id)
  then
    raise exception using
      errcode = '42501',
      message = 'that person is not available to request a session with';
  end if;

  with expired as (
    update public.sessions as s
       set status = 'expired'
     where s.status = 'requested'
       and (
             (s.user_a = v_actor_id and s.user_b = p_recipient_id)
          or (s.user_a = p_recipient_id and s.user_b = v_actor_id)
           )
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

  select s.id
    into v_existing_id
    from public.sessions as s
   where s.status not in (
           'completed', 'declined', 'cancelled', 'expired',
           'soft_signaled', 'safety_ended'
         )
     and (
           (s.user_a = v_actor_id and s.user_b = p_recipient_id)
        or (s.user_a = p_recipient_id and s.user_b = v_actor_id)
         )
   limit 1;

  if found then
    return v_existing_id;
  end if;

  insert into public.sessions (user_a, user_b, status)
  values (v_actor_id, p_recipient_id, 'requested')
  returning id into v_new_id;

  insert into public.session_events (
    session_id, actor_id, event_type, prior_state, resulting_state, idempotency_key, metadata
  ) values (
    v_new_id, v_actor_id, 'session_requested', 'draft', 'requested', p_idempotency_key, '{}'::jsonb
  );

  return v_new_id;
end;
$$;

revoke all on function public.request_session(uuid, text) from public, anon;
grant execute on function public.request_session(uuid, text) to authenticated;

comment on function public.request_session(uuid, text) is
  'Creates a session request or returns an existing non-terminal pair session. Rejects blocked pairs with the same opaque message as missing profiles. Stale requested sessions between the pair are auto-expired first.';
