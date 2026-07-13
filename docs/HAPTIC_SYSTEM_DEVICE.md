# Litmo Device Haptic System — Soft Edge

**Status:** design specification (hardware vision — not a shipping SKU)  
**Version:** 1.1 · refined 2026-07-13  
**Related:** [ADR 0057](adr/0057-device-haptic-vca-lra-architecture.md) · [Phone haptics](roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md) · [ADR 0039](adr/0039-semantic-haptic-language.md) · Soft Signal / Consent Snapshot product rules

> A gentle haptic can say “I’m here” without demanding attention.  
> A Soft Signal haptic must say “you stopped — you are free” without terror.  
> Litmo does not buzz at people. It **answers** them — warmly, sparsely, and honestly.

This document is the **authority** for the tactile language of the dedicated Litmo companion: emotional design, actuators, waveforms, semantic events, timing, accessibility, and firmware interfaces. It extends the phone-first five-event vocabulary into a high-fidelity **voice-coil + LRA** stack that feels like the rest of Litmo: soft-edged, trauma-informed, and deliberately **not** cold consumer-tech haptics.

---

## 0. Design thesis

### 0.1 What Soft Edge is

**Soft Edge** is Litmo’s haptic personality: feedback that feels like a calm hand on a wooden table, not a game controller, not a smartwatch reward, not a factory buzzer.

| Soft Edge wants people to feel | Soft Edge refuses to make people feel |
| --- | --- |
| Grounded | Startled |
| Free to leave | Trapped or punished |
| Locally acknowledged | Judged by the device |
| Gently invited to pause | Nudged to engage |
| Safe in their body | Sexualized or “tickled” |
| Clear about stop | Confused about whether stop worked |

### 0.2 Emotional intelligence (EI) rules for every pattern

Before any waveform ships, it must pass this checklist:

1. **Whose action is this?** If it is not *this user’s* local action or a fully sealed mutual protocol state, do not play a “success” feel.
2. **What feeling after?** Prefer grounded, complete, free — never urgent dopamine or shame.
3. **Would this be kind if someone is activated or dissociated?** If not, soften envelope or drop the haptic and keep visuals.
4. **Can silence carry the moment?** Default to silence; haptics earn their place.
5. **Is Soft Signal still the clearest word in the vocabulary?** Nothing may outrank or out-alarm it except true emergency, and even emergency is not a siren.

### 0.3 Tagline

*Warm enough to invite presence. Clear enough to end it. Quiet enough to leave room for humans.*

---

## 1. Intent and non-goals

### 1.1 Intent

- Make consent-critical moments **feel** distinct, calm, and trustworthy in the hand.
- Prioritize **warm, inviting, high-fidelity** feedback over rumble, metallic “tick,” or engagement buzz.
- Make **Soft Signal** instant, unmistakable, and **emotionally safe** (clear stop ≠ alarm, ≠ blame).
- Support **consent exchange** and **connection** without chatty social haptics.
- Stay optional, private, multi-modal, fail-safe, and sparse.

### 1.2 Explicit contrast: Soft Edge vs cold / tech haptics

| Dimension | Typical cold tech | Litmo Soft Edge |
| --- | --- | --- |
| Goal | Notify, reward, “premium click,” retain | Acknowledge, ground, free, clarify stop |
| Density | Frequent micro-ticks on every tap | Most taps silent |
| Envelope | Square, hard attack, snappy decay | Rounded attack, soft bloom, short warm release |
| Spectrum | High-frequency grit / sharp LRA only | Mid-low VCA body + soft LRA edge |
| Soft Signal cousin | Error buzz, triple alert, continuous vibrate | Dual-beat **curtain close** — firm, finished, kind |
| Social | “Someone liked you” buzz | No partner-emotion impersonation |
| Power metaphor | Device demands attention | Device yields the room back to people |
| Failure | Retry buzz loops | Fail silent; safety UI still complete |

**Anti-references (do not copy):** slot-machine reward ticks, endless “typing” pulses, fitness streak celebrations, harsh keyboard haptics, police-radio buzz, sexual “purr” rumbles, horror-game heartbeats.

