# Litmo authentication

**Canonical product documentation for how real accounts sign in.**  
Passkeys (WebAuthn) are the **primary and only routine** method for production
accounts. Face ID / Touch ID / device passcode provide user verification on
Apple platforms. Demo mode remains account-free.

| Related | Purpose |
| --- | --- |
| [ADR 0010](adr/0010-passkey-first-authentication.md) | Passkey-first decision |
| [ADR 0007](adr/0007-mandatory-face-id-lock.md) | Local Face ID lock (not server auth) |
| [ADR 0011](adr/0011-device-bound-sensitive-data-encryption.md) | Device vault |
| [ADR 0041](adr/0041-development-seed-password-sign-in.md) | Dev seed passwords only |
| [PASSKEY_AUTHENTICATION.md](PASSKEY_AUTHENTICATION.md) | Deployment & threat detail |
| [SENSITIVE_DATA_ENCRYPTION.md](SENSITIVE_DATA_ENCRYPTION.md) | Sensitive vault usage |

---

## 1. Principles

1. **No passwords** for real product accounts.  
2. **Passkeys first** — discoverable Apple platform credentials.  
3. **Email OTP** only proves ownership at account creation (not a login).  
4. **Face ID / Touch ID** (or device passcode) for WebAuthn user verification
   and for local sensitive-screen locks — Litmo never receives biometric data.  
5. **Device registration** after every successful passkey session — hashed
   installation secret, fail-closed on restore.  
6. **Demo mode** needs no account and no passkey.  
7. **Recovery never weakens** the model (no email magic-link login, no password
   reset as a back door).

---

## 2. Stack

```text
iOS app
  ├─ AuthenticationServices (native litmo-passkeys)
  │    Face ID / Touch ID / passcode · UV required
  ├─ Supabase Auth (WebAuthn / passkey API)
  │    startRegistration / verifyRegistration
  │    startAuthentication / verifyAuthentication
  │    list / delete passkeys
  ├─ Expo SecureStore (session + device secret)
  │    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
  └─ deviceRegistrationService
       register / verify / list / revoke (SHA-256 digests server-side)
```

Relying-party ID: **`softnessasastrength.com`** (immutable without a planned
migration). Associated Domains: `webcredentials:softnessasastrength.com`.

---

## 3. User journeys

### 3.1 Create account (smooth registration)

1. **Email + display name** → Supabase `signInWithOtp` (create user).  
2. **One-time code** → `verifyOtp` (bootstrap session only).  
3. **Passkey registration** → Supabase challenge → native AS registration with
   **userVerification = required** (Face ID sheet).  
4. **Device registration** → random installation id + secret in Keychain;
   server stores digest only.  
5. Onboarding → age gate → authenticated app.

If the person cancels Face ID, the bootstrap session is cleared and they can
retry without a sticky global error screen.

### 3.2 Sign in (default for real accounts)

1. Tap **Sign in with passkey** (no email field on the happy path).  
2. Supabase `startAuthentication` → native assertion with Face ID.  
3. `verifyAuthentication` → session.  
4. `deviceRegistrationService.register()` rotates/restores this installation.  
5. Session restore loads profile, age eligibility, safety reconciles.

### 3.3 Add another passkey

Settings → **Passkeys and registered devices** (behind `SensitiveAccessGate`) →
**Add another passkey**. Uses the same registration ceremony while already
authenticated. Removing the last passkey is blocked.

### 3.4 Fallbacks (ordered, honest)

| Fallback | When | Notes |
| --- | --- | --- |
| Retry passkey | Cancel / network blip | Primary |
| Other Apple device + iCloud Keychain | Lost phone | Synced passkey; new device secret |
| Second enrolled passkey | Multiple credentials | Settings enrollment |
| Development seed password | `APP_ENV=development` only | ADR 0041 — not production |
| Demo mode | No backend / Expo Go | No account |
| Human-reviewed recovery | No trusted device left | **Not deployed** — account stays locked |

There is **no** production email+password or magic-link sign-in.

---

## 4. Integration with privacy & devices

| Feature | Integration |
| --- | --- |
| Session storage | SecureStore / Keychain, passcode-required, non-migrating |
| Device secret | Registered after passkey; verified on restore; revoke fails closed |
| SensitiveAccessGate | Local Face ID before security/privacy screens |
| Sensitive vault (ADR 0011) | CryptoKit / LitmoPasskeys encrypt on-device; distinct from passkey private keys |
| Soft Signal / sessions | Unrelated to auth method; require authenticated session for real data |
| Logs | Never log challenges, credentials, device secrets, or biometrics |

---

## 5. Client modules

| Module | Role |
| --- | --- |
| `app/services/authServiceCore.ts` | Pure ceremony orchestration + exclusive lock |
| `app/services/authService.ts` | Supabase + litmo-passkeys wiring |
| `app/modules/litmo-passkeys` | AuthenticationServices + sensitive vault |
| `app/context/AuthContext.tsx` | Status machine, restore, device register hooks |
| `app/app/auth/sign-in.tsx` | Primary passkey UI + dev seed fallback |
| `app/app/auth/sign-up.tsx` | 3-step create flow |
| `app/app/auth/recovery.tsx` | Honest recovery ladder |
| `app/app/security/devices.tsx` | Passkeys list + add + device revoke |

---

## 6. Platform & deployment checklist

1. iOS **development build** (not Expo Go) with `litmo-passkeys`.  
2. Associated Domains `webcredentials:softnessasastrength.com` (paid team).  
3. Serve AASA at  
   `https://softnessasastrength.com/.well-known/apple-app-site-association`.  
4. Supabase Auth passkeys / WebAuthn enabled for the project.  
5. Free Personal Team builds may omit Associated Domains — passkeys will not
   complete; demo mode remains available (`LITMO_FREE_TIER_BUILD`).  

See [PASSKEY_AUTHENTICATION.md](PASSKEY_AUTHENTICATION.md) and
[MACHINE_SETUP.md](MACHINE_SETUP.md).

---

## 7. Threat model (summary)

**Mitigates:** password phishing/reuse, backup extraction of plain tokens,
credential logging, expired challenge replay, restored tokens without device
secret, racing native ceremonies.

**Relies on:** Apple platform integrity, iCloud Keychain recovery model,
TLS/DNS for RP ID, Supabase challenge correctness, RLS.

**Out of scope:** compromised unlocked OS, coerced device-owner auth, full
server compromise. Recovery operator workflow still pending.

---

## 8. Testing

```bash
cd app
npm test -- services/authService.test.ts
npm run typecheck
```

Physical device: register passkey → sign out → sign in with Face ID → confirm
device appears under Settings → add second passkey → revoke other installation
if available.

---

## 9. What “done” means for private alpha

- [x] Passkey registration after OTP bootstrap  
- [x] Discoverable passkey sign-in  
- [x] Device registration after passkey  
- [x] Local Face ID lock for sensitive UI  
- [x] Dev-only seed password fallback  
- [x] Demo without account  
- [x] Add passkey from Settings  
- [ ] Deployed human recovery operator (blocked — intentional)  
- [ ] Android passkey parity (future)  
