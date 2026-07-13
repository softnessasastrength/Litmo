# Neurodivergent Mode

## Purpose

Neurodivergent Mode is a **device-local accessibility preference** that optimizes
Vibe Quiz, partner invite/compare, and Guided Learning for reduced stimulation,
clearer language, easy navigation, save/resume, read-aloud, and dictation aids.

It is **not** a diagnosis, competence score, trust signal, or consent gate.
Turning it on never changes who may match, what a Consent Snapshot contains, or
whether Soft Signal works.

## How to enable

**Settings → Neurodivergent Mode** (toggle). Preference key:
`litmo.neurodivergent.prefs.v1` (AsyncStorage only).

When enabled, the optimized bundle turns on:

| Feature | Behavior |
| ------- | -------- |
| Reduced stimulation | No quiz fade motion; skip decorative glyphs; quiet haptics by default; honor system Reduce Motion |
| Clear language | Shorter chrome copy for quiz, partner, and learning (consent meaning unchanged) |
| Easy navigation | Jump lists, numbered options, explicit progress labels, larger targets |
| Save / resume | Mid-quiz progress on device (`quizPlayProgress`); learning already resumes |
| Read aloud | `expo-speech` when available; else `AccessibilityInfo.announceForAccessibility` |
| Voice input aids | Option-number field for keyboard dictation; partner package paste still works |

Turning **on** also sets haptics off by default. Users may re-enable haptics in
Settings without turning ND mode off.

## Surfaces

- **Quizzes hub / Learn hub** — status banner or soft link to Settings
- **Quiz play** — resume card, jump list, read aloud, dictate option number, auto-save
- **Partner share** — plain-language labels, optional read instructions
- **Learning modules** — jump-to-step, read step aloud, larger scenario targets

## Constitution / trauma-informed notes

- Accessibility preferences never appear in discovery, trust history, or export
  as “neuro type.”
- Clear language never softens fail-closed consent (four gates, Soft Signal, etc.).
- Read-aloud stays on-device; spoken text is not uploaded.
- Dictation uses the **device keyboard microphone**, not a Litmo cloud STT.
- Module and quiz completion still never prove safety or readiness.

## Architecture

- `neurodivergentPreferenceCore.ts` / `neurodivergentPreference.ts`
- `NeurodivergentContext` (provider in root layout)
- `quizPlayProgress.ts`, `speechService.ts`, `lib/clearLanguage.ts`

## Future work

- Fine-grained sub-toggles in Settings UI (currently master switch enables all)
- Optional larger base type scale beyond Dynamic Type
- Physical VoiceOver + Switch Control smoke for ND-optimized paths
