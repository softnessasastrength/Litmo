# Litmo Dedicated Hardware — Haptic System

**Status:** design specification (hardware vision — not a shipping SKU)  
**Version:** 4.0 · 2026-07-13  
**Canonical path:** `docs/HARDWARE/HAPTICS.md`  
**Related:** [ADR 0057](../adr/0057-device-haptic-vca-lra-architecture.md) · [Phone haptics](../roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md) · [ADR 0039](../adr/0039-semantic-haptic-language.md) · [Consent flow](../CONSENT_FLOW.md) · [Neurodivergent mode](../NEURODIVERGENT_MODE.md) · [Data classification](../DATA_CLASSIFICATION.md)

> Litmo does not buzz at people.  
> It **answers** them — warmly, sparsely, and in a way a sensitive nervous system can refuse, reduce, or replace with vision at any moment.  
> Soft Signal must say: *you stopped — you are free* — never *danger* or *you failed*.  
> **If haptics are off, the meaning still lands** — through calm, beautiful, unmistakable visuals (and optional sound).

This document is the **authoritative** multi-modal feedback specification for the dedicated Litmo companion:

- Tech stack (wideband VCM primary, LRA secondary, device-wide warm field)  
- Philosophy (caring, never jarring)  
- **Haptic controls** (global + per-pattern intensity sliders, Sensory-Friendly Mode)  
- **Persistence & profile sync** (sessions + Touch Language–adjacent sensory preferences)  
- **Every pattern:** Primary · Gentle · Full Visual Fallback · optional sound  
- Waveforms, slider math, visual specs, rationale, validation  

---

## 1. Goals

| Goal | Meaning |
| --- | --- |
| **Warm** | Mid–low body energy, rounded envelopes, palm-coupled “alive” feel |
| **Emotionally safe** | Never jarring, shaming, punishing, sexualized, or alarm-like |
| **High-fidelity** | Wideband VCM primary; LRA soft crisp accents only |
| **ND / sensory-first** | Gentle Mode + full Visual Fallback; one-tap Sensory-Friendly; intensity under user control |
| **Alive device-wide** | Distributed actuation — coherent soft body, not corner rattle |
| **User-owned intensity** | Global 0–100% slider; optional per-pattern advanced sliders; persists and restores |
| **Honest** | Haptics never fake mutual consent or another person’s safety |

### 1.1 Non-goals

- Engagement, streaks, FOMO, “nudge again”  
- Secret inter-device codes or fake human touch  
- Soft Signal delayed by haptic/animation (state commits first)  
- Sensitive analytics of Soft Signal / consent moments  
- ERM-primary Soft Signal  
- Partner-visible or partner-controllable haptic settings  
- Conflating haptic intensity with **consent boundaries** (body zones remain separate)  

---

## 2. Core philosophy

### 2.1 Caring and safe by default

| Principle | Implementation |
| --- | --- |
| **Answer, don’t demand** | Acknowledge local state; no harassment loops |
| **Silence is default** | Most taps produce no haptic |
| **Soft Signal is freedom** | Long descending warm pulse — release, not siren |
| **Gentle is first-class** | Every pattern has Gentle haptic |
| **Visual is first-class** | Every pattern has Full Visual Fallback |
| **Intensity is owned** | Global + optional per-pattern sliders; Sensory-Friendly auto-scales down |
| **One-tap calm** | Sensory-Friendly Mode from anywhere |
| **Fail kind** | Actuator fault → visual; Soft Signal still ends session |

### 2.2 Multi-modal stack (required)

```text
MEANING (semantic event)
  ├─ Haptic Primary     × effectiveIntensity
  ├─ Haptic Gentle      × effectiveIntensity   (Sensory-Friendly / preset)
  ├─ Visual Fallback    (always designed; auto when haptics off / fault / visual-only)
  └─ Sound Optional     (user opt-in)
```

**Rule:** Meaning is complete with **visual alone**. Soft Signal visual **always** fires when Soft Signal commits.

### 2.3 Emotional intelligence checks

1. Whose action? No success for peer-only / ambiguous states.  
2. Feeling after? Free, grounded — not shame or panic.  
3. Worst day? Gentle + calm visual both OK when overloaded.  
4. Can silence hold it? Prefer silence for non-critical UI.  
5. Soft Signal still clearest “end” (haptic + visual)?  

