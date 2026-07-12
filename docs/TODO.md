# TODO

Well-specified future work that has not yet been promoted into an active chapter (`AGENTS.md`'s "Current chapter assignment"). Recorded here so intent survives even without the conversation that produced it, per `docs/CONTINUITY_AND_STEWARDSHIP.md`. Do not begin implementation until a chapter assignment or explicit human instruction authorizes it.

## Passwordless authentication (implemented decision; remaining operations work)

ADR 0010 and `docs/PASSKEY_AUTHENTICATION.md` supersede the open architecture questions below for the iOS client: Supabase remains the backend of record, email OTP is bootstrap-only, and Apple passkeys are the routine credential. The historical proposal is retained here for decision provenance. Remaining production work is human-reviewed recovery, trusted server session revocation, hosted AASA verification, and non-iOS credential design.

Status: **not started — planning only**

Replace (or sit alongside, pending a decision below) Chapter 2's Supabase email/password authentication with a passwordless architecture for the iOS client:

### Requirements

- **Sign in with Apple** for initial account establishment. No email/password authentication is to be added.
- **Apple-platform passkeys** as the primary ongoing authentication method after the first sign-in.
- Use `AuthenticationServices` for both Sign in with Apple and passkey registration/authentication ceremonies.
- A **server-issued challenge** for every passkey registration ceremony and every passkey authentication ceremony. No client-generated or reused challenge.
- The **relying-party identifier is our owned domain**. The app must configure:
  - The Associated Domains `webcredentials` entitlement.
  - A valid `apple-app-site-association` file served from that domain.
- Immediately after a successful Sign in with Apple account creation, **prompt the user to create a passkey**.
- The server stores **only public passkey credential material** — never a private key, never a client-side authenticator secret.
- **Keychain**-backed storage for access and refresh tokens. Never `UserDefaults`, never any unencrypted local store.
- Completed 2026-07-12: mandatory biometric-only Face ID locking and native app-switcher privacy cover. See `docs/adr/0007-mandatory-face-id-lock.md`. Remaining follow-up: notification-preview and screen-capture review before private alpha.
- Explicit design for:
  - **Account recovery** (what happens when a user loses every enrolled passkey-capable device).
  - **Multi-device credential enrollment** (adding a passkey on a second device without treating the first device's presence as sufficient proof by itself).
- **Never silently fall back** to an insecure identifier (e.g., a device UUID, an unauthenticated guest identity treated as durable, or a locally generated token) as a stand-in for real authentication.
- Documentation must cover, at minimum:
  - Backend endpoints (registration challenge issuance, registration verification, authentication challenge issuance, authentication verification, credential listing/revocation).
  - Challenge validation and nonce handling (generation, storage, expiry, single-use enforcement, replay protection).
  - Credential schema (what is persisted per passkey: credential ID, public key, sign count, transports, associated user, created/last-used timestamps — never private key material).
  - Token lifecycle (access/refresh token issuance, rotation, revocation, expiry, what triggers re-authentication).
  - Entitlement configuration (Associated Domains, `apple-app-site-association`, any App ID / provisioning profile implications).
  - Threat model (what this design protects against — credential-stuffing, phishing, token theft from an unencrypted store, snapshot-based UI leakage — and what it explicitly does not address).

### Open question before implementation

This would replace Chapter 2's already-implemented and working Supabase email/password authentication (`docs/CHAPTER_2_COMPLETION.md`, `docs/SECURITY_MODEL.md`). Before implementation begins, a human needs to decide:

- Does this fully replace Supabase auth, or run alongside it (e.g., Supabase remains the backend of record for session/profile data, with passkeys replacing only the credential-verification step)?
- Which backend owns challenge issuance and credential storage — a new service, or an extension of the existing Express `backend/` API, or Supabase Edge Functions?
- Whether this is scoped to iOS only (as specified) while other platforms (per `docs/roadmap/CHAPTERS_7_TO_13_PLATFORM_FUTURE.md`'s multi-platform chapter) get a separate, later-designed passwordless flow, or whether the architecture needs to anticipate cross-platform credential portability from the start.

An ADR should be written to resolve these questions before implementation starts, per `docs/DOCUMENTATION_STANDARD.md`.

## Dark mode (soft palette)

Status: **not started — explicitly deferred, do not start until asked**

Add a dark mode. Explicit direction from the founder: it should feel "soft," matching the existing warm/muted palette (`app/theme.ts` — cream/paper/moss/plum/apricot) rather than a stark black-and-white inversion. Whenever this is picked up, derive dark-mode equivalents that keep the same emotional register (calm, warm, unhurried) rather than just running the existing colors through an automatic inverter.