### 1.3 Non-goals (hard bans)

| Forbidden | Why |
| --- | --- |
| Haptic as proof of another person’s consent | Consent is mutual, explicit, session-specific |
| Inter-device secret codes / “haptic Morse” | Coercion and misread-as-affection risk |
| Imitating interpersonal skin contact | Trauma-unsafe, product-dishonest |
| Engagement loops, streaks, FOMO buzzes | Out of constitution |
| Soft Signal delayed by playback | Safety state always wins |
| Sensitive haptic analytics | Local only |
| ERM-primary Soft Signal | Muddy, slow, generic phone buzz |
| Continuous nearby “presence field” | Stalking pressure / sensory load |
| Rising intensity to force a response | Coercive design |

### 1.4 Relationship to phone haptics

| Layer | Scope | Expression |
| --- | --- | --- |
| Phone (ADR 0039) | iOS demo & private alpha | 5 events, Expo presets |
| Device (this doc) | Hardware vision | Same **meanings**, Soft Edge waveforms, dual actuators |

Event **names** are stable across clients. Feel may deepen on hardware; meaning may not fork.

---

## 2. Tactile personality — Soft Edge in depth

### 2.1 Material metaphor

The device is **furniture for connection**: rounded square, soft-touch shell, calm light. Haptics must match:

- Think **thumb on linen-wrapped wood**, not metal trackpad.
- Energy should feel **absorbed into the body of the device**, not rattling the corners.
- After Soft Signal, the hand should feel **released**, not still buzzing.

### 2.2 Personality adjectives

| Do | Don’t |
| --- | --- |
| Warm | Cold / metallic sting |
| Rounded envelopes | Square on/off only |
| Low–mid fundamental “bloom” | High-frequency grit |
| Short warm decays | Long ringing tails |
| Sparse | Chatty |
| Grounding | Alarming (except true emergency, still not a siren) |
| Local acknowledgement | Impersonating a partner |
| Finished / complete | Needy / unfinished pulses |
| Optional | Mandatory for comprehension |

### 2.3 Sensory lexicon (authoring labels only)

| Name | Perceptual story | Typical use |
| --- | --- | --- |
| **Breath** | Soft swell and release — like settling into a chair | `presence`, quiet nearby |
| **Knock** | One polite knuckle on a wooden door | Local `confirmation` |
| **Bell** | Brief clear note, no clang | `attention`, consent invite |
| **Seal** | Soft knock + short warm exhale — a page closed gently | `consentMutualSealed` only |
| **Curtain** | Two firm beats: edge, then closed | Soft Signal |
| **Anchor** | Deep single settle into the palm | Session end / clean disconnect |
| **Thorn** | Very short muted tick — “that didn’t go; look at the screen” | Fail closed, never alarm |

These are **metaphors for designers**, not claims the device is touching or soothing the user like a person.

### 2.4 Emotional temperature scale

| Temp | Character | Allowed for |
| --- | --- | --- |
| Cool-neutral | Almost silent, thin LRA | ND quiet UI ticks |
| Warm-soft | VCA bloom dominant | Presence, nearby, seal |
| Warm-firm | VCA + LRA balanced | Soft Signal |
| Clear-urgent | Higher int, still rounded | Emergency only |

**Never use cold-hard** (max sharp, no body) for Soft Signal or consent.

### 2.5 Intensity ladder

| Level | Name | Emotional job |
| --- | --- | --- |
| L0 | Off | Full silence; meaning in UI only |
| L1 | Whisper | “I’m barely here with you” |
| L2 | Soft | Default kindness |
| L3 | Clear | “Please look” without shout |
| L4 | Firm | Soft Signal — complete, free |
| L5 | Urgent | Emergency — decisive, still not cruel |

**Defaults:** UI L2 · Soft Signal L4 · Emergency L5.  
**User Soft Signal floor:** when haptics on, Soft Signal ≥ L3 by default (configurable down for sensory safety).

### 2.6 Rhythm of the product day

Litmo’s day should be mostly **tactile silence**. Expected haptic density for a full demo session: on the order of **8–20 events**, not hundreds. If a flow would fire more than once every few seconds, delete patterns until it breathes.

