# Litmo Dedicated Hardware — Haptic System

**Status:** design specification (hardware vision — not a shipping SKU)  
**Version:** 3.0 · 2026-07-13  
**Canonical path:** `docs/HARDWARE/HAPTICS.md`  
**Related:** [ADR 0057](../adr/0057-device-haptic-vca-lra-architecture.md) · [Phone haptics](../roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md) · [ADR 0039](../adr/0039-semantic-haptic-language.md) · [Consent flow](../CONSENT_FLOW.md) · [Neurodivergent mode](../NEURODIVERGENT_MODE.md) · UX philosophy

> Litmo does not buzz at people.  
> It **answers** them — warmly, sparsely, and in a way a sensitive nervous system can refuse, reduce, or replace with vision at any moment.  
> Soft Signal must say: *you stopped — you are free* — never *danger* or *you failed*.  
> **If haptics are off, the meaning still lands** — through calm, beautiful, unmistakable visuals (and optional sound).

This document is the **authoritative** specification for the dedicated Litmo companion’s tactile + multi-modal feedback system:

- Tech stack (wideband VCM primary, LRA secondary, device-wide warm field)  
- Philosophy (caring, never jarring)  
- **Every pattern:** Primary haptic · Gentle / Sensory-Friendly haptic · **Full Visual Fallback** · optional sound  
- Global accessibility controls  
- Waveforms, visual design specs, rationale, validation  

---

## 1. Goals

| Goal | Meaning |
| --- | --- |
| **Warm** | Mid–low body energy, rounded envelopes, palm-coupled “alive” feel |
| **Emotionally safe** | Never jarring, shaming, punishing, sexualized, or alarm-like |
| **High-fidelity** | Wideband VCM primary; LRA only for soft crisp accents |
| **ND / sensory-first** | Gentle Mode + **full visual fallback** on every pattern; one-tap Sensory-Friendly; full disable |
| **Alive device-wide** | Distributed actuation — coherent soft-edged body, not corner rattle |
| **Honest** | Haptics never fake mutual consent, partner emotion, or another person’s safety |
| **Vision is not secondary** | Visual fallbacks are designed as first-class experiences, not grey error states |

### 1.1 Non-goals

- Engagement, streaks, FOMO, “nudge again”  
- Secret inter-device haptic codes or fake human touch  
- Soft Signal delayed by haptic or animation playback (state commits first)  
- Sensitive telemetry of Soft Signal / consent moments  
- ERM-primary Soft Signal  
- Meaning that only exists in vibration  

---

## 2. Core philosophy

### 2.1 Caring and safe by default

| Principle | Implementation |
| --- | --- |
| **Answer, don’t demand** | Acknowledge local state; do not harass for attention |
| **Silence is default** | Most UI taps produce no haptic |
| **Soft Signal is freedom** | Long descending warm pulse — release, not siren |
| **Gentle is first-class** | Every pattern has Gentle haptic mode |
| **Visual is first-class** | Every pattern has a **full Visual Fallback** (always available; automatic when haptics off/failed) |
| **One-tap calm** | Sensory-Friendly Mode reachable from anywhere |
| **Opt all the way down** | Intensity, per-pattern presets, complete disable |
| **Fail kind** | Actuator fault → visual fallback; Soft Signal still ends session |

### 2.2 Multi-modal stack (required per event)

```text
┌─────────────────────────────────────────────────────────┐
│  MEANING (semantic event)                               │
│    e.g. softSignal, connectionRequest, mutualConsent    │
└─────────────────────────────────────────────────────────┘
           │
           ├─► Haptic Primary     (Default profile)
           ├─► Haptic Gentle      (Sensory-Friendly / per-pattern Gentle)
           ├─► Visual Fallback    (ALWAYS designed; auto when haptics off,
           │                        preset=visual_only, or actuator fail)
           └─► Sound Optional     (user opt-in; default off in Sensory-Friendly)
```

