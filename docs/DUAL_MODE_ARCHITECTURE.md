# Dual-mode repository architecture — MAXIMUM_MODE × APP_STORE_SAFE

**Status:** canonical engineering architecture  
**ADRs:** [0060](adr/0060-dual-build-modes.md), [0045](adr/0045-native-macos-client-boundaries.md)  
**Code (TS):** `app/config/buildMode.ts`, `features.ts`, `copy/*`, `consentFlowsByMode.ts`, `runtime.ts`  
**Code (Swift SPM):** `packages/LitmoBuildMode/`  
**Code (macOS app):** `macos/project.yml` → `SWIFT_ACTIVE_COMPILATION_CONDITIONS: MAXIMUM_MODE`  
**Operator short form:** [BUILD_MODES.md](BUILD_MODES.md)

> No hand-waving. One monorepo. Two compile-time product modes.  
> Same consent engine. Different skin and optional RF.

---

## 0. Absolute product law (platform → mode)

| Build host / platform | Default compile-time mode | Flag names |
| --------------------- | ------------------------- | ---------- |
| **macOS** | **MAXIMUM_MODE** | `maximum` / `MAXIMUM_MODE=true` |
| **Linux** | **MAXIMUM_MODE** | same |
| **iOS** (device, simulator, EAS ios) | **APP_STORE_SAFE** | `app_store` / `APP_STORE_SAFE=true` |

**Override:** `EXPO_PUBLIC_LITMO_BUILD_MODE` or `LITMO_BUILD_MODE` or Swift `#if` injection  
always wins — used only for **internal** Maximum iOS (`production_maximum_internal`).

**Forbidden:** Runtime user toggle App Store binary → Maximum.

---

## 1. Repository folder structure (complete)

```text
Litmo/
├── app/                              # Expo React Native client
│   ├── config/
│   │   ├── buildMode.ts              # resolveBuildMode, MAXIMUM_MODE, APP_STORE_SAFE
│   │   ├── buildMode.test.ts
│   │   ├── features.ts               # FEATURES_MAXIMUM | FEATURES_APP_STORE
│   │   ├── consentFlowsByMode.ts     # step-by-step flow matrix (machine-readable)
│   │   ├── runtime.ts                # runtimeConfig.features + buildMode
│   │   └── copy/
│   │       ├── types.ts
│   │       ├── maximumCopy.ts        # unhinged voice
│   │       ├── appStoreCopy.ts       # review-sanitized voice
│   │       └── index.ts              # modeCopy façade
│   ├── app.config.ts                 # stamps mode into Expo extra + env
│   ├── eas.json                      # profile pins
│   ├── app/                          # screens (gate on features.*)
│   ├── lib/                          # softSignalCore SOFT_SIGNAL_COPY ← mode
│   ├── components/                   # SoftSignalButton, Consent*
│   └── modules/                      # native Expo modules (NFC, age, passkeys…)
│
├── packages/
│   └── LitmoBuildMode/               # Swift Package Manager
│       ├── Package.swift             # MAXIMUM_MODE on macOS; APP_STORE_SAFE on iOS
│       ├── Sources/LitmoBuildMode/
│       │   ├── BuildMode.swift
│       │   ├── FeatureFlags.swift
│       │   ├── SoftSignalCopy.swift
│       │   └── ConsentFlowNotes.swift
│       └── Tests/LitmoBuildModeTests/
│
├── macos/                            # Native SwiftUI (always Maximum)
│   ├── project.yml                   # XcodeGen + package dep + SWIFT_ACTIVE_COMPILATION_CONDITIONS
│   ├── Sources/LitmoMacCore/
│   ├── Sources/LitmoParticipantApp/  # imports LitmoBuildMode
│   └── Sources/LitmoOpsApp/
│
├── shared/                           # @litmo/domain — mode-agnostic consent engine
│   └── src/consentEngine.ts          # NEVER forked by mode
│
├── backend/                          # Express + snapshot service — mode-agnostic
├── supabase/                         # SQL RLS — mode-agnostic
└── docs/
    ├── DUAL_MODE_ARCHITECTURE.md     # this file
    ├── BUILD_MODES.md
    └── adr/0060-dual-build-modes.md
```

---

## 2. Compile-time flag mechanics

### 2.1 TypeScript / Expo (Metro)

| Symbol | Type | Meaning |
| ------ | ---- | ------- |
| `LITMO_BUILD_MODE` | `"maximum" \| "app_store"` | Frozen string |
| `MAXIMUM_MODE` | `boolean` | `=== maximum` |
| `APP_STORE_SAFE` | `boolean` | `=== app_store` |
| `IS_MAXIMUM_BUILD` | `boolean` | alias |
| `IS_APP_STORE_BUILD` | `boolean` | alias |

