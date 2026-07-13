# Litmo Dedicated Hardware — Haptic System

**Status:** design specification (hardware vision — not a shipping SKU)  
**Version:** 2.0 · 2026-07-13  
**Canonical path:** `docs/HARDWARE/HAPTICS.md`  
**Related:** [ADR 0057](../adr/0057-device-haptic-vca-lra-architecture.md) · [Phone haptics](../roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md) · [ADR 0039](../adr/0039-semantic-haptic-language.md) · [Consent flow](../CONSENT_FLOW.md) · [Neurodivergent mode](../NEURODIVERGENT_MODE.md)

> Litmo does not buzz at people.  
> It **answers** them — warmly, sparsely, and in a way a sensitive nervous system can refuse or reduce at any moment.  
> Soft Signal must say: *you stopped — you are free* — never *danger* or *you failed*.

This document is the **authoritative** haptic specification for the dedicated Litmo companion device: philosophy, actuators, distributed feel, full pattern library with **Gentle / Sensory-Friendly** fallbacks, accessibility, personalization (including Vibe / sensory profile suggestions), software interfaces, and validation.

---

## 1. Goals

| Goal | Meaning |
| --- | --- |
| **Warm** | Mid–low body energy, rounded envelopes, palm-coupled “alive” feel — not metallic needle-ticks |
| **Emotionally safe** | Caring acknowledgement; never jarring, shaming, punishing, sexualized, or alarm-like |
| **High-fidelity** | Wideband voice-coil primary; LRA only for soft-edged crisp accents |
| **ND / sensory-first** | Every pattern has a Gentle Mode; global Sensory-Friendly Mode; full off + strong visual/sound |
| **Alive device-wide** | Distributed actuation so the whole soft-edged body feels coherent, not a corner rattle |
| **Honest** | Haptics never fake mutual consent, partner emotion, or safety of another person |

### 1.1 Non-goals

- Engagement, streaks, FOMO, or “nudge again” haptics  
- Inter-device secret codes or imitation of human skin contact  
- Soft Signal delayed by playback (safety state always commits first)  
- Sensitive telemetry of haptic events  
- ERM-primary Soft Signal  
- Patterns that only work if the user can tolerate strong vibration  

---

## 2. Core philosophy

### 2.1 Caring and safe by default

All haptics must feel **caring and safe, never jarring**.

| Principle | Implementation |
| --- | --- |
| **Answer, don’t demand** | Haptics acknowledge *local* state; they do not demand attention like notifications culture |
| **Silence is the default** | Most interactions produce no haptic |
| **Soft Signal is freedom** | Long smooth descending warm pulse that *releases* — not a siren, error, or slap |
| **Gentle Mode is first-class** | Every pattern has a Gentle / Sensory-Friendly fallback — not an afterthought |
| **Opt-down is easy** | Global Sensory-Friendly Mode + intensity + per-pattern presets + full off, reachable quickly |
| **Multi-modal parity** | Visual (and optional sound) always carry full meaning without haptics |
| **Fail kind** | Actuator failure → silence + UI; stop still works |

### 2.2 Emotional intelligence checks

Before shipping any pattern:

1. **Whose action?** If not this user’s local action (or a true mutual protocol seal), do not play “success.”  
2. **Feeling after?** Prefer grounded, free, complete — never dopamine, shame, or panic.  
3. **Worst day test?** Acceptable for someone overloaded, autistic, PTSD-activated, or sensory-avoidant in Gentle Mode.  
4. **Can silence hold it?** If yes, prefer silence.  
5. **Soft Signal still clearest “end” word?** Nothing outranks it except true emergency (still not a siren).

### 2.3 Contrast to cold tech haptics

