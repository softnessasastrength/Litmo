# Security model

## Trust boundaries

The mobile application is untrusted. It holds only the public Supabase URL, anon key, and the signed-in user's session. Authorization is enforced by PostgreSQL RLS and server-side functions, not by hidden buttons or client route checks.

Service-role keys, JWT secrets, database passwords, and moderation credentials must never use the `EXPO_PUBLIC_` prefix or enter mobile source. Root environment validation rejects privileged-looking public names.

## Private data controls

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

## Authentication

Supabase Auth provides password hashing, token issuance, expiry, and refresh. The app restores sessions from AsyncStorage for Expo Go compatibility. AsyncStorage is persistent but not hardware-encrypted; a production distribution must adopt and review a secure-storage adapter, device compromise behavior, and logout token revocation.

Face ID is a separate local-access gate, not account authentication or identity verification. ADR 0007 documents the biometric-only policy, 30-second lifecycle threshold, native app-switcher cover, step-up routes, fail-closed errors, threat model, and limitations. Litmo stores no biometric data and offers no device-passcode bypass.

## Fail-closed behavior

Missing configuration produces an explicit failure state. Missing or invalid domain data is rejected by runtime schemas. Permission failures reveal no private record. Network and timeout failures do not broaden consent or silently mark onboarding complete.

## Known review needs

This foundation has not received independent penetration, privacy, legal, safeguarding, or accessibility review. The local seed disables email confirmation for developer convenience; production environments must make an explicit verification decision. Rate limiting, production identity verification, moderation, precise retention, and incident response remain later reviewed work.
