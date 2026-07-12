-- Application-layer encrypted envelopes are mandatory for highly sensitive
-- free text. PostgreSQL still enforces RLS and constraints; encryption does not
-- replace authorization. The mobile vault produces the authenticated envelope.
alter table public.touch_profile_versions
  drop constraint touch_profile_versions_private_nervous_system_notes_check,
  add constraint touch_profile_versions_private_nervous_system_notes_check check (
    private_nervous_system_notes is null or (
      char_length(private_nervous_system_notes) <= 4096 and
      private_nervous_system_notes like 'litmo:encrypted:v1:%'
    )
  );

alter table public.consent_preference_versions
  drop constraint consent_preference_versions_private_nervous_system_notes_check,
  add constraint consent_preference_versions_private_nervous_system_notes_check check (
    private_nervous_system_notes is null or (
      char_length(private_nervous_system_notes) <= 4096 and
      private_nervous_system_notes like 'litmo:encrypted:v1:%'
    )
  );

alter table public.session_wrapups
  drop constraint session_wrapups_private_note_check,
  add constraint session_wrapups_private_note_check check (
    private_note is null or (
      char_length(private_note) <= 8192 and
      private_note like 'litmo:encrypted:v1:%'
    )
  );

comment on column public.touch_profile_versions.private_nervous_system_notes is
  'Versioned authenticated-encryption envelope only; plaintext is rejected.';
comment on column public.consent_preference_versions.private_nervous_system_notes is
  'Versioned authenticated-encryption envelope only; plaintext is rejected.';
comment on column public.session_wrapups.private_note is
  'Owner-private versioned authenticated-encryption envelope only; plaintext is rejected.';

create or replace function public.submit_session_wrapup(
  p_session_id uuid,p_outcome text,p_private_note text,p_idempotency_key text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_actor uuid:=auth.uid(); v_session public.sessions%rowtype; v_existing uuid; v_id uuid;
begin
  if v_actor is null then raise exception using errcode='42501',message='authentication required'; end if;
  if p_outcome is null or p_outcome not in ('completed_comfortably','ended_normally','soft_signal_used','felt_uncomfortable','safety_concern')
    or p_idempotency_key is null or char_length(p_idempotency_key) not between 1 and 128
    or char_length(coalesce(p_private_note,''))>8192
    or (p_private_note is not null and p_private_note not like 'litmo:encrypted:v1:%')
  then raise exception using errcode='22023',message='invalid private wrap-up'; end if;
  select * into v_session from public.sessions where id=p_session_id and v_actor in (user_a,user_b) for share;
  if not found then raise exception using errcode='42501',message='session not found or access denied'; end if;
  if v_session.status not in ('completed','soft_signaled','safety_ended')
  then raise exception using errcode='55000',message='session is not ready for wrap-up'; end if;
  select id into v_existing from public.session_wrapups where session_id=p_session_id and user_id=v_actor;
  if found then return v_existing; end if;
  insert into public.session_wrapups(session_id,user_id,outcome,private_note,idempotency_key)
  values(p_session_id,v_actor,p_outcome,nullif(trim(p_private_note),''),p_idempotency_key) returning id into v_id;
  return v_id;
end; $$;
