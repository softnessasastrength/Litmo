# Semantic Haptic Language — full grammar

**Status:** specification + pure implementation (`hapticLanguageCore`)  
**Version:** language-v1 · ADR 0063  
**Phone path:** Expo `expo-haptics` (iOS-excellent impact/notification mapping)  
**Device path:** [`HARDWARE/HAPTICS.md`](HARDWARE/HAPTICS.md) · ADR 0057  
**Prior slice:** ADR 0039 five-event vocabulary (still public API)

> Litmo does not buzz at people.  
> It **answers** them — in a language with grammar, dialect, and stop words.  
> Soft Signal must say: *you stopped — you are free*.

---

## 1. Ambition

Treat touch feedback as **programmable, composable, and transmissible**:

| Property | Meaning |
| -------- | ------- |
| **Programmable** | Phrases are data: curve + rhythm + location + emotion + intensity |
| **Composable** | Phrases chain into compositions (e.g. seal_step → confirmation) |
| **Transmissible** | JSON recipes for Device OS / multi-client — never peer consent codes |
| **Device-agnostic IR** | `HapticAtom[]` intermediate representation |
| **Native-excellent iOS** | Impact/notification tiers + Core Haptics **hints** for future CHH |
| **Safety interrupts** | Soft Signal / emergency abort in-flight decorative phrases |

---

## 2. Non-negotiable constitution

1. Haptics **never** encode peer consent, remote presence, or “person is safe.”  
2. Soft Signal **commits stop first**, then plays — never reverse.  
3. **Silence is valid** — intensity 0 / haptics off / ND off still leave visual meaning.  
4. **No engagement FOMO** loops, streaks, or secret inter-user codes.  
5. **No imitation of interpersonal touch** as sexual or romantic signaling.  
6. Touch Language **zones** ≠ haptic **locations** (permission vs motor).  

---

## 3. Grammar layers

### 3.1 Lexemes (vocabulary / meanings)

| Lexeme | Meaning | Primary use |
| ------ | ------- | ----------- |
| `presence` | You arrived; pause | entry, grounding |
| `attention` | Look deliberately | consent checkpoints |
| `confirmation` | Local action registered | save, complete |
| `soft_signal` | Stop registered — freedom | Soft Signal |
| `emergency_stop` | Emergency stop ack | panic path only |
| `boundary_saved` | TL boundary stored locally | map edit |
| `check_in_gentle` | Session check-in nudge | active session |
| `zone_preview` | Local pressure preview | TL map select |
| `seal_step` | Dual-seal progress step | snapshot mutual |
| `wrap_complete` | Wrap-up recorded | wrap-up |

Legacy HAPTIC-001 names map: `softSignal` → `soft_signal`, etc.

### 3.2 Pressure curves

`constant` · `rise` · `fall` · `soft_edge` · `descend_warm` · `pulse_once` · `double_tap`

Soft Signal default: **`descend_warm`** (release, not alarm).

### 3.3 Rhythm patterns

`single` · `double` · `triple_soft` · `heartbeat_calm` · `breath_slow` · `staccato_alert` (emergency only)

### 3.4 Locations (logical)

`device` · `palm_center` · `palm_edge` · `fingertip` · `wrist` · `distributed`

Phone collapses all to **device**. Hardware maps to multi-actuator (ADR 0057).

### 3.5 Emotional modifiers

`neutral` · `calm` · `warm` · `crisp` · `solemn` · `clear`

Forbidden: arousal, FOMO, shame, “urgency marketing.”

### 3.6 Safety interrupts

| Interrupt | Priority | Effect |
| --------- | -------- | ------ |
| `none` | 0 | — |
| `user_cancel` | 50 | cancel decorative |
| `soft_signal` | 90 | abort + Soft Signal phrase |
| `emergency_stop` | 100 | abort + emergency phrase |

---

## 4. Phrase & composition

```ts
HapticPhrase = {
  version: 1,
  lexeme, curve, rhythm, location, emotion,
  intensity: 0..1,
  interrupt,
  durationMs?
}

HapticComposition = { id, phrases[], yieldToInterruptAbove }
```

**Compile path:**

```text
Phrase → HapticAtom[] (IR)
      → PhoneHapticCall[] (Expo + CHH hints)
      → [future] Core Haptics continuous events
      → [future] Device firmware VCM/LRA frames
```

Serialization: `serializePhrase` / `parsePhrase` — no user ids, no consent fingerprints.

---

## 5. Integration map

| Surface | Integration |
| ------- | ----------- |
| **Soft Signal** | `play("softSignal")` → `descend_warm` + breath_slow + solemn + interrupt latch |
| **Touch Language map** | Zone select → `zone_preview` intensity from zone/doc pressure |
| **Active session** | Soft Signal path unchanged (commit first); optional `check_in_gentle` later |
| **ND Mode** | `lexemeAllowedAtIntensity`: minimal = stop-class only |
| **Learning** | Module `haptic-language` |
| **Hardware Device OS** | Same lexemes; richer curves in firmware |

---

## 6. iOS excellence

| Layer | Behavior |
| ----- | -------- |
| Expo Go / current | `impactAsync` + `notificationAsync` + delays |
| Soft Signal | warning notification + descending impact chain |
| Emergency | error notification + heavy double |
| Future CHH | `core_haptics_hint` atoms (sharpness/intensity/duration) ready for native module |
| Accessibility | Visual Soft Signal / status always primary; haptics optional |

Physical feel validation remains a real-device smoke (not simulator proof).

---

## 7. Implementation status

| Piece | Status |
| ----- | ------ |
| `app/lib/hapticLanguageCore.ts` | **shipped** |
| `hapticServiceCore` compile + interrupt + `playPhrase` | **shipped** |
| TL map zone preview | **shipped** |
| Soft Signal via grammar | **shipped** (legacy API) |
| Core Haptics native module | planned |
| Device firmware compiler | design (HARDWARE/HAPTICS) |
| Multi-device recipe sync | not started (self-only when done) |

---

## 8. Implementation plan (phased)

### Phase A — Grammar foundation (done in this workstream)

- Pure language core + tests  
- Service compile path + interrupt generation  
- Spec + ADR 0063  
- Learning module  
- TL preview + Soft Signal mapping  

### Phase B — Session polish

- `check_in_gentle` on continuous consent UI when shipped  
- `seal_step` on mutual snapshot affirm  
- Settings: per-lexeme intensity advanced panel (optional)  
- Wire ND `getIntensityPolicy` into `createHapticService`  

### Phase C — iOS Core Haptics

- Optional native module for continuous events from `core_haptics_hint`  
- Soft Signal true descending continuous event  
- Keep Expo fallback  

### Phase D — Device OS parity

- Compile IR → VCM/LRA frames per HARDWARE/HAPTICS.md  
- Same lexeme names; distributed locations  

### Phase E — Transmissible self recipes

- Export/import personal intensity profiles (self-only)  
- Never peer transmission of “touch messages”  

---

## 9. Related

- ADR 0039 · ADR 0057 · **ADR 0063**  
- `docs/roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md`  
- `docs/HARDWARE/HAPTICS.md`  
- Living Constitution I.4 Soft Signal freeness  
