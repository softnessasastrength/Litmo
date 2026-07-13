# Current Project State

> Durable handoff for humans and coding agents. Update this file before stopping work for any reason.

## Active milestone

- **Name:** SAFETY-OPS-001 — Recommended private-alpha safety-operations foundation
- **Status:** active; founder selected the recommended defaults on 2026-07-13
- **Branch:** `agent/quizzes-section` carries Quizzes tab + partner E2E (ADR 0050/0051/0052). Prior macOS work: MACOS-004 session-requests read; `main` contains PRs #72–#80.
- **Latest known coherent milestone:** Chapters 1–5 foundation, BETA-001, ACCESS-001 semantics, native macOS foundation through MACOS-004, Quizzes section (ADR 0050) + owner-only summary backup (ADR 0051) + partner E2E Double Ratchet (ADR 0052).

## Completed foundation

- Playable mobile experience, demo mode, Supabase persistence, consent engine, session lifecycle, passkey architecture, learning system, Chapter 5 safety, private-alpha safety ops foundation.
- Campfire Mode (PR #73), MPL-2.0 (PR #74), hosted iOS compile (PR #75), native macOS foundation (PR #76), continuity finalize (PR #77).
- PR #78 ACCESS-001 semantics cleanup; VoiceOver smoke still optional.
- PR #79 MACOS-002 self-only trust history (ADR 0046).
- PR #80 MACOS-003 own profile + shared transport (ADR 0047).
- Quizzes section: short/deep vibe + self quizzes, local-first results, Face ID step-up on private result/share, four-gate partner comparison (ADR 0050); optional owner-only summary backup (ADR 0051); partner E2E X3DH + Double Ratchet with ciphertext-only optional relay (ADR 0052); demo fictional-partner practice on invite flow (QUIZ-003).
- Guided Learning lived lessons (LEARN-004): six short trauma-informed modules with scenarios and optional Vibe/self-quiz pairing after soft-close.
- Neurodivergent Mode (ACCESS-002): Settings toggle optimizes quiz, partner, and learning (reduced stimulation, clear language, save/resume, read-aloud, dictation aids). Demo entry enables it by default.
- QUIZ-004 review: short/deep paths verified; always-on mid-quiz resume; partner dual-consent + focused E2E stub; calm demo copy.
- Nearby local share (SHARE-001 / ADR 0053): Multipeer + ephemeral app crypto for discovery profiles and co-located Consent Snapshot review; opt-in off by default; Expo Go fail-soft.

## Work in progress

SAFETY-OPS-001 remains externally blocked on named qualified review and backup staffing. Quizzes + partner E2E + nearby share are on `agent/quizzes-section`. Litmo Ops remains locked. ACCESS-001 optional founder VoiceOver smoke remains open.

## Priority next work

1. Land Quizzes / partner E2E / nearby-share PR when green (ADR 0050–0053).
2. Review/merge remaining macOS read work if still open on other branches.
3. Keep Campfire local-only; keep partner weather off the server plaintext path; keep destructive retention/deletion blocked until review.
4. Optional founder VoiceOver smoke (ACCESS-001 residual), including Quizzes and Nearby Share if reviewing.
5. Name independent backup reviewer before external alpha.
6. Independent crypto review of quiz E2E and local share before external beta (KNOWN_LIMITATIONS / ADR 0052 / 0053).
7. Optional: two-device Multipeer physical smoke for Nearby Share.

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

Quizzes unit coverage includes `doubleRatchetCore`, `quizShareCore`, `quizPaths`, `quizScoring`, and `quizResultsRepositoryCore` tests under `app/`.

## Known limitations and risks

- Product is not production-ready for stranger meetings.
- macOS reads require env configuration + access token; not production passkey UX.
- Profile, trust history, and request lists never grant consent.
- A listed session request is never consent; mutations stay phone-first.
- Learning progress is device-local; Quizzes are local-first with optional own-summary backup; partner E2E keys/ratchets are device-local.
- Partner quiz E2E is Signal-inspired 1:1 (not full multi-device Signal audit); peer consents in packages are self-asserted; Expo Go may skip Enclave vault wrap.
- Physical VoiceOver smoke still pending.
- Ops is non-operational until real staff auth.

## Architectural decisions

- Repository artifacts are the source of truth.
- Consent is explicit, current, revocable, session-specific.
- macOS displays server-authoritative read models only; no Swift consent engine; no request mutations on Mac.
- Quizzes stay non-authoritative for touch, matching, trust, and sessions (ADR 0050); local-first with optional owner-only summary backup (ADR 0051); partner packages use X3DH + Double Ratchet with ciphertext-only optional relay (ADR 0052).

## Exact next action

Finish or merge the Quizzes / partner E2E branch after green checks. Continue SAFETY-OPS external blockers only with named owners. Do not unlock Ops without server-backed staff authentication. Do not promote quiz weather into discovery or Consent Snapshot without a new ADR.

## Resume checklist

1. Read `CURRENT_STATE.md`, `TASKS.md`, `DECISIONS.md`, and `project-state.json`.
2. Read `docs/KNOWN_LIMITATIONS.md` and relevant ADRs (0045–0048, **0050**/**0051**/**0052** for Quizzes).
3. Run `git status` and inspect recent commits.
4. Verify last recorded checks before changing code.

## Stop checklist

1. Stop at a coherent boundary.
2. Preserve working changes.
3. Run practical checks and record results.
4. Commit coherent work; update continuity files.
5. Note whether the tree is clean and the next resume action.