| Cold / tech default | Litmo Soft Edge (this system) |
| --- | --- |
| Frequent micro-clicks | Sparse; most taps silent |
| Hard attack, square envelopes | Soft attack, smooth release, descending fades |
| High-frequency grit | Wideband VCM warm body (≈ 45–90 Hz energy focus) |
| Triple-alert / error buzz for stop | Descending warm Soft Signal fade |
| Social “someone’s here” pressure | Optional nearby; Gentle = almost nothing |
| One intensity for all | Global Sensory-Friendly + per-pattern presets |

### 2.4 Tagline

*Warm enough to feel alive. Gentle enough for a sensitive day. Clear enough to end safely.*

---

## 3. Technology stack

### 3.1 Actuators

| Role | Technology | Job |
| --- | --- | --- |
| **Primary** | **High-fidelity wideband Voice Coil Motor (VCM / VCA)** | Device-wide warmth, breath, descending Soft Signal, ambient throbs, “alive” body |
| **Secondary** | **LRA** | Soft-edged crisp accents only (never the only Soft Signal path) |

**Rationale:** LRAs are efficient but narrow and often “cold.” Wideband VCM carries the emotional character — mass, warmth, smooth fades. LRA may add a *very soft* leading or trailing edge when clarity helps; in Gentle Mode, LRA is often **off**.

**Forbidden as primary Soft Signal:** ERM (muddy, slow, phone-buzz).

### 3.2 Device-wide distributed haptics

Goal: the rounded device feels **coherent and alive in the palm**, not a single buzzing corner.

| Element | Spec |
| --- | --- |
| **Primary VCM** | Center / palm coupling plate under soft-touch shell |
| **Optional satellite VCM or haptic channels** | Symmetrical left/right or edge modules driven **in phase** for whole-body field (v1 may be one VCM + mechanical distribution via chassis) |
| **LRA** | Near Soft Signal physical control for optional crisp accent (Default/Clear profiles only) |
| **Isolation** | Soft mounts so shell does not chatter; energy reads as pressure bloom |
| **Phase** | Multi-actuator drive locked in phase unless a deliberate spatial pattern is designed (v1: mono field) |

**“Alive” criteria:** slow amplitude envelopes, slight frequency glide (e.g. 72→55 Hz on Soft Signal), no hard mute mid-body when avoidable — prefer **smooth fade to zero**.

### 3.3 Drive electronics (targets)

| Item | Spec |
| --- | --- |
| VCM path | Broadband amp, stream ≥ 8 kHz, soft-start current limit |
| LRA path | Auto-resonance capable driver; optional for accents |
| Soft Signal start latency | **≤ 30 ms** p95 to first motion (even with long fade after) |
| Routine UI latency | ≤ 50 ms p95 |
| Soft Signal energy | Budget per product power model; long fade is low peak, not high average |
| Continuous watchdog | Abort continuous drive > **1200 ms** (Soft Signal long fade is the longest allowed intentional continuous) |
| Hardware mute | Factory + user off |

### 3.4 Dual-actuator mix (default vs gentle)

| Layer | Default / Clear | Gentle / Sensory-Friendly |
| --- | --- | --- |
| Soft Signal | VCM long descending pulse; optional soft LRA onset ≤ sharpness 0.35 | **VCM only**, very low amplitude, slower fade |
| Positive feedback | VCM glow + soft LRA click | VCM micro-pulse **or visual-only** |
| Nearby | VCM ambient throb | Single micro-pulse **or visual + optional sound only** |
| Mutual consent | Dual soft pulse (VCM; light LRA optional) | One extended VCM pulse |

---

## 4. Modes and personalization

### 4.1 Global Sensory-Friendly Mode

| Property | Spec |
| --- | --- |
| **Name** | Sensory-Friendly Mode (UI may also say “Gentle haptics”) |
| **Access** | Settings + **quick access** (hardware shortcut and/or persistent in-session control; not buried) |
| **Effect** | Forces **Gentle** fallback for every pattern; lowers global intensity ceiling; prefers VCM-only |
| **Persistence** | Device-local; not remotely settable by another user |
| **ND Mode link** | Enabling Neurodivergent Mode **suggests** Sensory-Friendly (user can decline) |

