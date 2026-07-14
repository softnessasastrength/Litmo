# 16-agent dual-mode architecture swarm

**Status:** canonical synthesis of a 16-role design swarm  
**Date:** 2026-07-14  
**Modes:** `MAXIMUM_MODE` (macOS/Linux/internal) · `APP_STORE_SAFE` (iOS default)  
**Parent:** [DUAL_MODE_ARCHITECTURE.md](DUAL_MODE_ARCHITECTURE.md) · [ADR 0060](adr/0060-dual-build-modes.md)

> One monorepo. One consent engine. Two compile-time skins.  
> Sixteen specialized agents. No hand-waving.

---

## 0. Swarm roster

| # | Role | Owns |
| - | ---- | ---- |
| **01** | Monorepo Systems Architect | Folder tree, package graph, dependency direction |
| **02** | Compile-Time Flags Engineer | Flag dictionary, resolution algorithm, EAS/CI pins |
| **03** | Consent Domain Steward | Mode-agnostic engine law (`soft_limit`, fail-closed, dual seal) |
| **04** | Soft Signal Specialist | Fire pipeline, sacred vs calm copy, hardware gate |
| **05** | Onboarding Flow Designer | First-open → home, demo only Max+dev, age split |
| **06** | Snapshot Dual-Seal Designer | Prepare → arm → seal → Soft Signal mid-seal |
| **07** | Touch Language / Body Map Lead | Zones, soft_limit, private notes, share-is-review-only |
| **08** | Proximity / NFC / Multipeer Gatekeeper | RF gates, unavailable copy, entitlement residual risk |
| **09** | Auth / Age / Passkey Lead | Auth state machine, Face ID ≠ age, prod never self-attest |
| **10** | App Review Survival Specialist | Risk inventory, forbidden copy, submission checklist |
| **11** | Maximum Mode Experience Lead | Full unhinged inventory, anti-patterns, Max tasks |
| **12** | macOS Native + SPM Lead | LitmoBuildMode, XcodeGen, ADR 0045 shell limits |
| **13** | Security / Local-First / Privacy Lead | Vault classes × mode, never-log, wipe/export |
| **14** | CI / Test Matrix Engineer | Dual-mode unit/SPM/EAS/Maestro matrix |
| **15** | Accessibility / ND / Trauma Lead | Sticky Soft Signal, Reduce Motion, toolkit both modes |
| **16** | Docs / ADR / Stewardship Lead | Doc graph L0–L8, anti-stale rules |

---

## 1. Shared product law (all agents agree)

| Law | Statement |
| --- | --------- |
| **Platform → mode** | macOS/Linux → MAXIMUM; iOS family → APP_STORE_SAFE unless explicit override |
| **No runtime unlock** | Store binary cannot become Maximum after ship |
| **Engine never forks** | `@litmo/domain` + snapshot/Soft Signal **cores** ignore mode |
| **Safety core always on** | Soft Signal stop · dual seal · age gate · profile≠consent · fail-closed |
| **Presentation only** | Mode changes copy intensity, RF/NFC/hardware/demo/diagnostics UI |
| **Honest limits** | UI gate ≠ entitlement strip; App Store Safe ≠ Review approval |

```text
                 ┌──────────────────┐
                 │  Single monorepo │
                 │  single domain   │
                 └────────┬─────────┘
           ┌──────────────┴──────────────┐
           │ compile-time mode resolve   │
           └──────────────┬──────────────┘
         ┌────────────────┴────────────────┐
         ▼                                 ▼
 MAXIMUM_MODE                        APP_STORE_SAFE
 full RF · sacred Soft Signal        RF off · calm end copy
 demo · diagnostics · hardware       no demo · no hardware UI
         │                                 │
         └────────────────┬────────────────┘
                          ▼
              softSignalStop = true
              consentDualSeal = true
              ageGate = true
              failClosedBoundaries = true
```

---

## 2. Folder structure (Agent 01 — complete)

