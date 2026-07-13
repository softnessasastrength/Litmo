# Proximity social layer

Architecture for Litmo’s **opt-in, privacy-first nearby social layer**: anonymous
presence, compatibility radar, secure local handshake, and strict consent
gating before any identity reveal.

**Authoritative decision:** [ADR 0054](adr/0054-proximity-social-layer.md)  
**Related:** [ADR 0053](adr/0053-nearby-local-share-multipeer.md) (AirDrop-style
payload share), [LOCAL_SHARE.md](LOCAL_SHARE.md), Constitution Articles I–V.

> Touch is not a transaction — it is a language.  
> Proximity is not consent. Resonance is not safety. A name is not a yes.

---

## 1. Goals

| Goal | Product meaning |
| --- | --- |
| Opt-in nearby discovery | Radio **off by default**; master switch + intentional start |
| Anonymized compatibility radar | See *weather resonance* without names, photos, or account IDs |
| Secure local handshake | Apple **Multipeer Connectivity** + app-layer **E2E** (ephemeral X25519 + AES-GCM) |
| Consent before identity | **Mutual** interest, then **mutual** reveal — fail closed |
| Soft Signal exits | One control ends radio + clears keys; no explanation, no penalty |
| Trauma-informed | No urgency dark patterns; easy leave; calm copy under stress |
| Neurodivergent-friendly | Progressive disclosure, quiet-preferred default, reduced stimulation alignment |

Non-goals for this layer:

- Background advertising while the app is closed  
- Precise geolocation or UWB ranging as identity  
- Server-side “who was near whom” logs  
- Auto session activation or Soft Signal of a *physical* session (that remains phone session lifecycle)  
- Public safety scores or ranking for engagement  

---

## 2. Disclosure ladder (never skip)

```text
OFF (default)
  → Master opt-in (Settings / Proximity intro)
  → Anonymous radar (beacon only)
  → Optional private handshake request
  → Mutual Multipeer accept
  → Ephemeral ECDH (encrypted channel)
  → Mutual interest (“continue carefully”)
  → Mutual identity reveal consent
  → Optional deeper Nearby Share (ADR 0053)
  → Soft Signal / stop / timeout → OFF
```

Each step is **explicit, revocable, and independent**. Prior steps never imply
later ones. Soft Signal may be pressed at **any** step.

### What is visible at each stage

| Stage | Peer sees | You see about them |
| --- | --- | --- |
| Radar | Anonymous token, coarse axes, optional weather family, quiet flag | Same + local **resonance** 0–100 |
| Handshake pending | That someone invited/accepted (still anonymous label) | Same |
| Encrypted | Nothing identity-bearing until interest | Channel ready |
| Mutual interest | Willingness to continue carefully | Same |
| Identity revealed | Display name / pronouns / short intro **only if both consented** | Same |
| Soft Signal | Radio gone; optional best-effort `px_soft_signal` | Calm exit copy |

---

## 3. Anonymous beacon (public discovery only)

Carried in Multipeer **discoveryInfo** (size-constrained):

```text
m=px
b=v1|p{p}r{r}s{s}e{e}|w{H|L|T|n}|q{0|1}|t{token}
```

| Field | Meaning |
| --- | --- |
| pace / presence / sensory / repair | Coarse **0–3** axes (social weather, not Touch Language) |
| weather | Optional vibe family: hearth / lantern / tidepool / none |
| quiet | Prefers quieter nearby interactions |
| token | **Ephemeral** rotating id — **not** account id |

**Never** in the beacon:

- Legal name, display name, photo  
- Account UUID, email, phone  
- Body zones, consent boundaries, private notes  
- Precise location, home address, real-time GPS  

Multipeer peer display names for this mode are **minted anonymous** labels
(`·` + short token), not profile names.

---

## 4. Compatibility radar (“weather resonance”)

Pure local function of two beacons:

- Distance over four axes (max 12) → score **0–100**  
- Quiet-preference match slightly boosts; mismatch slightly dampens  
- Bands: distant / gentle / aligned / very_aligned  

**Mandatory disclaimer (product + UI):**

> Weather resonance only. Not safety, not trust, not consent to touch, not a match.

Resonance **must not**:

- Rank people for engagement maximization  
- Gate session eligibility  
- Appear as a “safety score” or verification badge  
- Substitute for Consent Snapshot or live confirmation  

---

## 5. Secure handshake (Apple + app E2E)

### Transport (Apple)

- Framework: **Multipeer Connectivity** (`MCNearbyServiceAdvertiser` +
  `MCNearbyServiceBrowser` + `MCSession`)  
- Module: `app/modules/litmo-local-share` → `startProximityAsync`  
- `MCSession` encryption preference: **`.required`**  
- Service type: `litmo-share` (shared with Nearby Share; mode discriminated by
  discoveryInfo `m=px`)  
- Local Network + Bonjour entitlements/copy: existing
  `withLocalShareBonjour.cjs`  

**Why Multipeer (not Nearby Interaction alone):** NI is primarily ranging;
payload social handshake still needs a data channel. Multipeer provides
discovery + encrypted session transport offline. Nearby Interaction may be
considered later as an *optional* distance cue, not as identity.

### Application E2E (Litmo)

Even with Multipeer transport encryption, application payloads use:

