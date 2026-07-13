# Litmo Device Haptic System

**Status:** design specification (hardware vision — not a shipping SKU)  
**Date:** 2026-07-13  
**Related:** [ADR 0057](adr/0057-device-haptic-vca-lra-architecture.md) · [Phone haptics plan](roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md) · [ADR 0039](adr/0039-semantic-haptic-language.md) · Soft Signal / Consent Snapshot product rules

> A gentle haptic can say “I’m here” without demanding attention.  
> A Soft Signal haptic must say “you stopped — you are free” without terror.

This document specifies the **tactile language** of the dedicated Litmo companion device: actuators, waveforms, semantic events, timing budgets, accessibility, and implementation interfaces. It extends the phone-first five-event vocabulary into a high-fidelity **voice-coil + LRA** stack suited to warm, soft-edged hardware.

---

## 1. Intent and non-goals

### 1.1 Intent

- Make consent-critical moments **feel** distinct, calm, and trustworthy in the hand.
- Prioritize **warm, inviting, high-fidelity** feedback over rumble or game-controller “hit.”
- Make **Soft Signal** instant, unmistakable, and **emotionally safe** (clear stop ≠ alarm).
- Support **consent exchange**, **connection**, and everyday UI without turning the device into a buzzbox.
- Remain optional, private, multi-modal, and fail-safe.

### 1.2 Non-goals

| Forbidden | Why |
| --- | --- |
| Haptic as proof of another person’s consent | Consent is mutual, explicit, session-specific — never inferred from vibration |
| Inter-device “secret touch” or encoded messages | Opens coercion and misread-as-affection risks |
| Imitating interpersonal skin contact | Creepy, trauma-unsafe, product-dishonest |
| Engagement loops, streaks, reward buzzes | Engagement-maximizing haptics are out of constitution |
| Soft Signal delayed by haptic playback | Safety state always wins; haptics are acknowledgement only |
| Logging haptic events as sensitive telemetry | Local only; no analytics of stops or consent moments |
| ERM-only “phone buzz” as the primary Soft Signal | Too slow and muddy for a trauma-informed stop |

### 1.3 Relationship to phone haptics

| Layer | Scope | Vocabulary |
| --- | --- | --- |
| Phone (ADR 0039 / Expo) | iOS demo & private alpha | 5 semantic events, platform presets |
| Device (this doc) | Dedicated hardware vision | Same **meanings**, richer **waveforms**, dual actuators |

Semantic **event names** stay stable across clients. Waveforms, actuators, and drivers differ. A Litmo concept must mean the same thing on every platform ([platform future](roadmap/CHAPTERS_7_TO_13_PLATFORM_FUTURE.md)).

---

## 2. Tactile personality (“Soft Edge”)

The dedicated device should feel like **furniture for connection**, not a game pad.

### 2.1 Personality adjectives

| Do | Don’t |
| --- | --- |
| Warm | Cold / metallic sting |
| Rounded envelopes | Square on/off clicks only |
| Low–mid fundamental “bloom” | High-frequency buzz grit |
| Short decays | Long ringing tails |
| Sparse | Chatty |
| Grounding | Alarming (except true emergency path) |
| Local action acknowledgement | Impersonating a partner |

### 2.2 Sensory metaphor (design language only)

Patterns are described in product docs as:

- **Breath** — soft swell / release (presence, idle settle)
- **Knock** — short definite impact (local confirmation)
- **Bell** — brief clear peak with quick decay (attention)
- **Curtain** — firm dual pulse that closes (Soft Signal)
- **Anchor** — deep single settle (session ended / grounded)

These metaphors are **authoring labels**, not claims that the device is “touching” the user.

### 2.3 Intensity ladder

| Level | Name | Use |
| --- | --- | --- |
| L0 | Off | User disabled or hardware unavailable |
| L1 | Whisper | ND quiet profile; learning presence |
| L2 | Soft | Default UI confirms |
| L3 | Clear | Attention / consent checkpoint |
| L4 | Firm | Soft Signal (primary stop) |
| L5 | Urgent | Emergency stop only — still not a siren |

Default shipping profile: **L2** for routine, **L4** for Soft Signal, **L5** only for emergency. Users may lower globally; Soft Signal may optionally stay one step above UI (see §8).

---

## 3. Hardware architecture

### 3.1 Decision summary

Use a **dual-actuator stack**:

1. **Wideband voice-coil actuator (VCA / VCM)** — high-fidelity, broadband “skin” and soft textures (≈ 40–250+ Hz usable with proper mounting).
2. **Linear resonant actuator (LRA)** — efficient sharp impacts and discrete ticks near resonance (typically ≈ 150–200 Hz class; tune to part).

**Do not** use ERM as the primary Soft Signal path. ERM may exist only as optional low-cost prototype fallback with degraded fidelity.

Piezo remains a **future option** for ultra-sharp clicks if mechanical integration allows; not required for v1 vision.

Research basis (industry): LRAs are efficient but narrow-band; voice-coil / VCM variants trade power for **broader frequency response** and more realistic tactile stimulation; psychophysics spans roughly 1–400 Hz for distinct fingertip vibration perception. See [Immersion haptic stack hardware notes](https://www.immersion.com/the-haptic-stack-hardware-layer/) and LRA/VCA manufacturer guidance on resonance tracking vs broadband drive.

### 3.2 Placement (industrial design coupling)

| Actuator | Mount | Hand feel goal |
| --- | --- | --- |
| VCA | Chassis center / palm coupling plate under soft-touch shell | Whole-device “warm bloom” |
| LRA | Near Soft Signal physical control / front edge | Finger-local crisp confirm + stop |
| Isolation | Silicone / foam pads per mech eng | Avoid shell buzz and long ring |

Enclosure: soft-edged rounded square, matte/tactile outer — haptics must **not** make the shell chatter. Target: decay to −20 dB mechanical within **≤ 40 ms** after waveform end for Soft Signal.

### 3.3 Drive electronics (implementation targets)

| Item | Spec |
| --- | --- |
| Driver | Closed-loop or auto-resonance capable LRA driver + broadband VCA amp (class-D or dedicated haptic IC pair) |
| Sample rate | ≥ 8 kHz PWM / DAC stream for VCA; LRA may use click envelopes or short bursts |
| Latency budget (command → first motion) | Soft Signal **≤ 30 ms** p95; routine UI **≤ 50 ms** p95 |
| Power | Soft Signal burst ≤ 120 mJ; continuous patterns banned except timed softBreath ≤ 400 ms |
| Overtemp / overdrive | Hardware clamp; firmware must not retry Soft Signal into thermal fault loops |
| Mute pin | Global haptic enable line for factory test and user off |

### 3.4 Dual-actuator role split

| Role | VCA | LRA |
| --- | --- | --- |
| Soft textures / breath | Primary | Support (optional) |
| UI tick / local confirm | Light envelope | Primary sharp transient |
| Soft Signal | Deep firm body | Simultaneous crisp edge |
| Consent attention | Soft swell | Optional double tick |
| Connection notify | Gentle single bloom | None or very light |
| Emergency | Strong body + sharp edge | Max short burst |

Always **compose** patterns in software as named presets; never fire raw motors from UI code.

---

## 4. Waveform language (implementation units)

### 4.1 Primitives

```text
Transient  { actuator: VCA|LRA|BOTH, intensity: 0..1, sharpness: 0..1, duration_ms }
Continuous { actuator: VCA|LRA, f_hz, intensity: 0..1, attack_ms, sustain_ms, release_ms }
Silence    { ms }
Composite  { steps: Primitive[] }   // sequential
Parallel   { a: Composite, b: Composite }  // VCA + LRA together
```

**Sharpness** (0 soft / 1 hard) maps to envelope shape and high-frequency content on VCA; LRA maps sharpness to attack time and amplitude.

### 4.2 Authoring constraints

| Rule | Limit |
| --- | --- |
| Max total pattern length (non-emergency) | 450 ms |
| Max Soft Signal length | 280 ms |
| Max emergency length | 350 ms |
| Max continuous tone | 400 ms |
| Min gap between unrelated events | 120 ms (queue or drop low priority) |
| Soft Signal priority | Preempts all other patterns immediately |
| No infinite loops | Firmware watchdog aborts > 500 ms continuous drive |

### 4.3 Example envelope values (starting calibration)

Nominal for **default intensity L2–L4**. Final values require physical bring-up.

| Pattern ID | Composition (sketch) |
| --- | --- |
| `breathIn` | VCA Continuous 60–80 Hz, attack 80, sustain 40, release 120, int 0.25 |
| `softKnock` | LRA Transient int 0.45 sharp 0.35 dur 18 + VCA soft under 25 ms int 0.2 |
| `doubleBell` | two `softKnock` with 70 ms silence |
| `curtainClose` | Parallel: LRA Transient int 0.85 sharp 0.55 dur 22; VCA Continuous ~70 Hz attack 15 sustain 60 release 90 int 0.7 — then 40 ms silence — second softer LRA tick int 0.5 |
| `anchorDown` | VCA Continuous 50–65 Hz attack 30 sustain 50 release 150 int 0.4 |

---

## 5. Semantic vocabulary (device)

Preserve phone event names; add device-only connection and consent-exchange events carefully.

### 5.1 Core (shared with phone)

| Event | Meaning | Feel | Actuators |
| --- | --- | --- | --- |
| `presence` | Arrive; you are here | Breath / whisper | VCA |
| `attention` | Pause; look carefully | Double bell | LRA (+ light VCA) |
| `confirmation` | **Your** local action registered | Soft knock | LRA primary |
| `softSignal` | Stop/exit registered — you are free | Curtain close | BOTH |
| `emergencyStop` | Emergency stop registered | Anchor + firm edge | BOTH (L5) |

### 5.2 Consent exchange (device)

These acknowledge **local** protocol steps only. They must never imply the peer agreed.

| Event | When | Feel | Must not mean |
| --- | --- | --- | --- |
| `consentInvite` | Local user opens Consent Snapshot review | `attention` family, slightly warmer | Peer is ready |
| `consentLocalAffirm` | Local user affirms their side | `confirmation` + tiny breath | Mutual consent complete |
| `consentMutualSealed` | **Both** sides affirmed and snapshot sealed in protocol | Distinct calm seal: softKnock + short breathOut | “You are safe with this person” |
| `consentRevokedLocal` | Local withdraws before/during | Soft descending curtain (shorter Soft Signal family) | Blame or error |

**Rule:** `consentMutualSealed` may play only after the consent engine reports mutual seal. If network is ambiguous, play nothing or `attention` to re-check UI — never fake mutual.

### 5.3 Connection notifications

Proximity / NFC / Multipeer — opt-in radio only.

| Event | When | Feel | Constraints |
| --- | --- | --- | --- |
| `nearbyAware` | First anonymous nearby match (opt-in radar) | Single soft breath (L1–L2) | Max 1 per 30 s; never while Soft Signal active |
| `carefulTapPrompt` | NFC/QR invite received needing explicit accept | `attention` | No auto-accept |
| `linkEstablishedLocal` | Local radio channel up (not identity reveal) | Soft knock | Not “friend found” romance cue |
| `identityRevealedMutual` | Both chose reveal | Soft double breath | Not consent to touch |
| `linkEnded` | Channel closed cleanly | Anchor soft | — |
| `linkFailed` | Fail closed | Single muted tick, no alarm | Visible error required |

### 5.4 Explicitly unused

- Heartbeat / continuous presence buzz while nearby  
- “They are typing” style social haptics  
- Intensity escalating to force response  
- Haptic Morse or secret codes  

---

## 6. Soft Signal — primary safety haptic

### 6.1 Product requirements

| Requirement | Spec |
| --- | --- |
| Instant | Motion start ≤ 30 ms after firmware accepts Soft Signal input |
| Unmistakable | User study: ≥ 95% identify as “stop/exit” vs confirm/attention after training |
| Emotionally safe | Not a panic alarm; firm and complete — “curtain closed,” not “danger siren” |
| Non-blocking | Session stop commits **before or concurrent with** haptic start; never `await haptic` before state transition |
| Idempotent | Extra presses within 800 ms do not stack vibration; may reinforce once if first failed to start |
| Discoverable by touch | Physical Soft Signal control placement + LRA near control for finger-local edge |
| Works haptics-off | Full visual + optional audio; stop still works |

### 6.2 Waveform: `softSignal` (`curtainClose`)

```text
t=0 ms     Preempt any playing pattern; open VCA + LRA drive
t=0–25     LRA sharp firm tick (int ~0.85, sharp ~0.55)  // “edge”
t=0–160    VCA warm body (≈65–80 Hz, attack 15, release 90, int ~0.70)
t=160–200  Silence (perceptual gap)
t=200–230  LRA softer second tick (int ~0.50)           // “closed”
t=230–280  VCA residual release only if needed; then hard stop
```

**Emotional intent:** two beats = *I asked to stop* / *it stopped*. Not three-alarm, not buzzsaw.

### 6.3 Optional peer device behavior

If the peer is also on Litmo hardware and the session is active:

- Peer may receive a **different** pattern `softSignalRemoteEnded` (single soft curtain, L3) **only** as “session ended” UI, never as “you did something wrong.”
- Peer pattern must not be stronger than local Soft Signal.
- If connectivity is lost, peer relies on timeout UI; do not invent fake Soft Signal haptics.

### 6.4 Practice vs real

| Mode | Haptic |
| --- | --- |
| Learning / fictional Soft Signal practice | Full `softSignal` at L3–L4 |
| Active session Soft Signal | Full `softSignal` at L4 (or user Soft Signal floor) |
| Demo with haptics disabled | Silent; visible Soft Signal state only |

---

## 7. Consent exchange patterns (timeline)

Ideal mutual path (local device only shown):

```text
User opens snapshot     → consentInvite      (attention / doubleBell)
User scrolls / reviews  → (no haptic)
User affirms locally    → consentLocalAffirm (confirmation)
Waiting for peer        → (no haptic; optional subtle UI only)
Mutual seal             → consentMutualSealed
Session becomes active  → optional presence (once)
Either Soft Signal      → softSignal (preempt)
```

**Fail closed:** if seal fails, play nothing or a single muted `linkFailed` tick + clear visual — never `confirmation`.

### 7.1 Confusion matrix (must pass in user testing)

| Pair | Must remain distinct |
| --- | --- |
| `confirmation` vs `softSignal` | Soft Signal longer dual-actuator curtain |
| `attention` vs `softSignal` | Attention lighter, no “closed” second beat |
| `consentMutualSealed` vs `softSignal` | Seal is warm/soft; Soft Signal is firm/closed |
| `nearbyAware` vs `softSignal` | Nearby is whisper breath only |

---

## 8. Accessibility, ND, trauma-informed rules

Aligned with phone ADR 0039 and Neurodivergent Mode:

1. **Master toggle** — off silences all haptics including Soft Signal acknowledgement; **stop still works**.
2. **Intensity scale** — Off / Quiet / Default / Strong (maps to L0–L4 UI; Soft Signal floor configurable).
3. **Soft Signal floor** — default “always at least Clear when haptics on”; user may set Soft Signal to match Quiet if needed.
4. **ND quiet profile** — shortens sustain, lowers VCA, prefers LRA ticks; Soft Signal remains dual-actuator but reduced int.
5. **Reduced motion** — does **not** auto-disable haptics; explicit toggle wins.
6. **No surprise on wake** — no haptic on boot or unlock without user action (except optional one-time Soft Signal hardware self-test in settings).
7. **Visible + spoken parity** — every event has UI copy / VoiceOver equivalent.
8. **Sensory safety** — ban patterns > 450 ms; ban repeating; ban rising alarm for Soft Signal.
9. **Hold-to-confirm vs Soft Signal** — Soft Signal must never require long press that blocks release under panic; prefer dedicated control with short press.

---

## 9. Software architecture (firmware + client)

### 9.1 Layers

```text
App / session state machine
    → HapticSemantic.play(event, { source, intensity? })
        → Priority queue (Soft Signal / emergency preempt)
            → Pattern library (JSON / const tables)
                → DualActuatorMixer
                    → Drivers (VCA stream, LRA envelope)
```

### 9.2 TypeScript-shaped interface (shared domain)

```ts
/** Stable across phone + device. Device may implement a superset. */
export type HapticEvent =
  | "presence"
  | "attention"
  | "confirmation"
  | "softSignal"
  | "emergencyStop"
  // device / rich clients
  | "consentInvite"
  | "consentLocalAffirm"
  | "consentMutualSealed"
  | "consentRevokedLocal"
  | "nearbyAware"
  | "carefulTapPrompt"
  | "linkEstablishedLocal"
  | "identityRevealedMutual"
  | "linkEnded"
  | "linkFailed";

export type HapticPriority = "low" | "normal" | "safety";

export interface HapticPlayOptions {
  /** Never block safety transitions on playback. */
  awaitPlayback?: boolean; // default false for safety events
  intensityOverride?: number; // 0..1, clamped by profile
  source: string; // non-sensitive debug tag only
}

export interface HapticService {
  play(event: HapticEvent, opts: HapticPlayOptions): Promise<void>;
  cancelAll(): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  getProfile(): HapticProfile;
  setProfile(profile: HapticProfile): void;
}
```

### 9.3 Priority rules

| Priority | Events | Behavior |
| --- | --- | --- |
| safety | `softSignal`, `emergencyStop`, `consentRevokedLocal` | Cancel current; play immediately |
| normal | confirmations, consent, link | Queue up to 1; drop if safety arrives |
| low | `nearbyAware`, presence | Drop if anything else playing or cooldown |

### 9.4 Safety ordering (mandatory)

```text
1. Accept Soft Signal input
2. Commit session → ended_soft_signal (or equivalent)
3. Update UI / peers / radio teardown per product rules
4. HapticSemantic.play("softSignal")  // fire-and-forget
```

Playback failure is logged only in dev builds without PII.

### 9.5 Pattern library file (device firmware)

Suggested `patterns/soft_edge_v1.json`:

```json
{
  "version": 1,
  "personality": "soft_edge",
  "events": {
    "softSignal": { "ref": "curtainClose", "priority": "safety" },
    "confirmation": { "ref": "softKnock", "priority": "normal" }
  }
}
```

Cal tables live outside app binary for factory tuning without resubmitting app logic when possible.

---

## 10. Validation and test plan

### 10.1 Bench (engineering)

| Test | Pass criteria |
| --- | --- |
| Soft Signal latency | p95 ≤ 30 ms first motion |
| Preempt | Soft Signal cancels confirmation mid-play within 10 ms command |
| Thermal | 50 Soft Signals / 5 min no fault; intensity within ±15% |
| Power | Average Soft Signal energy within budget |
| Mount ring | Spectrogram decay OK; no > 100 ms audible buzz |

### 10.2 Perceptual (human)

Minimum 8 adults including sensory-sensitive / ND self-ID if available (ethics: informed, stop anytime):

1. Forced-choice labeling of 5 core events after one training pass  
2. Comfort Likert; flag “alarming,” “ticklish,” “sexualized,” “angry”  
3. Soft Signal eyes-closed recognizability  
4. Quiet profile acceptability  
5. Confusion Soft Signal vs mutual seal  

**Fail** if Soft Signal is reported as “alarm/danger” by majority — redesign toward firmer-but-warmer curtain, not louder buzz.

### 10.3 Safety regression

- Soft Signal with haptics off  
- Soft Signal with actuator fault injection  
- Rapid multi-press  
- Soft Signal during nearbyAware cooldown  
- Mutual seal blocked + no false seal haptic  

### 10.4 Phone parity

Phone Expo mapping remains the degraded subset; do not require VCA on iPhone. Device patterns should remain *recognizable* when simplified to phone impacts.

---

## 11. Implementation phases

| Phase | Deliverable | Gate |
| --- | --- | --- |
| **H0** | This design + ADR 0057 | Docs accepted |
| **H1** | Phone semantic service already in progress (HAPTIC-001) | Five events live |
| **H2** | Desktop simulator: waveform graphs + audio proxy of VCA/LRA | Design review |
| **H3** | Dev board: dual actuator + Soft Signal button latency | Bench pass |
| **H4** | Soft Edge v1 pattern pack + user study | Perceptual pass |
| **H5** | Integrate with device session FSM / NFC / proximity | Fail-closed review |
| **H6** | Factory cal + profile storage | Production readiness (future) |

Hardware manufacturing is **out of current private-alpha critical path**. Phone demo remains the real shipping surface.

---

## 12. Abuse, limits, unresolved risks

| Risk | Mitigation |
| --- | --- |
| Soft Signal feels like alarm → panic | Curtain metaphor; study gate; no escalating siren |
| Mutual seal haptic over-trusted as “safe person” | Copy + intensity; never “success fanfare” |
| NearbyAware used for stalking pressure | Rate limit; opt-in radio; easy off |
| Partner forces “haptics on” | Local-only preference; not remotely settable |
| Sexualized interpretation of warm bloom | Avoid low-frequency long rumbles; keep short; user study language check |
| Actuator failure | Fail silent; stop still works |

---

## 13. Documentation ownership

| Doc | Role |
| --- | --- |
| **This file** | Device haptic system authority |
| `adr/0057-…` | Actuator architecture decision |
| `adr/0039-…` + phone plan | Mobile semantic haptics |
| `CONSENT_FLOW.md` | When consent events may fire |
| `PROXIMITY_LAYER.md` / `NFC_FEATURES.md` | Connection event gates |
| Website `/litmo#hardware` | Product vision language only |

---

## 14. Quick reference card

```text
Soft Signal:     BOTH · curtainClose · ≤280 ms · preempt · after state commit
Local confirm:   LRA softKnock
Attention:       doubleBell
Mutual seal:     softKnock + breath — only if engine says mutual
Nearby:          whisper breath · rate limited · never consent
Emergency:       L5 firm · still not a siren · after state commit
Off:             silence; safety UI remains complete
```

**Tagline for the tactile system:**  
*Warm enough to invite presence. Clear enough to end it.*