**Rule:** Product meaning must be complete with **visual alone**. Haptics and sound only reinforce.

### 2.3 Emotional intelligence checks

1. **Whose action?** No “success” feel for peer-only or ambiguous states.  
2. **Feeling after?** Grounded, free, complete — not dopamine, shame, panic.  
3. **Worst day?** Gentle haptic + calm visual both acceptable when overloaded.  
4. **Can silence hold it?** Prefer silence for non-critical UI.  
5. **Soft Signal still the clearest “end”?** Visually and haptically.  

### 2.4 Visual design language (all fallbacks)

| Do | Don’t |
| --- | --- |
| Warm cream / amber / soft rose tones | Aggressive red emergency (except true emergency path, still calm) |
| Slow breathing motion (≈ 4–6 s cycle where looping) | Fast strobe, seizure-risk flash rates |
| Large, legible type; clear verbs | Cryptic icons alone |
| Respect reduced motion → crossfade / opacity only | Forced large motion when reduced-motion is on |
| Soft edges, rounded geometry matching hardware | Harsh chrome, glitch, game HUD |

**Reduced motion:** All looping “breathing” animations become **static emphasis + one soft crossfade**. Meaning text remains.

### 2.5 Tagline

*Warm enough to feel alive. Gentle enough for a sensitive day. Clear enough to end safely — even in silence.*

---

## 3. Technology stack

### 3.1 Actuators

| Role | Technology | Job |
| --- | --- | --- |
| **Primary** | **High-fidelity wideband Voice Coil Motor (VCM / VCA)** | Warm body, descent, breath, ambient throb, “alive” field |
| **Secondary** | **LRA** | Soft-edged crisp accents only (often **off** in Gentle) |

**Rationale:** Warmth and long smooth fades need broadband VCM. LRA alone reads cold/tech. Soft Signal character is **VCM descent**, not LRA slap.

**Forbidden as Soft Signal primary:** ERM.

### 3.2 Device-wide distributed haptics

| Element | Spec |
| --- | --- |
| Primary VCM | Palm coupling under soft-touch shell |
| Optional multi-module | Left/right or edge channels **in phase** for whole-body field |
| LRA | Near Soft Signal control (Full profile accent only) |
| Isolation | Soft mounts; no shell chatter; ring ≤ 40 ms after zero |
| Phase | v1 mono field preferred |

**“Alive” criteria:** slow envelopes, optional gentle frequency glide, smooth fade to zero — energy feels absorbed into the object.

### 3.3 Drive targets

| Item | Spec |
| --- | --- |
| VCM stream | ≥ 8 kHz, soft-start current limit |
| Soft Signal first motion | **≤ 30 ms** p95 after accept |
| Routine UI | ≤ 50 ms p95 |
| Continuous watchdog | Abort > **1200 ms** continuous (Soft Signal long fade is max intentional) |
| Hardware mute | Factory + user software off |

### 3.4 Mix: Full vs Gentle

| Pattern family | Full (Primary) | Gentle |
| --- | --- | --- |
| Soft Signal | VCM long descent; optional soft LRA onset | VCM only, very low amp, slower fade |
| Connection | VCM rising soft throbs | Single slow VCM throb |
| Mutual consent | VCM double-pulse; micro LRA optional | One extended VCM pulse |
| Positive | VCM glow + soft LRA click | Micro VCM only |
| Nearby | VCM ambient throb | Micro VCM or haptic off → visual |

---

## 4. Global accessibility

### 4.1 Sensory-Friendly Mode (one-tap from anywhere)

| Property | Spec |
| --- | --- |
| **Access** | **One tap** from: session chrome, system sheet, hardware quiet button (if present), and Settings |
| **Effect** | All patterns → **Gentle** haptics; lower intensity ceiling; prefer VCM-only; sound defaults off unless user enabled |
| **Visual** | Full Visual Fallbacks remain active and may be **slightly stronger** when Sensory-Friendly is on (vision carries more) |
| **Persistence** | Device-local; not remotely controllable |
| **ND Mode** | Enabling Neurodivergent Mode **suggests** Sensory-Friendly (user can decline) |

