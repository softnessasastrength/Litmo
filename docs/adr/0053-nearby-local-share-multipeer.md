# ADR 0053 — Nearby local share (Multipeer Connectivity)

## Status

Accepted (2026-07-13) for engineering foundation on private-alpha builds.

## Context

People sometimes need to show a **discovery profile** or a **Consent Snapshot
summary** to someone standing next to them without uploading that material to a
server or pasting it into insecure channels. Apple’s AirDrop sets the UX
expectation: intentional, local, temporary, easy to cancel.

Litmo also requires:

- explicit, revocable consent at every step;
- encryption of application payloads;
- never treating a share as session activation or touch consent;
- fail-soft behavior in Expo Go (no native Multipeer module).

Nearby Interaction (U1/U2) is distance-oriented and less suited to general
payload exchange without Multipeer or another transport. **Multipeer
Connectivity** is the chosen primary transport.

## Decision

1. **Transport:** Multipeer Connectivity via Expo module `litmo-local-share`
   (`MCNearbyServiceAdvertiser` / `MCNearbyServiceBrowser` / `MCSession`).
   MCSession encryption preference is `.required`. Service type: `litmo-share`.
2. **Application crypto:** Ephemeral X25519 ECDH + HKDF-SHA-256 + AES-256-GCM
   (`localShareCore.ts`), independent of Multipeer’s transport encryption.
   Keys live only in process memory for the share screen lifetime.
3. **Payloads:**
   - `discovery_profile` — display name, optional pronouns/bio only;
   - `consent_snapshot_review` — plain-language snapshot rows for co-located
     review; flags `notSessionActivation` and `notConsentToTouch` are required.
4. **Consent / opt-out:**
   - Master switch **off by default** (device-local preference);
   - Radio only while `/share/local` is active;
   - Explicit accept of Multipeer invitations;
   - Always-visible **Stop sharing** (signal-style control);
   - **2-minute** default radio timeout;
   - Leaving the screen stops the radio.
5. **Non-goals:** session activation, Soft Signal, private notes, body-zone
   raw data dumps, Android parity in this ADR, Nearby Interaction ranging.
6. **Expo Go:** native module absent → clear “development build required” UX;
   pure protocol remains unit-tested.

## Consequences

- Requires `NSLocalNetworkUsageDescription` and Bonjour services
  `_litmo-share._tcp` / `_litmo-share._udp` (config plugin
  `withLocalShareBonjour.cjs`).
- Physical two-device smoke still needed under ACCESS-001 / private alpha.
- Android nearby share is deferred; no false claim of cross-platform parity.
- Share never writes consent confirmations or activates sessions.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Nearby Interaction only | Ranging-focused; still needs a data channel |
| QR codes only | Works offline but poorer AirDrop-like feel; may add later |
| Server relay | Defeats “local only” and increases sensitive surface |
| Multipeer encryption alone | Keep app-layer crypto so policy AAD (kind) is explicit |

## Related

- `app/services/localShareCore.ts`
- `app/services/localShareService.ts`
- `app/modules/litmo-local-share/`
- `app/app/share/local.tsx`
- `docs/LOCAL_SHARE.md`
- Constitution: share ≠ consent; fail closed
