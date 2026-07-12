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