### 2.4 Tagline

*Warm enough to feel alive. Gentle enough for a sensitive day. Clear enough to end safely — even in silence.*

---

## 3. Technology stack

### 3.1 Actuators

| Role | Technology | Job |
| --- | --- | --- |
| **Primary** | **High-fidelity wideband Voice Coil Motor (VCM / VCA)** | Warm body, descent, breath, ambient, “alive” field |
| **Secondary** | **LRA** | Soft-edged crisp accents (often off in Gentle) |

**Rationale:** Long warm fades need broadband VCM. LRA alone reads cold/tech.

**Forbidden as Soft Signal primary:** ERM.

### 3.2 Device-wide distributed haptics

| Element | Spec |
| --- | --- |
| Primary VCM | Palm coupling under soft-touch shell |
| Optional multi-module | In-phase channels for whole-body field |
| LRA | Near Soft Signal control (Full accent only) |
| Isolation | Soft mounts; ring ≤ 40 ms after zero |
| Phase | v1 mono field preferred |

### 3.3 Drive targets

| Item | Spec |
| --- | --- |
| VCM stream | ≥ 8 kHz, soft-start |
| Soft Signal first motion | **≤ 30 ms** p95 after accept |
| Routine UI | ≤ 50 ms p95 |
| Continuous watchdog | Abort > **1200 ms** continuous |
| Hardware mute | Factory + software off |

### 3.4 Full vs Gentle actuator mix

| Family | Full (Primary) | Gentle |
| --- | --- | --- |
| Soft Signal | VCM long descent; optional soft LRA onset | VCM only, very low amp, slower fade |
| Connection | VCM rising soft throbs | Single slow VCM throb |
| Mutual consent | VCM double-pulse; micro LRA optional | One extended VCM pulse |
| Positive | VCM glow + soft LRA click | Micro VCM only |
| Nearby | VCM ambient throb | Micro VCM or haptic off → visual |

---

## 4. Haptic controls (sliders & modes)

### 4.1 Control surface map

| Control | Where | Required |
| --- | --- | --- |
| **Global Haptic Intensity** 0–100% | Settings · **Quick menu** (session / system sheet) | **Yes** |
| **Master haptics On/Off** | Settings · Quick menu | **Yes** |
| **Sensory-Friendly Mode** | **One-tap** from anywhere + Settings | **Yes** |
| **Per-pattern intensity** 0–100% | Settings → Advanced haptics | Optional advanced |
| **Per-pattern mode** Full / Gentle / Visual only / Off | Settings → Advanced | Recommended |
| **Sound opt-in** | Settings | Yes |
| **Reduced motion** | System + in-app | Yes |

Quick menu must expose at minimum: **Sensory-Friendly**, **Master on/off**, **Global intensity slider** — without opening full Settings.

### 4.2 Global Haptic Intensity Slider (0–100%)

| Property | Spec |
| --- | --- |
| **Range** | Integer 0–100 (UI); internal `globalIntensity ∈ [0, 1]` |
| **Meaning** | Scales **all** haptic pattern peaks and LRA accents (after mode selection) |
| **0%** | Equivalent to no haptic energy; Visual Fallbacks remain; recommend pairing with clear “haptics silent” label — Soft Signal still ends session |
| **100%** | Pattern seed peaks (hardware-safe max; firmware clamps) |
| **Default** | 60% (warm but not aggressive); Sensory-Friendly may lower (see §4.4) |
| **Access** | Settings + quick menu; large touch target; live preview optional via “Test Soft Signal (Gentle)” only on explicit tap |
| **Debounce** | Persist after 300 ms idle or on pointer-up; no write storm |
| **A11y** | Slider labelled “Haptic intensity”; value announced; step 5% for screen readers optional |

#### Implementation notes — effective intensity