---

## 3. Hardware architecture

### 3.1 Decision

Dual stack ([ADR 0057](adr/0057-device-haptic-vca-lra-architecture.md)):

1. **Wideband voice-coil (VCA / VCM)** — warmth, breath, body (≈ 40–250+ Hz usable with mounting).
2. **LRA** — soft-edged ticks near resonance (often ≈ 150–200 Hz class; tune to part).

ERM only as degraded prototype fallback. Piezo optional later for ultra-sharp clicks — not required for Soft Edge v1.

### 3.2 Why this stack feels warmer than phones

Phones often optimize LRA for **efficiency and click**. Soft Edge prioritizes:

- **VCA body** so confirms and Soft Signal have a human-scale “mass,” not a needle poke.
- **Rounded LRA sharpness** (sharpness ≤ 0.55 for Soft Signal edge; UI knocks ≤ 0.40).
- **Mechanical isolation** so energy is felt as palm pressure, not shell chatter.

### 3.3 Placement

| Actuator | Mount | Feel goal |
| --- | --- | --- |
| VCA | Center / palm coupling under soft-touch shell | Whole-device warm bloom |
| LRA | Near Soft Signal control + front edge | Finger finds stop; soft ticks |
| Isolation | Silicone / foam | No corner rattle; decay ≤ 40 ms after Soft Signal end |

### 3.4 Drive targets

| Item | Spec |
| --- | --- |
| Drivers | Auto-resonance LRA + broadband VCA amp |
| VCA stream | ≥ 8 kHz |
| Soft Signal latency | **≤ 30 ms** p95 first motion |
| Routine UI latency | ≤ 50 ms p95 |
| Soft Signal energy | ≤ 120 mJ |
| Continuous drive | Banned except timed breath ≤ 400 ms |
| Watchdog | Abort continuous > 500 ms |
| Mute | Hardware + user software mute |

### 3.5 Dual-actuator mix philosophy

| Role | VCA | LRA |
| --- | --- | --- |
| Breath / presence | Primary, soft | Optional whisper support |
| UI knock | Light under-layer | Primary soft transient |
| Soft Signal | Firm warm body | Firm-but-rounded edge + close beat |
| Mutual seal | Short warm exhale | Soft knock |
| Nearby | Whisper only | Off preferred |
| Fail / thorn | Off | Single muted tick |
| Emergency | Strong body | Short max edge — still rounded |

**Authoring rule:** if a pattern is only LRA max-sharp with no VCA body, it is **too cold** for Soft Edge shipping personality (except optional ND “crisp only” accessibility mode).

---

## 4. Waveform language

### 4.1 Primitives

```text
Transient  { actuator: VCA|LRA|BOTH, intensity: 0..1, sharpness: 0..1, duration_ms }
Continuous { actuator: VCA|LRA, f_hz, intensity: 0..1, attack_ms, sustain_ms, release_ms,
             curve: soft|linear }   // soft = ease-in-out envelope (default)
Silence    { ms }
Composite  { steps: Primitive[] }
Parallel   { a: Composite, b: Composite }
```

**Soft curve default:** all Continuous use `curve: soft` unless emergency.

**Sharpness guidance:**

| Range | Character |
| --- | --- |
| 0.00–0.25 | Almost cushioned |
| 0.25–0.40 | Soft Edge default UI |
| 0.40–0.55 | Soft Signal edge (max for stop) |
| 0.55–0.70 | Emergency only |
| > 0.70 | Forbidden in Soft Edge shipping profiles |

### 4.2 Global authoring constraints

| Rule | Limit |
| --- | --- |
| Max pattern (non-emergency) | 450 ms |
| Soft Signal | ≤ 280 ms |
| Emergency | ≤ 350 ms |
| Continuous tone | ≤ 400 ms |
| Min gap unrelated events | 120 ms |
| Soft Signal priority | Preempts everything |
| No loops | Watchdog |
| No escalation ramps | Intensity may not rise across repeats to pressure the user |

### 4.3 Soft Edge base palette (v1.1 calibration seeds)