### 4.2 Intensity

| Control | Range | Notes |
| --- | --- | --- |
| Global intensity slider | 0–100% (mapped to safe peak) | 0 with haptics “on” still allows optional micro-pulses only if user wants; recommend pairing 0 with Off |
| Soft Signal floor | Optional “keep Soft Signal slightly clearer” | Never forces above user Soft Signal preset; never forces haptics if fully off |

### 4.3 Per-pattern presets

For each semantic pattern family:

| Preset | Meaning |
| --- | --- |
| **Full** | Primary pattern at global intensity |
| **Gentle** | Sensory-Friendly fallback |
| **Visual only** | No haptic (and optional sound per user) |
| **Off** | No haptic for this family |

Stored locally. UI lists human names (Soft Signal, Connection request, …).

### 4.4 Full haptics off

| Requirement | Spec |
| --- | --- |
| Master toggle | Off silences **all** haptics including Soft Signal acknowledgement |
| Soft Signal still works | Session ends immediately; **strong visual** Soft Signal state + optional **sound** (user-controlled) |
| Connection / consent | Full visual timelines; optional chimes only if sound enabled |

### 4.5 Automatic suggestions (Vibe Quiz / sensory profile)

**Suggestion only — never silent forced change without user confirmation** (except first-run optional onboarding apply).

| Signal | Suggested default |
| --- | --- |
| Vibe / sensory answers favoring quiet, low stimulus, “window nook,” overload | Sensory-Friendly Mode **on**, intensity low, nearby → visual-only |
| Vibe favoring clear structure / “need a plan” | Default haptics, Soft Signal Full, positive feedback Gentle |
| Explicit sensory preference in onboarding (if collected) | Map to Sensory-Friendly or Full |
| User previously disabled haptics | Never auto-re-enable |

```text
suggestion = f(vibeThemes, sensoryAnswers, neuroMode, lastUserChoice)
apply only after: user confirms OR user opted into “apply calm defaults”
```

Do **not** claim clinical sensing. Do **not** infer trauma. Quiz = preference weather, not diagnosis.

---

## 5. Pattern library

Every pattern below has:

- **Primary** — Default / Clear profiles  
- **Gentle Mode** — Sensory-Friendly / Quiet  
- **Rationale**  
- **Accessibility**  
- **Must not mean**  

Intensity values are **relative seeds** (0–1). Physical calibration required.

### 5.1 Soft Signal (critical)

| | Primary | Gentle Mode |
| --- | --- | --- |
| **Feel** | Long, smooth **descending warm pulse** that gently fades to silence | Extremely subtle, slow, low-amplitude fade — almost a soft breath / light presence leaving |
| **Emotional intent** | *I stopped. It stopped. I am free.* | Same meaning, minimal sensory load |
| **Actuators** | VCM primary; optional soft LRA onset only in Full | **VCM only** |
| **Duration** | ~600–900 ms fade envelope (peak early, long release) | ~700–1100 ms, peak ≤ 30% of Primary |
| **Must not** | Alarm, error triple-buzz, rising escalation, slap | Still must be **noticeable enough** when haptics on — if user cannot feel Gentle Soft Signal, rely on visual + optional sound |

#### Waveform — Primary `softSignal.primary` (“warm descent”)

```text
Intent: Freedom through release — energy leaves the hand.

t = 0 ms
  - Preempt all patterns
  - Optional: LRA soft onset  int 0.25  sharp ≤ 0.30  dur 12 ms  (Full only)
  - VCM start ~ 72–78 Hz, intensity ramp 0 → peak (0.55–0.70) in 40–60 ms (soft attack)

t = 40–120 ms
  - Hold near peak briefly (≤ 80 ms) — “registered”

t = 120–800 ms  (core Soft Signal character)
  - Smooth descending amplitude envelope (ease-out cubic or exponential)
  - Optional gentle frequency glide 75 Hz → 52 Hz (warm settling)
  - No secondary sharp slap at the end

t = end
  - Amplitude → 0 cleanly; no residual rattle > 40 ms mechanical ring
```

