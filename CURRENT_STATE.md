# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected the recommended defaults on 2026-07-13
- **Branch:** `agent/macos-session-requests-read` carries MACOS-004. Open PR #81 holds the light vibe quiz. `main` contains PRs #72–#80.
- **Latest known coherent milestone:** Chapters 1–5 foundation, BETA-001, ACCESS-001 semantics (PR #78), native macOS foundation (PR #76), MACOS-002 trust history (PR #79), MACOS-003 own profile (PR #80).

## Completed foundation

- Playable mobile experience, demo mode, Supabase persistence, consent engine, session lifecycle, passkey architecture, learning system, Chapter 5 safety, private-alpha safety ops foundation.
- Campfire Mode (PR #73), MPL-2.0 (PR #74), hosted iOS compile (PR #75), native macOS foundation (PR #76), continuity finalize (PR #77).
- PR #78 ACCESS-001 semantics cleanup; VoiceOver smoke still optional.
- PR #79 MACOS-002 self-only trust history (ADR 0046).
- PR #80 MACOS-003 own profile + shared transport (ADR 0047).

## Work in progress

SAFETY-OPS-001 remains externally blocked on named qualified review and backup staffing. MACOS-004 adds read-only session requests on macOS (ADR 0048). PR #81 lightens and expands the vibe quiz with back/retake polish. Litmo Ops remains locked.

## Priority next work

1. Review/merge MACOS-004 (PR #82) and vibe quiz (PR #81) when green.
2. Next single macOS read surface: export (or display-only consent snapshot without recompute).
3. Keep Campfire local-only; keep destructive retention/deletion blocked until review.
4. Optional founder VoiceOver smoke (ACCESS-001 residual).
5. Name independent backup reviewer before external alpha.

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

## Known limitations and risks

- Product is not production-ready for stranger meetings.
- macOS reads require env configuration + access token; not production passkey UX.
- Profile, trust history, and request lists never grant consent.
- A listed session request is never consent; mutations stay phone-first.
- Learning progress is device-local only.
- Physical VoiceOver smoke still pending.
- Ops is non-operational until real staff auth.

## Architectural decisions

- Repository artifacts are the source of truth.
- Consent is explicit, current, revocable, session-specific.
- macOS displays server-authoritative read models only; no Swift consent engine; no request mutations on Mac.

## Exact next action

Land MACOS-004 (PR #82) and the light vibe quiz (PR #81) after green checks. Then choose export as the next fail-closed macOS read, or return to SAFETY-OPS external blockers. Do not unlock Ops without server-backed staff authentication.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Read `docs/KNOWN_LIMITATIONS.md` and relevant ADRs (0045–0048).
3. Run `git status` and inspect recent commits.
4. Verify last recorded checks before changing code.

## Stop checklist

1. Stop at a coherent boundary.
2. Preserve working changes.
3. Run practical checks and record results.
4. Commit coherent work; update continuity files.
5. Note whether the tree is clean and the next resume action.
