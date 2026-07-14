# 16-Agent Mode — Operator Index

**Status:** active dual-mode stewardship protocol  
**Date:** 2026-07-13  
**Purpose:** One door into the sixteen-role dual-mode swarm — roster, law, gap board, how to re-run autism mode, and where the code lives.

> Sixteen specialists. One monorepo. One consent engine. Two compile-time skins.  
> Soft Signal freeness is never a mode flag.

**This is currently a personal emotional containment system that also carries dual-mode product residue.** Documentation here must stay honest about both.

---

## Read order

| Order | Doc | Role |
| ----- | --- | ---- |
| **0** | **This file** | Index + how to run 16-agent mode |
| 1 | [`DUAL_MODE_16_AGENT_SWARM.md`](DUAL_MODE_16_AGENT_SWARM.md) | Canonical roster, architecture synthesis, gap board |
| 2 | [`16_AGENT_AUTISM_MODE_RUN.md`](16_AGENT_AUTISM_MODE_RUN.md) | Latest autism-mode execution log (what closed) |
| 3 | [`DUAL_MODE_ARCHITECTURE.md`](DUAL_MODE_ARCHITECTURE.md) | Folder tree, flags, flows |
| 4 | [`BUILD_MODES.md`](BUILD_MODES.md) | Operator build manual |
| 5 | [`adr/0060-dual-build-modes.md`](adr/0060-dual-build-modes.md) | Policy ADR |
| 6 | [`APPLE_PRIVACY_5_1_1.md`](APPLE_PRIVACY_5_1_1.md) | Store deletion honesty (G13) |

Related: [`FEATURE_SWARM_TRACKER.md`](FEATURE_SWARM_TRACKER.md) (older five-stream feature swarm) · [`NUCLEAR_SWARM.md`](NUCLEAR_SWARM.md) (constitution nuclear).

---

## Shared product law (all 16 agents)

| Law | Statement |
| --- | --------- |
| **Platform → mode** | macOS/Linux → MAXIMUM; iOS family → APP_STORE_SAFE unless explicit override |
| **No runtime unlock** | Store binary cannot become Maximum after ship |
| **Engine never forks** | `@litmo/domain` + snapshot/Soft Signal **cores** ignore mode |
| **Safety core always on** | Soft Signal stop · dual seal · age gate · profile≠consent · fail-closed |
| **Presentation only** | Mode changes copy intensity, RF/NFC/hardware/demo/diagnostics UI |
| **Honest limits** | UI gate ≠ entitlement strip alone; App Store Safe ≠ Review approval |

---

## Swarm roster

| # | Role | Owns |
| - | ---- | ---- |
| **01** | Monorepo Systems Architect | Folder tree, package graph, dependency direction, release pins |
| **02** | Compile-Time Flags Engineer | Flag dictionary, resolution algorithm, EAS/CI pins, plugins by mode |
| **03** | Consent Domain Steward | Mode-agnostic engine law (`soft_limit`, fail-closed, dual seal) |
| **04** | Soft Signal Specialist | Fire pipeline, sacred vs calm copy, SoftSignalButton packs |
| **05** | Onboarding Flow Designer | First-open → home, demo only Max+dev, age split |
| **06** | Snapshot Dual-Seal Designer | Prepare → arm → seal → Soft Signal mid-seal |
| **07** | Touch Language / Body Map Lead | Zones, soft_limit fidelity, private notes, share-is-review-only |
| **08** | Proximity / NFC / Multipeer Gatekeeper | RF gates, FeatureUnavailable, plugin strip, CTAs |
| **09** | Auth / Age / Passkey Lead | Auth state machine, Face ID ≠ age, prod never self-attest |
| **10** | App Review Survival Specialist | Risk inventory, forbidden copy, 5.1.1 honesty |
| **11** | Maximum Mode Experience Lead | Full unhinged inventory, diagnostics, Max-only RF |
| **12** | macOS Native + SPM Lead | LitmoBuildMode, XcodeGen, Swift matrix |
| **13** | Security / Local-First / Privacy Lead | Vault classes × mode, wipe/export, never-log |
| **14** | CI / Test Matrix Engineer | Dual-mode unit/SPM/EAS/Maestro matrix, parity script |
| **15** | Accessibility / ND / Trauma Lead | Sticky Soft Signal, Reduce Motion, trauma chrome both modes |
| **16** | Docs / ADR / Stewardship Lead | Doc graph, gap board truth, this index, run logs |

