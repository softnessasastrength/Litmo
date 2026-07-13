# ADR 0057 — Dual VCA + LRA architecture for dedicated-device haptics

- **Status:** Accepted (hardware vision)
- **Date:** 2026-07-13
- **Owners:** Product + hardware (when staffed); coding agents maintain docs and phone-side semantic alignment

## Context

Litmo’s dedicated device vision needs a tactile language that matches warm, soft-edged hardware and trauma-informed product rules. Phone haptics (ADR 0039, Expo) already define a five-event semantic vocabulary. Dedicated hardware can go further with high-fidelity actuators but must not invent a second, conflicting meaning system.

Industry constraints:

- **LRA** actuators are efficient and good for sharp ticks near resonance, but narrow-band.
- **Voice-coil / VCM (VCA)** class actuators provide broader frequency response and richer, more “realistic” tactile texture at higher power cost.
- **ERM** motors are slow and muddy — poor fit for Soft Signal.
- Human vibration perception for distinct fingertip/device cues roughly spans low tens of Hz through a few hundred Hz; Soft Signal needs fast start/stop, not long rumble.

Soft Signal must be instant, unmistakable, and emotionally safe: a clear stop, not a panic alarm. Haptics must never encode another person’s consent.

## Decision

1. Adopt a **dual-actuator** stack for the dedicated Litmo device: **high-fidelity wideband Voice Coil Motor (VCM/VCA) primary** + **LRA secondary** for soft-edged crisp accents only.
2. Aim for **device-wide distributed** warm haptics (palm-coupled field; multi-actuator in phase when present).
3. Keep **semantic event names** shared with phone clients; richer waveforms live on device firmware only.
4. **Soft Signal (critical):** long, smooth **descending warm pulse** that fades (freedom/release) — not an alarm. Gentle Mode: extremely subtle slow low-amplitude fade. Start latency ≤ 30 ms; state commit before playback.
5. **Every pattern** has **Gentle / Sensory-Friendly** haptic **and a full Visual Fallback**. Soft Signal visual always fires on stop. Sensory-Friendly Mode is **one-tap from anywhere** and lowers intensity while favoring visuals.
6. **Global haptic intensity 0–100%** (Settings + quick menu) and optional **per-pattern intensity** (advanced); preferences persist across sessions and sync as **self-only sensory device preferences** (sibling of Touch Language profile data — never consent boundaries, never partner-visible).
7. Forbid ERM-primary Soft Signal; forbid engagement, secret, and interpersonal-touch-imitation haptics.
8. Full multi-modal library + slider math is specified in **`docs/HARDWARE/HAPTICS.md`** v4+ (canonical).

## Alternatives considered

| Alternative | Why not (primary) |
| --- | --- |
| LRA-only | Insufficient soft “warm” body for Soft Edge personality |
| VCA-only | Weaker efficient ticks; Soft Signal edge less crisp |
| Piezo-only v1 | Integration voltage/mechanics heavier for early vision |
| ERM Soft Signal | Slow, muddy, easy to misread as generic buzz |
| Separate haptic languages per platform | Violates “same concept, every client” |

## Consequences

### Positive

- High-fidelity Soft Signal and consent cues are designable without pretending phones have VCA.
- Clear split of labor: LRA for edge, VCA for warmth.
- Extends ADR 0039 without breaking Expo demo path.

### Negative / costs

- BOM, power, mechanical isolation, and dual drivers.
- Calibration and user studies required before any hardware claim of “ready.”
- Risk of over-design before private-alpha phone path is done.

### Neutral

- Phone continues on Expo presets; device simulator can proxy waveforms in audio for design.

## Follow-up work

1. Soft Edge v1 pattern pack + bench latency tests (when hardware exists).
2. Perceptual study gate before marketing Soft Signal haptics.
3. Keep `HAPTIC-001` phone implementation aligned with shared event names.
4. Do not block private alpha on device manufacturing.

## References

- `docs/HARDWARE/HAPTICS.md` (canonical)
- `docs/HAPTIC_SYSTEM_DEVICE.md` (pointer)
- `docs/roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md`
- `docs/adr/0039-semantic-haptic-language.md`
- Immersion, “The Haptic Stack – Hardware Layer” (actuator taxonomy: ERM, LRA, VCM, piezo)