1. Ephemeral **X25519** key pairs (memory only)  
2. **HKDF-SHA-256** session key (same construction as Nearby Share)  
3. **AES-256-GCM** for interest + identity blobs  
4. Tear-down on Soft Signal / leave / timeout wipes keys  

Wire types (`proximityCore`):

| Message | Purpose |
| --- | --- |
| `px_hello` / `px_hello_ack` | ECDH public exchange |
| `px_interest` | Sealed “want to continue carefully” |
| `px_identity_offer` / `px_identity_accept` | Sealed identity + mutual accept |
| `px_soft_signal` / `px_cancel` | Immediate cooperative exit |

---

## 6. Identity reveal gate (fail closed)

```ts
mayRevealIdentity({
  localAcceptedReveal,
  peerAcceptedReveal,
  encryptedChannelReady,
  softSignaled,
})
```

Rules:

1. Soft Signal → **never** reveal  
2. No session key → **never** reveal  
3. Only **both** local and peer accept → show name  
4. Peer’s sealed identity is held in memory until local consent; UI must not
   flash a name early  
5. Revealed payload includes `notConsentToTouch` and `notSessionActivation`  

After reveal, optional **Nearby Share** (ADR 0053) may exchange a fuller
discovery profile or co-located Consent Snapshot **review** — still not
session activation.

---

## 7. Soft Signal (proximity context)

Soft Signal in the proximity layer means:

1. Play local `softSignal` haptic (if haptics allowed)  
2. Best-effort notify peer (`px_soft_signal`)  
3. Stop Multipeer advertise/browse/session  
4. Zero session keys and beacons from process memory  
5. Calm copy: no explanation needed, no penalty, not emergency services  

Soft Signal is **always** more prominent than continue actions (signal button
variant). Ending proximity Soft Signal does **not** by itself Soft-Signal an
unrelated active physical session (session Soft Signal remains on the session
screen).

Default privacy timeout: **5 minutes** of radio, then Soft Signal for the user.

---

## 8. Trauma-informed & neurodivergent design

| Pattern | Implementation |
| --- | --- |
| No dark urgency | No “only 3 nearby — act now” |
| Easy exit | Soft Signal + leave screen + timeout |
| Progressive disclosure | ND Mode can hide axis detail until later phases |
| Quiet default | `quietPreferred: true` in default prefs |
| Clear language | “Weather resonance”, never “compatibility score” as safety |
| One step at a time | Intro → radar → handshake → interest → reveal |
| Practice path | Demo radar with fictional peers (no radio) |
| Face ID | Proximity screen behind `SensitiveAccessGate` on real accounts |
| Reduced motion | No pulsing “radar rings” required for meaning |

---

## 9. Component map

| Piece | Path |
| --- | --- |
| Architecture (this doc) | `docs/PROXIMITY_LAYER.md` |
| ADR | `docs/adr/0054-proximity-social-layer.md` |
| Pure protocol | `app/services/proximityCore.ts` |
| Preferences | `app/services/proximityPreference*.ts` |
| Orchestration | `app/services/proximityService.ts` |
| UI | `app/app/proximity/radar.tsx` |
| Native transport | `app/modules/litmo-local-share` (`startProximityAsync`) |
| Payload share (post-reveal) | `app/app/share/local.tsx` (ADR 0053) |

---

## 10. Threat model (summary)

| Threat | Mitigation |
| --- | --- |
| Stalking via persistent IDs | Ephemeral tokens + anonymous MC names; short radio lifetime |
| Name leakage on beacon | Names never in discoveryInfo |
| Coercion to continue | Soft Signal primary; decline without penalty |
| MitM on local radio | Multipeer encryption + app ECDH; still co-location threat model |
| Server correlation | No proximity payloads uploaded |
| Fake “safe match” | Explicit non-safety disclaimer; no trust badges on radar |
| Expo Go confusion | Fail soft + **practice demo** path |

Co-located adversaries who can receive Multipeer advertisements can see
**anonymous** beacons. That is accepted for radar utility; identity remains
gated. Users who need zero RF presence leave radio off.

---

## 11. User paths

### A. Real devices (development build)

1. Settings or Home → **Proximity**  
2. Allow proximity + tune axes  
3. **Start anonymous radar**  
4. See resonance cards; optionally **Request private handshake**  
5. Accept only if the in-person situation feels right  
6. Mutual interest → optional mutual identity reveal  
7. Soft Signal or stop when done  

### B. Practice (any build / Expo Go)

1. **Practice radar (demo, no radio)**  
2. Fictional neighbors with resonance  
3. Practice handshake / interest / reveal with demo peer  
4. Soft Signal ends practice  

---

## 12. Testing

```bash
cd app
npm test -- services/proximityCore.test.ts services/proximityPreferenceCore.test.ts
npm run typecheck
```

Physical two-device Multipeer smoke remains human-led (ACCESS-001 residual /
private alpha).

---

## 13. Honest limits

- Android proximity not implemented in this milestone  
- Multipeer range and OS permission behavior vary  
- Demo peers are not real people and must stay labeled  
- Independent crypto review still recommended before external beta  
- Does not replace Consent Snapshot, blocking, reporting, or session Soft Signal  

---

## 14. Future (not authorized by this doc alone)

- Optional Nearby Interaction distance band as a soft cue  
- Android Nearby Connections parity  
- Rotating BLE-only presence without Multipeer (research)  
- Venue-scale “campfire room” beacons with staff governance  

Any expansion must preserve the disclosure ladder and Soft Signal primacy.