Nominal **Default profile L2–L4**. Physical bring-up required.

| Pattern ID | Composition | Emotional note |
| --- | --- | --- |
| `breathIn` | VCA 55–75 Hz, attack 90, sustain 30, release 140, int 0.22, soft | Arrive without demand |
| `breathOut` | VCA 50–65 Hz, attack 40, sustain 20, release 160, int 0.20 | Soft completion / seal exhale |
| `softKnock` | LRA int 0.42 sharp 0.32 dur 16 + VCA under int 0.18 dur 28 | Polite local yes |
| `doubleBell` | softKnock · silence 75 · softKnock @ 0.9× int | Pause and look |
| `warmSeal` | softKnock · silence 50 · breathOut @ 0.85× | Mutual map sealed — calm, not fanfare |
| `curtainClose` | See §6.2 | Soft Signal free / complete |
| `curtainSoft` | curtainClose @ 0.75× int, second tick softer | Peer “session ended” / revoke |
| `anchorDown` | VCA 48–62 Hz attack 35 sustain 45 release 160 int 0.35 | Grounded end |
| `thorn` | LRA int 0.28 sharp 0.30 dur 12 | Fail closed; look at UI |
| `emergencyFirm` | Parallel LRA sharp 0.60 int 0.9 dur 20 + VCA 60–80 Hz body int 0.85 attack 12 sustain 70 release 100 · silence 30 · LRA int 0.55 | Decisive, not cruel |

### 4.4 Frequency “warm band”

Prefer VCA energy concentrated in **≈ 50–90 Hz** for body (felt as mass/pressure). Avoid prolonged energy above **≈ 180 Hz** on VCA (reads as cheap buzz). LRA may sit at part resonance for ticks but **always** under-layered with VCA for Soft Edge default profile.

---

## 5. Semantic vocabulary

### 5.1 Core (shared with phone)

| Event | Meaning in words the user could say | Feel | Pattern |
| --- | --- | --- | --- |
| `presence` | “I’m here; I can go slowly.” | Breath | `breathIn` |
| `attention` | “This moment wants care.” | Double bell | `doubleBell` |
| `confirmation` | “My action registered.” | Soft knock | `softKnock` |
| `softSignal` | “I stopped. I’m free.” | Curtain | `curtainClose` |
| `emergencyStop` | “Emergency stop registered.” | Firm anchor+edge | `emergencyFirm` |

### 5.2 Consent exchange (local honesty)

| Event | When | Pattern | Emotional contract |
| --- | --- | --- | --- |
| `consentInvite` | Opens Consent Snapshot | `doubleBell` slightly warmer (VCA +5%) | Invite care, not pressure |
| `consentLocalAffirm` | Local affirm only | `softKnock` + tiny `breathOut` | **Only you** said yes so far |
| `consentMutualSealed` | Engine: mutual seal true | `warmSeal` | Shared map exists — **not** “they are safe” |
| `consentRevokedLocal` | Local withdraw | `curtainSoft` | Dignity; no error blare |

**Fail closed:** ambiguous network → silence or `thorn` + UI. Never `warmSeal` without seal.

### 5.3 Connection (opt-in radio)

| Event | When | Pattern | Emotional contract |
| --- | --- | --- | --- |
| `nearbyAware` | First anonymous nearby (opt-in) | `breathIn` L1–L2 | Bare notice; 1 / 30 s max |
| `carefulTapPrompt` | NFC/QR needs explicit accept | `doubleBell` | Choice required |
| `linkEstablishedLocal` | Local channel up | `softKnock` | Plumbing, not romance |
| `identityRevealedMutual` | Both chose reveal | two `breathIn` soft | Still **not** touch consent |
| `linkEnded` | Clean close | `anchorDown` soft | Settled |
| `linkFailed` | Fail closed | `thorn` | No alarm |

### 5.4 Device-only helper events (optional)

| Event | Use |
| --- | --- |
| `softSignalRemoteEnded` | Peer session ended — `curtainSoft` L3 max; never blame |
| `settingsSelfTest` | User-initiated Soft Signal feel test in settings only |
| `hapticsEnabledAck` | When turning haptics **on** only — single softKnock |

