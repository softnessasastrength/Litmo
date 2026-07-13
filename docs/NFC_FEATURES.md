# NFC careful-connect features

Tap-to-connect for Litmo using **NFC NDEF tags**, with graceful fallback to
**system share / QR-capable deep links** and **manual codes**. Built for
explicit post-tap consent, ephemeral E2E encryption, and trauma-informed pace.

**Authoritative decision:** [ADR 0055](adr/0055-nfc-careful-connect.md)  
**Related:** [PROXIMITY_LAYER.md](PROXIMITY_LAYER.md), [LOCAL_SHARE.md](LOCAL_SHARE.md),
ADR 0053 / 0054, Constitution Articles I–V.

> A tap is never consent.  
> A scan is never a session.  
> Soft cancel is always easier than continue.

---

## 1. Goals

| Goal | Behavior |
| --- | --- |
| Quick profile sharing | Discovery-safe name / pronouns / intro after **Accept** |
| Consent Snapshot initiation | Co-located **review invite** only — never activates a session |
| Secure key exchange | Ephemeral X25519 + HKDF + AES-GCM for sealed payloads |
| Explicit consent after every tap | `awaiting_post_tap_consent` gate — fail closed |
| E2E encryption | App-layer seal; NFC carries public offer / sealed blob only |
| Graceful fallback | QR deep link, system Share sheet, 8-character code, paste JSON |
| Trauma-informed | No urgency, Decline = Soft clear, calm copy, ND-friendly steps |

### Non-goals

- Silent background NFC identity  
- iOS third-party **phone-to-phone P2P NFC** (not available; we use tags + fallbacks)  
- Treating NFC as Consent Snapshot confirmation or Soft Signal of a live session  
- Server storage of NFC payloads  

---

## 2. Honest platform model (iOS)

Apple does **not** expose general peer-to-peer NFC between two third-party app
instances the way legacy Android Beam did.

Litmo therefore uses:

1. **Core NFC NDEF reader** — scan a tag (or sticker) that holds a Litmo invite  
2. **Core NFC NDEF writer** — place an invite onto a writable tag  
3. **Deep link / QR / Share / manual code** — same protocol package without RF  

This is intentional and documented so users are never promised “just bump phones”
when the OS cannot support it for third-party apps.

---

## 3. Supported intents

| Intent | After mutual careful accept | Never does |
| --- | --- | --- |
| `profile_share` | Opens sealed discovery profile | Grant touch; become a match score |
| `snapshot_initiate` | Opens sealed **review-only** snapshot rows + optional navigate to snapshot UI | Activate session; record consent |
| `key_exchange` | Confirms ephemeral channel ready | Auto-share private notes |

All offers carry:

- `requiresPostTapConsent: true`  
- `notConsentToTouch: true`  
- `notSessionActivation: true`  
- short **TTL** (default 3 minutes)  

---

## 4. Protocol flow

```text
Host                          Tag / QR / Code                     Guest
────                          ───────────────                     ─────
Create ephemeral X25519
Build NfcOffer (sid, epk, code, intent, exp)
Write NDEF URI  or  Share deep link
                              ───────────────→
                                                    Scan / paste
                                                    POST-TAP REVIEW UI
                                                    [Accept] or [Decline]
                                                    On Accept: guest X25519
                                                    Derive session key
                                                    Share Accept link ──→
Receive Accept
Derive same session key
Seal AES-GCM payload (AAD binds intent+sid)
Share sealed link / write tag ──────────────→
                                                    Open only if accepted
                                                    Show content + disclaimers
```

### Deep link shapes

```text
litmo://nfc/v1/<base64url(offer-json)>
litmo://nfc/accept/v1/<base64url(accept-json)>
litmo://nfc/sealed/v1/<base64url(sealed-json)>
```

Manual fallback also accepts raw JSON paste.

### Crypto

- ECDH: X25519 (`@noble/curves`)  
- KDF: HKDF-SHA-256, info `LitmoNfc-v1`, salt = `sid|sorted(epks)`  
- Seal: AES-256-GCM, AAD `litmo-nfc|v1|{intent}|{sid}`  
- Keys live in process memory only; Cancel / Soft clear zeros state  

---

## 5. UX principles (trauma-informed)

| Pattern | Implementation |
| --- | --- |
| Post-tap consent | After every successful scan, **Accept carefully** vs **Decline** |
| No dark urgency | Expiry is privacy, not a “hurry” countdown in red marketing language |
| Easy exit | Signal-style **Cancel / Soft clear** always available |
| Progressive steps | Create → share/write → peer accept → seal → open |
| ND Mode | Explicit note that codes are fine if NFC is overstimulating |
| Face ID | `/nfc/connect` behind `SensitiveAccessGate` on real accounts |
| Language | “Careful connect”, never “matched by tap” |

---

## 6. Component map

| Piece | Path |
| --- | --- |
| This document | `docs/NFC_FEATURES.md` |
| ADR | `docs/adr/0055-nfc-careful-connect.md` |
| Pure protocol | `app/services/nfcCore.ts` |
| Orchestration | `app/services/nfcService.ts` |
| UI | `app/app/nfc/connect.tsx` |
| Native Core NFC | `app/modules/litmo-nfc/` |
| Config plugin | `app/plugins/withLitmoNfc.cjs` |

Entry points: Home, Settings, Profile edit, Consent Snapshot.

---

## 7. Fallback matrix

| Situation | Path |
| --- | --- |
| Expo Go / no Core NFC module | Share sheet + paste deep link / JSON |
| No writable tag | Host shows code + deep link only |
| Guest cannot use NFC | Paste invite or open shared link |
| Offer expired | Create a new offer (fail closed) |
| Decline | Soft clear; no penalty messaging |

System **Share** is the primary QR path: many OS share sheets can present a QR
for a URL. Litmo does not require a third-party QR dependency for private alpha.

---

## 8. Threat model (summary)

| Threat | Mitigation |
| --- | --- |
| Stolen tag replay | Short TTL; single-session `sid` |
| Tap coercion | Post-tap Accept mandatory; Decline primary |
| Shoulder surfing of code | Codes expire; no private notes on offer |
| MitM on air | ECDH + GCM; co-location threat model remains |
| Server correlation | No NFC payload upload |
| Confused deputy (wrong intent) | AAD binds intent; UI restates intent before Accept |

---

## 9. Build requirements

```bash
cd app
# after native module link
npx expo prebuild --platform ios   # or expo run:ios
```

Entitlements / Info:

- `NFCReaderUsageDescription`  
- `com.apple.developer.nfc.readersession.formats = NDEF`  

Physical tags (NTAG213/215 class) recommended for write tests.

---

## 10. Testing

```bash
cd app
npm test -- services/nfcCore.test.ts
npm run typecheck
```

Hardware NFC read/write smoke remains human-led on a development build.

---

## 11. Relationship to other nearby layers

| Layer | When to use |
| --- | --- |
| NFC (this doc) | Tag / QR / code bootstrap for a **specific** careful intent |
| Proximity (ADR 0054) | Anonymous multi-peer radar before names |
| Nearby Share (ADR 0053) | Multipeer AirDrop-style payload after presence is clear |

They compose: NFC can bootstrap keys; Multipeer can carry larger later shares;
Proximity stays anonymous-first.

---

## 12. Future (not authorized here)

- Android Host Card Emulation peer path  
- On-screen QR matrix renderer without Share sheet  
- Optional second-factor confirmation phrase displayed on both phones  
