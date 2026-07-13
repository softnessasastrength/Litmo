# Litmo authentication architecture

**Canonical architecture for real-account sign-in and device trust.**  
Passkeys (WebAuthn) are the **primary and only routine** production method.
Supabase Auth verifies credentials; **custom Edge Functions** add rate limiting
and audit; **device binding** ties installations to passkey sessions and gates
consent confirmation.

| Related | Purpose |
| --- | --- |
| [ADR 0010](adr/0010-passkey-first-authentication.md) | Passkey-first decision |
| [ADR 0056](adr/0056-auth-ceremony-edge-ops.md) | Edge rate limit + audit + consent gate |
| [ADR 0007](adr/0007-mandatory-face-id-lock.md) | Local Face ID lock (not server auth) |
| [ADR 0011](adr/0011-device-bound-sensitive-data-encryption.md) | Device vault |
| [ADR 0041](adr/0041-development-seed-password-sign-in.md) | Dev seed passwords only |
| [PASSKEY_AUTHENTICATION.md](PASSKEY_AUTHENTICATION.md) | Deployment / AASA detail |
| [CONSENT_FLOW.md](CONSENT_FLOW.md) | Consent confirmation product flow |

---

## 1. Principles

1. **No production passwords.**  
2. **Passkeys first** — Apple platform WebAuthn, user verification required.  
3. **Email OTP** only for ownership bootstrap (create account), never login.  
4. **Face ID / Touch ID / passcode** for UV and local sensitive locks — Litmo
   never receives biometric templates.  
5. **Device binding** after every successful passkey session (hashed secret).  
6. **Rate limit + audit** on ceremonies via Edge Function (no secrets in logs).  
7. **Consent requires a bound device** — fail closed without registration.  
8. **Graceful fallbacks** that never weaken security (demo, dev seed, retry).  
9. **Recovery never becomes email+password.**  

---

## 2. System diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│ iOS Litmo app                                                    │
│  litmo-passkeys (AuthenticationServices, UV required)            │
│  authService → Supabase Auth WebAuthn                            │
│  authCeremonyClient → Edge Function auth-ceremony                │
│  deviceRegistrationService → register_auth_device RPC            │
│  sessionRepository.confirmSnapshot → confirm_session_snapshot    │
└───────────────┬───────────────────────────┬─────────────────────┘
                │                           │
                ▼                           ▼
     Supabase Auth (WebAuthn)      Edge: auth-ceremony
     start/verify registration     • assert_auth_ceremony_rate_limit
     start/verify authentication   • log_auth_audit_event
     list/delete passkeys          • no WebAuthn crypto here
                │                           │
                └───────────┬───────────────┘
                            ▼
                   Postgres (public)
                   auth_devices (hashes only)
                   auth_audit_events
                   auth_ceremony_rate_limits
                   consent_snapshot_confirmations
                   (+ require_bound_auth_device gate)
