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
- Lived-lesson modules never replace clinical care; “Recovering from Violation” points to tools and optional outside support without graphic detail or forced processing.

## Curriculum tracks

### Foundations (product safety map)

1. **Consent Snapshots** — nothing is inferred; the strictest compatible boundary wins; both people affirm the same current snapshot.
2. **The Soft Signal** — stopping is unilateral, immediate, and requires no explanation.
3. **Understanding Touch Language** — preferences are contextual and never obligations.
4. **A full practice session** — fictional River & Sam walk request → snapshot → dual confirm → active → Soft Signal → wrap-up. No real session authority.
5. **Blocking and reporting** — block is immediate and private; report starts human review.
6. **Your trust signals, not a score** — peer-visible facts are not a rating.

### Lived lessons (hard-earned relational skills)

Short, interactive modules (≈3–4 minutes each) with at least one scenario:

| Module | Focus | Optional private quiz |
| ------ | ----- | --------------------- |
| **Consent as Language** | Words over weather/vibe; specific, revocable yes | Vibe Quiz — Short |
| **Nervous System Safety** | Capacity, freeze as data, private aftercare | Soft Capacity |
| **Boundaries** | Early clarity; limits are not earned | Boundary Voice |
| **Recovering from Violation** | Believe yourself; tools not performance; repair optional | Soft Capacity |
| **Partner Communication** | Check-ins; small repair; pace; dual-consent quiz share | Connection Pace |
| **Self-Compassion** | Awkwardness without cruelty; rest is curriculum | Comfort & Care |

Safety-critical foundation modules are labeled as recommended before a first session. This implementation does not hard-block session creation (separate product/accessibility decision).

## Vibe Quiz integration

- Lived lessons may set `relatedQuizId` + `relatedQuizPrompt` on the module.
- Completing a module shows a **soft close** screen with an optional quiz CTA (never required).
- Learn hub links to Quizzes; Quizzes hub links back to Guided Practice.
- Copy always states weather/quizzes are never consent, safety scores, or competence proof.
- Partner quiz comparison remains behind dual share+compare consent (ADR 0050/0052).

## Architecture

- `app/data/learningModules.ts` — typed, static curriculum (`track`, optional quiz links).
- `app/data/learningModules.test.ts` — structure and lived-lesson presence checks.
- `app/services/learningProgressCore.ts` — deterministic progress and resume rules.
- `app/services/learningProgress.ts` — private device-local progress (AsyncStorage).
- `app/app/(tabs)/learn.tsx` — catalog by track + Campfire + Quizzes entry.
- `app/app/learning/[id].tsx` — one step at a time, scenarios, soft-close + quiz CTA.

Progress is intentionally local. It contains only module identifiers, step positions, completion flags, and timestamps — no reflections, free text, or social data.

### Haptics (HAPTIC-001)

Learning uses the semantic haptic service only at restrained points: `presence`
on module entry, `attention` on scenario steps, `softSignal` when leaving Soft
Signal practice steps, `confirmation` on module complete. Never on every Next.
Haptics can be disabled in Settings; meaning always remains in copy.

## Progress behavior

- Opening an unfinished module resumes at the saved step.
- Completing a step saves the next position.
- Completing a module records completion and shows a private soft-close (optional quiz).
- Corrupt or invalid persisted state fails safely to empty progress.
- Completed modules may be revisited from the beginning.

## Accessibility

Semantic button roles, selected states, descriptive labels, progress-bar values, evergreen high-contrast actions, and no color-only completion meaning.

Future validation should include VoiceOver, Dynamic Type, reduced motion, and physical-device testing.

## Future work

- Authoring schema and content validation beyond unit structure tests.
- Optional account synchronization without exposing learning data publicly.
- A separately reviewed decision about whether specific modules gate first-session features.
- Localization and plain-language / clinical editorial review for lived lessons.
- More optional quiz pairings as self-quiz catalog grows.