```text
Litmo/
├── shared/                    # @litmo/domain — MODE-AGNOSTIC consent law
│   └── src/consentEngine.ts · consentSnapshot.ts · constitutionInvariants.ts
├── packages/
│   └── LitmoBuildMode/        # Swift SPM — MAXIMUM on macOS, APP_STORE_SAFE on iOS
│       ├── Package.swift
│       └── Sources/… BuildMode · FeatureFlags · SoftSignalCopy · ConsentFlowNotes
├── app/                       # Expo RN — both modes via compile-time env
│   ├── config/                # ★ MODE CONTROL PLANE
│   │   ├── buildMode.ts       # MAXIMUM_MODE / APP_STORE_SAFE booleans
│   │   ├── features.ts        # FEATURES_MAXIMUM | FEATURES_APP_STORE
│   │   ├── consentFlowsByMode.ts
│   │   ├── runtime.ts
│   │   └── copy/{maximum,appStore,index}.ts
│   ├── app/                   # Screens — gate features.* at entry
│   ├── lib/                   # Pure client cores (prefer no mode math)
│   ├── services/              # I/O; Soft Signal order mode-agnostic
│   ├── modules/               # Native Expo (NFC/share may still link — strip later)
│   ├── plugins/               # NFC + Bonjour — conditionalize for store (gap)
│   ├── app.config.ts · eas.json
│   └── ios/                   # Generated native project
├── macos/                     # ALWAYS MAXIMUM_MODE (ADR 0045)
│   ├── project.yml            # XcodeGen + SWIFT_ACTIVE_COMPILATION_CONDITIONS
│   └── Sources/LitmoMacCore · LitmoParticipantApp · LitmoOpsApp
├── backend/ · supabase/       # MODE-AGNOSTIC server authority
├── integration/ · scripts/
└── docs/
    ├── DUAL_MODE_ARCHITECTURE.md · BUILD_MODES.md · this file
    └── adr/0060-dual-build-modes.md · 0045-native-macos-…
```

### Dependency direction (Agent 01)

```text
screens → config/features|copy → services → lib cores → @litmo/domain
backend → @litmo/domain → Postgres RLS
macos apps → LitmoMacCore → LitmoBuildMode (SPM leaf)
domain ↛ app/backend/mode flags
```

---

## 3. Feature flag system (Agents 02, 03, 08, 11)

### 3.1 Compile-time symbols

| Symbol | TS | Swift |
| ------ | -- | ----- |
| Mode string | `LITMO_BUILD_MODE` = `maximum` \| `app_store` | `LitmoBuildMode` |
| Boolean | `MAXIMUM_MODE` / `APP_STORE_SAFE` | `#if MAXIMUM_MODE` / `#if APP_STORE_SAFE` |
| Features | `features` / `FEATURES_*` | `LitmoFeatureFlags.current` |
| Soft Signal copy | `softSignalCopy` / `SOFT_SIGNAL_COPY` | `SoftSignalCopyPack.current` |

### 3.2 Resolution (Agent 02 — authoritative steps)

1. Parse `EXPO_PUBLIC_LITMO_BUILD_MODE` (aliases: max, unhinged, store, review…) → if set, return  
2. Invalid string → **throw** (never silent default)  
3. Platform ∈ `{ios, iphoneos, iphonesimulator, ipados, tvos}` → `app_store`  
4. Else → `maximum` (macos, linux, android, web, unknown)  
5. `APP_ENV` is **orthogonal** (demo also needs development + `demoModeSurface`)

### 3.3 Safety core (never false)

`softSignalStop` · `consentDualSeal` · `ageGate` · `profileIsNotConsent` · `failClosedBoundaries`

### 3.4 Mode delta (Maximum ON / Store OFF)

| Flag | Max | Store | Behavior when false |
| ---- | --- | ----- | ------------------- |
| `proximityRadar` | ✅ | ❌ | Unavailable UI; no radio |
| `nfcCarefulConnect` | ✅ | ❌ | Unavailable UI; no NFC session |
| `localMultipeerShare` | ✅ | ❌ | **Must gate `/share/local`** (gap) |
| `hardwareSoftSignal` | ✅ | ❌ | Null bridge; no marketing |
| `diagnosticsPanel` | ✅ | ❌ | Hidden |
| `demoModeSurface` | ✅ | ❌ | No demo card |
| `softSignalSacredCopy` | ✅ | ❌ | Use calm pack |
| `softSignalReviewCopy` | ❌ | ✅ | “End session now” |
| `showBuildModeBadge` | ✅ | ❌ | Hidden |

### 3.5 EAS pins (Agent 02 / 14)

| Profile | Mode |
| ------- | ---- |
| `production`, `preview` | **app_store** |
| `development`, `device_beta`, `preview_simulator`, `production_maximum_internal`, `maximum_linux_ci` | **maximum** |