```text
// 1) Choose variant
variant = SensoryFriendly || preset==gentle ? Gentle
        : preset==visual_only || preset==off || !masterEnabled ? None
        : Primary

// 2) Resolve intensity multipliers
g = globalIntensity                    // 0..1 from global slider
p = perPatternIntensity[event] ?? 1.0  // 0..1 from advanced slider (default 1)
s = sensoryFriendlyIntensityScale      // e.g. 0.45 when SF on, else 1.0
floor = softSignalFloor[event]         // optional, 0 for most; see Soft Signal

// 3) Effective peak scale (never above hardware max)
effective = clamp(g * p * s, 0, 1)
if event == softSignal && masterEnabled && variant != None:
  effective = max(effective, softSignalUserFloor * g)  // optional user floor
  // still 0 if master off or variant None

// 4) Apply to waveform peak amplitudes
drivePeak = patternSeedPeak * effective * hardwareCalGain
```

**Sensory-Friendly scale (default):** `sensoryFriendlyIntensityScale = 0.40` (config 0.30–0.50). Also forces Gentle waveforms and **favors visual emphasis** (border/glow strength +10–20% when SF on).

**Firmware clamp:** Regardless of slider, peak current/energy hard-limited for thermal and comfort.

### 4.3 Per-pattern intensity sliders (advanced mode)

| Property | Spec |
| --- | --- |
| **Location** | Settings → Haptics → Advanced |
| **Default visibility** | Collapsed / behind “Advanced” |
| **Per event** | Soft Signal, Connection request, Mutual consent, Positive feedback, Nearby, … |
| **Range** | 0–100% relative to global (multiplicative, not additive) |
| **0%** | No haptic for that family; Visual Fallback still runs for critical events |
| **Default** | 100% (inherit global only) |
| **Reset** | “Reset advanced to defaults” |
| **Rationale** | Sensory-sensitive users may want Soft Signal barely on but nearby fully visual; advanced sliders enable that without killing Soft Signal meaning (visual remains) |

```text
effective = globalIntensity * perPatternIntensity[event] * sensoryScale
```

### 4.4 Sensory-Friendly Mode (one-tap)

| Property | Spec |
| --- | --- |
| **Access** | One tap: session chrome, quick menu, hardware quiet button (if any), Settings |
| **Haptics** | Force **Gentle** waveforms for all events |
| **Intensity** | Multiply by `sensoryFriendlyIntensityScale` (~0.40); optional temporary **cap** global display at 50% while SF on (user’s stored global value preserved underneath) |
| **Visual** | **Favor visual fallbacks** — full Soft Signal visual always; nearby/connection visuals slightly stronger; positive particles reduced or off |
| **Sound** | Default off unless user previously enabled |
| **Persistence** | SF flag persists across sessions; stored with haptic preferences |
| **ND Mode** | Suggest SF when enabling Neurodivergent Mode (user can decline) |
| **Toggle off** | Restores prior global intensity and Full/Gentle presets without re-enabling master if master was off |

**Important:** Turning SF on must **not** raise intensity for anyone. Turning SF off must **not** jump to 100% — restore last non-SF global value.

### 4.5 Master disable

| Property | Spec |
| --- | --- |
| Master off | All haptics silent including Soft Signal ack |
| Soft Signal | Session ends; **mandatory Visual Fallback** + optional sound |
| Label | “Haptics off — visuals still guide you” |

### 4.6 Persistence across sessions

| Key | Storage | Scope |
| --- | --- | --- |
| `masterHapticsEnabled` | Local secure prefs + profile sync blob | User |
| `globalIntensity` | Same | User |
| `sensoryFriendlyMode` | Same | User |
| `perPatternIntensity` | Same | User |
| `perPatternPreset` | Same | User |
| `soundEnabled` | Same | User |
| `lastUpdatedAt` | Same | Conflict resolution |

**Across sessions (same device):** load on boot/app start before first feedback event.  
**Cold start default** only if never set: global 60%, SF off, master on (or ND default quiet if ND already on).

**Write rules:**

- Debounced  
- Atomic JSON blob  
- Never log Soft Signal timestamps with intensity in analytics  

### 4.7 Sync with Touch Language profile (sensory preferences, not consent)

Haptic intensity is **not** a consent boundary. Body zones, pressure, duration, and Soft Signal *product logic* stay in Touch Language / consent engines.

**Sync model:**

