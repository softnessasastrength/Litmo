# Architecture

## Boundaries

```text
Expo Router UI
  → authoritative AuthContext
  → typed repositories and public error mapping
  → Supabase client using anon credentials + user JWT
  → PostgreSQL functions, constraints, and RLS

UI/API adapters
  → @litmo/domain runtime schemas
```

`shared/` owns framework-independent types, enum values, runtime schemas, and validated serialization. UI components do not call Supabase directly. `profileRepository` owns profile persistence, timeouts, boundary parsing, and safe error translation.

Chapter 3 adds the canonical pure consent engine to `shared/`. It models receive/offer direction, produces deterministic conservative overlap and explanations, and creates exact-version snapshot records. Compatibility and consent remain different states: engine output cannot activate consent.

## Authentication and routing

`AuthContext` is the sole mobile authority for session state. It restores the Supabase session from device storage, fetches the owner's profile, distinguishes incomplete onboarding from a ready account, subscribes to auth changes, and redirects protected routes conservatively. Expired sessions return to sign-in.

## Profile separation

- `profiles` contains general identity and discovery-safe candidates.
- `onboarding_progress` contains an owner-private draft.
- `touch_profile_versions` contains immutable touch preferences and separately stored private notes.
- `consent_preference_versions` contains immutable consent boundaries and separately stored private notes.
- `discovery_profiles()` returns only explicitly selected general fields.

Material touch/consent changes call `save_profile_versions` transactionally. An advisory transaction lock serializes version numbers per user. Triggers reject updates and deletes.

## Existing proof-of-concept layers

The Express consent-overlap service and early session/trust migrations remain intact. Chapter 2 does not expand the consent engine or session lifecycle; those are Chapter 3 and Chapter 4.