---

## 4. Behavior by mode — consent-critical flows

### 4.1 Soft Signal (Agent 04)

**Identical pipeline both modes:**

```text
UI local free (0ms) → fire() → remote best-effort
  → private log (fail-open) → haptic (fail-open) → hardware emit (fail-open)
  → always localEnded: true · no reason field
```

| Chrome | MAXIMUM | APP_STORE_SAFE |
| ------ | ------- | -------------- |
| Button | Soft Signal — end now | End session now |
| Banner | Sacred success | End anytime · no peer permission |
| Settled | You are free | Session ended |
| Sticky | … · NEVER A PENALTY | … · NO REASON NEEDED |
| Hardware meta | Allowed | Gated |

**Gap:** Some screens still hardcode Maximum labels (`SoftSignalButton` a11y, wrap-up, active sticky) — unify to pack.

### 4.2 Onboarding (Agent 05)

| Step | MAXIMUM (dev) | APP_STORE |
| ---- | ------------- | --------- |
| Welcome CTA | Explore the prototype | Continue |
| Demo card | **Yes** if development | **Never** |
| ND default | On at demo entry | N/A (no demo) |
| About You age ≥18 | Self-report gate | Same |
| Real age after onboarding | Apple (+ dev attest non-prod) | Apple only in production |
| Boundaries | Fail-closed map | Same math; calmer chrome |
| Completes | Prepare tools only — **never touch** | Same |

### 4.3 Dual seal (Agent 06)

```text
DECLARED → MUTUAL_UNSEALED → (ARM 320ms) → SEALED
                │ Soft Signal / withdraw anytime → WITHDRAWN
```

Both modes: soft_limit first-class · maxDuration min · DEMO partner labeled · arm never gates Soft Signal.

### 4.4 Touch Language (Agent 07)

| Rule | Both modes |
| ---- | ---------- |
| Unset zone | off_limits |
| soft_limit | First-class rank (not almost-welcomed) |
| Hard limits | Win |
| Private notes | Device only; stripped on share |
| Share | Accept gate; not session activation |

**Gaps:** Onboarding boundaries wizard lacks soft_limit UI; server map may collapse soft_limit→ask_first (fidelity bug, not mode policy).

### 4.5 RF (Agent 08)

| Route | Store gate today |
| ----- | ---------------- |
| `/proximity` | ✅ Unavailable |
| `/nfc/connect` | ✅ Unavailable |
| `/share/local` | ❌ **Ungated gap** |
| `/proximity/radar` | ❌ Deep-link gap |
| Home/Settings CTAs | ❌ Still market RF |
| NFC + Bonjour plugins | ❌ Always stamped |

**Residual Review risk:** entitlements without UI — strip plugins for store profiles.

### 4.6 Auth / age (Agent 09)

```text
locked → authenticating/registering → onboarding → age_gate → authenticated
                                              ↘ demo (Max+dev only)
```

| Face ID use | Proves | Not age |
| ----------- | ------ | ------- |
| Passkey UV | Credential ceremony | ❌ |
| App lock | Device owner present | ❌ |
| Sensitive step-up | Fresh local re-auth | ❌ |

**Only** Apple Declared Age Range (or non-prod dev attest when native missing) sets adult eligibility. **Production never self-attest** (client enforced; server should reject too — gap).

### 4.7 macOS shell (Agent 12)

Always MAXIMUM. May: Campfire, self-only reads, mode badge, authority copy.  
**Must not:** live Soft Signal session end, dual-seal recompute, shared App Group with Ops.

### 4.8 Privacy (Agent 13)

| Class | Mode impact |
| ----- | ----------- |
| Soft Signal journal | Same vault class both modes |
| Private notes | Never in compatibility either mode |
| Classification law | **Mode-invariant** |
| Wipe/export | Same rights UX both modes |

### 4.9 A11y / ND / trauma (Agent 15)

| Item | Both modes |
| ---- | ---------- |
| `traumaSafetyToolkit` | **true** |
| Soft Signal sticky outside ScrollView | Required |
| Reduce Motion | Caps cover ease only; stop still 0ms |
| Color sole meaning | Forbidden |
| ND Mode | Device-local; never match trait |

Store rewords “panic” → privacy/calm cover; **does not remove** toolkit.

