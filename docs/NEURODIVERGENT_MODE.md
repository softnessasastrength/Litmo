# Neurodivergent Mode — inclusive design (second-level accommodations)

**Status:** implemented device-local (v3 prefs)  
**Code:** `neurodivergentPreferenceCore` · `neuroAccommodationCore` · `NeurodivergentContext`  
**Related:** [`TRAUMA_INFORMED_SAFETY.md`](TRAUMA_INFORMED_SAFETY.md) · Living Constitution **Article V**

## Purpose

A **device-local global system** applying neurodiversity-inclusive and trauma-informed
patterns across Litmo — especially **Vibe Quiz**, **Guided Learning**, **Settings**,
and **overload exits**.

| Pattern | Behavior |
| ------- | -------- |
| **Progressive disclosure** | Extra detail expands on request |
| **Customizable pace** | Confirm (default on), slow auto, or brief auto |
| **Critical-step confirm** | Consent-adjacent steps never race even in auto |
| **Reduced motion** | Pref + system Reduce Motion |
| **Haptic intensity** | off / stop-only / standard |
| **Sensory profile** | low / balanced / variable (chrome density) |
| **Language preference** | plain / standard / detailed |
| **Voice input / output** | Read aloud + dictation option numbers |
| **Clear progress** | Explicit step/question remaining labels |
| **Easy breaks** | Save-and-leave anytime |
| **Overload exits** | break (saved) · Home · calm safety / panic cover |
| **Larger text** | ~18% scale on themed styles |

Calm, empowering, respectful. **Not** a diagnosis, score, trust signal, matching
trait, or consent gate.

## Demo-strength default

- **Demo entry** (`/entry`) turns Neurodivergent Mode **on** automatically
  (`onboard_nd_default_demo`) with the full calm bundle.
- **Settings master on** applies the same **demo-strength** bundle.
- Every second-level axis remains **reconfigurable** without turning the mode off.

Demo-strength defaults:

| Axis | Default when ND on |
| ---- | ------------------ |
| Pace | confirm |
| Sensory | low |
| Motion | reduced |
| Haptics | off (master haptics also quieted) |
| Language | plain |
| Overload exit | break (saved) |
| Progressive disclosure | on |
| Easy breaks | on |
| Always confirm critical | on |
| Low visual density | on |
| Explicit progress | on |

## How to enable

**Settings → Neurodivergent Mode**

Storage keys (load order):

1. `litmo.neurodivergent.prefs.v3`
2. fallback `…v2`, then `…v1`

When on, Settings exposes cycle controls for pace, sensory, motion, haptics
intensity, language, and overload exit.

## Second-level product law

Pure helpers live in `app/lib/neuroAccommodationCore.ts`:

- `mayPlayHaptic` — minimal = Soft Signal / emergency only  
- `accommodationAutoAdvanceMs` — critical steps → null  
- `overloadExitHref` — quiz / learning / session / general  
- `evaluateAccommodationFeature` — constitution gate (no profile export, no consent gate)

## Quiz (Vibe + self)

- One question at a time; numbered options  
- **Continue when ready** when pace = confirm  
- **Take a break** uses overload-exit preference (default Quizzes hub)  
- Progressive detail; resume card; read aloud + dictate  

## Guided Learning

- One step at a time; clear % progress  
- Progressive body truncation  
- Take a break → overload exit (default Learn hub)  
- Module: **`neurodivergent-mode`** in foundations + nervous-system path  

## Architecture

| Piece | Role |
| ----- | ---- |
| `neurodivergentPreferenceCore.ts` | v3 prefs, parse, patch, cycles |
| `neuroAccommodationCore.ts` | second-level pure law |
| `NeurodivergentContext` | projections + setters for UI |
| `useThemedStyles` + `neuroStyleScale` | larger text |
| `clearLanguage` | plain chrome strings + ND labels |
| `OverloadExitBar` | reusable exit affordance |

## Trauma-informed surfaces (overlap)

ND Mode does **not** replace Soft Signal, panic cover, or reflection. It makes
pause/leave **easier** and chrome **quieter**. See `TRAUMA_INFORMED_SAFETY.md`.

## Constitution

- Never export as a profile “type” or peer-visible signal  
- Never changes Consent Snapshot, Soft Signal availability, or matching eligibility  
- Dictation is device keyboard; speech stays on-device  
- No diagnostic or clinical framing  

## Future

- Physical VoiceOver / Switch Control smoke (ACCESS-001)  
- Wire `mayPlayHaptic` into every haptic call site with live intensity  
- Optional per-flow sensory overrides beyond global prefs  
