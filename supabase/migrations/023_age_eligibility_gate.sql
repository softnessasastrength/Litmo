-- Adult eligibility gate (ADR 0025). Stores a coarse Apple Declared Age Range
-- signal (or development self-attest). Never stores DOB, ID images, or KYC
-- documents. Discovery and request_session fail closed until status = adult.
-- Composed with one-way blocks from migration 022 (pair_is_blocked).

alter table public.profiles
  add column if not exists age_signal_status text
    check (
      age_signal_status is null
      or age_signal_status in (
        'unverified', 'adult', 'not_adult', 'declined', 'unavailable'
      )
    )
    default 'unverified',
  add column if not exists age_signal_source text
    check (
      age_signal_source is null
      or char_length(age_signal_source) <= 80
    ),
  add column if not exists age_signal_lower integer
    check (age_signal_lower is null or age_signal_lower between 0 and 120),
  add column if not exists age_signal_upper integer
    check (age_signal_upper is null or age_signal_upper between 0 and 120),
  add column if not exists age_signal_at timestamptz;

comment on column public.profiles.age_signal_status is
  'Coarse adult eligibility from Apple Declared Age Range or development self-attest. Not a trust/safety score.';

create or replace function public.is_adult_eligible(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.user_id = p_user_id
      and p.age_signal_status = 'adult'
  );
$$;

revoke all on function public.is_adult_eligible(uuid) from public, anon;
grant execute on function public.is_adult_eligible(uuid) to authenticated;

create or replace function public.record_age_signal(
  p_status text,
  p_source text,
  p_lower integer default null,
  p_upper integer default null
)
returns text
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
  if p_status is null or p_status not in (
    'adult', 'not_adult', 'declined', 'unavailable'
  ) then
    raise exception using errcode = '22023', message = 'invalid age signal status';
  end if;
  if p_source is null or char_length(trim(p_source)) < 1 or char_length(p_source) > 80 then
    raise exception using errcode = '22023', message = 'invalid age signal source';
  end if;
  if p_source not in (
    'apple_declared_age_range',
    'development_self_attest'
  ) then
    raise exception using errcode = '22023', message = 'unsupported age signal source';
  end if;

  update public.profiles
     set age_signal_status = p_status,
         age_signal_source = p_source,
         age_signal_lower = p_lower,
         age_signal_upper = p_upper,
         age_signal_at = now(),
         updated_at = now()
   where user_id = v_actor;

  if not found then
    raise exception using errcode = '42501', message = 'profile not found';
  end if;

  return p_status;
end;
$$;

revoke all on function public.record_age_signal(text, text, integer, integer) from public, anon;
grant execute on function public.record_age_signal(text, text, integer, integer) to authenticated;

-- Discovery: completed onboarding + adult signal + not pair-blocked.
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
    and p.age_signal_status = 'adult'
    and public.is_adult_eligible(auth.uid())
    and not public.pair_is_blocked(auth.uid(), p.user_id);
$$;

revoke all on function public.discovery_profiles() from public, anon;
grant execute on function public.discovery_profiles() to authenticated;

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

  if not public.is_adult_eligible(v_actor_id) then
    raise exception using
      errcode = '42501',
      message = 'adult age confirmation is required before requesting a session';
  end if;

  -- Opaque: missing profile, non-adult recipient, or either-direction block.
  if not exists (select 1 from public.profiles where user_id = p_recipient_id)
    or not public.is_adult_eligible(p_recipient_id)
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
  'Creates a session request or returns an existing non-terminal pair session. Requires adult age signals for both parties (ADR 0025). Rejects blocked pairs with the same opaque message as missing/non-adult profiles (ADR 0024).';