---

## 5. App Review survival (Agent 10)

### Forbidden in store chrome (sample)

Sacred Soft Signal CTA · Explore the prototype / fictional demo · MAXIMUM badge · Proximity (radar · NFC · AirDrop) marketing · Panic mode / TRAUMA-INFORMED primary titles · Safety scores · Sexual/dating marketing · “Complete deletion” if only queue · GDPR-compliant claims without counsel

### Submission binary

Only `eas build --profile production` (or `preview` staging). Never submit Maximum internal profiles.

### Engineering honesty

APP_STORE_SAFE reduces misclassification risk; it is **not** legal or Review insurance.

---

## 6. Maximum experience inventory (Agent 11)

Unhinged = **more precise**, not more coercive:

- Sacred Soft Signal · full microgrammar · expanded map · soft_limit  
- Demo + ND default · Living Constitution learning · Campfire  
- Proximity · NFC · Multipeer · hardware Soft Signal matrix  
- Diagnostics constitution print  

**Anti-patterns:** swipe-to-consent · reason-at-stop · auto-accept scan · Soft Signal slower than grant · demo peer unlabeled · runtime Max unlock · ND as diagnosis.

---

## 7. CI / test matrix (Agent 14)

| Layer | Proves both modes |
| ----- | ----------------- |
| `buildMode.test.ts` | Resolution, safety core, RF off, copy, flow catalog |
| `softSignalServiceCore.test.ts` | Local end first (mode-agnostic) |
| SPM `BuildModeTests` | Swift matrix parity |
| **Needed** | `release:check` EAS pins; dual-env CI; gate `/share/local`; Maestro store vs max Soft Signal labels |

Maestro `maestro-app-store.yaml` still walks **demo** strings — rename debt; true store binary has no demo.

---

## 8. Documentation graph (Agent 16)

```text
L1 Constitution → L2 ADR 0060 → L3 BUILD_MODES + DUAL_MODE_ARCHITECTURE
→ L4 domain CONSENT/SOFT_SIGNAL (mode-agnostic meaning)
→ L5 features.ts + consentFlowsByMode + LitmoBuildMode
→ L6 CODE_COMMENT_STANDARD
→ L7 CURRENT_STATE / TASKS
```

**Single writers:** policy=ADR 0060 · operator build=BUILD_MODES · matrix narrative=DUAL_MODE · live flags=features.ts+Swift.

---

## 9. Unified gap board (swarm consensus)

**Autism mode run:** [`16_AGENT_AUTISM_MODE_RUN.md`](16_AGENT_AUTISM_MODE_RUN.md) (2026-07-13).

| ID | Gap | Agents | Severity | Status |
| -- | --- | ------ | -------- | ------ |
| G1 | `/share/local` not feature-gated | 02, 08, 10, 14 | **Critical** | **closed** — FeatureUnavailable + `localMultipeerShare` |
| G2 | `/proximity/radar` deep-link ungated | 08 | High | **closed** — FeatureUnavailable + `proximityRadar` |
| G3 | NFC/Bonjour plugins always on for store IPA | 02, 08, 10 | High | open |
| G4 | Soft Signal chrome not fully mode-pack-driven | 04, 10, 15 | High | **closed** — SoftSignalButton pack labels/hints |
| G5 | Home/Settings still market RF in store | 08, 10 | High | **closed** — CTAs gated by features |
| G6 | `release:check` lacks EAS mode pins | 01, 02, 14, 16 | High | **closed** — validate-release.mjs pins |
| G7 | Server accepts `development_self_attest` in prod | 09 | High | **closed** — migration 044 + GUC |
| G8 | Onboarding boundaries lack soft_limit status | 07 | Medium | open |
| G9 | Server soft_limit→ask_first collapse | 07, 03 | Medium | open |
| G10 | TS↔Swift matrix not machine-parity CI | 01, 02, 12, 14 | Medium | open |
| G11 | ADR 0060 prose vs platform-primary code | 02, 16 | Medium | open |
| G12 | Maestro app-store uses demo path | 05, 10, 14 | Medium | open |
| G13 | Privacy deletion honesty for 5.1.1 | 10, 13 | High (distribution) | open |

---

## 10. Unified implementation backlog (priority)

### P0 — Store integrity (ship-blockers)