#### Waveform — Gentle `softSignal.gentle` (“breath leave”)

```text
t = 0 ms     VCM only; peak intensity ≤ 0.22
t = 0–100    Very soft attack to peak
t = 100–900  Slow descending fade (almost linear soft ease)
             f ≈ 58–65 Hz (narrower, warmer, less “buzzy”)
t = end      Silence; visual Soft Signal must already show ended
```

#### Safety ordering (mandatory)

```text
1. Accept Soft Signal input (short press preferred; never long-press trap)
2. Commit session → ended_soft_signal
3. Update UI / peers / radio per product rules
4. Haptic play fire-and-forget (Primary or Gentle per mode)
```

Playback failure must not undo stop. Extra presses ≤ 800 ms do not stack chaos.

#### Rationale

A **descending** warm pulse matches emotional release better than a hard dual-click “alarm.” Long fade is still high-fidelity VCM territory; LRA alone cannot do this kindly. Gentle Mode preserves dignity for sensory-sensitive users without removing Soft Signal’s *identity* as the stop word (visual remains primary carrier when needed).

---

### 5.2 Connection request

| | Primary | Gentle Mode |
| --- | --- | --- |
| **Feel** | Gentle **rising** heartbeat-like rhythm (2–3 soft throbs, rising slightly) | Single slow, very low-amplitude warm throb |
| **When** | Careful-connect / invite needs **explicit** accept (NFC, QR, proximity offer) | Same |
| **Actuators** | VCM (LRA off preferred) | VCM only |
| **Duration** | ~450–700 ms total | ~200–350 ms single throb |
| **Must not** | Romance, urgency, sexualized pound, continuous heartbeat while waiting | — |

#### Waveform — Primary `connectionRequest.primary`

```text
Three soft throbs, each a small VCM envelope; amplitude rises slightly 1 → 2 → 3
  throb: attack 30, sustain 40, release 70, base int 0.28 / 0.34 / 0.40
  gap between throbs: 90–110 ms
  f ≈ 60–70 Hz
Max 1 play per invite; never loop while user decides
```

#### Waveform — Gentle `connectionRequest.gentle`

```text
Single VCM throb: attack 50, sustain 60, release 120, int ≤ 0.18, f ≈ 58 Hz
Or: Visual only + optional soft chime if sound on
```

#### Rationale

“Heartbeat” here means **organic rhythm**, not panic or intimacy performance. Rising slightly says “something arrived that may need a choice” without demand. Gentle collapses to one throb or non-haptic.

**Coercion rule:** Never increase rate/intensity if the user ignores the request.

---

### 5.3 Mutual consent confirmed

| | Primary | Gentle Mode |
| --- | --- | --- |
| **Feel** | Soft **synchronized double-pulse** | One extended, very gentle confirmation pulse |
| **When** | Consent engine reports **mutual seal** only | Same |
| **Actuators** | VCM (+ optional micro LRA on each pulse in Full) | VCM only |
| **Must not** | “This person is safe,” fanfare, celebration buzz | Fake mutual if only one side affirmed |

#### Waveform — Primary `mutualConsent.primary`

```text
Pulse A: VCM int 0.35, attack 25, release 80, f ~65 Hz
Silence 70–90 ms
Pulse B: VCM int 0.38, attack 25, release 90  (equal partners, not escalating)
Optional: LRA int ≤ 0.22 sharp ≤ 0.28 with each pulse
```

#### Waveform — Gentle `mutualConsent.gentle`

```text
One extended VCM pulse: attack 40, sustain 50, release 160, int ≤ 0.20
```

#### EmotionalGuard

