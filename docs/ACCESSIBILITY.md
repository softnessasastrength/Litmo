# Litmo Accessibility Audit & Checklist

**Date:** 2026-07-13  
**Scope:** Vibe Quiz (hub, play, result, partner share), Guided Learning, Settings  
  Neurodivergent Mode, and shared UI primitives.  
**Method:** Static code review + unit verification. Physical VoiceOver smoke remains  
  ACCESS-001 (optional founder pass).  
**Constitution:** Accessibility is care, not a competence score. ND Mode is never  
  matching, trust, or consent authority.

Related: `docs/ACCESSIBILITY_TRACK_C.md`, `docs/NEURODIVERGENT_MODE.md`, ACCESS-001 / ACCESS-002.

---

## Checklist legend

| Status | Meaning |
| ------ | ------- |
| ✅ | Implemented and wired |
| 🟡 | Partial / improve this pass |
| ❌ | Missing — prioritized if P0/P1 |
| ⏳ | Needs physical device smoke |

**Priority:** P0 screen-reader / critical path · P1 neurodivergent / quiz · P2 polish

---

## 1. Screen reader (VoiceOver / TalkBack)

| Item | Priority | Status | Notes |
| ---- | -------- | ------ | ----- |
| Interactive controls have roles (`button`, `radio`, `switch`, `progressbar`) | P0 | ✅ | `Button`, `Choice`, Settings switches, Progress |
| Meaningful `accessibilityLabel` (not icon-only) | P0 | 🟡 | Quiz strong; some decorative Text still announced |
| `accessibilityState` for selected / disabled | P0 | ✅ | Choice radios, switches, jump list |
| `accessibilityHint` for non-obvious actions | P1 | 🟡 | Share/partner strong; quiz continue/break present |
| Radiogroup wraps exclusive options | P0 | ✅ | Quiz play `accessibilityRole="radiogroup"` |
| Progress announces current/total | P0 | 🟡 | Progress bar + text; improve live updates |
| Announce route/question changes | P0 | ❌→✅ | Implement announce on question change |
| Headers use `accessibilityRole="header"` sparingly | P1 | 🟡 | Eyebrow+Title both headers — demote Eyebrow |
| Images have labels or are hidden | P1 | ✅ | Glyphs `accessible={false}` on Choice |
| Lists expose item count where useful | P2 | 🟡 | Jump list has per-item labels |
| Modal/sensitive gates announce purpose | P1 | ✅ | SensitiveAccessGate fail UI |
| Live regions for status / fail-closed | P1 | 🟡 | Share status; expand on quiz continue |

## 2. Neurodivergent support

| Item | Priority | Status | Notes |
| ---- | -------- | ------ | ----- |
| Global Neurodivergent Mode toggle | P0 | ✅ | Settings + demo default |
| Larger text / tap targets when ND on | P0 | ✅ | `useThemedStyles` + `neuroStyleScale` |
| Reduced motion (system + ND) | P0 | ✅ | FadeIn, Progress, pace delays |
| One question/step at a time | P0 | ✅ | Quiz + learning |
| Customizable pace (confirm/slow/auto) | P0 | ✅ | Settings pace cycle |
| Progressive disclosure | P1 | ✅ | Quiz detail / learning body |
| Clear progress (n of total · % · left) | P0 | ✅ | Quiz + learning labels |
| Easy breaks with save | P0 | ✅ | Quiz + learning break buttons |
| Voice: read aloud | P1 | ✅ | `speechService` |
| Voice: dictation aids (option number) | P1 | ✅ | Keyboard dictation fields |
| Quiet haptics by default in ND | P1 | ✅ | Re-enable in Settings |
| No color-only meaning | P0 | ✅ | Selected state + radio glyph + labels |
| Calm, non-shaming copy | P0 | ✅ | clearLanguage + safety lines |

## 3. Motor / touch targets