| Concept | Spec |
| --- | --- |
| **Association** | Haptic sensory preferences store as a **sibling preference object** on the user’s account/device profile, **linked by user id**, co-exported with “my preferences” alongside Touch Language profile metadata for backup continuity |
| **What syncs** | Intensity sliders, SF mode, master on/off, per-pattern advanced values, presets |
| **What never syncs as “Touch Language”** | Haptic settings are **not** part of Consent Snapshot, not shown to partners, not versioned as consent map |
| **Privacy class** | Low–moderate preference data (not body-zone sensitive); still **private to self**; partners cannot read or write |
| **Multi-device** | Last-write-wins by `lastUpdatedAt`; optional per-device override flag `intensityDeviceOverride` if future hardware differs |
| **Demo / offline** | Local-only; no cloud required |
| **Export** | Included in self-export under “sensory & device preferences,” not under “consent boundaries” |
| **Fail closed** | If sync fails, keep last local values; never block Soft Signal |

```text
UserProfile
  touchLanguageProfile     // consent-relevant, versioned
  sensoryDevicePreferences // haptic intensity, SF mode, visual density…
       globalIntensity
       sensoryFriendlyMode
       masterHapticsEnabled
       patterns: { softSignal: { intensity, preset }, ... }
```

**Rationale for linking near Touch Language UX:** Users already visit “how I show up in my body / nervous system” settings; placing haptic intensity next to Neurodivergent Mode and sensory options is coherent. It must never appear as a boundary others confirm.

### 4.8 Live preview safety

| Rule | Spec |
| --- | --- |
| Preview Soft Signal | Only via explicit “Feel Soft Signal (Gentle/Full)” in Settings — never on slider drag |
| Slider drag | Optional micro positiveFeedback at ≤ 20% of current effective (or none under SF) |
| No session Soft Signal | Preview never ends a real session |

---

## 5. Pattern library

Every pattern: **Primary** · **Gentle** · **Full Visual Fallback** · optional sound · rationale.

Waveform peaks are **seeds** before `effective` intensity scaling.

---

### 5.1 Soft Signal (most critical)

| Layer | Spec |
| --- | --- |
| **Intent** | *I stopped. It stopped. I am free.* |
| **Primary** | Long, smooth **descending warm pulse** that gently fades |
| **Gentle** | Extremely subtle, slow, low-amplitude fade |
| **Visual** | Large calm **pulsing border** + gentle **screen fade** + clear **“Session ended via Soft Signal”** with **breathing** animation |
| **Must not** | Alarm, error, shame, red panic |

#### Waveform — Primary `softSignal.primary`

```text
t = 0
  Preempt all haptics
  Optional Full: LRA onset int 0.25 sharp ≤ 0.30 dur 12 ms  (× effective)
  VCM ~72–78 Hz, soft attack 40–60 ms → peak seed 0.55–0.70 (× effective)

t = 40–120
  Brief hold ≤ 80 ms (“registered”)

t = 120–800
  Smooth descending amplitude (ease-out)
  Optional f glide 75 → 52 Hz
  No end slap

t = end
  Clean zero; ring ≤ 40 ms
```

#### Waveform — Gentle `softSignal.gentle`

```text
VCM only; peak seed ≤ 0.22 (× effective, further reduced by SF scale)
Soft attack 0–100 ms; slow descent 100–900 ms; f ≈ 58–65 Hz
```

#### Visual Fallback (mandatory on Soft Signal)

| Element | Spec |
| --- | --- |
| Border | Large inset / bezel; warm cream–amber; opacity breathe ~0.35↔0.75 |
| Breath cycle | ~5 s; ease-in-out; never strobe |
| Field | Gentle fade to soft cream/rose-cream (**not** emergency red) |
| Text | **“Session ended via Soft Signal”** large and calm |
| Subcopy | “You can stop. You don’t need a reason.” |
| Reduced motion | Static border + field + full text; one crossfade in |
| Timing | Visible within 100 ms of commit; ≥ 2 s readable |

#### Safety order

```text
1. Accept Soft Signal (short press; no long-press trap)
2. Commit session → ended_soft_signal
3. Show Visual Fallback (mandatory)
4. Haptic Primary/Gentle × effectiveIntensity (fire-and-forget)
5. Optional sound
```

#### Slider notes

