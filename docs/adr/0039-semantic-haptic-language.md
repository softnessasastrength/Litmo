# ADR 0039: Semantic haptic language (expo-haptics)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

HAPTIC-001 requires a small, optional haptic vocabulary for learning and
local safety acknowledgements without implying remote consent or presence.

## Decision

- Add `expo-haptics` (Expo SDK 55) as the only platform haptic dependency.
- Expose a single semantic service (`hapticService` / `hapticServiceCore`) with
  five events: `presence`, `attention`, `confirmation`, `softSignal`,
  `emergencyStop`.
- Screens call semantic `play(event)` only; no direct `expo-haptics` imports
  outside the adapter.
- Local AsyncStorage preference (default on); Settings toggle; disable suppresses
  all events including safety acknowledgements while UI remains complete.
- Soft Signal: commit stop first, then `void play("softSignal")`.
- Physical validation deferred to BETA-001 / walkthrough.

## Alternatives considered

- Core Haptics custom waveforms. Deferred until physical study requires them.
- Default off. Rejected for first slice; toggle remains authoritative.

## Consequences

- Simulator is not acceptance proof for feel/comfort.
- Preference is device-local; no account sync in this slice.