**Injection path**

```text
eas.json env
  EXPO_PUBLIC_LITMO_BUILD_MODE=app_store|maximum
  EXPO_PUBLIC_LITMO_PLATFORM=ios|macos|linux
        │
        ▼
app.config.ts
  resolveBuildMode({ envMode, appEnvironment, platform })
  process.env.EXPO_PUBLIC_LITMO_BUILD_MODE = resolved
  extra.litmoBuildMode = resolved
        │
        ▼
Metro inlines EXPO_PUBLIC_* into JS
  import { MAXIMUM_MODE, features } from './config/…'
        │
        ▼
Dead branches (features.proximityRadar === false) never run RF
```

**Resolution algorithm** (`resolveBuildMode`) — exact:

```
1. parseBuildModeEnv(EXPO_PUBLIC_LITMO_BUILD_MODE | LITMO_BUILD_MODE)
   - if valid → return that mode
   - if invalid → throw invalid_litmo_build_mode
2. platform ∈ {ios, iphoneos, iphonesimulator, ipados, tvos} → app_store
3. else → maximum   // macos, linux, android, web, unknown
```

### 2.2 Swift Package Manager (`packages/LitmoBuildMode`)

`Package.swift` sets:

```swift
.swiftSettings: [
  .define("MAXIMUM_MODE", .when(platforms: [.macOS])),
  .define("APP_STORE_SAFE", .when(platforms: [.iOS])),
]
```

`LitmoBuildModeRuntime.active` reads `#if APP_STORE_SAFE` / `#if MAXIMUM_MODE`,  
with platform fallback if neither define is present.

### 2.3 XcodeGen macOS (`macos/project.yml`)

```yaml
packages:
  LitmoBuildMode:
    path: ../packages/LitmoBuildMode
settings.base:
  SWIFT_ACTIVE_COMPILATION_CONDITIONS: MAXIMUM_MODE
# every target also sets SWIFT_ACTIVE_COMPILATION_CONDITIONS: MAXIMUM_MODE
dependencies:
  - package: LitmoBuildMode
    product: LitmoBuildMode
```

Regenerate:

```sh
cd macos && xcodegen generate && open LitmoMac.xcodeproj
```

### 2.4 Swift unit tests (SPM)

```sh
cd packages/LitmoBuildMode && swift test
```

Asserts: safety core true both tables; RF off in appStore; Soft Signal copy labels.

---

## 3. Feature flag system (complete matrix)

Source of truth: **TS** `features.ts` · **Swift** `FeatureFlags.swift` (must stay parallel).

### 3.1 Safety core — ALWAYS true in both modes

| Flag | Meaning if true |
| ---- | --------------- |
| `softSignalStop` | Unilateral local end; no reason; offline OK |
| `consentDualSeal` | Both parties affirm same fingerprint |
| `ageGate` | Real accounts need adult eligibility |
| `profileIsNotConsent` | Vibe/TL/map never authorize touch |
| `failClosedBoundaries` | Missing/unset → off_limits |

### 3.2 Experience (both true today; App Store may thin chrome later)

| Flag | Maximum | App Store | Notes |
| ---- | ------- | --------- | ----- |
| `consentMicrogrammarFull` | ✅ | ✅ | Arm dwell, CONSENT_POINTS |
| `expandedBodyMap` | ✅ | ✅ | Full zone set |
| `softLimitZoneStatus` | ✅ | ✅ | First-class soft_limit |
| `guidedLearningFull` | ✅ | ✅ | Learning catalog |
| `campfirePractice` | ✅ | ✅ | Local practice |
| `traumaSafetyToolkit` | ✅ | ✅ | Cover/exit (wording calmer in store) |
| `softSignalPrivateLog` | ✅ | ✅ | Private history |
| `softSignalPractice` | ✅ | ✅ | Muscle memory |

### 3.3 Review-sensitive (Maximum on / App Store off)

| Flag | Maximum | App Store | Effect when false |
| ---- | ------- | --------- | ----------------- |
| `proximityRadar` | ✅ | ❌ | `/proximity` unavailable screen |
| `nfcCarefulConnect` | ✅ | ❌ | `/nfc/connect` unavailable |
| `localMultipeerShare` | ✅ | ❌ | Share entry gated |
| `hardwareSoftSignal` | ✅ | ❌ | Null hardware bridge UI |
| `diagnosticsPanel` | ✅ | ❌ | Diagnostics hidden |
| `demoModeSurface` | ✅ | ❌ | Demo card off (also needs APP_ENV=development) |
| `softSignalSacredCopy` | ✅ | ❌ | Use review copy pack |
| `softSignalReviewCopy` | ❌ | ✅ | Calm “End session” strings |
| `showBuildModeBadge` | ✅ | ❌ | Hide MAXIMUM badge on store |

