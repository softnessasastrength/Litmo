# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** Private-beta validation (physical walkthrough)
- **Status:** active
- **Branch:** `main` is the current integrated baseline; use a feature branch for new work.
- **Latest known coherent milestone:** Chapters 1–5, LEARN-002, HAPTIC-001, matching-hold ends open sessions (ADR 0038), semantic haptics (ADR 0039), physical walkthrough checklist.

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

## Work in progress

**Track A Pass** (founder). **Track C Pass** (engineering). **Track B automated backend Pass** (2026-07-12): Docker + setup + seed password grant for all four emails + integration 3/3 + pgTAP 240/240. Seed GoTrue token NULL bug fixed. **Track B physical UI (B1–B26)** still founder-owned. Do not claim external beta readiness until RELEASE_AND_TESTFLIGHT blockers clear.

## Priority next work

1. **Track B on device** — `bash scripts/setup-track-b-local.sh` → `npm run api` + `npm run mobile` → two seed accounts → B1–B26 (`docs/TRACK_B_LOCAL.md`).
2. Optional founder VoiceOver smoke (`docs/ACCESSIBILITY_TRACK_C.md`).
3. Reconcile any Fail findings into tests, ADRs, `KNOWN_LIMITATIONS.md`.
4. Clear external TestFlight blockers only when intentionally starting private alpha distribution.

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
- Moderation, reporting, operational review, invitation expiry, and eligibility rules remain incomplete.
- Passkey deployment depends on correct Associated Domains and server-side relying-party configuration.

## Architectural decisions

- Repository state, commits, tests, and documentation are the source of truth.
- No agent may depend on hidden reasoning or prior chat context for continuity.
- Model switches should occur at coherent commit boundaries whenever practical.
- Security-sensitive partial work must fail closed and be explicitly documented.
- Consent is explicit, current, revocable, session-specific, and never inferred from trust or compatibility.
- Guided learning teaches product behavior but never certifies a participant as safe.

## Exact next action

Founder: run Track B B1–B26 on physical device(s) after `bash scripts/setup-track-b-local.sh`. Agent: merge seed password fix if not already on `main`; open fix PRs only for Fail items from the walkthrough.

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