- Soft Signal advanced intensity still scaled by global + SF.  
- Master off → haptic 0, visual full.  
- Optional **Soft Signal floor** (user setting): when haptics on, Soft Signal effective ≥ min(floor, global) so stop remains feelable for those who want it — **default floor 0** under Sensory-Friendly.

#### Rationale

Descent = release. Visual guarantees freedom for ND/haptics-off users. Intensity sliders never delay commit.

---

### 5.2 Connection request

| Layer | Spec |
| --- | --- |
| **Intent** | *Something careful arrived; you may choose.* |
| **Primary** | Gentle **rising** heartbeat rhythm (2–3 soft throbs) |
| **Gentle** | Single slow, very low-amplitude warm throb |
| **Visual** | Warm **glowing pulse around contact** + **breathing** animation + soft banner |
| **Must not** | Romance pressure, sexualized pound, loop while waiting, escalate if ignored |

#### Waveform — Primary

```text
2–3 VCM throbs; int seeds 0.28 → 0.34 → 0.40 (× effective)
attack 30 / sustain 40 / release 70; gap 90–110 ms; f ≈ 60–70 Hz
Once per invite; never loop
```

#### Waveform — Gentle

```text
Single VCM throb; seed int ≤ 0.18 (× effective); attack 50 / sustain 60 / release 120; f ≈ 58 Hz
```

#### Visual Fallback

| Element | Spec |
| --- | --- |
| Contact card | Warm edge glow; slow pulse |
| Breathing | ~5 s cycle; reduced motion → static rim + one fade-in |
| Banner | “Careful connect request” · Accept / Decline / Not now |
| Color | Amber-soft / cream — not urgent red |

#### Slider notes

Users may set Connection intensity to 0% (visual only) while keeping Soft Signal higher — advanced per-pattern.

#### Rationale

Organic rhythm without demand. Coercion rule: never intensify if ignored.

---

### 5.3 Mutual consent confirmed

| Layer | Spec |
| --- | --- |
| **Intent** | *Both affirmed this map — for this session.* |
| **Primary** | Soft **synchronized double-pulse** |
| **Gentle** | One extended, very gentle confirmation pulse |
| **Visual** | Beautiful **expanding ripple** + **warm color flash** + affirming text |
| **Must not** | “They are safe,” fake mutual, engagement fanfare |

#### Waveform — Primary

```text
Pulse A: VCM seed 0.35, attack 25, release 80, f ~65 Hz
Silence 70–90 ms
Pulse B: VCM seed 0.38, attack 25, release 90
Optional micro LRA ≤ 0.22 sharp ≤ 0.28 (Full only; × effective)
```

#### Waveform — Gentle

```text
One VCM pulse: attack 40, sustain 50, release 160, seed int ≤ 0.20 (× effective)
```

#### Visual Fallback

| Element | Spec |
| --- | --- |
| Ripple | 1–2 expanding soft waves; ease-out |
| Warm flash | ≤ 200 ms peak wash then settle |
| Text | “Consent Snapshot sealed” / “You both affirmed this map” |
| Subcopy | “Not a guarantee of safety. Soft Signal is always available.” |
| Reduced motion | Single fade + seal mark + text |
| Gate | Only if engine reports mutual seal |

#### Rationale

Double-pulse = two sides. EmotionalGuard blocks unsealed play.

---

### 5.4 Positive feedback

| Layer | Spec |
| --- | --- |
| **Intent** | *Your local action registered.* |
| **Primary** | Pleasant **rising click/glow** |
| **Gentle** | Barely noticeable warm micro-pulse |
| **Visual** | Soft **checkmark** with **expanding glow** (+ optional sparse particles in Full) |
| **Must not** | Peer agreement, streak reward |

#### Waveform — Primary

```text
VCM f 55→70 Hz, attack 20, release 60, seed peak 0.32 (× effective)
Optional LRA click seed 0.30 sharp 0.28 dur 14
```

#### Waveform — Gentle

```text
VCM micro seed ≤ 0.12 (× effective), total < 80 ms
```

#### Visual Fallback

| Element | Spec |
| --- | --- |
| Checkmark | Soft scale-in |
| Expanding glow | 300–450 ms fade |
| Particles | ≤ 12 sparse; **off** under reduced motion / SF optional |
| Placement | Near the control that saved |

