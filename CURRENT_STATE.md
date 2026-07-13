# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected the recommended defaults on 2026-07-13
- **Branch:** `main` contains the reviewed private-alpha mobile controls through PR #72, all three local Campfire practices through PR #73, and MPL-2.0 licensing through PR #74. PR #75 adds hosted native iOS compilation.
- **Latest known coherent milestone:** Chapters 1–5, LEARN-002, HAPTIC-001, matching-hold ends open sessions (ADR 0038), semantic haptics (ADR 0039), BETA-001 physical walkthrough (Track A/B/C all Pass, including physical B1–B26).

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

## Work in progress

SAFETY-OPS-001 is active. ADR 0042 and migration 036 implement the engineering-safe recommended foundation: hashed staff-issued invitations, seven-day expiry, private-alpha membership gates, routine matching pause, minimal unblock tombstones, bounded non-destructive cleanup, and self export. The matching mobile controls are merged through PR #72. Campfire Mode is merged through PR #73 as a separate local-only practice surface under ADR 0043. External-review-dependent destructive retention, deletion, jurisdiction, escalation, and two-person staffing decisions remain blocked. MPL-2.0 licensing is merged through PR #74 under ADR 0044. PR #75 adds a credential-free hosted native compile gate; it does not sign an IPA or authorize TestFlight distribution.

## Priority next work

1. Review and merge green PR #75; then create contributor and trademark policies as separate governance decisions.
2. Keep Campfire Mode interpreted only as a local practice tool, never real group matching or group consent.
3. Keep destructive retention and account deletion blocked until legal/privacy/security review names the permissible data categories, holds, and timing.
4. Name and train an independent backup reviewer before external alpha; implement two-person permanent-ban approval only when that role exists.
5. Optional founder VoiceOver smoke remains tracked under ACCESS-001.

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

Database and integration checks require local Supabase. Native passkey, biometric, device-build, and release verification require Xcode, signing configuration, and a physical iPhone where applicable.

Do not claim the current integrated `main` has passed every command unless the exact current commit was tested. Review the latest CI and local test evidence before release decisions.

## Known limitations and risks

- The product is not production-ready and must not be presented as safe for arranging meetings with strangers.
- Discovery and trust-history presentation remain partly synthetic or beta-oriented.
- Learning progress is device-local and does not synchronize across accounts or devices.
- Learning completion is not evidence of safety, competence, or consent.
- First-session learning gates have not been approved or implemented.
- Physical-device accessibility validation remains incomplete.
- Moderation operations still require qualified review and named backup staffing; the engineering invitation-expiry and eligibility gates are implemented.
- Campfire circle readiness is local, ephemeral facilitation and is not a multi-person Consent Snapshot.
- Passkey deployment depends on correct Associated Domains and server-side relying-party configuration.

## Architectural decisions

- Repository state, commits, tests, and documentation are the source of truth.
- No agent may depend on hidden reasoning or prior chat context for continuity.
- Model switches should occur at coherent commit boundaries whenever practical.
- Security-sensitive partial work must fail closed and be explicitly documented.
- Consent is explicit, current, revocable, session-specific, and never inferred from trust or compatibility.
- Guided learning teaches product behavior but never certifies a participant as safe.

## Exact next action

PRs #72–#74 are merged on `main`; private-alpha mobile controls, all three local Campfire practices, and MPL-2.0 licensing are integrated. PR #75 has produced the first successful hosted native Xcode build. Next: merge green PR #75, then continue only governance or operational work with real named owners. SAFETY-OPS-001 remains externally blocked on named qualified review and an independent backup reviewer.

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
