-- Device registrations complement iCloud-synced passkeys. The passkey proves
-- account ownership; this device-bound secret lets Litmo independently revoke
-- an installation without ever storing the secret in plaintext server-side.
create table public.auth_devices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  secret_hash text not null,
  display_name text not null check (length(display_name) between 1 and 120),
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, id)
);

alter table public.auth_devices enable row level security;
create policy "owners read device metadata" on public.auth_devices
  for select to authenticated using (auth.uid() = user_id);
grant select on public.auth_devices to authenticated;

create function public.register_auth_device(p_id uuid, p_secret text, p_display_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or length(p_secret) < 32 or length(trim(p_display_name)) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'invalid device registration';
  end if;
  insert into public.auth_devices(id, user_id, secret_hash, display_name)
  values (p_id, auth.uid(), encode(extensions.digest(p_secret, 'sha256'), 'hex'), trim(p_display_name))
  on conflict (id) do update set
    secret_hash = excluded.secret_hash,
    display_name = excluded.display_name,
    last_seen_at = now(),
    revoked_at = null
  where public.auth_devices.user_id = auth.uid();
  if not found then
    raise exception using errcode = '42501', message = 'device registration unavailable';
  end if;
end; $$;

create function public.verify_auth_device(p_id uuid, p_secret text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_valid boolean;
begin
  select revoked_at is null and secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  into v_valid from public.auth_devices where id = p_id and user_id = auth.uid();
  if coalesce(v_valid, false) then
    update public.auth_devices set last_seen_at = now() where id = p_id and user_id = auth.uid();
  end if;
  return coalesce(v_valid, false);
end; $$;

create function public.revoke_auth_device(p_current_id uuid, p_current_secret text, p_target_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.verify_auth_device(p_current_id, p_current_secret) then
    raise exception using errcode = '42501', message = 'current device is not trusted';
  end if;
  update public.auth_devices set revoked_at = now()
  where id = p_target_id and user_id = auth.uid() and revoked_at is null;
  if not found then raise exception using errcode = '42501', message = 'device not found'; end if;
end; $$;

revoke all on function public.register_auth_device(uuid,text,text) from public, anon;
revoke all on function public.verify_auth_device(uuid,text) from public, anon;
revoke all on function public.revoke_auth_device(uuid,text,uuid) from public, anon;
grant execute on function public.register_auth_device(uuid,text,text) to authenticated;
grant execute on function public.verify_auth_device(uuid,text) to authenticated;
grant execute on function public.revoke_auth_device(uuid,text,uuid) to authenticated;