Refuse `mutualConsent` unless protocol state is mutually sealed. Otherwise silence or fail-closed UI only.

#### Rationale

Double-pulse = *two sides met* without a party. Gentle = one quiet “your device registered the seal.”

---

### 5.4 Positive feedback (local confirmation)

| | Primary | Gentle Mode |
| --- | --- | --- |
| **Feel** | Pleasant **rising click/glow** | Barely noticeable warm micro-pulse **or visual-only** |
| **When** | Local save, local affirm, settings toggle on, non-critical success | Same |
| **Must not** | Imply peer agreed; reward farming | — |

#### Waveform — Primary `positiveFeedback.primary`

```text
VCM short rising glow: f 55→70 Hz, attack 20, release 60, int peak 0.32
Optional LRA soft click: int 0.30 sharp 0.28 dur 14 at onset
```

#### Waveform — Gentle `positiveFeedback.gentle`

```text
VCM micro-pulse int ≤ 0.12, total < 80 ms
OR visual-only (recommended default under Sensory-Friendly for non-critical UI)
```

---

### 5.5 Nearby / incoming notification

| | Primary | Gentle Mode |
| --- | --- | --- |
| **Feel** | Light **ambient throb** | Extremely subtle single pulse **or visual + optional sound only** |
| **When** | Opt-in radar first nearby; or incoming careful invite (if not using connectionRequest) | Same |
| **Constraints** | Max 1 / 30 s; never during Soft Signal; radio off → never | Prefer visual-only in Sensory-Friendly |

#### Waveform — Primary `nearby.primary`

```text
VCM single ambient envelope: attack 40, sustain 50, release 120, int 0.22, f ~60 Hz
```

#### Waveform — Gentle `nearby.gentle`

```text
VCM int ≤ 0.10, total < 100 ms
OR no haptic — visual badge + optional chime
```

---

### 5.6 Additional patterns (same Gentle requirement)

| Event | Primary | Gentle |
| --- | --- | --- |
| `presence` / arrive | Soft breath-in VCM | Micro breath or silence |
| `attention` / pause | Soft double glow | Single micro glow or visual |
| `consentLocalAffirm` | positiveFeedback family | Gentle positive / visual |
| `consentRevokedLocal` | Short warm descent (family of Soft Signal, lower peak) | Micro descent or visual |
| `linkFailed` | Single muted soft tick (not alarm) | Visual only preferred |
| `emergencyStop` | Firmer warm descent + slightly stronger peak — **still not a siren** | Soft Signal Gentle + strong visual/sound |
| `softSignalRemoteEnded` | Softer descent than local Soft Signal | Micro fade or visual |

---

## 6. Semantic map (stable names)

| Semantic event | Pattern family | Priority |
| --- | --- | --- |
| `softSignal` | Soft Signal | safety |
| `emergencyStop` | Emergency (firm descent) | safety |
| `consentRevokedLocal` | Short descent | safety |
| `carefulTapPrompt` / connection invite | Connection request | normal |
| `consentMutualSealed` | Mutual consent | normal |
| `confirmation` / local save | Positive feedback | normal |
| `consentLocalAffirm` | Positive feedback | normal |
| `nearbyAware` | Nearby | low |
| `presence` | Presence breath | low |
| `linkFailed` | Fail tick | normal |

Phone clients keep ADR 0039 five-event subset; device implements full map with Primary/Gentle variants.

---

## 7. Accessibility (ND & sensory-sensitive)

### 7.1 Required features

| Feature | Spec |
| --- | --- |
| **Sensory-Friendly Mode** | Global; easy access; maps all patterns to Gentle |
| **Intensity slider** | Global 0–100% with safe clamp |
| **Per-pattern presets** | Full / Gentle / Visual-only / Off |
| **Full disable** | Master off + strong Soft Signal visual + optional sound |
| **Profile suggestions** | From Vibe / sensory answers — confirm before apply |
| **No remote control** | Partner cannot change haptic settings |
| **No long-press Soft Signal** | Short press; discoverable control |
| **Reduced motion** | Does not auto-kill haptics; user toggles win |
| **VoiceOver / large type** | Full meaning without haptics |
| **Self-test** | Optional settings “feel Soft Signal (Gentle/Full)” only when user starts it |

