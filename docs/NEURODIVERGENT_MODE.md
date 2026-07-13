# Neurodivergent Mode (global)

## Purpose

A **device-local global toggle** that optimizes the entire Litmo app experience:

- **Larger text** and tap targets (style scale via `useThemedStyles`)
- **Reduced motion** (no FadeIn motion; quieter haptics by default)
- **One question / step at a time** (quiz + learning)
- **Voice aids** (read-aloud + keyboard-dictation option numbers)
- **Easy saves** (mid-quiz resume; learning progress)

It is **not** a diagnosis, competence score, trust signal, or consent gate.

## How to enable

**Settings → Neurodivergent Mode** (master switch).

- Key: `litmo.neurodivergent.prefs.v1` (AsyncStorage only)
- **Demo mode** turns it on by default from the entry screen

## What “global” means

| Area | Behavior when on |
| ---- | ---------------- |
| App-wide styles | ~18% scale on font sizes, line heights, and min tap heights through `useThemedStyles` |
| Motion | `FadeIn` becomes instant; system Reduce Motion still honored |
| Haptics | Off by default; user may re-enable in Settings |
| Quizzes | One question UI, numbered options, resume card, read aloud, dictate option # |
| Guided Learning | One step, jump optional, read aloud, dictate scenario option #, save hint |
| Partner invite | Clear language chrome (existing) |
| Language | Shorter chrome copy where wired (`clearLanguage`) |

Consent gates, Soft Signal, and matching authority are **unchanged**.

## Architecture

- `neurodivergentPreferenceCore.ts` / `neurodivergentPreference.ts`
- `NeurodivergentContext` — `enabled`, `textScale`, `reducedStimulation`, `oneAtATime`, `voiceAids`, `easySaves`
- `lib/neuroStyleScale.ts` — pure scale helpers
- `hooks/useThemedStyles.ts` — applies scale when enabled
- `speechService.ts` — TTS / accessibility announce
- `quizPlayProgress.ts` — mid-quiz save

## Constitution

- Preference never appears in discovery, trust history, or export as “neuro type”
- Fail-closed consent still requires explicit mutual gates
- Dictation uses the **device keyboard**, not Litmo cloud STT
- Spoken content is not uploaded

## Future work

- Optional fine-grained sub-toggles in Settings UI
- Physical VoiceOver + Switch Control smoke on ND paths