#### Slider notes

Often first advanced slider users lower; visual check remains.

---

### 5.5 Nearby / incoming notification

| Layer | Spec |
| --- | --- |
| **Intent** | *Optional awareness — no demand.* |
| **Primary** | Light **ambient throb** |
| **Gentle** | Extremely subtle single pulse |
| **Visual** | Soft **ambient edge glow** + optional **floating indicator** |
| **Must not** | Stalking pressure, continuous field, consent |

#### Waveform — Primary

```text
VCM attack 40, sustain 50, release 120, seed int 0.22 (× effective), f ~60 Hz
Max 1 / 30 s; never during Soft Signal; radio off → never
```

#### Waveform — Gentle

```text
VCM seed ≤ 0.10 (× effective), total < 100 ms
```

#### Visual Fallback

| Element | Spec |
| --- | --- |
| Edge glow | Soft, low contrast; slow breathe or static (reduced motion) |
| Floating indicator | Optional small soft orb near nearby UI |
| SF default | Prefer visual-only (preset or intensity 0) |

#### Slider notes

Common to set Nearby to 0% globally or advanced — edge glow still optional.

---

### 5.6 Additional events

| Event | Primary / Gentle | Visual summary |
| --- | --- | --- |
| `presence` | Breath-in / micro | Soft screen settle |
| `attention` | Double glow / micro | Focus ring |
| `consentLocalAffirm` | Positive family | “You affirmed (waiting…)” |
| `consentRevokedLocal` | Short descent / micro | “You withdrew consent” |
| `linkFailed` | Soft tick / none | Plain fail UI |
| `emergencyStop` | Firmer descent / Soft Signal Gentle | Soft Signal visual family + emergency copy |
| `softSignalRemoteEnded` | Softer descent / micro | “Session ended” — no blame |

---

## 6. Semantic map & priority

| Event | Family | Priority | Visual always |
| --- | --- | --- | --- |
| `softSignal` | Soft Signal | safety | **Yes** |
| `emergencyStop` | Emergency | safety | **Yes** |
| `consentRevokedLocal` | Short descent | safety | **Yes** |
| `connectionRequest` | Connection | normal | When invite shown |
| `consentMutualSealed` | Mutual | normal | **Yes** |
| `confirmation` | Positive | normal | Companion OK |
| `nearbyAware` | Nearby | low | Edge glow preferred |

---

## 7. Software architecture

### 7.1 Layers

```text
Session / consent / proximity FSMs
  → FeedbackSemantic.emit(event)
      → EmotionalGuard
          → SettingsResolver
                master, SF, globalIntensity, perPatternIntensity, preset
              → effectiveIntensity + variant
                  ├─ HapticBank (primary|gentle|none) × effective
                  ├─ VisualBank (always for Soft Signal; density by SF)
                  └─ SoundBank (optional)
          → PreferenceStore (local + profile sensory sync)
```

### 7.2 Types

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

export interface PatternHapticSettings {
  intensity: number; // 0..1, default 1
  preset: PatternPreset; // default "full"
}

/** Sibling of Touch Language profile — not consent boundaries. */
export interface SensoryDevicePreferences {
  masterHapticsEnabled: boolean;
  globalIntensity: number; // 0..1
  sensoryFriendlyMode: boolean;
  patterns: Partial<Record<FeedbackEvent, PatternHapticSettings>>;
  soundEnabled: boolean;
  softSignalFeelFloor: number; // 0..1, default 0
  lastUpdatedAt: string; // ISO
  schemaVersion: 1;
}

export interface FeedbackService {
  emit(event: FeedbackEvent, opts?: { source: string }): Promise<void>;
  cancelHaptics(): void;
  getPreferences(): SensoryDevicePreferences;
  setPreferences(patch: Partial<SensoryDevicePreferences>): Promise<void>;
  setGlobalIntensity(value01: number): Promise<void>;
  setPatternIntensity(event: FeedbackEvent, value01: number): Promise<void>;
  enableSensoryFriendlyMode(): Promise<void>;
  /** Settings-only; never ends a session. */
  previewSoftSignal(kind: "gentle" | "full"): Promise<void>;
}
```

### 7.3 Soft Signal order

```text
accept → commit ended_soft_signal → Visual (mandatory)
       → haptic × effective (async) → optional sound
