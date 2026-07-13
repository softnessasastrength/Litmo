# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected the recommended defaults on 2026-07-13
- **Branch:** `agent/macos-self-export-read` (MACOS-005). Open PR #83 holds 100-question vibe quiz + model. `main` has PRs #72–#82.
- **Latest known coherent milestone:** Foundation through BETA-001; ACCESS-001 semantics (#78); macOS foundation (#76); trust history (#79); own profile (#80); session requests (#82).

## Completed foundation

- Mobile vertical slice, consent, sessions, safety ops foundation, Campfire, MPL-2.0, hosted iOS/macOS compile.
- MACOS-002 trust history (PR #79 / ADR 0046).
- MACOS-003 own profile (PR #80 / ADR 0047).
- MACOS-004 session requests read-only (PR #82 / ADR 0048).

## Work in progress

- MACOS-005 self export on macOS (ADR 0049).
- PR #83: 100-question vibe quiz + vibe-mix-1.0 model engine.
- Litmo Ops remains locked. ACCESS-001 residual: optional founder VoiceOver smoke.
- SAFETY-OPS-001 externally blocked on named qualified review and backup staffing.

## Priority next work

1. Merge PR #83 (quiz) and MACOS-005 export when green.
2. Next gaps: learning sync (none), consent-snapshot display-only, or Ops staff auth design.
3. Keep Campfire local-only; keep destructive retention/deletion blocked.
4. Optional founder VoiceOver smoke.
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
- Self export is not legally complete data access and not deletion.
- Listed requests and profiles never grant consent.
- Physical VoiceOver smoke still pending.
- Ops is non-operational until real staff auth.

## Architectural decisions

- Repository artifacts are the source of truth.
- Consent is explicit, current, revocable, session-specific.
- macOS shows server-authoritative read models only; no Swift consent engine.

## Exact next action

Land MACOS-005 and rebased PR #83 after green checks. Do not unlock Ops without server-backed staff authentication.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Read `docs/KNOWN_LIMITATIONS.md` and ADRs 0045–0049.
3. Run `git status` and inspect recent commits.
4. Verify last recorded checks before changing code.

## Stop checklist

1. Stop at a coherent boundary.
2. Preserve working changes.
3. Run practical checks and record results.
4. Commit coherent work; update continuity files.
5. Note whether the tree is clean and the next resume action.
