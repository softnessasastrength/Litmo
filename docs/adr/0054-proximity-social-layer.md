# ADR 0054 — Proximity social layer

## Status

Accepted (2026-07-13) for engineering foundation on private-alpha builds.

## Context

Litmo needs a way for consenting adults who are **already co-located** to
discover optional social-weather alignment without defaulting to identity
exposure, server logging, or engagement-maximizing “people nearby” feeds.

ADR 0053 covers intentional **payload share** (profile / Consent Snapshot
review). This ADR covers the **social discovery and handshake ladder** that
must run *before* names appear.

Constitution constraints: consent is never inferred; privacy is default; Soft
Signal-style exits must be easier than continuing; accessibility and
neurodivergent support are core.

## Decision

1. **Master opt-in off by default** (`proximityPreference`).  
2. **Anonymous Multipeer radar** using discoveryInfo beacons (coarse axes only).  
3. **Weather resonance** computed locally; never presented as safety/trust.  
4. **Handshake** via Multipeer invitation + `MCSession` encryption required +
   app-layer ephemeral X25519/AES-GCM.  
5. **Strict gates:** mutual interest, then mutual identity reveal, before any
   name is shown in UI.  
6. **Soft Signal** tears down radio and keys immediately at any step.  
7. **Practice demo path** when native Multipeer is unavailable (Expo Go).  
8. Post-reveal deeper exchange reuses ADR 0053 Nearby Share — still not session
   activation.

Architecture detail: [`docs/PROXIMITY_LAYER.md`](../PROXIMITY_LAYER.md).

## Consequences

- Extends `litmo-local-share` with `startProximityAsync` (advertise + browse).  
- Additional UI surface `/proximity/radar` behind SensitiveAccessGate.  
- Physical two-device smoke still human-led.  
- Android deferred.  
- Must not invent co-location as consent or as a trust signal.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Server geo discovery | Surveillance and stranger-scale risk |
| Always-on BLE identity | Violates privacy-default and Article VII |
| Nearby Interaction only | Ranging without full social payload channel |
| Auto-reveal after handshake | Skips mutual identity consent |

## Related

- `docs/PROXIMITY_LAYER.md`  
- `app/services/proximityCore.ts`  
- `app/services/proximityService.ts`  
- `app/app/proximity/radar.tsx`  
- ADR 0053 Nearby Share  