| Item | Priority | Status | Notes |
| ---- | -------- | ------ | ----- |
| Primary controls ≥ ~44×44 pt | P0 | ✅ | Buttons minHeight 56; Choice 78 |
| Hit slop on small text buttons | P1 | 🟡 | Back links have hitSlop; expand jump chips |
| Adequate spacing between controls | P1 | ✅ | Gap 10–12 on options |
| No gesture-only critical actions | P0 | ✅ | All pressable |

## 4. Visual / contrast / Dynamic Type

| Item | Priority | Status | Notes |
| ---- | -------- | ------ | ----- |
| Dynamic Type (`allowFontScaling`) | P0 | 🟡 | Choice/Button yes; audit Title/Body |
| maxFontSizeMultiplier cap where layout breaks | P1 | 🟡 | Choice caps 2; extend to quiz prompts |
| Light/dark modes keep distinct safety colors | P0 | ✅ | Theme + Settings copy |
| Progress not color-only | P1 | ✅ | Numeric labels |
| Focus order logical (top→bottom) | P0 | 🟡 | Reasonable; verify with VoiceOver smoke |

## 5. Cognitive / calm UX (quiz-specific)

| Item | Priority | Status | Notes |
| ---- | -------- | ------ | ----- |
| Save/resume mid-quiz | P0 | ✅ | Always on |
| Explicit continue when ND pace=confirm | P0 | ✅ | |
| Fail-closed partner compare messaging | P0 | ✅ | |
| Weather ≠ consent reminder on result | P0 | ✅ | |
| Error/empty states have recovery actions | P0 | ✅ | Missing quiz, Face ID deny |

## 6. Platform / process

| Item | Priority | Status | Notes |
| ---- | -------- | ------ | ----- |
| Physical VoiceOver smoke on device | P0 | ⏳ | ACCESS-001 residual |
| Switch Control / keyboard | P2 | ⏳ | |
| Automated a11y unit/static checks | P2 | 🟡 | Manual checklist here |
| Docs kept current with features | P1 | ✅ | This file + ND Mode |

---

## Audit findings (2026-07-13) — Vibe Quiz focus

### Strengths

- Radiogroup + radio roles with selected state on answers.
- ND Mode covers pace, breaks, progress, scale, voice aids.
- Partner share fail-closed with live status tones.
- Sensitive gates explain Face ID failure with retry/back.
- Decorative glyphs hidden from accessibility tree.

### Gaps addressed this pass (implementation)

1. **Announce question changes** to VoiceOver when index advances.  
2. **Progress** uses ND reduced motion + richer `accessibilityValue` text.  
3. **Eyebrow** no longer claims `header` (reduces header noise).  
4. **Quiz prompts / progress / body** `allowFontScaling` + multiplier.  
5. **Screen** `keyboardShouldPersistTaps="handled"` for dictation fields.  
6. **Result notes** grouped with accessibility labels.  
7. **Continue / break** live region polite announcements.

### Remaining / follow-up

- Physical VoiceOver full path: hub → short play → result → share.  
- Deep quiz (100) fatigue: already has breaks; smoke-test focus restoration.  
- Optional: `accessibilityViewIsModal` on SensitiveAccessGate.  
- Optional: reduce simultaneous progressbar + text redundancy for VoiceOver.

---

## Implementation map

| Area | Key files |
| ---- | --------- |
| Quiz play | `app/app/quizzes/play.tsx` |
| Quiz hub / result / share | `app/app/(tabs)/quizzes.tsx`, `result.tsx`, `share.tsx` |
| Learning | `app/app/learning/[id].tsx`, `app/app/(tabs)/learn.tsx` |
| Primitives | `app/components/ui.tsx` |
| ND Mode | `NeurodivergentContext`, `neurodivergentPreference*`, `neuroStyleScale` |

---

## How to re-audit

1. Toggle ND Mode on/off; confirm scale, pace, breaks.  
2. Enable VoiceOver (iOS) or TalkBack (Android).  
3. Walk: Quizzes hub → Short Vibe → answer → continue → break → resume → result.  
4. Partner share next-step + import (demo fictional partner).  
5. Guided Learning one lived lesson with scenario.  
6. Record findings under ACCESS-001 if device smoke run.