---

## Critical code map

| Path | Agents | Why |
| ---- | ------ | --- |
| `app/config/buildMode.ts` | 01, 02 | Platform law + booleans |
| `app/config/features.ts` | 02, 03, 08, 11 | Live matrix |
| `app/config/copy/*` | 04, 10, 15 | Sacred vs calm |
| `app/app.config.ts` | 02, 08 | Mode stamp + RF plugin strip (G3) |
| `app/components/SoftSignalButton.tsx` | 04, 15 | Pack-driven chrome |
| `app/components/FeatureUnavailable.tsx` | 08, 10 | Honest unavailable RF |
| `app/app/share/local.tsx` | 08 | G1 Multipeer gate |
| `app/app/proximity/radar.tsx` | 08 | G2 radar gate |
| `packages/LitmoBuildMode/` | 12, 14 | Swift parity |
| `app/eas.json` | 02, 14 | Store vs max pins |
| `scripts/validate-release.mjs` | 01, 14 | EAS mode asserts (G6) |
| `scripts/validate-feature-parity.mjs` | 01, 12, 14 | TS↔Swift (G10) |
| `supabase/migrations/044_reject_dev_age_attest_in_production.sql` | 09 | G7 |
| `docs/screenshots/maestro-app-store.yaml` | 05, 10, 14 | G12 no-demo store path |

---

## How to re-run “16-agent autism mode”

1. Read this index + gap board in `DUAL_MODE_16_AGENT_SWARM.md` §9.  
2. Prefer **open** gaps only; do not invent product launch claims.  
3. For each agent: implement largest safe unit; Soft Signal freeness never reduced.  
4. Run checks:

```bash
npm run parity:features
# from app workspace:
node --experimental-strip-types --test config/buildMode.test.ts
# release pins (needs production-like env + ios artifacts when available):
# EXPO_PUBLIC_APP_ENV=production … npm run release:check
```

5. Update `16_AGENT_AUTISM_MODE_RUN.md` with disposition + closed IDs.  
6. Update gap board status in `DUAL_MODE_16_AGENT_SWARM.md`.  
7. Changelog + `CURRENT_STATE.md` + commit/push.

---

## Gap board summary (as of wave 2)

| Status | IDs |
| ------ | --- |
| **Closed** | G1, G2, G3, G4, G5, G6, G7, G8, G9, G10, G12, G13 |
| **Open** | G11 (ADR 0060 prose vs platform-primary code) |

Full table + backlog: [`DUAL_MODE_16_AGENT_SWARM.md`](DUAL_MODE_16_AGENT_SWARM.md) §9–10.  
Execution detail: [`16_AGENT_AUTISM_MODE_RUN.md`](16_AGENT_AUTISM_MODE_RUN.md).

---

## Commands cheat sheet

| Command | Proves |
| ------- | ------ |
| `npm run parity:features` | TS `features.ts` ↔ Swift `FeatureFlags.swift` |
| `npm run release:check` | EAS env pins + release hygiene (when artifacts present) |
| `EXPO_PUBLIC_LITMO_BUILD_MODE=app_store` | Force App Store Safe resolution in JS/config |
| `EXPO_PUBLIC_LITMO_BUILD_MODE=maximum` | Force Maximum |

---

## Stewardship notes (Agent 16)

- **Single writers:** policy = ADR 0060 · operator build = BUILD_MODES · matrix narrative = DUAL_MODE_ARCHITECTURE · live flags = `features.ts` + Swift · **run truth** = this index + AUTISM_MODE_RUN.  
- Do not leave gap status only in chat — update §9 of the swarm doc.  
- Containment protocols (Pre-Renn, Flood, Field Notes, etc.) are orthogonal; they must not re-enable RF in App Store Safe.  

---

*Sixteen specialists. One conclusion:*  
**The engine stays sacred. The store skin stays calm. The flags stay compile-time. Touch is never a transaction.**

**Last updated:** 2026-07-13