### 7.2 Sensory safety limits

| Limit | Value |
| --- | --- |
| Max sharpness (LRA) Default | ≤ 0.35 Soft Signal onset; ≤ 0.40 positive click |
| Max sharpness Gentle | LRA off |
| Max peak int Gentle Soft Signal | ≤ 0.22 (seed) |
| No looping patterns | Connection request plays once |
| No escalating ignore-punishment | Intensity never rises because user delayed |
| Ban list | Purr, horror heartbeat, triple alarm, continuous nearby field |

### 7.3 Visual & sound alternatives (when haptics Gentle/off)

| Event | Visual | Optional sound |
| --- | --- | --- |
| Soft Signal | Full-screen / unmistakable Soft Signal state, calm color, clear copy | Soft low chime descending (user opt-in) |
| Connection request | Card + accept/decline | Soft double tap tone |
| Mutual consent | Seal confirmation UI | Soft two-note |
| Nearby | Badge / radar mark | Single soft tick |
| Fail | Plain error, no red panic | Single muted tone |

Sound defaults **off** in Sensory-Friendly unless user enables.

---

## 8. Software architecture

### 8.1 Layers

```text
Session / consent / proximity FSMs
  → HapticSemantic.play(event, opts)
      → EmotionalGuard (mutual seal, radio gates, off)
          → ModeResolver (Sensory-Friendly? per-pattern preset? intensity?)
              → PatternBank soft_edge_v2 (primary | gentle | none)
                  → DistributedVcmMixer (+ optional LRA accent)
                      → Drivers
```

### 8.2 Interface sketch

```ts
export type HapticEvent =
  | "softSignal"
  | "emergencyStop"
  | "connectionRequest"
  | "consentMutualSealed"
  | "confirmation"
  | "nearbyAware"
  | "presence"
  | "attention"
  | "consentLocalAffirm"
  | "consentRevokedLocal"
  | "linkFailed"
  | "softSignalRemoteEnded";

export type PatternPreset = "full" | "gentle" | "visual_only" | "off";

export interface HapticUserSettings {
  masterEnabled: boolean;
  sensoryFriendlyMode: boolean;
  globalIntensity: number; // 0..1
  patternPresets: Partial<Record<HapticEvent, PatternPreset>>;
  soundEnabled: boolean;
  acceptCalmDefaultsFromVibe: boolean;
}

export interface HapticService {
  play(event: HapticEvent, opts?: { source: string }): Promise<void>;
  cancelAll(): void;
  getSettings(): HapticUserSettings;
  setSettings(patch: Partial<HapticUserSettings>): void;
  /** Suggestion only — does not apply without confirm unless user opted in. */
  suggestFromVibe(profile: VibeSensoryHints): HapticUserSettings;
}
```

### 8.3 Soft Signal ordering

```text
commit stop → UI/peers → play(softSignal) fire-and-forget
```

### 8.4 Pattern bank file

`firmware/patterns/soft_edge_v2.json` (or equivalent):

```json
{
  "version": 2,
  "personality": "soft_edge_warm",
  "events": {
    "softSignal": {
      "primary": "warmDescent",
      "gentle": "breathLeave",
      "priority": "safety"
    },
    "connectionRequest": {
      "primary": "risingHeartSoft",
      "gentle": "singleWarmThrob"
    },
    "consentMutualSealed": {
      "primary": "doublePulseSync",
      "gentle": "extendedConfirm"
    },
    "confirmation": {
      "primary": "risingClickGlow",
      "gentle": "microPulseOrNone"
    },
    "nearbyAware": {
      "primary": "ambientThrob",
      "gentle": "microOrVisual"
    }
  }
}
```

