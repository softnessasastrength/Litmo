# Litmo dual build modes — Maximum vs App Store Safe

**Status:** canonical  
**ADR:** [`adr/0060-dual-build-modes.md`](adr/0060-dual-build-modes.md)  
**Code:** `app/config/buildMode.ts`, `features.ts`, `copy/*`, `runtime.ts`, `app.config.ts`, `eas.json`

> One repository. Two binaries. Same consent engine. Different skin and optional RF.

---

## 1. The problem this solves

Litmo’s **Maximum** product is intentionally uncompromising:

- Soft Signal as sacred, unilateral, zero-dwell stop  
- Expanded body maps, soft limits, safewords, aftercare  
- Proximity radar, NFC careful-connect, Multipeer share  
- Hardware Soft Signal contracts  
- Autistic-depth copy and diagnostics  

That is correct for **macOS**, **Linux**, and **internal** iOS development.

The **public iOS App Store** rejects or delays apps that look like continuous nearby radio, NFC social, crisis tools, or sexually coded products. We will not fork the consent engine. We **compile-time tame** presentation and optional surfaces for store binaries while leaving Maximum source in the tree.

---

## 2. Platform law + environment axis

| Platform | Default mode | Compile flags |
| -------- | ------------ | ------------- |
| **macOS** | **MAXIMUM_MODE** | `MAXIMUM_MODE` / `maximum` |
| **Linux** | **MAXIMUM_MODE** | same |
| **iOS** | **APP_STORE_SAFE** | `APP_STORE_SAFE` / `app_store` |

Orthogonal environment: `EXPO_PUBLIC_APP_ENV` = development · staging · production.

| Host | Default mode | Notes |
| ---- | ------------ | ----- |
| Mac Expo / native | MAXIMUM | Full experience |
| Linux CI | MAXIMUM | Full tests |
| Any iOS (unset env) | **APP_STORE_SAFE** | Auto-tame |
| EAS `development` / `device_beta` | MAXIMUM (explicit env) | Internal full phone |
| EAS `production` / `preview` | APP_STORE_SAFE | Store path |
| EAS `production_maximum_internal` | MAXIMUM | Internal; do not submit |

Full architecture + consent flow tables: [`DUAL_MODE_ARCHITECTURE.md`](DUAL_MODE_ARCHITECTURE.md).  
Swift SPM: `packages/LitmoBuildMode/`.

---

## 3. How the switch works (compile-time)

```text
┌─────────────────────────────────────────────────────────────┐
│  eas.json profile / shell env                               │
│    EXPO_PUBLIC_LITMO_BUILD_MODE=maximum|app_store           │
│    EXPO_PUBLIC_APP_ENV=development|staging|production       │
│    EXPO_PUBLIC_LITMO_PLATFORM=ios|macos|linux|…             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  app.config.ts                                              │
│    resolveBuildMode() → stamps process.env + extra.*        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Metro bundles JS                                           │
│    import { features, softSignalCopy } from config/*        │
│    IS_APP_STORE_BUILD ? FEATURES_APP_STORE : FEATURES_MAX   │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     Maximum Mode UI              App Store Safe UI
     (full RF + sacred copy)      (gated RF + calm copy)
              │                           │
              └─────────────┬─────────────┘
                            ▼
              SAME safety core
              Soft Signal stop · dual seal · age gate · fail closed
```

### Resolution algorithm (`resolveBuildMode`) — platform-primary

Source of truth: `app/config/buildMode.ts` · ADR 0060 (G11 reconciled).

1. If `EXPO_PUBLIC_LITMO_BUILD_MODE` is set → parse (aliases: `max`, `store`, `review`, …). Invalid → **throw**. Explicit env always wins (EAS pins; internal Maximum iOS).  
2. Else if platform is **iOS family** (`ios` | `iphoneos` | `iphonesimulator` | `ipados` | `tvos`) → `app_store`  
   (including development iOS — staging vs production does **not** flip mode).  
3. Else (macOS, Linux, Android, web, unknown) → `maximum`.

**There is no in-app toggle** to “upgrade” an App Store binary to Maximum. That would violate store integrity and Review rules. Ship a different profile.

---

## 4. Folder structure

```text
app/
  config/
    buildMode.ts          # resolveBuildMode, LITMO_BUILD_MODE, IS_* flags
    buildMode.test.ts
    features.ts           # FEATURES_MAXIMUM | FEATURES_APP_STORE | features
    runtime.ts            # runtimeConfig (env + mode + features)
    copy/
      types.ts            # ModeCopyPack shapes
      maximumCopy.ts      # full autistic voice
      appStoreCopy.ts     # review-sanitized voice
      index.ts            # modeCopy / softSignalCopy / entryCopy / welcomeCopy
  app.config.ts           # stamps mode into Expo extra + env
  eas.json                # profile pins
  app/
    index.tsx             # welcomeCopy
    entry.tsx             # entryCopy + demo gate
    proximity/index.tsx   # features.proximityRadar gate
    nfc/connect.tsx       # features.nfcCarefulConnect gate
  lib/
    softSignalCore.ts     # SOFT_SIGNAL_COPY ← mode-aware pack
docs/
  BUILD_MODES.md          # this file
  adr/0060-dual-build-modes.md
macos/                    # native Mac stays Maximum (ADR 0045)
```

