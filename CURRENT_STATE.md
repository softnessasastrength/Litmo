# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected the recommended defaults on 2026-07-13
- **Branch:** feature work for MACOS-002 (self-only trust history) is on `agent/macos-trust-history-read`. `main` contains PRs #72–#78.
- **Latest known coherent milestone:** Chapters 1–5, LEARN-002, HAPTIC-001, matching-hold ends open sessions (ADR 0038), semantic haptics (ADR 0039), BETA-001 physical walkthrough (Track A/B/C all Pass, including physical B1–B26), native macOS foundation (ADR 0045 / PR #76).

## Completed foundation

- First playable mobile experience and backend-free demo mode.
- Supabase persistence, owner-only RLS, immutable profile versions, and consent compatibility engine.
- Database-enforced session lifecycle, immutable Consent Snapshots, session requests, realtime updates, private wrap-ups, and unilateral withdrawal/emergency stop.
- Passkey-first authentication architecture, device registration, mandatory biometric locking, sensitive-data protection, and privacy-safe notifications.
- Release/TestFlight boundaries, privacy and security documentation, ADRs, and database tests.
- Model-portable workflow files and `npm run state:check` enforcement.
- Publish-ready GitHub Wiki source under `wiki/`.
- Guided learning catalog, lesson player, fictional scenarios, private device-local progress, resume behavior, and progress tests.
- Chapter 5: blocks, age gate, reports, review queue, rate limits, trust events, restrictions, moderator console, peer signals, appeals, real discovery, ban ends open sessions, real Consent Snapshot UI.
- Physical beta walkthrough checklist for founder/private validation (not external TestFlight).
- BETA-001 complete: Track A Pass, Track C Pass, Track B Pass (automated backend + physical B1–B26 on device, founder, 2026-07-13). No Fail items recorded. Do not claim external beta readiness until RELEASE_AND_TESTFLIGHT blockers clear.
- Private-alpha safety foundation and mobile controls are integrated on `main` through PR #72.
- Campfire Mode's three device-local practices are integrated on `main` through PR #73.
- MPL-2.0 licensing and ADR 0044 are integrated on `main` through PR #74.
- A hosted unsigned Xcode 26.5 simulator build passed in strict CocoaPods deployment mode on PR #75 and produced a compiled `.app` plus full build log.
- PR #76 has a green hosted Xcode 26.5 macOS run: four Campfire tests passed, both separate arm64 app targets compiled, and unsigned inspection artifacts uploaded.
- PR #77 finalized post-merge macOS continuity on `main`.
- PR #78 standardized ACCESS-001 deferred a11y semantics (moderation filter selected-state, Settings haptics Switch).

## Work in progress

SAFETY-OPS-001 remains active and externally blocked on named qualified review and an independent backup reviewer. MACOS-002 implements the first server-backed macOS participant read: self-only trust history via `my_trust_signals` (ADR 0046), fail-closed without configuration/session. Litmo Ops remains locked. PR #78 merged ACCESS-001 semantics cleanup; the optional founder VoiceOver smoke remains open.

## Priority next work

1. Review and merge the MACOS-002 trust-history PR; keep Litmo Ops locked until real staff authentication and authorization exist.
2. Optionally land PR #78 (ACCESS-001 semantics) or run the founder VoiceOver smoke.
3. Keep Campfire Mode interpreted only as a local practice tool, never real group matching or group consent.
4. Keep destructive retention and account deletion blocked until legal/privacy/security review names the permissible data categories, holds, and timing.
5. Name and train an independent backup reviewer before external alpha; implement two-person permanent-ban approval only when that role exists.

## Verification baseline

The repository contains commands for:

```bash
npm run state:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run db:lint
npm run build
```

Database and integration checks require local Supabase. Native passkey, biometric, device-build, and release verification require Xcode, signing configuration, and a physical iPhone where applicable. macOS native checks require XcodeGen and the `macos/` Xcode project generation path.

Do not claim the current integrated `main` has passed every command unless the exact current commit was tested. Review the latest CI and local test evidence before release decisions.

## Known limitations and risks

- The product is not production-ready and must not be presented as safe for arranging meetings with strangers.
- Discovery and trust-history presentation remain partly synthetic or beta-oriented on mobile; macOS trust history is server-backed only when explicitly configured.
- Learning progress is device-local and does not synchronize across accounts or devices.
- Learning completion is not evidence of safety, competence, or consent.
- First-session learning gates have not been approved or implemented.
- Physical-device accessibility validation remains incomplete.
- Moderation operations still require qualified review and named backup staffing; the engineering invitation-expiry and eligibility gates are implemented.
- Campfire circle readiness is local, ephemeral facilitation and is not a multi-person Consent Snapshot.
- Passkey deployment depends on correct Associated Domains and server-side relying-party configuration.
- macOS participant auth is env-token inspection only in this slice, not production sign-in.

## Architectural decisions

- Repository state, commits, tests, and documentation are the source of truth.
- No agent may depend on hidden reasoning or prior chat context for continuity.
- Model switches should occur at coherent commit boundaries whenever practical.
- Security-sensitive partial work must fail closed and be explicitly documented.
- Consent is explicit, current, revocable, session-specific, and never inferred from trust or compatibility.
- Guided learning teaches product behavior but never certifies a participant as safe.
- macOS may display server-authoritative read models but must not reimplement consent or staff authorization in Swift.

## Exact next action

Review the MACOS-002 PR (self-only trust history). After merge, choose the next single macOS read surface (profile, requests, or export) or return to SAFETY-OPS external-review blockers. Do not treat unsigned artifacts as releases or unlock Ops without server-backed staff authentication and authorization. ACCESS-001 residual remains the optional founder VoiceOver smoke.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Read `docs/DOCUMENTATION_MAP.md`, `docs/KNOWN_LIMITATIONS.md`, and the relevant ADRs.
3. Run `git status`, inspect the current diff, and read recent commits.
4. Verify the last recorded checks before changing code.
5. Continue only from an explicitly selected active task.

## Stop checklist

Before stopping because of a rate limit, context limit, tool failure, interruption, or model switch:

1. Stop at the safest coherent boundary available.
2. Preserve all working changes.
3. Run all practical checks and record the exact results.
4. Commit coherent completed work.
5. Update this file, `TASKS.md`, and `project-state.json`.
6. State whether the working tree is clean.
7. Record the exact next command or action required to resume.
