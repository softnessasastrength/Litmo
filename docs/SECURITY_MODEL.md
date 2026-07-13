# Security model

## Trust boundaries

The mobile application is untrusted. It holds only the public Supabase URL, anon key, and the signed-in user's session. Authorization is enforced by PostgreSQL RLS and server-side functions, not by hidden buttons or client route checks.

Service-role keys, JWT secrets, database passwords, and moderation credentials must never use the `EXPO_PUBLIC_` prefix or enter mobile source. Root environment validation rejects privileged-looking public names.

## Private data controls

Highly sensitive private profile and wrap-up notes receive application-layer AES-256-GCM encryption before persistence. Versioned keys remain inside the iOS Keychain with passcode, this-device-only, and biometric-current-set controls; malformed/tampered/wrong-purpose ciphertext fails closed. Migration 013 rejects plaintext note storage. See ADR 0011 and `docs/SENSITIVE_DATA_ENCRYPTION.md` for hierarchy, rotation, recovery, and residual risks.

- Every Chapter 2 user-data table has RLS enabled. RLS policies alone are not sufficient: Postgres also requires an underlying table-level `GRANT` to a role, checked before RLS is even evaluated. A real bug — RLS policies with no matching `GRANT` on four tables, silently masked because Docker-backed tests were never run locally until 2026-07-12 — is documented in `docs/CHANGELOG.md` and fixed in `supabase/migrations/006_grant_authenticated_table_privileges.sql`. When adding a new table, both must be reviewed, not just RLS policies.
- General private records are owner-select/update only.
- Touch and consent histories are owner-select/append only.
- Mutation triggers reject ordinary historical updates and deletes.
- Cross-user discovery uses a narrow security-definer function that omits private notes, consent preferences, and touch details.
- Structured development logs redact keys containing consent, body-zone, nervous-system, note, password, token, secret, or session terms.
- External errors map to stable public codes and never return raw policy or database details.
- Session lifecycle rows and their append-only audit events are participant-readable but not directly writable by authenticated clients. `transition_session(...)` is a `SECURITY DEFINER` function with an empty search path; it row-locks before validation, requires `auth.uid()` to match either participant, and deliberately returns the same error for a missing session and a stranger-owned session. Its audit metadata is an enumerated object rather than arbitrary text. Transition-specific requester/recipient/system role authorization is not yet enforced.
- Consent Snapshot persistence is service-role-only; mobile clients cannot submit agreement payloads. The trusted backend route authenticates a Supabase bearer token, verifies participation without disclosing stranger-owned sessions, loads immutable profile versions itself, computes through `@litmo/domain`, and sends only canonical compatibility to the database function. `SUPABASE_SERVICE_ROLE_KEY` is server-only and the route fails closed when it is absent. Participants can read their shared snapshot but only their own confirmation. Security-definer confirmation/withdrawal functions validate participation and exact fingerprint, and an independent trigger prevents activation without both current confirmations. The mobile flow is not wired yet.
- Profile-version writes invalidate affected pre-activation snapshots in the same transaction. Invalidated fingerprints cannot be reconfirmed or satisfy activation, and prior confirmations are deleted. Only participant identifiers, version numbers, lifecycle states, and enumerated metadata enter the shared audit trail; private notes and changed preference contents do not.
- Session wrap-ups are owner-readable and immutable. The counterpart cannot query another participant's outcome or note, authenticated clients cannot write the table directly, and submissions are accepted only for participants after a terminal active-session outcome. Retries return the first result rather than overwriting sensitive history.
- Quiz result summaries (`quiz_result_summaries`, ADR 0051) are owner-only under RLS. Writes should use `upsert_own_quiz_result_summary` so `user_id` is forced to `auth.uid()` and archetypes/mix/notes are constrained. They are not discovery-visible, not public scores, and never consent. Partner comparison payloads and seal keys are not stored on the server.

## Authentication

Supabase Auth issues, expires, and refreshes sessions and verifies WebAuthn challenges. Routine iOS authentication uses Apple passkeys with device-owner verification; email one-time codes are limited to initial account bootstrap and are never routine sign-in or recovery credentials. Supabase session material and the random installation identity use Expo SecureStore with `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`, so they require a device passcode and do not migrate through backups. `auth_devices` stores only a SHA-256 secret digest and owner-visible device metadata. A valid passkey ceremony can rotate or restore a revoked local registration; self-revocation clears the local secret and signs out immediately. See ADR 0010 and `docs/PASSKEY_AUTHENTICATION.md`.

Face ID is a separate local-access gate, not account authentication or identity verification. ADR 0007 documents the biometric-only policy, 30-second lifecycle threshold, native app-switcher cover, step-up routes, fail-closed errors, threat model, and limitations. Litmo stores no biometric data and offers no device-passcode bypass.

## Fail-closed behavior

Missing configuration produces an explicit failure state. Missing or invalid domain data is rejected by runtime schemas. Permission failures reveal no private record. Network and timeout failures do not broaden consent or silently mark onboarding complete.

## Known review needs

This foundation has not received independent penetration, privacy, legal, safeguarding, or accessibility review. The local seed disables email confirmation for developer convenience; production environments must make an explicit verification decision. Rate limiting, production identity verification, moderation, precise retention, and incident response remain later reviewed work.
