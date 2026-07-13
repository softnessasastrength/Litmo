# Haptic Language Specification – Litmo v0.1 (Nuclear Autistic Edition)

**THIS IS A PRIVATE EXORCISM ARTIFACT, NOT A PRODUCT.**  
Primary framing: Trauma-to-Code Exorcism Dojo — [`EXORCISM_MANIFESTO.md`](EXORCISM_MANIFESTO.md) · [`DOJO_GUIDELINES.md`](DOJO_GUIDELINES.md) · [`TRAUMA_ARCHITECTURE.md`](TRAUMA_ARCHITECTURE.md).

**Status:** pure domain shipped (phone nuclear + **Watch / shared domain**)  
**Version:** `0.2-watch` · ADR 0063 · **ADR 0064**  
**Code:**  
- Phone: `app/lib/hapticLanguageCore.ts` · `hapticLanguageNuclear.ts`  
- Shared: `@litmo/domain` `hapticLanguage.ts` · `hapticWatch.ts`  
- Swift: `packages/LitmoWatchHaptics`  
- Expo stub: `app/modules/litmo-watch-haptics`  
**Hardware:** [`HARDWARE/HAPTICS.md`](HARDWARE/HAPTICS.md) · ADR 0057  
**Prior:** ADR 0039 five-event public API (still stable)

---

## Core philosophy

> **Touch is a language. Haptics are its phonemes, prosody, and punctuation.**

In Litmo, haptics are **never decorative feedback**. They are a **consensual, expressive, and revocable** channel that must obey the same strict consent spirit as physical touch:

| Rule | Meaning |
| ---- | ------- |
| **Opt-in** | Global haptics off / ND intensity off is valid |
| **Context-aware** | Patterns need sealed vocabulary in live sessions |
| **Previewable** | Preview mandatory before live session patterns |
| **Interruptible** | Soft Signal kills all active non-stop haptics |
| **Honest** | Never means peer consented, is present, or is safe |

Soft Signal remains **sacred**: commit stop first; haptic is freedom acknowledgment, not an alarm, not 911.

---

## 1. Core primitives (second & third-level granularity)

### Duration

| Class | Range | Notes |
| ----- | ----- | ----- |
| **Short** | 50–200 ms | taps, presence |
| **Medium** | 300–800 ms | waves, check-ins |
| **Sustained** | 1s+ with fade | requires envelope `allowSustained` |

### Intensity (5-step pressure scale)

`feather` → `light` → `medium` → `firm` → `firm_plus`  
Mapped to LRA/VCA/phone impact tiers (`intensityStepToUnit`).

### Rhythm

Single pulse · double tap · wave (rising/falling) · trill · heartbeat (variable BPM) · breath · Soft Signal staccato+decay.

### Location zones

**Body-mapped:** `shoulder-left/right`, `shoulders`, `forearm-*`, `hand-*`, `upper-back`, `mid-back`  
**Device-relative:** `device`, `device-left/right/center`  

Phone collapses body zones to logical motor locations; hardware Device OS maps multi-actuator.

### Texture modifiers

`sharp` · `soft` · `rumbling` · `pulsing` · `directional_stroke` · `smooth`

### Emotional / context tags (private by default)

`grounding` · `affirming` · `playful` · `calming` · `energizing` · `check_in` · `presence` · `boundary_warning`

### Safety envelope

Every pattern is clamped by:

```ts
{ maxIntensity, maxDurationMs, allowSustained, requirePreviewBeforeLive }
```

- **Default** envelope for standard sessions  
- **ND envelope** lower intensity / shorter / no sustained  
- **Soft Signal sacred envelope** — not ND-capped into inaudibility; still globally disableable  

### Internal pattern syntax

```text
[shoulder-left][firm][wave-rising 600ms][heartbeat 72bpm][affirming][consent-id:xyz]
```

Parsed by `parseNuclearSyntax` → `NuclearPattern` → `HapticPhrase` → phone/device IR.

---

## 2. Consent integration (non-negotiable)

| Requirement | Implementation |
| ----------- | -------------- |
| Preview mandatory before live | `mayPlayLivePattern` + `requirePreviewBeforeLive` |
| Vocabulary in Consent Snapshot | `HapticConsentVocabulary` bound to `consentId` / fingerprint |
| Dual affirm of allowed vocabulary | Product seal of allowed zones, max intensity, contexts |
| Soft Signal / withdrawal kills all | `raiseInterrupt("soft_signal")` + `softSignalActive` gate |
| Granular revocation | `revokeHapticFacet(vocab, "shoulder-left" \| "sustained")` |
| ND Mode | `ND_SAFETY_ENVELOPE` + `ndDefaultHapticVocabulary` |

**Soft Signal never requires preview or vocabulary seal.**

Live play algorithm:

```text
if Soft Signal → always allow (language layer)
if softSignalActive → deny all other
if preview required && !previewed → deny
if no vocabulary → deny
if zone/intensity/context revoked or not sealed → deny
else compile + play
```

---

## 3. Core haptic phrases (library)