### 4.2 Customization

| Control | Spec |
| --- | --- |
| Master haptics | On / Off |
| Global intensity | 0–100% (safe clamp) |
| Per-pattern preset | **Full** · **Gentle** · **Visual only** · **Off** (Off = no haptic; visual still runs) |
| Sound | Global opt-in; per-event optional |
| Reduced motion | System + in-app; calms visual motion |
| Soft Signal visual always | Cannot fully “off” Soft Signal **meaning** — only haptic/sound layers |

**Note:** Pattern preset **Off** still shows Visual Fallback for safety-critical and consent-critical events. “Off” never means silent Soft Signal with no UI.

### 4.3 Automatic visual fallback

Visual Fallback **always runs** in parallel when:

| Condition | Behavior |
| --- | --- |
| Master haptics off | Visual only (+ optional sound) |
| Per-pattern Visual only / Off | Visual only |
| Sensory-Friendly + Gentle too subtle for user preference | Visual primary emphasis |
| Actuator fault / timeout | Visual only; no retry spam |
| Full + Gentle haptics on | Visual **may** run softer companion motion (not competing) — for Soft Signal, visual **always** appears |

**Soft Signal special rule:** Visual Soft Signal **always** displays when Soft Signal fires, even if Primary haptic plays — so meaning is never haptic-only.

### 4.4 Vibe / sensory suggestions

Suggest Sensory-Friendly, low intensity, or visual-heavy nearby — **confirm before apply**. Never re-enable haptics after user chose Off. Not clinical.

---

## 5. Pattern library

Every pattern includes:

1. **Primary haptic** (waveform)  
2. **Gentle Mode haptic**  
3. **Full Visual Fallback** (layout, motion, copy, reduced-motion variant)  
4. **Optional sound**  
5. **Rationale**  
6. **Must not mean**  

Relative intensity seeds 0–1; calibrate on hardware.

---

### 5.1 Soft Signal (most critical)

| Layer | Spec |
| --- | --- |
| **Emotional intent** | *I stopped. It stopped. I am free.* |
| **Primary haptic** | Long, smooth **descending warm pulse** that gently fades |
| **Gentle haptic** | Extremely subtle, slow, low-amplitude fade |
| **Visual Fallback** | Large calm **pulsing border** + gentle **screen fade** to soft color + clear text **“Session ended via Soft Signal”** with **breathing** animation |
| **Must not** | Alarm, error, shame, red panic, third “alert” beat |

#### Haptic — Primary `softSignal.primary` (“warm descent”)

```text
Intent: Freedom through release — energy leaves the hand.

t = 0 ms
  - Preempt all other haptics
  - Optional Full-only: LRA soft onset  int 0.25  sharp ≤ 0.30  dur 12 ms
  - VCM ~72–78 Hz, soft attack 40–60 ms to peak int 0.55–0.70

t = 40–120 ms
  - Brief near-peak hold (≤ 80 ms) — “registered”

t = 120–800 ms
  - Smooth descending amplitude (ease-out cubic / exponential)
  - Optional frequency glide 75 → 52 Hz
  - No end slap

t = end
  - Clean zero; mechanical ring ≤ 40 ms
```

#### Haptic — Gentle `softSignal.gentle` (“breath leave”)

```text
t = 0        VCM only; peak ≤ 0.22
t = 0–100    Soft attack
t = 100–900  Slow descending fade; f ≈ 58–65 Hz
t = end      Silence (visual already shows ended)
```

#### Visual Fallback — Soft Signal (always on Soft Signal fire)