### 5.5 Vocabulary that must never exist

- `partnerThinking`, `partnerNearbyPulse`, `matchCelebration`, `streak`, `nudgeAgain`, `heartbeat`, `purr`, `flirt`.

---

## 6. Soft Signal — emotionally safe stop

### 6.1 Product requirements

| Requirement | Spec |
| --- | --- |
| Instant | ≤ 30 ms first motion after accept |
| Unmistakable | ≥ 95% label as stop/exit after brief training |
| Emotionally safe | “Curtain closed / I’m free” — **not** danger, shame, or anger |
| Kind under stress | Works for activated, overloaded, or non-verbal users; no long-press prison |
| Non-blocking | State commit **before** or concurrent with haptic; never await haptic for stop |
| Idempotent | Extra presses ≤ 800 ms do not stack chaos |
| Hands find it | Physical control + LRA near control |
| Haptics off | Stop still 100% works |

### 6.2 Waveform `curtainClose` (v1.1)

```text
Intent:  Beat 1 = “I asked to stop.”  Beat 2 = “It stopped.”  Then silence = freedom.

t=0        Preempt all patterns; open BOTH actuators
t=0–22     LRA firm edge  int 0.82  sharp 0.50  dur 20   // rounded, not needle
t=0–165    VCA warm body  ~68 Hz  attack 18  sustain 55  release 95  int 0.68  soft
t=165–205  Silence                                        // perceptual breath
t=205–232  LRA close tick int 0.48  sharp 0.35  dur 16  // softer “closed”
t=205–280  Optional VCA residual release only; hard mute by 280
```

**Design notes:**

- Second beat **softer** than first → completion, not escalation.
- No third beat (three feels like alarm).
- No continuous hold after.
- If user study says “alarm,” **lower sharpness and raise VCA warmth** — do not “fix” by getting louder.

### 6.3 Peer device

- `softSignalRemoteEnded` = `curtainSoft` only: “the session ended,” not “you failed.”
- Never stronger than local Soft Signal.
- No peer haptic if link state is ambiguous.

### 6.4 Practice vs real

Same pattern family; practice may use L3–L4. Real Soft Signal uses L4 (or user floor). Disabled → pure visual Soft Signal.

### 6.5 Soft Signal emotional copy (for UI pairing)

Haptics reinforce, never replace, language like:

- “Soft Signal sent. You can stop. You don’t need a reason.”
- Never: “Warning,” “Abort,” “Error,” “Violation.”

---

## 7. Consent exchange — full emotional timeline

```text
Open snapshot     → consentInvite        (careful attention)
Review            → silence              (thinking is quiet)
Local affirm      → consentLocalAffirm   (only my yes)
Waiting           → silence              (no anxious pulse)
Mutual seal       → consentMutualSealed  (warmSeal — only if sealed)
Active session    → optional presence once
Soft Signal       → softSignal           (preempt, free)
Local revoke      → consentRevokedLocal
```

### 7.1 Confusion matrix (study must pass)

| Pair | Soft Edge distinction |
| --- | --- |
| confirm vs Soft Signal | Length, dual-actuator curtain, second beat |
| attention vs Soft Signal | Lighter, no close beat |
| warmSeal vs Soft Signal | Seal soft/warm; Soft Signal firm/complete |
| nearby vs Soft Signal | Whisper only |
| thorn vs Soft Signal | Thorn tiny; Soft Signal whole-hand |

### 7.2 Emotional failure modes

| Failure | Wrong feel | Correct |
| --- | --- | --- |
| Seal when only one affirmed | Celebration | Silence / wait UI |
| Soft Signal as error buzz | Shame | Curtain freedom |
| Waiting pulse while peer decides | Anxiety / coercion | Silence |

---

## 8. Connection notifications — careful social field

Connection haptics answer: **“something needs your optional attention,”** never **“someone wants something from you right now.”**

Rules:

1. Radio off → zero connection haptics.  
2. Rate-limit `nearbyAware` (30 s).  
3. Never haptic-stack with Soft Signal.  
4. Identity reveal ≠ consent (breath only).  
5. Failures are `thorn` + honest UI, not alarms.

