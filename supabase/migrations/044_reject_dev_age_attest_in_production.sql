-- Agent 09 — G7: reject development_self_attest outside local/dev DB role.
-- Production and staging databases must never accept self-attest age signals.
-- Development seeds and tests may set app.litmo_allow_dev_age_attest = 'true'.

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
  v_allow_dev text;
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

  -- Fail closed: development_self_attest only when session GUC explicitly allows.
  -- Production/staging never set this GUC → self-attest is rejected.
  if p_source = 'development_self_attest' then
    begin
      v_allow_dev := current_setting('app.litmo_allow_dev_age_attest', true);
    exception when others then
      v_allow_dev := null;
    end;
    if v_allow_dev is distinct from 'true' then
      raise exception using
        errcode = '42501',
        message = 'development_self_attest is not allowed in this environment';
    end if;
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

comment on function public.record_age_signal(text, text, integer, integer) is
  'Records age signal. apple_declared_age_range always allowed when authenticated. development_self_attest only if app.litmo_allow_dev_age_attest=true (local seeds/tests).';