| Element | Spec |
| --- | --- |
| **Border** | Full-viewport inset border (or device bezel glow), **large**, warm cream/amber; opacity pulses calmly ~0.35↔0.75 |
| **Breathing rate** | ~5 s full cycle (or 4–6 s); ease-in-out; never strobe |
| **Screen field** | Gentle fade of background toward soft color (e.g. warm cream `#F6EFE2` / soft rose-cream — **not** emergency red) |
| **Typography** | Large, calm: **“Session ended via Soft Signal”** |
| **Subcopy** | “You can stop. You don’t need a reason.” (or equivalent constitution-aligned) |
| **Iconography** | Optional simple Soft Signal mark; never skull/warning triangle |
| **Duration** | Enter within 100 ms of commit; hold readable ≥ 2 s; user can dismiss to wrap-up |
| **Reduced motion** | No continuous pulse: single soft border + static soft field + full text; one crossfade in |
| **Contrast** | WCAG-minded large text on soft field; test light/dark shells |

**Timing with safety:**

```text
1. Accept Soft Signal (short press; no long-press trap)
2. Commit session → ended_soft_signal
3. Show Visual Fallback immediately (mandatory)
4. Play haptic Primary/Gentle fire-and-forget
5. Optional sound if enabled
```

#### Optional sound

Soft descending low chime (~400–600 ms), never alarm klaxon. Default **off** in Sensory-Friendly.

#### Rationale

Descending VCM = release. Visual border + breath + explicit sentence guarantees ND/sensory users and haptics-off users get the same **freedom** message. Soft color avoids trauma-coded “you did something wrong.”

---

### 5.2 Connection request

| Layer | Spec |
| --- | --- |
| **Emotional intent** | *Something careful arrived; you may choose.* |
| **Primary haptic** | Gentle **rising** heartbeat-like rhythm (2–3 soft throbs) |
| **Gentle haptic** | Single slow, very low-amplitude warm throb |
| **Visual Fallback** | Warm **glowing pulse around the contact card** + subtle **breathing** + soft **notification banner** |
| **Must not** | Romance pressure, sexualized pound, looping heart while waiting, escalating intensity |

#### Haptic — Primary `connectionRequest.primary`

```text
2–3 soft VCM throbs; amplitude rises slightly (e.g. 0.28 → 0.34 → 0.40)
  each: attack 30, sustain 40, release 70; gap 90–110 ms; f ≈ 60–70 Hz
Play once per invite; never loop
```

#### Haptic — Gentle `connectionRequest.gentle`

```text
Single VCM throb: attack 50, sustain 60, release 120, int ≤ 0.18, f ≈ 58 Hz
```

#### Visual Fallback — Connection request

| Element | Spec |
| --- | --- |
| **Contact card** | Soft warm glow along card edge; pulse opacity / outer glow radius slowly |
| **Breathing** | Glow breathe ~5 s cycle; reduced motion → static warm rim + one fade-in |
| **Banner** | Soft top/bottom notification: e.g. “Careful connect request” + Accept / Decline / Not now |
| **Color** | Amber-soft / cream glow — not urgent red |
| **Persistence** | Until user acts or request expires; no increasingly aggressive animation |

#### Optional sound

Soft double-tap wood tone, once. No repeat.

#### Rationale

Organic rhythm without demand. Visual card glow keeps choice in context; banner aids Attention / VoiceOver.

**Coercion rule:** Never speed up pulse or brighten indefinitely if ignored.

---

### 5.3 Mutual consent confirmed

| Layer | Spec |
| --- | --- |
| **Emotional intent** | *Both of you affirmed the same map — for this session.* |
| **Primary haptic** | Soft **synchronized double-pulse** |
| **Gentle haptic** | One extended, very gentle confirmation pulse |
| **Visual Fallback** | Beautiful **expanding ripple** + warm color flash + **affirming text animation** |
| **Must not** | “This person is safe,” fireworks engagement, fake mutual |

#### Haptic — Primary `mutualConsent.primary`

```text
Pulse A: VCM int 0.35, attack 25, release 80, f ~65 Hz
Silence 70–90 ms
Pulse B: VCM int 0.38, attack 25, release 90  (equal, not escalating)
Optional micro LRA ≤ 0.22 sharp ≤ 0.28 with each pulse (Full only)
```

