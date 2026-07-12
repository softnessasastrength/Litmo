# Litmo Next Steps

## Purpose

This plan turns the current playable prototype into a small, private beta without risking the working `main` branch.

The operating rule is simple:

> One meaningful concern per branch. No direct feature work on `main`.

Every feature branch should build, pass checks, preserve the existing demo path, and be merged only through a reviewed pull request.

## Branch policy

Use branches with these prefixes:

- `feature/` for user-facing capabilities
- `fix/` for defects
- `chore/` for tooling, CI, and repository maintenance
- `docs/` for documentation-only work
- `spike/` for experiments that may be discarded

Before merging any branch:

1. Rebase or update it from the latest `main`.
2. Run `npm run lint`.
3. Run `npm run typecheck`.
4. Run `npm test`.
5. Run `npm run build`.
6. Verify the full demo flow on a physical iPhone.
7. Open a pull request and review the diff before merge.

Do not merge authentication, persistence, or safety-sensitive changes solely because they compile.

## Phase 0 — Preserve the working build

Suggested branch: `chore/release-safety-baseline`

Deliverables:

- Confirm the current build and demo flow are reproducible from a clean checkout.
- Record the exact Expo, Node, npm, and Xcode versions used for the known-good build.
- Add a concise smoke-test checklist for the complete tap-through flow.
- Ensure CI runs lint, typecheck, unit tests, and build on every pull request.
- Tag the current known-good commit as a prototype baseline after verification.

Exit criteria:

- A clean clone can be built without undocumented local state.
- The current demo remains recoverable even if later branches fail.

## Phase 1 — Passwordless account foundation

Existing branch: `feature/secure-auth-foundation`

The repository currently uses Expo, React Native, Supabase Auth, and an email/password Chapter 2 flow. The passwordless design must therefore be implemented through Expo-compatible native modules and Supabase-supported identity flows rather than assuming a native Swift-only application.

Deliverables:

- Replace email/password as the intended production path with Sign in with Apple.
- Preserve demo mode so the app remains usable without backend configuration.
- Define whether passkeys are implemented directly through a WebAuthn-capable backend or through a provider that integrates cleanly with Supabase identities.
- Store mobile session material using secure platform storage, not AsyncStorage or plain files.
- Add an optional local Face ID / Touch ID app lock.
- Hide private content when the app moves to the background.
- Document recovery, account linking, and duplicate-account prevention.

Exit criteria:

- New users can establish an account without creating a password.
- Returning users can restore a secure session.
- Losing a passkey does not silently create a second account.
- Demo mode still works.
- Two separate test accounts cannot access each other's data.

## Phase 2 — Real private logs

Suggested branch: `feature/private-logs`

Deliverables:

- Define the smallest useful `LogEntry` model.
- Add create, read, update, and delete operations.
- Enforce owner-only access with Supabase Row Level Security.
- Add loading, empty, offline, retry, and error states.
- Keep logs private by default.
- Add explicit export and deletion behavior before inviting real users.

Initial model:

```text
LogEntry
- id
- owner_id
- created_at
- updated_at
- type
- title
- body
- mood
- visibility
```

Exit criteria:

- A user can create a log, close the app, reopen it, and retrieve the same log.
- User A cannot read or modify User B's logs.
- Deletion is reflected locally and remotely.
- No synthetic records are mixed with real account data.

## Phase 3 — Privacy and safety hardening

Suggested branch: `feature/privacy-controls`

Deliverables:

- App lock settings with clear fallback behavior.
- App-switcher privacy screen.
- Data export and account deletion flow.
- Analytics review: collect no sensitive content and minimize identifiers.
- Redaction rules for logs, crash reports, and error telemetry.
- Threat-model review for intimate and consent-related data.

Exit criteria:

- Private content is not visible in app-switcher snapshots.
- Logout removes local secrets.
- Account deletion has a documented and tested lifecycle.
- Sensitive text never appears in application logs or analytics payloads.

## Phase 4 — Internal TestFlight beta

Suggested branch: `chore/testflight-readiness`

Deliverables:

- Production bundle identifier, icons, launch assets, version, and build numbers.
- App Store Connect privacy answers and beta-review notes.
- A concise tester guide explaining that Litmo is an early beta and not an emergency, therapy, or safety-certification service.
- In-app feedback path.
- TestFlight group limited to trusted testers initially.

Exit criteria:

- Five trusted testers can install the app independently.
- Crash and feedback reports can be tied to a build number.
- The team can revoke a broken build and ship a corrected build safely.

## Phase 5 — Selective sharing and connection features

Suggested branches:

- `feature/connections`
- `feature/selective-log-sharing`
- `feature/shared-consent-snapshots`

These should not begin until private single-user data is stable.

Rules:

- Nothing is shared automatically.
- Sharing is per item or clearly scoped space.
- Ownership, participants, and permissions are always visible.
- Revocation is immediate and understandable.
- Prior sharing never implies current consent.

## Immediate sequence

1. Establish the release-safety baseline.
2. Correct and finish the Expo/Supabase-aware authentication design.
3. Implement private logs with strict RLS.
4. Add local privacy controls.
5. Ship to a tiny internal TestFlight group.
6. Observe actual use before building matching, social discovery, or broad sharing.

## Product discipline

For the first beta, optimize for one trustworthy loop:

```text
Open Litmo → authenticate → create a private log → return later → find it intact
```

That loop should feel calm, private, recoverable, and boringly reliable. Everything else can grow around it after real people prove they want it.