---

## 9. Profiles — one personality, several nervous systems

| Profile ID | Who | Adjustments |
| --- | --- | --- |
| `soft_edge_default` | Most users | Full palette as written |
| `quiet_hearth` | ND / sensory sensitive | −25% VCA, shorter sustain, LRA preferred for UI, Soft Signal still dual but −20% int |
| `clear_edge` | Low tactile sensitivity | +15% int, Soft Signal sharpness up to 0.55 max |
| `crisp_only` | Optional accessibility | LRA-weighted; still ban sharp > 0.55 on Soft Signal |
| `off` | Explicit | Silence; full visual/audio parity |

**Neurodivergent Mode** on device should **offer** `quiet_hearth` default (not force forever). User can re-enable fuller Soft Edge.

---

## 10. Accessibility, trauma-informed, sensory safety

1. Master toggle off → silence including Soft Signal ack; **stop works**.  
2. Intensity Off / Quiet / Default / Strong.  
3. Soft Signal floor configurable.  
4. Reduced motion ≠ auto-off haptics; toggle wins.  
5. No haptic on boot/unlock without intentional action.  
6. VoiceOver / large type / visible Soft Signal always sufficient alone.  
7. Soft Signal: short press preferred; never long-press trap.  
8. Ban > 450 ms patterns, repeats, escalating alarms.  
9. User study flags: alarming, ticklish, sexualized, angry, punishing → redesign.  
10. Preferences **local only** — partner cannot remotely enable haptics.

---

## 11. Software architecture

### 11.1 Layers

```text
Session / consent / proximity state machines
  → HapticSemantic.play(event, opts)
      → EmotionalGuard (bans illegal transitions; e.g. warmSeal without seal)
          → Priority queue (safety preempt)
              → ProfileMixer (quiet_hearth / default / …)
                  → Pattern library soft_edge_v1
                      → DualActuatorMixer
                          → VCA stream + LRA envelopes
```

### 11.2 Interface (shared domain)

```ts
export type HapticEvent =
  | "presence"
  | "attention"
  | "confirmation"
  | "softSignal"
  | "emergencyStop"
  | "consentInvite"
  | "consentLocalAffirm"
  | "consentMutualSealed"
  | "consentRevokedLocal"
  | "nearbyAware"
  | "carefulTapPrompt"
  | "linkEstablishedLocal"
  | "identityRevealedMutual"
  | "linkEnded"
  | "linkFailed"
  | "softSignalRemoteEnded"
  | "settingsSelfTest"
  | "hapticsEnabledAck";

export type HapticProfileId =
  | "soft_edge_default"
  | "quiet_hearth"
  | "clear_edge"
  | "crisp_only"
  | "off";

export type HapticPriority = "low" | "normal" | "safety";

export interface HapticPlayOptions {
  awaitPlayback?: boolean; // false for safety events
  intensityOverride?: number;
  source: string; // non-sensitive
}

export interface HapticService {
  play(event: HapticEvent, opts: HapticPlayOptions): Promise<void>;
  cancelAll(): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  getProfile(): HapticProfileId;
  setProfile(profile: HapticProfileId): void;
}
```

### 11.3 EmotionalGuard (required)

Firmware/app layer must refuse:

- `consentMutualSealed` unless consent engine state is mutually sealed  
- `identityRevealedMutual` unless both revealed  
- `softSignalRemoteEnded` unless session ended by peer Soft Signal / end protocol  
- any play while profile is `off`  
- stacking safety patterns

### 11.4 Priority

| Priority | Events | Behavior |
| --- | --- | --- |
| safety | softSignal, emergencyStop, consentRevokedLocal | Preempt immediately |
| normal | confirmations, consent, links | Queue ≤ 1 |
| low | nearbyAware, presence | Drop if busy |

### 11.5 Soft Signal ordering

```text
1. Accept Soft Signal input
2. Commit session ended_soft_signal
3. UI / peer / radio teardown
4. play("softSignal") fire-and-forget
```

### 11.6 Pattern pack

