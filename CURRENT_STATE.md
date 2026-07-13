# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** No active implementation milestone
- **Status:** BETA-001 is complete; SAFETY-OPS-001 is pending founder/reviewer decisions
- **Branch:** `main` at `42a1eed65b182c9880238eca26f3a53032ad5c43` is the integrated baseline. Decision preparation is on `agent/continuity-safety-ops-decisions`.
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

## Work in progress

Documentation-only decision preparation is in progress for SAFETY-OPS-001. `docs/SAFETY_OPS_FOUNDER_DECISIONS.md` contains the founder worksheet. No implementation task is `active`, and no Chapter 6 code is authorized.

## Priority next work

1. Founder reviews `docs/SAFETY_OPS_FOUNDER_DECISIONS.md` and records dispositions for S1–S10.
2. Convert accepted decisions into focused ADRs; keep legal/privacy/safeguarding-dependent rows provisional until the named review exists.
3. Separately decide whether to promote a Chapter 6 implementation milestone. Completing the worksheet alone is not implementation authorization.
4. Optional founder VoiceOver smoke remains tracked under ACCESS-001.

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

BETA-001 is closed with no Fail items. Next: the founder reviews `docs/SAFETY_OPS_FOUNDER_DECISIONS.md`, records S1–S10 dispositions, and identifies the required external reviewers. Do not implement Chapter 6 until a human separately promotes it.

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
