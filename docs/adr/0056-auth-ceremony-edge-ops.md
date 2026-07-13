# ADR 0056 — Auth ceremony Edge ops (rate limit, audit, consent device gate)

## Status

Accepted (2026-07-13).

## Context

Supabase Auth correctly owns WebAuthn verification. Litmo still needs:

- abuse controls on ceremony starts (including pre-auth);
- append-only authentication audit without secrets;
- a hard link between passkey-bound installations and consent confirmation.

Putting rate limits and audit only in the client is insufficient. Putting full
WebAuthn verification in a custom Edge Function would duplicate Supabase Auth
and increase risk.

## Decision

1. Keep **WebAuthn verify** in Supabase Auth passkey APIs.  
2. Add Edge Function **`auth-ceremony`** for rate limiting and audit only.  
3. Store **hashed** device secrets in `auth_devices` (existing).  
4. Gate **`confirm_session_snapshot`** with **`require_bound_auth_device()`**.  
5. Subject keys for pre-auth limits are **hashes**, never raw IP/email columns.  
6. If Edge is undeployed, client **fails open** on network/404 so local demos
   work; explicit **rate_limited** responses **fail closed**.

## Consequences

- Migration `040_auth_passkey_ops.sql` is required.  
- Deploy `supabase functions deploy auth-ceremony` for staging/production.  
- Consent confirmation fails without a registered device (real accounts).  
- Audit is not a trust score and never contains consent snapshot content.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Custom full WebAuthn in Edge | Duplicates Supabase; higher crypto risk |
| Client-only rate limits | Trivially bypassed |
| Password recovery fallback | Violates passkey-first constitution |

## Related

- `docs/AUTHENTICATION.md`  
- ADR 0010, 0028 (abuse rate limits for product actions)  
