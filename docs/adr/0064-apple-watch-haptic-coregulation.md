# ADR 0064 — Apple Watch as soft co-regulation haptic device

- **Status:** accepted for domain + stubs; Watch app binary not yet shipping  
- **Date:** 2026-07-13  
- **Constitution:** I.4 Soft Signal · IV no engagement · V ND · X honesty  
- **Related:** ADR 0039 · 0063 · `docs/HAPTIC_LANGUAGE.md`

## Context

Phone haptics (Expo) and a pure nuclear grammar exist. Apple Watch offers
always-on wrist presence and a precise Taptic Engine — ideal for Soft Signal
and co-regulation **if** it never becomes a notification or FOMO surface.

## Decision

1. **Watch is first-class** in `@litmo/domain` (`hapticLanguage.ts`, `hapticWatch.ts`):
   capabilities, sensory profiles, cross-device propose/preview/affirm,
   Soft Signal kill commands, complication intents (Soft Signal / check-in only).
2. **Soft Signal from wrist** is offline-first, unilateral, kills all haptics,
   ends session when `sessionId` present — never waits on phone ACK.
3. **Cross-device consent:** phone proposes; Watch previews and affirms; live
   play requires required devices affirmed; Soft Signal never requires preview.
4. **Native shells:** Expo module `litmo-watch-haptics` (fail-closed stubs) +
   SPM `packages/LitmoWatchHaptics` (Swift Taptic library types).
5. **Non-goals for v0.1:** full Watch UI app, App Store Watch target, social
   complications, HR medical claims, peer presence spoofing.

## Alternatives considered

- Watch as phone notification mirror only — rejected (not co-regulation).  
- Auto-play partner patterns on wrist — rejected (consent violation).  
- Delay Soft Signal for WCSession — rejected (I.4).

## Consequences

- Domain tests lock cross-device gates before silicon.  
- Phone Soft Signal remains primary until Watch app ships.  
- Learning path `haptic-watch-track` teaches flows without requiring hardware.  
- Future Watch app maps `LitmoWatchPhraseLibrary` → `WKInterfaceDevice` haptics.

## Integration flow

```text
[Phone] propose pattern + consentId
    → [Watch] preview Taptic (local only)
    → [Watch] affirm | Soft Signal | decline
    → vocabulary.affirmedDeviceIds
    → live play only if mayPlayOnDevice ok
[Watch] Soft Signal anytime
    → SoftSignalKillCommand (kill haptics + end session)
    → phone reconciles offline-first
```