#### Haptic — Gentle `mutualConsent.gentle`

```text
One extended VCM: attack 40, sustain 50, release 160, int ≤ 0.20
```

#### Visual Fallback — Mutual consent

| Element | Spec |
| --- | --- |
| **Ripple** | Soft expanding circular ripple from center (or between two soft nodes representing “both”); 1–2 waves max; ease-out |
| **Warm flash** | Brief warm color wash (cream/amber) peaking ≤ 200 ms then settling — **not** strobe |
| **Text** | Affirming animation: e.g. “Consent Snapshot sealed” / “You both affirmed this map” |
| **Subcopy** | “This is not a guarantee of safety. Soft Signal is always available.” |
| **Reduced motion** | No multi-ripple: single opacity fade + static seal mark + full text |
| **Gate** | Only if consent engine reports mutual seal |

#### Optional sound

Two soft equal notes (not fanfare).

#### Rationale

Double-pulse = two sides. Visual ripple + humble copy prevents over-trust.

**EmotionalGuard:** Refuse event if not mutually sealed.

---

### 5.4 Positive feedback (local confirmation)

| Layer | Spec |
| --- | --- |
| **Emotional intent** | *Your local action registered.* |
| **Primary haptic** | Pleasant **rising click/glow** |
| **Gentle haptic** | Barely noticeable warm micro-pulse |
| **Visual Fallback** | Soft **checkmark** with **expanding glow** + gentle **particle burst** (calm, sparse) |
| **Must not** | Peer agreement, streak, addictive reward |

#### Haptic — Primary `positiveFeedback.primary`

```text
VCM rising glow: f 55→70 Hz, attack 20, release 60, peak int 0.32
Optional LRA soft click: int 0.30 sharp 0.28 dur 14 at onset
```

#### Haptic — Gentle `positiveFeedback.gentle`

```text
VCM micro-pulse int ≤ 0.12, total < 80 ms
```

#### Visual Fallback — Positive feedback

| Element | Spec |
| --- | --- |
| **Checkmark** | Soft rounded check; scale 0.92→1.0 ease-out |
| **Expanding glow** | Soft circular glow under icon, expands and fades ~300–450 ms |
| **Particles** | Sparse, slow, warm particles (≤ 12); optional; **off** under reduced motion / Sensory-Friendly optional density reduction |
| **Context** | Adjacent to the control that was saved/confirmed |
| **Reduced motion** | Static check + single opacity flash, no particles |

#### Optional sound

Single soft tick.

#### Rationale

Local only. Particles stay gentle — never confetti casino.

---

### 5.5 Nearby / incoming notification

| Layer | Spec |
| --- | --- |
| **Emotional intent** | *Optional awareness — no demand.* |
| **Primary haptic** | Light **ambient throb** |
| **Gentle haptic** | Extremely subtle single pulse |
| **Visual Fallback** | Soft **ambient glow on screen edge** + optional **subtle floating indicator** |
| **Must not** | Stalking pressure, continuous field, consent |

#### Haptic — Primary `nearby.primary`

```text
VCM ambient: attack 40, sustain 50, release 120, int 0.22, f ~60 Hz
Max 1 / 30 s; never during Soft Signal; radio off → never
```

#### Haptic — Gentle `nearby.gentle`

```text
VCM int ≤ 0.10, total < 100 ms
```

#### Visual Fallback — Nearby / incoming

| Element | Spec |
| --- | --- |
| **Edge glow** | Soft ambient light along one screen edge (or bezel); low contrast; slow breathe or static under reduced motion |
| **Floating indicator** | Optional small soft orb/dot near radar/nearby UI; does not chase the eye |
| **Copy** | If banner used: calm “Someone nearby (opt-in radar)” — never “Match waiting!” |
| **Sensory-Friendly default** | Prefer edge glow static + no haptic for nearby |

