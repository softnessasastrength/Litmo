# Litmo Guided Learning System

## Purpose

Litmo teaches its safety model instead of expecting users to infer it from buttons and warnings.

The learning system uses short, step-by-step modules inspired by station training: one concept at a time, concrete instructions, realistic practice, immediate explanation, and the ability to resume later.

## Educational principles

- Calm, direct, trauma-informed language.
- Understanding over compliance theater.
- No public badges, rankings, streaks, or claims of consent expertise.
- No module completion is evidence that a participant is safe.
- Scenario feedback explains consequences without shaming the learner.
- Every module reinforces that consent is current, specific, revocable, and session-bound.

## Initial curriculum

1. **Consent Snapshots** — nothing is inferred; the strictest compatible boundary wins; both people affirm the same current snapshot.
2. **The Soft Signal** — stopping is unilateral, immediate, and requires no explanation.
3. **Understanding Touch Language** — preferences are contextual and never obligations.
4. **A full practice session** (LEARN-002) — fictional River & Sam walk request → snapshot → dual confirm → active → Soft Signal → wrap-up. No real session authority. Completing it is never safety certification.

Safety-critical modules (including the full practice path) are labeled as recommended before a first session. This implementation does not yet hard-block session creation because gating behavior requires a separate product decision and accessibility review.

## Architecture

- `app/data/learningModules.ts` contains typed, static curriculum content.
- `app/services/learningProgressCore.ts` contains deterministic progress and resume rules.
- `app/services/learningProgress.ts` persists private device-local progress through AsyncStorage.
- `app/app/(tabs)/learn.tsx` displays the module catalog and private completion summary.
- `app/app/learning/[id].tsx` renders one step at a time and provides scenario feedback.

Progress is intentionally local in this first slice. It contains only module identifiers, step positions, completion flags, and timestamps. It contains no reflections, sensitive free text, or social data.

### Haptics (HAPTIC-001)

Learning uses the semantic haptic service only at restrained points: `presence`
on module entry, `attention` on scenario steps, `softSignal` when leaving Soft
Signal practice steps, `confirmation` on module complete. Never on every Next.
Haptics can be disabled in Settings; meaning always remains in copy.

## Progress behavior

- Opening an unfinished module resumes at the saved step.
- Completing a step saves the next position.
- Completing a module records its final step and completion status.
- Corrupt or invalid persisted state fails safely to empty progress.
- Completed modules may be revisited from the beginning.

## Accessibility

The interface includes semantic button roles, selected states, descriptive labels, progress-bar values, evergreen high-contrast actions, and no color-only completion meaning.

Future validation should include VoiceOver, Dynamic Type, reduced motion, and physical-device testing.

## Future work

- Authoring schema and content validation.
- More modules, including respectful communication, ending sessions well, accessibility, privacy, and the Trust Ledger.
- ~~Practice mode covering the full session lifecycle with fictional participants.~~ **Landed 2026-07-12** as module `full-session-practice` (content-only; not a separate interactive simulator).
- Optional account synchronization without exposing learning data publicly.
- A separately reviewed decision about whether specific modules gate first-session features.
- Localization and plain-language editorial review.
