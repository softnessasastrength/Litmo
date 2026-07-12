# ADR 0041: Development seed password sign-in (Track B)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

BETA-001 Track B needs two real authenticated accounts. Passkeys require a paid
Apple team + Associated Domains, which blocks founder validation on free-tier
and simulator builds. Local seed users already exist with passwords in
`supabase/seed.sql` (`LitmoDemo123!`).

## Decision

- In **development only** (`runtimeConfig.allowDemo`), the sign-in screen may
  call `signInWithPassword` for local seed emails.
- Passkeys remain the product path for staging/production.
- UI is clearly labeled “Development seed accounts (Track B).”
- Staging/production builds do not show the seed form (`allowDemo` is false
  outside development).

## Alternatives considered

- OTP-only bootstrap for every Track B run. Rejected: slower than seeded passwords.
- Disable Face ID for seed logins. Rejected: ADR 0007 still applies to real sessions.

## Consequences

- Track B can use two simulators/devices with seed accounts after `db:reset`.
- Real Face ID lock still applies once a real session exists.
- Never ship seed passwords into production configs.

## Addendum 2026-07-12 — GoTrue token column nullability

Direct `INSERT` into `auth.users` must set `confirmation_token`,
`recovery_token`, `email_change_token_new`, and `email_change` to empty
strings (`''`), not SQL `NULL`. GoTrue's password grant scans those columns
as non-null strings; `NULL` yields HTTP 500:

`Scan error on column ... confirmation_token: converting NULL to string is unsupported`

Signup-created users get empty-string defaults; seed rows must match.
`scripts/setup-track-b-local.sh` verifies password grant for all four seed
emails after `db reset` so this cannot regress silently.