```

### 7.4 Preference store

```text
Local:  SecureStore / platform prefs  key litmo.sensoryDevicePreferences.v1
Sync:   user sensory preferences API (self-only RLS); merge by lastUpdatedAt
UI:     Settings + Quick menu bind to same store
```

---

## 8. Visual design tokens

| Token | Example | Use |
| --- | --- | --- |
| `--feedback-warm-field` | `#F6EFE2` | Soft Signal field |
| `--feedback-warm-border` | `#B5602C` @ 40–70% | Border pulse |
| `--feedback-glow` | `#D68A52` soft | Card / positive |
| `--feedback-breath-ms` | `5000` | Default breathe |
| `--feedback-sf-visual-boost` | `1.15` | SF visual emphasis |

Reduced motion: no continuous breathe; static emphasis + one crossfade.

---

## 9. Validation

### 9.1 Slider / settings

| Test | Pass |
| --- | --- |
| Global 0% | No haptic energy; Soft Signal visual works; session ends |
| Global 100% | Peaks ≤ hardware clamp |
| Per-pattern 0% Soft Signal | No Soft Signal haptic; visual mandatory |
| SF on | Gentle waveforms; intensity scaled; stored global not destroyed |
| SF off | Restores previous global, not 100% jump |
| Persist kill/relaunch | Values restore |
| Profile sync | Self-only; partner cannot read; conflict LWW |
| Quick menu | Global slider + SF + master reachable ≤ 1 sheet |

### 9.2 Bench haptic

Soft Signal ≤ 30 ms first motion; smooth descent; preempt; ring ≤ 40 ms.

### 9.3 Sensory / emotional study

Soft Signal → free/stopped not alarm; visual alone sufficient; connection not sexual; SF one-tap discoverable.

---

## 10. Implementation phases

| Phase | Deliverable |
| --- | --- |
| **H0** | This v4 spec |
| **H1** | Phone semantic haptics (existing) |
| **H2** | Preference store + global slider UI + SF one-tap |
| **H3** | Visual Soft Signal + connection visuals |
| **H4** | VCM bench + warm descent × intensity |
| **H5** | Advanced per-pattern sliders + profile sync |
| **H6** | Distributed multi-actuator |

Not private-alpha blocking.

---

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Users set Soft Signal intensity 0 and miss stop | Mandatory visual; copy; optional floor |
| SF + low global too weak | Visual favor; self-test |
| Sync overwrites device cal | Optional deviceOverride later; LWW timestamp |
| Partner pressure on settings | Not shareable; not in Consent Snapshot |
| Heartbeat misread | Soft non-loop; Gentle single; copy |
| Slider spam writes | Debounce 300 ms |

---

## 12. Documentation ownership

| Doc | Role |
| --- | --- |
| **`docs/HARDWARE/HAPTICS.md`** | Canonical multi-modal + slider system |
| `docs/HAPTIC_SYSTEM_DEVICE.md` | Pointer |
| ADR 0057 | VCM + LRA |
| ADR 0039 / phone plan | Mobile subset |

---

## 13. Quick reference

```text
Stack:     Wideband VCM primary · LRA accents · distributed warm field
Controls:  Global intensity 0–100% (Settings + quick menu)
           Per-pattern intensity (advanced)
           Sensory-Friendly: Gentle waveforms + lower intensity + favor visuals
           Persist sessions + sync sensory prefs (sibling of Touch Language; not consent)
Soft Signal: descending warm pulse · Gentle breath-fade
             Visual: pulsing border + soft field + “Session ended via Soft Signal”
Connection: rising soft heart · Gentle one throb · card glow + breath
Mutual:     double pulse · Gentle one pulse · ripple + warm flash (sealed only)
Positive:   rising click/glow · micro · check + glow
Nearby:     ambient throb · micro · edge glow + optional float
Off:        haptics silent · visuals complete for critical meaning
effective = global × perPattern × sensoryScale × hardwareClamp
```

**Tagline:**  
*Warm enough to feel alive. Gentle enough for a sensitive day. Clear enough to end safely — even in silence.*