`patterns/soft_edge_v1.json` — personality, event→pattern map, per-profile multipliers. Factory cal outside app binary when possible.

---

## 12. Authoring guide (for future designers)

1. Start from **silence**. Justify every event in one sentence of user language.  
2. Prefer VCA warmth before adding LRA edge.  
3. Soft Signal must remain the most distinctive word.  
4. Never design a “fun” version of Soft Signal.  
5. If a pattern could mean two things, split or delete.  
6. Read the waveform with the question: *Would I want this on my worst day?*  
7. Prototype with hand on soft material; reject shell chatter.  
8. Log only non-sensitive debug IDs in dev builds.

---

## 13. Validation

### 13.1 Bench

| Test | Pass |
| --- | --- |
| Soft Signal latency | p95 ≤ 30 ms |
| Preempt | ≤ 10 ms cancel of lower patterns |
| Thermal / power | Within §3.4 budgets |
| Ring decay | ≤ 40 ms after Soft Signal |
| Sharpness audit | No shipping pattern sharpness > 0.55 except emergency ≤ 0.70 |

### 13.2 Perceptual & emotional (human)

≥ 8 adults; include sensory-sensitive / trauma-informed opt-in participants; stop anytime; no deception about recording.

1. Forced-choice labels for core 5 events  
2. Soft Signal open labels (want “stopped / free / done,” not “danger / error”)  
3. Comfort + flags: alarming, ticklish, sexualized, angry, punishing, cold  
4. quiet_hearth acceptability  
5. warmSeal vs Soft Signal confusion  
6. “Would you disable this after a week?” (target: low disable for Soft Signal path)

**Hard fail:** majority call Soft Signal “alarm/danger” → redesign warmer, not louder.

### 13.3 Safety regression

Haptics off · actuator fault · multi-press · nearby during Soft Signal · false seal blocked · EmotionalGuard unit tests.

### 13.4 Phone parity

Phone remains Expo subset; meaning stable; feel simplified.

---

## 14. Implementation phases

| Phase | Deliverable | Gate |
| --- | --- | --- |
| **H0** | This design + ADR 0057 | Docs |
| **H1** | Phone HAPTIC-001 | Five events live |
| **H2** | Soft Edge simulator (waveforms + audio proxy) | Design review |
| **H3** | Dual-actuator bench + Soft Signal button | Latency pass |
| **H4** | soft_edge_v1 + emotional user study | Perceptual pass |
| **H5** | Session / NFC / proximity EmotionalGuard | Fail-closed review |
| **H6** | Factory cal + profiles | Future production |

Not on private-alpha critical path. Phone remains real surface.

---

## 15. Abuse, limits, risks

| Risk | Mitigation |
| --- | --- |
| Soft Signal as alarm | Curtain design; study gate; no third beat |
| warmSeal over-trusted | Copy + modest intensity; no fanfare |
| Nearby pressure | Rate limit; opt-in; silence default |
| Remote haptic control | Impossible by design |
| Sexualized warm bloom | Short low-mid band; study language; ban purr |
| Actuator death | Silent fail; stop works |
| Cold tech regression | Sharpness caps; VCA body requirement in default profile |

---

## 16. Documentation ownership

| Doc | Role |
| --- | --- |
| **This file** | Device Soft Edge authority |
| ADR 0057 | Dual VCA+LRA decision |
| ADR 0039 + phone plan | Mobile semantics |
| CONSENT_FLOW / PROXIMITY / NFC | When events may fire |
| Website `/litmo#hardware` | Vision language only |

---

## 17. Quick reference

```text
Personality:   Soft Edge — warm, sparse, free, never cold-tech
Soft Signal:   curtainClose · BOTH · ≤280 ms · ≤30 ms start · after commit
Confirm:       softKnock (polite wood)
Attention:     doubleBell
Mutual seal:   warmSeal · only if sealed · not safety
Nearby:        breath whisper · rate limited
Fail:          thorn · look at UI
Emergency:     emergencyFirm · decisive · not cruel
Off:           silence; meaning lives in UI
```

**Tagline:**  
*Warm enough to invite presence. Clear enough to end it. Quiet enough to leave room for humans.*