#### Optional sound

Single soft tick, rare; default off in Sensory-Friendly.

#### Rationale

Ambient, not alarm. Visual edge glow works when pocketed device is glanced at later.

---

### 5.6 Additional events (same three-layer rule)

| Event | Primary haptic | Gentle | Visual Fallback (summary) |
| --- | --- | --- | --- |
| `presence` | Soft breath-in VCM | Micro breath / none | Soft screen settle / dim glow |
| `attention` | Soft double glow | Single micro | Soft highlight ring on focus target |
| `consentLocalAffirm` | Positive family | Gentle positive | Check + “You affirmed (waiting for them)” |
| `consentRevokedLocal` | Short warm descent | Micro descent | Calm banner “You withdrew consent” |
| `linkFailed` | Soft muted tick | None | Plain fail UI, no panic red |
| `emergencyStop` | Firmer descent (still not siren) | Soft Signal Gentle | Soft Signal visual family + “Emergency stop registered” |
| `softSignalRemoteEnded` | Softer descent | Micro / none | “Session ended” calm state — never blame |

---

## 6. Semantic map & priority

| Event | Pattern family | Priority | Visual always? |
| --- | --- | --- | --- |
| `softSignal` | Soft Signal | safety | **Yes** |
| `emergencyStop` | Emergency descent | safety | **Yes** |
| `consentRevokedLocal` | Short descent | safety | **Yes** |
| `connectionRequest` / careful tap | Connection request | normal | **Yes** when invite visible |
| `consentMutualSealed` | Mutual consent | normal | **Yes** |
| `confirmation` | Positive feedback | normal | Soft companion OK |
| `nearbyAware` | Nearby | low | Edge glow preferred |

---

## 7. Software architecture

### 7.1 Layers

```text
Session / consent / proximity FSMs
  → FeedbackSemantic.emit(event)
      → EmotionalGuard
          → ModeResolver (Sensory-Friendly, presets, intensity, reduced motion)
              ├─► HapticBank  (primary | gentle | none)
              ├─► VisualBank  (always select variant; density by mode)
              └─► SoundBank   (optional)
```

### 7.2 Interface sketch

```ts
export type FeedbackEvent =
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

export interface FeedbackUserSettings {
  masterHapticsEnabled: boolean;
  sensoryFriendlyMode: boolean; // one-tap global
  globalIntensity: number; // 0..1
  patternPresets: Partial<Record<FeedbackEvent, PatternPreset>>;
  soundEnabled: boolean;
  reducedMotion: boolean | "system";
  acceptCalmDefaultsFromVibe: boolean;
}

export interface FeedbackService {
  /** Commits no safety state — callers commit first for Soft Signal. */
  emit(event: FeedbackEvent, opts?: { source: string }): Promise<void>;
  cancelHaptics(): void;
  getSettings(): FeedbackUserSettings;
  setSettings(patch: Partial<FeedbackUserSettings>): void;
  /** Opens Sensory-Friendly in one action (from anywhere). */
  enableSensoryFriendlyMode(): void;
}
```

### 7.3 Soft Signal ordering

```text
accept → commit ended_soft_signal → Visual Soft Signal (mandatory)
       → haptic fire-and-forget → optional sound
```

### 7.4 Pattern / visual bank files

```text
firmware/patterns/soft_edge_v3.json     # haptic primary/gentle
app/feedback/visual/soft_edge_v3.ts     # visual fallback components + tokens
app/feedback/sound/soft_edge_v3.json    # optional
```

---

## 8. Design tokens (visual fallback examples)

Suggested product tokens (align with site cream/amber language):

| Token | Example | Use |
| --- | --- | --- |
| `--feedback-warm-field` | `#F6EFE2` | Soft Signal field |
| `--feedback-warm-border` | `#B5602C` @ 40–70% | Pulsing border |
| `--feedback-glow` | `#D68A52` soft | Card / positive glow |
| `--feedback-text` | ink on cream | Primary sentences |
| `--feedback-breath-ms` | `5000` | Default breathe cycle |
| `--feedback-motion-ease` | cubic-bezier soft | All feedback motion |