1. **Gate Multipeer + radar + collapse RF CTAs** (Agents 08, 10, 14)  
2. **Mode-aware Soft Signal chrome end-to-end** (Agent 04)  
3. **`release:check` EAS mode pins** (Agents 02, 14)  
4. **Server reject dev age attest in production** (Agent 09)

### P1 — Fidelity & parity

5. Conditional NFC/Bonjour plugins for app_store prebuild (08, 10)  
6. soft_limit onboarding + server fidelity (07)  
7. Soft Signal mid-seal + fingerprint rebuild on mutual (06)  
8. Dual-env + SPM in CI; TS↔Swift parity (14, 12)  
9. Expand App Store copy packs (Home/Safety/trauma chrome) (10, 15)

### P2 — Stewardship & experience

10. Doc graph in DOCUMENTATION_MAP + CONTINUITY (16)  
11. Maximum diagnostics constitution panel (11)  
12. Privacy class×mode matrix + wipe honesty (13)  
13. Maestro dual Soft Signal tracks (14)  
14. Platonic adult affirm on Entry (05)

---

## 11. How behavior changes (one-page cheat sheet)

| Surface | MAXIMUM_MODE | APP_STORE_SAFE |
| ------- | ------------ | -------------- |
| Soft Signal **law** | Unilateral, 0ms, offline | **Identical** |
| Soft Signal **label** | Soft Signal — end now | End session now |
| Dual seal **law** | Arm + both affixes | **Identical** |
| Dual seal **chrome** | Sacred density | Calmer density |
| Demo | Dev + Max only | Off |
| Proximity/NFC/Multipeer | Full careful path | Unavailable / must gate all routes |
| Age production | Apple only | Apple only |
| Hardware Soft Signal UI | On | Off |
| Diagnostics | On (non-prod) | Off |
| macOS native | Always Max prepare shell | N/A |
| Consent engine | Unchanged | Unchanged |

---

## 12. Agent task highlights (3 each, condensed)

| Agent | Top tasks |
| ----- | --------- |
| 01 | release pin assert · TS↔Swift golden matrix · boundary lint script |
| 02 | share gate + EAS CI · doc/code law · capability flavors |
| 03 | domain ignores mode env tests · softLimit preview · presentation-only rows |
| 04 | pack-driven SoftSignalButton/wrap-up · hardware surface gate · dual-mode copy tests |
| 05 | demo only Max+dev audit · platonic affirm · age copy split |
| 06 | Soft Signal mid-seal · fingerprint rebuild · mode copy DEMO banner |
| 07 | soft_limit on boundaries · server soft_limit fidelity · share privateNotes harness |
| 08 | gate share+radar+services · conditional plugins · UnavailableInThisBuild pack |
| 09 | server reject dev attest · ageGatePolicy helper · Face ID ≠ age docs/tests |
| 10 | expand store copy · capability strip · privacy honesty pack |
| 11 | Soft Signal sacred pass · diagnostics panel · ND demo polish |
| 12 | SPM tests harden · XcodeGen freeze · ADR 0045 boundary suite |
| 13 | class×mode docs · Soft Signal log redaction tests · wipe/export completeness |
| 14 | validate-build-modes · dual-env+SPM CI · Maestro max/store Soft Signal |
| 15 | a11y matrix guard · mode trauma chrome on active · Reduce Motion + XXXL smoke |
| 16 | MAP/CONTINUITY graph · dual-mode feature checklist · algorithm reconcile |

---

## 13. Critical files (swarm)

| Path | Why |
| ---- | --- |
| `app/config/buildMode.ts` | Platform law + booleans |
| `app/config/features.ts` | Live matrix |
| `app/config/copy/*` | Sacred vs calm |
| `app/config/consentFlowsByMode.ts` | Flow machine twin |
| `shared/src/consentEngine.ts` | Mode-agnostic law |
| `app/services/softSignalServiceCore.ts` | Stop order |
| `packages/LitmoBuildMode/` | Swift parity |
| `macos/project.yml` | Max hard-wire |
| `app/eas.json` | Store vs max pins |
| `app/app/share/local.tsx` | Critical ungated RF path |
| `docs/DUAL_MODE_ARCHITECTURE.md` | Parent architecture |

---

*Sixteen specialists. One conclusion:*  
**The engine stays sacred. The store skin stays calm. The flags stay compile-time. Touch is never a transaction.**