### 3.4 Call site pattern (TS)

```ts
import { MAXIMUM_MODE, APP_STORE_SAFE } from "../config/buildMode";
import { runtimeConfig } from "../config/runtime";
import { softSignalCopy } from "../config/copy";

if (!runtimeConfig.features.proximityRadar) {
  return <UnavailableInThisBuild />;
}

// Soft Signal always available when softSignalStop (always true):
<Button label={softSignalCopy.button} onPress={fireSoftSignal} />
```

### 3.5 Call site pattern (Swift)

```swift
import LitmoBuildMode

if LitmoFeatureFlags.current.campfirePractice {
  CampfireHubView()
}
Text(SoftSignalCopyPack.current.button) // sacred on Max; calm on Safe
```

---

## 4. Consent flows — exact behavior by mode

Machine-readable twin: `app/config/consentFlowsByMode.ts`  
Onboarding detail: `docs/ONBOARDING_CONSENT_FLOW.md`  
Snapshot detail: `docs/CONSENT_SNAPSHOT_SYSTEM.md`  
Soft Signal: `docs/SOFT_SIGNAL.md`

### 4.1 Flow A — First-open onboarding (prepare only)

| Step | MAXIMUM_MODE | APP_STORE_SAFE |
| ---- | ------------ | -------------- |
| Welcome primary | “Explore the prototype” / soft connection title | “Continue” / clear boundaries title |
| Entry demo | Present if `APP_ENV=development` | **Omitted** (`demoModeSurface=false`) |
| Entry badge | `MAXIMUM MODE · full consent grammar` | Hidden |
| About You age ≥18 | Gate Next (self-report) | Same gate |
| Vibe quiz | Short if demo/ND; deep if real | Same rules |
| TL save | `notConsentToTouch: true` forced | Same |
| Boundaries | Expanded map; hard stops; private note | Same fail-closed semantics |
| Soft Signal during onboarding | Not required | Not required |
| **Does this seal a session?** | **Never** | **Never** |
| **Does this authorize touch?** | **Never** | **Never** |

### 4.2 Flow B — Consent Snapshot prepare → dual seal

| Step | MAXIMUM_MODE | APP_STORE_SAFE |
| ---- | ------------ | -------------- |
| Prepare declaration | Mood, energy, zones, soft_limit, safewords, aftercare, Soft Signal triple-ack, optional maxDuration | Same domain fields |
| Soft Signal ack copy | Sacred “immediate stop / no explanation / mutual availability” | Same booleans; calmer surrounding UI |
| Mutual intersection | stricter(status); missing→off_limits; soft_limit bucket | **Identical engine math** |
| Grant Confirm | `useConsentGrantArm` dwell 320ms | Same arm law |
| Demo partner | Labeled practice partner (DEMO banner) | Same labeling requirement |
| Seal | both affirmations + fingerprint | Same |
| Soft Signal mid-seal | Abandons seal; local free | Same |
| Button label | “Soft Signal — end now” | “End session now” |
| **Single affirm activates session?** | **No** | **No** |

### 4.3 Flow C — Active session Soft Signal

| Step | MAXIMUM_MODE | APP_STORE_SAFE |
| ---- | ------------ | -------------- |
| Sticky control | Weight 100, signal shell, sacred banner optional | Same weight; calm labels |
| Press order | clearProtectedRuntime → pending storage → remote → log → haptic → hardware | Same order; hardware emit no-op UI |
| localEnded | always true on return | always true |
| Reason field | **Forbidden** | **Forbidden** |
| pending_sync copy | “Stopped on this device…” | “Ended on this device…” |
| Practice screen | “Practice Soft Signal” | “Practice ending a session” |
| Hardware marketing | On | **Off** |

### 4.4 Flow D — Proximity / NFC / Multipeer

| Step | MAXIMUM_MODE | APP_STORE_SAFE |
| ---- | ------------ | -------------- |
| Open `/proximity` | Full hub after SensitiveAccessGate | **Unavailable** copy; no radio start |
| NFC connect | Tag → post-tap Accept gate | **Unavailable** |
| Multipeer share | Review-only accept/decline | **Gated off** |
| Scan auto-opens payload? | **Never** | N/A |

### 4.5 Flow E — Real-account age gate

| Step | MAXIMUM_MODE | APP_STORE_SAFE |
| ---- | ------------ | -------------- |
| Apple Declared Age Range | Yes | Yes (primary production path) |
| Dev self-attest | Non-prod + no native only | **Never in production store** |
| Not adult | Blocked | Blocked |
| Is age a trust score? | **No** | **No** |

### 4.6 Flow F — macOS native shell (always Maximum)