---

## 5. Feature matrix (summary)

| Feature | Maximum | App Store |
| ------- | ------- | --------- |
| Soft Signal stop | ✅ | ✅ |
| Dual seal / consent engine | ✅ | ✅ |
| Age gate | ✅ | ✅ |
| Profile ≠ consent | ✅ | ✅ |
| Fail-closed boundaries | ✅ | ✅ |
| Expanded body map + soft_limit | ✅ | ✅ |
| Soft Signal practice + private log | ✅ | ✅ |
| Trauma toolkit (privacy cover) | ✅ | ✅ |
| Proximity radar RF UI | ✅ | ❌ |
| NFC careful-connect UI | ✅ | ❌ |
| Multipeer local share | ✅ | ❌ |
| Hardware Soft Signal bridge | ✅ | ❌ |
| Diagnostics panel | ✅ | ❌ |
| Demo mode surface | ✅ | ❌ |
| Sacred Soft Signal copy | ✅ | ❌ (calm end-session copy) |
| Build mode badge on entry | ✅ | ❌ |

Full table: `app/config/features.ts` · delta: `featureDelta()`.

---

## 6. Copy dual-pack

| Surface | Maximum | App Store |
| ------- | ------- | --------- |
| Soft Signal button | “Soft Signal — end now” | “End session now” |
| Soft Signal banner | “stop is sacred” | “You can end at any time” |
| Welcome title | “Connection can be soft.” | “Clear boundaries. Soft connection.” |
| Entry | Full prototype honesty | Calmer adult platonic framing |

**Both packs still:**

- Require no explanation to stop  
- State not emergency/crisis services  
- Forbid swipe-to-agree / safety score language  

---

## 7. EAS profiles (how you actually build)

| Profile | Mode | Use |
| ------- | ---- | --- |
| `development` | maximum | Dev client, full phone |
| `device_beta` | maximum | Internal full IPA |
| `preview_simulator` | maximum | Simulator full |
| `preview` | **app_store** | Staging-shaped review candidate |
| `production` | **app_store** | **App Store / TestFlight store path** |
| `production_maximum_internal` | maximum | Internal production-env full (not submit) |
| `maximum_linux_ci` | maximum | Linux CI env stamp |

```bash
# App Store Safe (iOS store)
cd app && eas build --profile production --platform ios

# Maximum internal iOS
cd app && eas build --profile device_beta --platform ios

# Local Expo (Maximum on Mac by default)
cd app && EXPO_PUBLIC_LITMO_BUILD_MODE=maximum npx expo start

# Force App Store skin locally (for copy QA)
cd app && EXPO_PUBLIC_LITMO_BUILD_MODE=app_store EXPO_PUBLIC_LITMO_PLATFORM=ios npx expo start
```

---

## 8. Screen integration pattern

```ts
import { runtimeConfig } from "../config/runtime";
import { softSignalCopy } from "../config/copy"; // or SOFT_SIGNAL_COPY from softSignalCore

if (!runtimeConfig.features.proximityRadar) {
  return <UnavailableInThisBuild />;
}

// Soft Signal still always available when softSignalStop (always true):
<SoftSignalButton onPress={...} />
```

**Rules for new features**

1. Add a key to `LitmoFeatureFlags`.  
2. Set Maximum default (usually `true`).  
3. Explicitly choose App Store value.  
4. Gate UI; do not delete Maximum source.  
5. If user-facing strings, add both copy packs.  
6. Document in this file’s matrix.  

---

## 9. What mode must NEVER do

| Forbidden | Why |
| --------- | --- |
| Disable Soft Signal stop | Constitution |
| Disable age gate in production | Adults only |
| Treat App Store mode as “less consensual” | Same dual-seal law |
| Runtime unlock Maximum inside store binary | Review + integrity |
| Two consent engines | Drift = harm |
| Ship store profile without `BUILD_MODE=app_store` | eas.json pins; CI should assert |

---

## 10. macOS / Linux

- **Native macOS** (`macos/`) remains Maximum participant shell (ADR 0045).  
- **Linux CI** runs Maximum tests; use `maximum_linux_ci` env stamp when exporting web/CI artifacts.  
- **Expo on Mac** defaults to Maximum unless you force `app_store` for copy QA.

---

## 11. Verification

```bash
cd app && npx tsx --test config/buildMode.test.ts
# Also: softSignalCore tests (copy must still ban reason-to-stop)
```

Assert:

- Safety core true in both matrices  
- RF/NFC off in App Store  
- Maximum Soft Signal button contains “Soft Signal”; App Store contains “End session”  
- Both packs mention no explanation / not emergency  

---

## 12. Honest limitations

- App Store Safe is **not** a legal guarantee of App Review approval.  
- Gating UI does not remove native modules from the Xcode project; Review may still see entitlements (NFC, etc.). Further entitlement stripping for store archives is a **follow-up** (Xcode capability sets / scheme flavors).  
- Maximum source remains readable in the open repo — that is intentional for stewardship.  

---

*Touch is not a transaction — it is a language. The engine stays sacred; the store skin stays calm.*