| Id | Description |
| -- | ----------- |
| `greeting_double_tap` | Soft double tap — affirming arrival |
| `greeting_shoulder_wave` | Rising wave — safe container |
| `checkin_heartbeat` | Heartbeat ~72 bpm — co-regulation |
| `checkin_soft_pulse` | Soft pulse — I'm here, no pressure |
| `affirmation_stroke` | Light directional stroke (approved) |
| `affirmation_trill` | Playful trill |
| `grounding_rumble` | Deep slow rumble + fade |
| `grounding_bilateral` | Bilateral soft pulsing |
| **`soft_signal_sacred`** | Sharp triple + sustained decay — **cannot be overridden** |
| `boundary_question` | Soft “question mark” before new zone |

Access: `HAPTIC_PHRASE_LIBRARY` · `libraryPhraseToHaptic(id)`.

---

## 4. Technical implementation

| Platform | Path |
| -------- | ---- |
| **iOS (now)** | Expo `impact` + `notification` + delays; Soft Signal warning + descend impacts |
| **iOS (next)** | Core Haptics / AHAP from `core_haptics_hint` atoms |
| **Android** | VibrationEffect fallbacks (planned parity) |
| **Shared** | Versioned types in `app/lib` (domain-style pure); future `shared/` JSON recipes |
| **Offline** | Local phrases + consentId hash validation before live |
| **A11y** | `describePattern` full text; reduced intensity profiles; haptics never sole channel |
| **Extensibility** | Community patterns require constitution review before core library |

**Compile path:**

```text
Nuclear syntax / library id
  → NuclearPattern
  → HapticPhrase (clamp envelope)
  → HapticAtom[] IR
  → PhoneHapticCall[] | Device VCM/LRA frames
```

---

## 5. Learning & onboarding flow (Haptic Language Track)

Path id: **`haptic-language-track`** · progress via `learningProgress` (device-local).

| # | Module id | Title | Minutes |
| - | --------- | ----- | ------- |
| 1 | `haptic-language` | Touch Without Words | ~3 |
| 2 | `haptic-language-vocabulary` | Your First Words | ~4 |
| 3 | `haptic-language-consent` | Asking and Answering with Haptics | ~3 |
| 4 | `haptic-language-nd` | Making It Work for Your Brain | ~3 |
| 5 | `haptic-language-practice` | Putting It Together | ~4 |

Every module ends with **“You did enough. You can stop anytime.”**  
Patterns reference `HAPTIC_PHRASE_LIBRARY` / Soft Signal practice — not peer motors.

---

## 6. Soft Signal sacred contract (haptic layer)

```ts
{
  commitStopFirst: true,
  interruptPriority: 90, // emergency_stop = 100
  cannotBeOverriddenByOtherPhrases: true,
  pattern: "descend_warm + breath/staccato decay",
  notEmergencyServices: true,
  notAPenalty: true,
}
```

On Soft Signal fire: `raiseInterrupt("soft_signal")` then `play("softSignal")`.

---

## 6b. Apple Watch · Taptic co-regulation (ADR 0064)

> The Watch is an extension of safe human touch language — **never** a notification device.

### Watch-specific patterns

| Phrase | Meaning |
| ------ | ------- |
| `watch_gentle_tap` / `watch_strong_tap` | Local presence intensity |
| `watch_presence` | Soft double — not peer proximity |
| `watch_stroke` | Directional stroke **simulation** (not another hand) |
| `watch_co_regulation_heartbeat` | Co-regulation rhythm — **not** medical HR |
| `watch_check_in` | Optional gentle check-in |
| **`watch_soft_signal`** | Triple + decay; **global kill**; offline-first |

### Per-device intensity & profiles

- Capabilities: `defaultWatchCapabilities()` / `featherModeCapabilities()`  
- Sensory profiles travel: Overstimulated (feather), Co-regulation, Stop-only  
- ND / feather caps max intensity on that device  

### Cross-device Consent Snapshot enforcement

```text
Phone proposes → Watch previews → affirm/decline/Soft Signal
→ live only if required devices affirmed + mayPlayOnDevice
```

Soft Signal **never** requires preview or dual affirm.

### Complications (offline-first)

Allowed: Soft Signal control, calm check-in, “session active” without peer identity.  
Forbidden: badges, streaks, social unread, partner names on face.

### Learning

Path **`haptic-watch-track`**: intro · wrist Soft Signal · phone proposes/watch affirms · feather mode.

---

## 7. Implementation status & plan

| Piece | Status |
| ----- | ------ |
| Nuclear primitives + syntax | **shipped** |
| Consent vocabulary pure API | **shipped** |
| Phrase library | **shipped** |
| Soft Signal kill-all interrupt | **shipped** |
| TL zone preview | **shipped** |
| Mutual preview UI in snapshot | Phase B |
| Persist vocabulary on server seal | Phase B |
| Core Haptics AHAP | Phase C |
| Device multi-actuator locations | Phase D (HARDWARE) |

### Phase B — Consent Snapshot UI

1. Preview gallery in mutual seal flow  
2. Affirm allowed zones / max intensity into package  
3. Mid-session revoke facet control  

### Phase C — iOS Core Haptics

1. Native module consumes `core_haptics_hint`  
2. Soft Signal continuous descend  

### Phase D — Hardware

1. Map body zones to distributed actuators  
2. Same library ids / syntax  

---

## 8. Related

- Living Constitution I.4 · IV · V (ND)  
- ADR 0039 · 0057 · **0063**  
- `NEURODIVERGENT_MODE.md`  
- `SOFT_SIGNAL.md`  
