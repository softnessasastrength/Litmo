# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected the recommended defaults on 2026-07-13
- **Branch:** `agent/macos-trust-history-read` carries MACOS-002. `main` contains PRs #72–#78.
- **Latest known coherent milestone:** Chapters 1–5, LEARN-002, HAPTIC-001, BETA-001, native macOS foundation (ADR 0045 / PR #76), ACCESS-001 semantics cleanup (PR #78).

## Completed foundation

- First playable mobile experience and backend-free demo mode.
- Supabase persistence, owner-only RLS, immutable profile versions, and consent compatibility engine.
- Database-enforced session lifecycle, immutable Consent Snapshots, session requests, realtime updates, private wrap-ups, and unilateral withdrawal/emergency stop.
- Passkey-first authentication architecture, device registration, mandatory biometric locking, sensitive-data protection, and privacy-safe notifications.
- Release/TestFlight boundaries, privacy and security documentation, ADRs, and database tests.
- Model-portable workflow files and `npm run state:check` enforcement.
- Publish-ready GitHub Wiki source under `wiki/`.
- Guided learning catalog, lesson player, fictional scenarios, private device-local progress, resume behavior, and progress tests.
- Chapter 5 safety surfaces and private-alpha safety foundation through PR #72.
- Campfire Mode through PR #73; MPL-2.0 through PR #74; hosted iOS compile through PR #75; native macOS foundation through PR #76; continuity finalize through PR #77.
- PR #78 standardized ACCESS-001 deferred a11y semantics (moderation filter selected-state, Settings haptics Switch). Physical founder VoiceOver smoke remains open.

## Work in progress

SAFETY-OPS-001 remains active and externally blocked on named qualified review and an independent backup reviewer. MACOS-002 (PR #79) implements the first server-backed macOS participant read: self-only trust history via `my_trust_signals` (ADR 0046), fail-closed without configuration/session. Litmo Ops remains locked.

## Priority next work

1. Merge green PR #79 (MACOS-002 trust history); keep Litmo Ops locked.
2. Next macOS read surface after #79: own profile, requests, or export — one slice at a time.
3. Keep Campfire Mode as local practice only; keep destructive retention/deletion blocked until review.
4. Optional founder VoiceOver smoke remains under ACCESS-001.
5. Name and train an independent backup reviewer before external alpha.

## Verification baseline

```bash
npm run state:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run db:lint
npm run build
```

Database and integration checks require local Supabase. macOS native checks require XcodeGen and the `macos/` generation path.

## Known limitations and risks

- The product is not production-ready and must not be presented as safe for arranging meetings with strangers.
- macOS trust history is server-backed only when explicitly configured; missing config/session fails closed.
- Learning progress is device-local and does not synchronize across accounts or devices.
- Physical-device accessibility validation remains incomplete (VoiceOver smoke pending).
- Moderation operations still require qualified review and named backup staffing.
- Campfire is local facilitation, not multi-person consent.
- macOS participant auth is env-token inspection only, not production passkey sign-in.

## Architectural decisions

- Repository state, commits, tests, and documentation are the source of truth.
- Consent is explicit, current, revocable, session-specific, and never inferred from trust or compatibility.
- macOS may display server-authoritative read models but must not reimplement consent or staff authorization in Swift.

## Exact next action

Land PR #79 when checks are green on the rebased head. Then implement the next single fail-closed macOS participant read (own profile recommended). Do not unlock Ops without server-backed staff authentication and authorization.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Read `docs/DOCUMENTATION_MAP.md`, `docs/KNOWN_LIMITATIONS.md`, and the relevant ADRs.
3. Run `git status`, inspect the current diff, and read recent commits.
4. Verify the last recorded checks before changing code.
5. Continue only from an explicitly selected active task.

## Stop checklist

1. Stop at the safest coherent boundary available.
2. Preserve all working changes.
3. Run all practical checks and record the exact results.
4. Commit coherent completed work.
5. Update this file, `TASKS.md`, and `project-state.json`.
6. State whether the working tree is clean.
7. Record the exact next command or action required to resume.
