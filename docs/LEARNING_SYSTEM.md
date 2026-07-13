# Litmo Guided Learning System

## Purpose

Litmo teaches its safety model instead of expecting users to infer it from buttons and warnings.

The learning system uses short, step-by-step modules inspired by station training: one concept at a time, concrete instructions, realistic practice, immediate explanation, optional product practice, and the ability to resume later.

> Touch is not a transaction — it is a language.

## Educational principles

- Calm, direct, trauma-informed language.
- Understanding over compliance theater.
- No public badges, rankings, streaks, or claims of consent expertise.
- No module completion is evidence that a participant is safe.
- Scenario feedback explains consequences without shaming the learner.
- Every module reinforces that consent is current, specific, revocable, and session-bound.
- Lived-lesson modules never replace clinical care; “Recovering from Violation” points to tools and optional outside support without graphic detail or forced processing.
- Private reflection prompts appear on screen only and are **never persisted**.
- Product practice links (Soft Signal, Consent Snapshot, Touch Language, Campfire, quiz share) are optional muscle memory — never required, never scored.

## Curriculum tracks

### Foundations (product safety map) — 6 modules

1. **Consent Snapshots** — nothing is inferred; the strictest compatible boundary wins; both people affirm the same current snapshot. Practice → prepare flow.
2. **The Soft Signal** — stopping is unilateral, immediate, and requires no explanation. Practice → Soft Signal practice + private log.
3. **Understanding Touch Language** — preferences are contextual and never obligations. Practice → Touch Language map.
4. **A full practice session** — fictional River & Sam walk request → snapshot → dual confirm → active → Soft Signal → wrap-up. No real session authority.
5. **Blocking and reporting** — block is immediate and private; report starts human review.
6. **Your trust signals, not a score** — peer-visible facts are not a rating.

### Lived lessons (hard-earned relational skills) — 6 modules

Full interactive track (≈5–6 minutes each). Frame + teaching + **at least two** scenario practices + soft close. Trauma-informed, private, leave-anytime.

| Module | Themes | Focus | Optional private quiz | Product practice |
| ------ | ------ | ----- | --------------------- | ---------------- |
| **Consent as Language** | consent, communication | Words over weather; grammar of a yes; hearing no | Vibe Quiz — Short | Consent Snapshot prepare, Touch Language edit |
| **Nervous System Safety** | nervous-system, consent, self-compassion | Capacity, window of tolerance, freeze as data, aftercare (not clinical) | Soft Capacity | Soft Signal practice, Campfire |
| **Boundaries** | boundaries, communication, consent | Early clarity; scripts; limits not earned; change either way | Boundary Voice | Touch Language, Consent Snapshot |
| **Recovering from Violation** | recovery, boundaries, self-compassion | Believe yourself; what counts; tools not performance; repair optional | Soft Capacity | Soft Signal practice + log |
| **Partner Communication** | communication, boundaries, consent | Check-ins; small repair; dual-consent share; pace; when talk ends | Connection Pace | Partner quiz share, TL secure share |
| **Self-Compassion** | self-compassion, nervous-system, recovery | Awkwardness without cruelty; both sides of a stop; rest is curriculum | Comfort & Care | Campfire, Comfort quiz |

Safety-critical foundation modules are labeled as recommended before a first session. This implementation does **not** hard-block session creation (separate product/accessibility decision).

## Learning paths

Curated sequences on the Learn hub. Paths only recommend; they never gate features or issue certificates.

| Path | Purpose |
| ---- | ------- |
| **Before a first session** | Lived consent language + Consent Snapshot + Soft Signal + Touch Language + full practice walk |
| **Consent & language** | Consent as Language + snapshot + Touch Language + partner communication |
| **Nervous system & capacity** | Nervous System Safety + Soft Signal + Self-Compassion |
| **Boundaries in practice** | Boundaries + Touch Language + blocking/reporting |
| **After hard moments** | Recovering from Violation + Self-Compassion + blocking/reporting |
| **Full lived-lessons track** | All six lived modules in calm order |

**Recommended next** on the hub prefers the first incomplete module on “Before a first session,” then other required foundations, then remaining lived lessons.

## Vibe Quiz integration

- Lived lessons may set `relatedQuizId` + `relatedQuizPrompt` on the module.
- Completing a module shows a **soft close** with optional quiz CTA and optional product practice (never required).
- Soft close may suggest a **continue learning** next module from the path or catalog.
- Learn hub links to Quizzes; Quizzes hub links back to Guided Practice.
- Copy always states weather/quizzes are never consent, safety scores, or competence proof.
- Partner quiz comparison remains behind dual share+compare consent (ADR 0050/0052).

## Architecture

| Piece | Role |
| ----- | ---- |
| `app/data/learningModules.ts` | Typed static curriculum: modules, themes, practice links, paths, recommend helpers |
| `app/data/learningModules.test.ts` | Structure, scenarios (≥2 per lived), paths, themes, safety copy |
| `app/services/learningProgressCore.ts` | Deterministic progress and resume rules |
| `app/services/learningProgress.ts` | Private device-local progress (AsyncStorage) |
| `app/app/(tabs)/learn.tsx` | Hub: progress split, recommended next, paths, tracks, Campfire, Quizzes |
| `app/app/learning/[id].tsx` | Player: one step at a time, scenarios, ephemeral reflection, soft close |

Progress is intentionally local. It contains only module identifiers, step positions, completion flags, and timestamps — **no reflections, free text, or social data**.

### Haptics (HAPTIC-001)

Learning uses the semantic haptic service only at restrained points: `presence`
on module entry (when not reduced-stimulation), `attention` on scenario steps,
`softSignal` when leaving Soft Signal practice steps, `confirmation` on module
complete. Never on every Next. Haptics can be disabled in Settings; meaning
always remains in copy.

## Progress behavior

- Opening an unfinished module resumes at the saved step.
- Completing a step saves the next position.
- Completing a module records completion and shows a private soft-close (practice + optional quiz + next module).
- Corrupt or invalid persisted state fails safely to empty progress.
- Completed modules may be revisited from the beginning.
- “Take a break” returns to the Learn hub with progress already saved (ND Mode / easy breaks).

## Accessibility

Semantic button roles, selected states, descriptive labels, progress-bar values, evergreen high-contrast actions, and no color-only completion meaning.

Neurodivergent Mode (Settings): larger clear language, progressive body disclosure, jump-to-step, voice aids / option-by-number, easy breaks, read aloud.

Future validation should include VoiceOver, Dynamic Type, reduced motion, and physical-device testing.

## Safety and non-claims

- Completing modules does **not** certify readiness, safety, or consent skill.
- Paths and “recommended next” are **not** gates.
- Freeze, capacity, and recovery content is **not** clinical diagnosis or therapy.
- Violation recovery content is non-graphic; leave-anytime is first-class.
- Trust signals modules reinforce: history is not a safety score.

## Future work

- Authoring schema and content validation beyond unit structure tests.
- Optional account synchronization without exposing learning data publicly.
- A separately reviewed decision about whether specific modules gate first-session features.
- Localization and plain-language / clinical editorial review for lived lessons.
- More optional quiz pairings as self-quiz catalog grows.
- Optional offline export of completion metadata only (no reflections).
