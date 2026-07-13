# Neurodivergent Mode — inclusive design

## Purpose

A **device-local global toggle** applying neurodiversity-inclusive patterns
across Litmo — especially **Vibe Quiz** and **Guided Learning**:

| Pattern | Behavior |
| ------- | -------- |
| **Progressive disclosure** | Extra scene detail and long lesson text expand on request |
| **Customizable pace** | Confirm to continue (default), slow auto-advance, or brief auto |
| **Reduced motion** | Instant transitions; quieter haptics by default |
| **Voice input / output** | Read aloud + keyboard-dictation option numbers |
| **Clear progress** | “Question 3 of 10 · 30% · 7 left” style labels |
| **Easy breaks** | Save-and-leave anytime; mid-quiz resume |
| **Larger text** | ~18% scale on themed styles app-wide |

Calm, empowering, respectful. **Not** a diagnosis, score, trust signal, or
consent gate.

## How to enable

**Settings → Neurodivergent Mode**

- Storage: `litmo.neurodivergent.prefs.v2` (loads v1 if present)
- **Demo** turns it on by default
- When on, **Pace** cycles: confirm → slow → auto

## Quiz (Vibe + self)

- One question at a time; numbered options
- **Continue when ready** when pace = confirm
- **Take a break (saved)** returns to Quizzes with progress kept
- Progressive: optional “Show more detail” for kickers/details
- Resume card if mid-quiz progress exists
- Read aloud + dictate option number

## Guided Learning

- One step at a time; clear % progress
- Progressive body truncation + show more
- Takeaway may wait until expand or scenario choice
- Take a break → Learn hub (progress already saved)
- Read aloud + dictate scenario options

## Architecture

- `neurodivergentPreferenceCore.ts` — prefs, pace, parse
- `NeurodivergentContext` — enabled, textScale, pace, progressiveDisclosure, easyBreaks, autoAdvanceDelayMs
- `useThemedStyles` + `neuroStyleScale` — larger text
- `clearLanguage` — plain chrome strings

## Constitution

- Never export as a profile “type”
- Never changes Consent Snapshot, Soft Signal, or matching
- Dictation is device keyboard; speech stays on-device

## Future

- Physical VoiceOver / Switch Control smoke
- Optional more granular Settings sub-toggles
