# ADR 0045: Native macOS client boundaries

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

Litmo needs native macOS access to participant preparation, Campfire practices, and future staff operations. Combining participant and staff capability in one privileged binary would enlarge the credential, entitlement, and authorization blast radius. Reimplementing the canonical consent engine in Swift would also risk platform drift from the TypeScript/server domain.

## Decision

Create two native SwiftUI application targets from one generated Xcode project:

1. **Litmo** (`com.litmo.macos`) provides a participant-oriented shell and functional local Campfire practices.
2. **Litmo Ops** (`com.litmo.ops`) is a separately bundled staff surface that fails closed until server-backed staff authentication and authorization exist.

Shared Swift code is limited to presentation-safe state and explicit authority copy. The Swift client does not reinterpret consent snapshots, session transitions, staff permissions, matching eligibility, or enforcement. Those remain server-authoritative and reuse the canonical domain contracts.

Campfire remains local and ephemeral:

- Circle supports two to eight people, requires fresh unanimous readiness, and lets anyone pause without giving a reason.
- Quiet practice is open-ended and has no completion score.
- Digital pause offers bounded local timers with no streaks or penalties.

The two apps share no App Group or Keychain access group in this slice. CI disables signing, runs Campfire invariant tests, compiles both apps, and uploads unsigned inspection artifacts.

## Alternatives considered

- **One participant-and-staff app:** rejected because an authentication or entitlement mistake could expose staff capability to a participant context.
- **Electron or Catalyst first:** rejected because the requested surface is native macOS and the current UI can remain small.
- **Duplicate the TypeScript safety engine in Swift:** rejected because two implementations could disagree at a safety-critical transition.
- **Enable mock staff actions:** rejected because a visual demo must not imply authorization or operational readiness.

## Consequences

The participant and Ops experiences can evolve independently while sharing low-risk visual/state primitives. The first participant build is useful for Campfire but intentionally incomplete for server data. The first Ops build is intentionally locked and is not an operational console. Signing, notarization, staff authentication, API contracts, audit logging, and participant read models remain future reviewed work.