---

## 9. Validation

### 9.1 Bench (haptic)

| Test | Pass |
| --- | --- |
| Soft Signal first motion | ≤ 30 ms p95 |
| Descent smoothness | Continuous amplitude fall; no hard steps |
| Gentle peak | ≤ cap; fixture-measurable |
| Preempt | Soft Signal cancels lower patterns |
| Ring | ≤ 40 ms after zero |

### 9.2 Visual / a11y

| Test | Pass |
| --- | --- |
| Soft Signal haptics off | Full visual + text alone; session ended correctly |
| Sensory-Friendly one-tap | ≤ 1 action from session UI |
| Reduced motion | No continuous pulse; text complete |
| Contrast | Soft Signal sentence readable |
| Photosensitive | No flash > 3 Hz; Soft Signal breathe ≤ 0.25 Hz |

### 9.3 Sensory & emotional study

Include ND / sensory-sensitive opt-in participants:

1. Soft Signal → “free / stopped / done” not “alarm”  
2. Visual Soft Signal alone sufficient  
3. Connection heart not sexual/coercive  
4. Mutual seal not “safe person”  
5. Particle density not overwhelming in Full  

**Hard fail:** Soft Signal Primary mostly labeled danger → lower peak / longer fade / warmer visual, not louder.

---

## 10. Implementation phases

| Phase | Deliverable |
| --- | --- |
| **H0** | This v3 spec |
| **H1** | Phone semantic haptics (existing) |
| **H2** | Visual fallback components (RN/device UI) for Soft Signal first |
| **H3** | VCM bench + warm descent |
| **H4** | Gentle pack + Sensory-Friendly one-tap |
| **H5** | Full pattern set + visual banks + vibe suggestions |
| **H6** | Distributed multi-actuator (if multi-module) |

Not private-alpha blocking. Phone remains real surface until hardware ships.

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Long Soft Signal missed | Mandatory visual; optional sound; self-test |
| Soft Signal as alarm | Descent character; soft color field; study gate |
| Heartbeat misread | Soft non-loop; Gentle single; copy |
| Particles overwhelm | Sparse; off under reduced motion / optional SF |
| Visual distraction mid-session | Soft Signal full-screen only on end; connection scoped to card |
| Auto suggestions pushy | Confirm; never re-enable after Off |

---

## 12. Documentation ownership

| Doc | Role |
| --- | --- |
| **`docs/HARDWARE/HAPTICS.md`** | **Canonical** multi-modal haptic + visual system |
| `docs/HAPTIC_SYSTEM_DEVICE.md` | Pointer |
| ADR 0057 | VCM + LRA architecture |
| ADR 0039 / phone plan | Mobile subset |
| Website `/litmo#hardware` | Vision only |

---

## 13. Quick reference

```text
Stack:     Wideband VCM primary · LRA accents · distributed warm field
Layers:    Primary haptic · Gentle haptic · Full Visual Fallback · optional sound
SF Mode:   One-tap · all Gentle · vision carries more
Soft Signal: descending warm pulse · Gentle breath-fade
             Visual: pulsing border + soft field + “Session ended via Soft Signal” + breath
Connection: rising soft heart · Gentle one throb
             Visual: card glow + breath + banner
Mutual:     double pulse · Gentle one pulse · sealed only
             Visual: ripple + warm flash + affirming text
Positive:   rising click/glow · Gentle micro
             Visual: check + glow + sparse particles
Nearby:     ambient throb · Gentle micro
             Visual: edge glow + optional float
Off:        haptics silent · visuals still complete for critical meaning
```

**Tagline:**  
*Warm enough to feel alive. Gentle enough for a sensitive day. Clear enough to end safely — even in silence.*