```

**Relying party:** `softnessasastrength.com`  
**Associated Domains:** `webcredentials:softnessasastrength.com`

---

## 3. Layers

### 3.1 Credential layer — Supabase Auth WebAuthn

| Operation | API |
| --- | --- |
| Register options | `auth.passkey.startRegistration()` |
| Register verify | `auth.passkey.verifyRegistration()` |
| Auth options | `auth.passkey.startAuthentication()` |
| Auth verify | `auth.passkey.verifyAuthentication()` |
| Manage | `auth.passkey.list()` / `delete()` |

Native bridge: `app/modules/litmo-passkeys` (ASAuthorization platform passkeys).

Supabase holds **public** credential material only. Private keys stay in Apple
Secure Enclave / iCloud Keychain.

### 3.2 Ceremony ops layer — Edge Function `auth-ceremony`

Path: `supabase/functions/auth-ceremony/`

| Responsibility | Detail |
| --- | --- |
| Rate limiting | `assert_auth_ceremony_rate_limit(subject_hash, action)` |
| Audit | `log_auth_audit_event(...)` non-sensitive metadata only |
| Subject hashing | `sha256(user:id)` or `sha256(ip|ua|ceremony)` — never raw email in DB |
| Fail mode | Explicit **429 rate_limited** fails closed; missing Edge **fails open** for local/dev so demos still work |

**POST body:**

```json
{
  "phase": "start" | "complete",
  "ceremony": "register" | "authenticate" | "otp_request" | "device_register",
  "outcome": "succeeded" | "failed" | "cancelled",
  "deviceId": "uuid-optional",
  "platform": "ios",
  "errorCode": "auth_cancelled"
}
```

**Never logged:** secrets, OTPs, challenges, credentials, biometrics, consent
snapshot contents, refresh tokens.

### 3.3 Device binding layer

| Piece | Role |
| --- | --- |
| Local Keychain | installation `id` + high-entropy `secret` |
| `register_auth_device` | stores **SHA-256** of secret only |
| `verify_auth_device` | session restore fail-closed |
| `revoke_auth_device` | immediate install revoke |

After every successful passkey register/sign-in, the client calls
`deviceRegistrationService.register()` (also audited via Edge).

### 3.4 Consent integration

`confirm_session_snapshot` calls `require_bound_auth_device()` first:

- User must have a **non-revoked** `auth_devices` row.  
- That implies a prior passkey session on this (or restored) installation.  
- Demo mode does not use this RPC path for real confirmations.

This ties **account auth + device trust** to **session-specific consent**
without treating passkey as consent itself.

---

## 4. User journeys

### 4.1 Registration

1. Edge `otp_request` start (rate limit).  
2. Email OTP (ownership only).  
3. Verify OTP → bootstrap session.  
4. Edge `register` start → Supabase startRegistration → Face ID sheet →
   verifyRegistration → Edge complete.  
5. Device register (+ Edge) → onboarding → age gate.

### 4.2 Sign-in (default)

1. Edge `authenticate` start.  
2. Supabase startAuthentication → Face ID → verifyAuthentication.  
3. Edge complete success.  
4. Device register/rotate.  
5. Restore profile + safety reconciles.

### 4.3 Consent confirm

1. User authenticated with passkey.  
2. Device verified on restore.  
3. `confirm_session_snapshot` requires bound device.  
4. Both parties confirm → session `ready` (still not touch until active).

### 4.4 Fallbacks (ordered)

| Order | Path | Notes |
| --- | --- | --- |
| 1 | Retry passkey | Cancel / blip |
| 2 | Other Apple device + iCloud Keychain | New device secret after passkey |
| 3 | Second enrolled passkey | Settings → Add passkey |
| 4 | Dev seed password | `APP_ENV=development` only |
| 5 | Demo mode | No account |
| 6 | Human recovery | **Not deployed** — stay locked |

---

## 5. Rate limits (ceremony)

| Action | Window | Max |
| --- | --- | --- |
| passkey_register_start / complete | 15 min | 8 |
| passkey_auth_start / complete | 15 min | 20 |
| otp_request | 1 hour | 6 |
| device_register | 1 hour | 12 |

Message is non-revealing: *“You're doing that too often — try again later.”*

Abuse limits for sessions/reports/blocks remain in ADR 0028 / migration 026.

---

## 6. Audit model

Table `auth_audit_events`:

- `user_id`, optional `device_id`  
- `event_type`, `outcome`  
- `metadata` jsonb stripped of secret-like keys  

Owners: `list_my_auth_audit_events(limit)`.  
Staff full export: future safety-ops only; not a public trust score.

---

## 7. Client map

| File | Role |
| --- | --- |
| `app/services/authServiceCore.ts` | Ceremonies + exclusive lock + gate hooks |
| `app/services/authService.ts` | Supabase + passkeys + Edge gate |
| `app/services/authCeremonyClient.ts` | Edge invoke |
| `app/services/deviceRegistrationService*.ts` | Binding + Edge on register |
| `app/modules/litmo-passkeys` | Native WebAuthn + sensitive vault |
| `app/context/AuthContext.tsx` | Status machine, restore, cancel calm |
| `app/app/auth/*` | Sign-in / sign-up / recovery UI |
| `app/app/security/devices.tsx` | Passkeys + devices |
| `supabase/functions/auth-ceremony` | Rate limit + audit |
| `supabase/migrations/040_auth_passkey_ops.sql` | Tables + consent gate |

---

## 8. Local / staging / production

| Env | Behavior |
| --- | --- |
| Expo Go | Passkeys unavailable; demo works; Edge call soft-fails open |
| Local Supabase | `supabase db reset`; `supabase functions serve auth-ceremony` for full gate |
| Staging/Prod | Functions deployed; AASA live; passkeys required for real accounts |

Deploy Edge:

```bash
npx supabase functions deploy auth-ceremony
```

---

## 9. Threat model (summary)

| Threat | Control |
| --- | --- |
| Password phishing | No production passwords |
| Ceremony spam | Edge rate limits |
| Audit leakage | Strip secrets; no consent content |
| Stolen backup token | Device secret non-migrating Keychain + verify |
| Consent without device trust | `require_bound_auth_device` |
| Racing Face ID sheets | Exclusive ceremony lock |

**Out of scope:** compromised unlocked OS, coerced biometrics, full server
compromise, undeployed human recovery.

---

## 10. Testing

```bash
cd app && npm test -- services/authService.test.ts services/authCeremonyClient.test.ts
# with local DB:
npx supabase db reset
# pgTAP includes auth_passkey_ops.test.sql when integration suite runs
```

Physical: register passkey → sign out → sign in → confirm device → confirm
snapshot only after device bound → revoke device and ensure consent fails closed
until re-register.

---

## 11. Status checklist

- [x] Passkey primary registration + sign-in (Supabase WebAuthn)  
- [x] Device binding after passkey  
- [x] Edge rate limit + audit  
- [x] Consent confirmation requires bound device  
- [x] Graceful fallbacks (demo / dev seed / cancel calm)  
- [x] Canonical docs (`AUTHENTICATION.md`)  
- [ ] Deployed human recovery operator (blocked intentionally)  
- [ ] Android passkey parity (future)  
