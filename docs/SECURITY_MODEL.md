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

## Authentication

Supabase Auth provides password hashing, token issuance, expiry, and refresh. The app restores sessions from AsyncStorage for Expo Go compatibility. AsyncStorage is persistent but not hardware-encrypted; a production distribution must adopt and review a secure-storage adapter, device compromise behavior, and logout token revocation.

## Fail-closed behavior

Missing configuration produces an explicit failure state. Missing or invalid domain data is rejected by runtime schemas. Permission failures reveal no private record. Network and timeout failures do not broaden consent or silently mark onboarding complete.

## Known review needs

This foundation has not received independent penetration, privacy, legal, safeguarding, or accessibility review. The local seed disables email confirmation for developer convenience; production environments must make an explicit verification decision. Rate limiting, production identity verification, moderation, precise retention, and incident response remain later reviewed work.