| Surface | Behavior |
| ------- | -------- |
| Mode | `MAXIMUM_MODE` via SPM + XcodeGen |
| Campfire | Local ephemeral; pause without reason |
| Soft Signal live session | **Not owned** (ADR 0045) — phone/server domain |
| Profile / trust / requests | Self-only reads; profile ≠ consent |
| Badge | Shows MAXIMUM_MODE label on Home |

---

## 5. What is shared (mode-agnostic) — never fork

| Layer | Path | Rule |
| ----- | ---- | ---- |
| Consent engine | `shared/src/consentEngine.ts` | soft_limit, fail closed, consentGranted:false |
| Session lifecycle | `shared/src/sessionLifecycle.ts` | terminal states irreversible |
| Snapshot domain (local) | `app/lib/sessionConsentSnapshotCore.ts` | dual seal / withdraw |
| Soft Signal service core | `app/services/softSignalServiceCore.ts` | local end first |
| Emergency stop | `app/services/emergencyStopServiceCore.ts` | pending + reconcile |
| Supabase RLS / SQL | `supabase/migrations/*` | server authority |
| Constitution invariants | `shared/src/constitutionInvariants.ts` | both modes |

**If mode needs different *meaning*, it is a product bug.**  
Mode may only change **presentation**, **optional RF surfaces**, and **copy intensity**.

---

## 6. EAS / local build recipes (exact)

| Command | Mode | Notes |
| ------- | ---- | ----- |
| `cd app && eas build -p ios --profile production` | APP_STORE_SAFE | Store path |
| `cd app && eas build -p ios --profile preview` | APP_STORE_SAFE | Staging review |
| `cd app && eas build -p ios --profile development` | MAXIMUM (explicit env) | Internal full |
| `cd app && eas build -p ios --profile production_maximum_internal` | MAXIMUM | Do not submit |
| `cd app && npm run start:maximum` | MAXIMUM | Local |
| `cd app && npm run start:app-store` | APP_STORE_SAFE | Local copy QA |
| `cd macos && xcodegen generate` | MAXIMUM | Native Mac |
| `cd packages/LitmoBuildMode && swift test` | package tests | SPM |

---

## 7. Testing requirements

| Test | Asserts |
| ---- | ------- |
| `config/buildMode.test.ts` | Platform law; aliases; safety core; RF off in store; copy sacred vs calm; flow catalog Soft Signal both modes |
| `softSignalCore.test.ts` | Log flags; non-punitive messages |
| `softSignalServiceCore.test.ts` | Offline stop; log failure never undoes |
| SPM `BuildModeTests` | Swift matrix parity |
| Manual | iOS store build: no proximity RF start; Soft Signal still ends |

---

## 8. Adding a new feature (checklist)

1. Add key to `LitmoFeatureFlags` (TS) **and** `LitmoFeatureFlags` (Swift).  
2. Set Maximum default (usually `true`).  
3. Explicit App Store value (default `false` if Review-sensitive).  
4. Gate every UI entry point.  
5. If user-visible strings: add both `maximumCopy` and `appStoreCopy` (+ Swift SoftSignalCopy if stop-related).  
6. Add steps to `consentFlowsByMode.ts` if consent-critical.  
7. Update this file’s matrix.  
8. Never disable safety core flags.

---

## 9. Honest limitations

1. **App Store Safe ≠ guaranteed Review approval.**  
2. **UI gates ≠ Xcode capability stripping.** NFC entitlement may still exist in the iOS project until a follow-up entitlement flavor.  
3. **macOS does not run live Soft Signal sessions** (ADR 0045) — Maximum on Mac means full prepare/practice honesty, not a second session engine.  
4. **Open source Maximum source** remains readable in the repo by design (stewardship).  

---

## 10. Mental model (one diagram)

```text
                 ┌──────────────────┐
                 │  Single monorepo │
                 │  single domain   │
                 └────────┬─────────┘
                          │
           ┌──────────────┴──────────────┐
           │ compile-time mode resolve   │
           └──────────────┬──────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
 MAXIMUM_MODE                        APP_STORE_SAFE
 macOS · Linux · internal iOS        iOS store default
 full RF · sacred Soft Signal        RF off · calm end copy
 demo · diagnostics · hardware       no demo · no hardware UI
         │                                 │
         └────────────────┬────────────────┘
                          ▼
              softSignalStop = true
              consentDualSeal = true
              ageGate = true
              profileIsNotConsent = true
              failClosedBoundaries = true
                          │
                          ▼
              Touch still requires
              dual seal + Soft Signal free
```

---

*Touch is not a transaction — it is a language.*  
*The engine stays sacred. The store skin stays calm. The flags stay compile-time.*
