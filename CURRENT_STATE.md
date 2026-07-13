# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected the recommended defaults on 2026-07-13
- **Branch:** `agent/quizzes-section` carries Quizzes tab + partner consent docs (ADR 0050). Prior macOS work: MACOS-004 session-requests read; `main` contains PRs #72–#80.
- **Latest known coherent milestone:** Chapters 1–5 foundation, BETA-001, ACCESS-001 semantics, native macOS foundation through MACOS-004, Quizzes section (ADR 0050) + optional owner-only summary backup (ADR 0051).

## Completed foundation

- Playable mobile experience, demo mode, Supabase persistence, consent engine, session lifecycle, passkey architecture, learning system, Chapter 5 safety, private-alpha safety ops foundation.
- Campfire Mode (PR #73), MPL-2.0 (PR #74), hosted iOS compile (PR #75), native macOS foundation (PR #76), continuity finalize (PR #77).
- PR #78 ACCESS-001 semantics cleanup; VoiceOver smoke still optional.
- PR #79 MACOS-002 self-only trust history (ADR 0046).
- PR #80 MACOS-003 own profile + shared transport (ADR 0047).
- Quizzes section: short/deep vibe + self quizzes, local-first results, Face ID step-up on private result/share, four-gate partner comparison (ADR 0050); optional owner-only summary backup (ADR 0051).

## Work in progress

SAFETY-OPS-001 remains externally blocked on named qualified review and backup staffing. Quizzes implementation and ADR/docs living-set updates are on `agent/quizzes-section`. Litmo Ops remains locked. ACCESS-001 optional founder VoiceOver smoke remains open.

## Priority next work

1. Land Quizzes section PR when green (implementation + ADR 0050 docs).
2. Review/merge remaining macOS read work if still open on other branches.
3. Keep Campfire local-only; keep Quizzes partner path local (own summaries may back up per ADR 0051); keep destructive retention/deletion blocked until review.
4. Optional founder VoiceOver smoke (ACCESS-001 residual), including Quizzes surfaces if reviewing.
5. Name independent backup reviewer before external alpha.
6. Security/privacy follow-up on quiz seal posture before external beta (KNOWN_LIMITATIONS).

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

macOS: `cd macos && xcodegen generate` then unsigned `xcodebuild` test/build.

Quizzes unit coverage includes `quizShareCore`, `quizPaths`, `quizScoring`, and `quizResultsRepositoryCore` tests under `app/`.

## Known limitations and risks

- Product is not production-ready for stranger meetings.
- macOS reads require env configuration + access token; not production passkey UX.
- Profile, trust history, and request lists never grant consent.
- A listed session request is never consent; mutations stay phone-first.
- Learning progress is device-local; Quizzes are local-first with optional own-summary backup; invites/compare stay device-local.
- Partner quiz seal is lightweight (not audited production E2E); packages include seal key; peer consents in packages are self-asserted.
- Physical VoiceOver smoke still pending.
- Ops is non-operational until real staff auth.

## Architectural decisions

- Repository artifacts are the source of truth.
- Consent is explicit, current, revocable, session-specific.
- macOS displays server-authoritative read models only; no Swift consent engine; no request mutations on Mac.
- Quizzes stay non-authoritative for touch, matching, trust, and sessions (ADR 0050); local-first with optional owner-only summary backup (ADR 0051); partner seal/compare stays device-local.

## Exact next action

Finish or merge the Quizzes section branch after green checks. Continue SAFETY-OPS external blockers only with named owners. Do not unlock Ops without server-backed staff authentication. Do not promote quiz weather into discovery or Consent Snapshot without a new ADR.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Read `docs/KNOWN_LIMITATIONS.md` and relevant ADRs (0045–0048, **0050**/**0051** for Quizzes).
3. Run `git status` and inspect recent commits.
4. Verify last recorded checks before changing code.

## Stop checklist

1. Stop at a coherent boundary.
2. Preserve working changes.
3. Run practical checks and record results.
4. Commit coherent work; update continuity files.
5. Note whether the tree is clean and the next resume action.
