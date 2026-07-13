# Nearby local share (AirDrop-style)

Intentional, temporary Multipeer Connectivity exchange for:

1. **Discovery profile** — name, pronouns, short intro only  
2. **Consent Snapshot review** — co-located plain-language rows only  

This is **never** consent to touch, **never** session activation, and **never**
a channel for private nervous-system notes.

Authoritative product decision: [ADR 0053](adr/0053-nearby-local-share-multipeer.md).

## Safety model

| Control | Behavior |
| --- | --- |
| Default | Nearby share **off** |
| Master switch | Settings → Nearby share |
| Radio lifetime | Only while Nearby Share screen is open |
| Invitation | Both people must accept connect |
| Encryption | Multipeer `.required` + ephemeral X25519/AES-GCM |
| Stop | Signal-style **Stop sharing now** + leave screen + 2 min timeout |
| Snapshot share | Review only; does not call session activate/confirm |

## User path

1. Turn **Nearby share** on in Settings (or from the share screen).  
2. Open **Nearby Share** from Settings, Profile edit, or a Consent Snapshot.  
3. Choose **discovery profile** or **Consent Snapshot review**.  
4. **Offer** (advertise) or **Receive** (browse).  
5. Confirm the person in front of you; accept invitations carefully.  
6. Review received content; stop the radio when done.

## Technical stack

- Native: `app/modules/litmo-local-share` (Swift Multipeer)  
- Protocol: `app/services/localShareCore.ts`  
- Orchestration: `app/services/localShareService.ts`  
- UI: `app/app/share/local.tsx`  
- Config plugin: `app/plugins/withLocalShareBonjour.cjs`  

### Wire protocol (v1)

1. Connect (Multipeer invitation + accept)  
2. `hello` — ephemeral X25519 public + share kind  
3. Derive session key (ECDH + HKDF, salt = sorted public keys)  
4. Host sends `payload` (AES-GCM ciphertext, AAD binds kind)  
5. `done` / `cancel` / stop tears down keys  

## Build requirements

- iOS **development build** (`npx expo run:ios`), not Expo Go  
- Local Network permission prompt on first use  
- Prefer two physical devices for radio tests  

## What is deliberately excluded

- Raw consent-engine graphs  
- Private notes / boundary internals beyond snapshot rows  
- Auto-start on approach  
- Background advertising  
- Server storage of nearby payloads  

## Testing

```bash
cd app && npm test -- services/localShareCore.test.ts services/localSharePreferenceCore.test.ts
```

Physical device smoke remains a human/private-alpha checklist item.