---

## 9. Validation

### 9.1 Bench

| Test | Pass |
| --- | --- |
| Soft Signal latency to first motion | ≤ 30 ms p95 |
| Soft Signal fade smoothness | No hard steps; spectrogram continuous descent |
| Gentle Soft Signal peak | ≤ configured cap; still measurable on fixture |
| Preempt | Soft Signal cancels other patterns immediately |
| Distributed phase | Multi-actuator phase error within mech budget |
| Ring | ≤ 40 ms after zero command |

### 9.2 Sensory & emotional study

Include sensory-sensitive and ND-identifying adults (opt-in, stop anytime):

1. Soft Signal labels: want *stopped / free / released*, not *alarm / error*  
2. Gentle Mode usable for a full session without overload  
3. Connection “heartbeat” not read as sexual or coercive  
4. Mutual seal not read as “safe person”  
5. Sensory-Friendly discoverability (< 2 steps from session UI)  
6. Full off + visual Soft Signal alone is sufficient  

**Hard fail:** majority experience Soft Signal Primary as alarming → lower peak, longer fade, less LRA — do not “fix” by getting louder.

### 9.3 Accessibility regression

- Master off  
- Sensory-Friendly on  
- Per-pattern visual-only  
- Actuator fault  
- Soft Signal multi-press  
- EmotionalGuard false mutual  
- Suggestion never overrides prior Off without consent  

---

## 10. Implementation phases

| Phase | Deliverable |
| --- | --- |
| **H0** | This document (v2) + ADR alignment |
| **H1** | Phone semantic haptics (existing path) |
| **H2** | Soft Edge simulator (VCM envelopes + audio proxy) |
| **H3** | VCM (+ LRA) bench; Soft Signal warm descent latency |
| **H4** | Gentle Mode pack + sensory user study |
| **H5** | Settings: Sensory-Friendly, intensity, per-pattern, vibe suggestions |
| **H6** | Distributed multi-actuator (if multi-module hardware) |

Not on private-alpha critical path. Phone remains the real shipping surface until hardware exists.

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Long Soft Signal feels weak / missed | Visual primary; optional Soft Signal floor; self-test |
| Long Soft Signal feels like alarm if peak too high | Low peak, descent character; study gate |
| Heartbeat misread as intimate/sexual | Soft, short, non-looping; Gentle single throb; copy |
| Sensory-Friendly hidden | Quick access control required |
| Auto vibe suggestions feel controlling | Confirm before apply; never re-enable after Off |
| Distributed rattle | Mech isolation; mono phase v1 |

---

## 12. Documentation ownership

| Doc | Role |
| --- | --- |
| **`docs/HARDWARE/HAPTICS.md`** | **Canonical** dedicated-device haptic system |
| `docs/HAPTIC_SYSTEM_DEVICE.md` | Pointer / historical Soft Edge notes → prefer this file |
| ADR 0057 | VCM primary + LRA secondary architecture |
| ADR 0039 + phone plan | Mobile subset |
| Website `/litmo#hardware` | Product vision language only |

---

## 13. Quick reference

```text
Stack:     Wideband VCM primary · LRA secondary accents · distributed warm field
Mode:      Sensory-Friendly → all Gentle; intensity; per-pattern; full off + visual/sound
Soft Signal: long smooth DESCENDING warm pulse · Gentle = breath-leave · after state commit
Connection: rising soft heartthrobs · Gentle = one slow throb
Mutual:     double soft pulse · Gentle = one extended pulse · only if sealed
Positive:   rising click/glow · Gentle = micro or visual-only
Nearby:     ambient throb · Gentle = micro or visual+sound
Suggest:   from Vibe/sensory — confirm before apply
```

**Tagline:**  
*Warm enough to feel alive. Gentle enough for a sensitive day. Clear enough to end safely.*
