# 16-Agent Autism Mode — Run Log

**Date:** 2026-07-13 (waves 1–2) · **Agent 06 close:** 2026-07-14  
**Index:** [`16_AGENT_MODE.md`](16_AGENT_MODE.md)  
**Parent synthesis:** [`DUAL_MODE_16_AGENT_SWARM.md`](DUAL_MODE_16_AGENT_SWARM.md)  
**Commits:** `3a6f2d1` (wave 1 P0) · `076049b` (wave 2 residuals) · Agent 06 mid-seal (this run)

**Framing:** Dual-mode store integrity + containment honesty. Soft Signal freeness never reduced.

> Sixteen specialists. Maximum granularity. Engine stays sacred. Store skin stays calm.

---

## Roster disposition (waves 1 + 2 + Agent 06)

| # | Role | Disposition |
| - | ---- | ----------- |
| 01 | Monorepo Systems Architect | EAS pin asserts; parity script entry |
| 02 | Compile-Time Flags Engineer | EAS pins; RF plugin strip in `app.config.ts` |
| 03 | Consent Domain Steward | Safety-core matrix tests; soft_limit first-class in schema |
| 04 | Soft Signal Specialist | SoftSignalButton pack-driven `button` + `hint` |
| 05 | Onboarding Flow Designer | Maestro store path without demo (G12) |
| 06 | Snapshot Dual-Seal Designer | **Closed 2026-07-14** — Soft Signal mid-seal + fingerprint rebuild |
| 07 | Touch Language / Body Map Lead | **G8/G9** soft_limit preserved in completeProfile |
| 08 | Proximity / NFC / Multipeer Gatekeeper | **G1/G2/G3/G5** gates + plugin strip + CTAs |
| 09 | Auth / Age / Passkey Lead | **G7** migration 044 + GUC |
| 10 | App Review Survival Specialist | FeatureUnavailable; **G13** 5.1.1 honesty |
| 11 | Maximum Mode Experience Lead | RF remains Maximum-only |
| 12 | macOS Native + SPM Lead | **G10** Swift side of parity:features |
| 13 | Security / Local-First / Privacy Lead | Wipe honesty; delete-data card |
| 14 | CI / Test Matrix Engineer | buildMode tests; release pins; parity; Maestro |
| 15 | Accessibility / ND / Trauma Lead | Soft Signal a11y retained; no-reason pack |
| 16 | Docs / ADR / Stewardship Lead | Index `16_AGENT_MODE.md`; gap board; this log |

---

## Gaps closed — wave 1 (P0)

| ID | Gap | Fix |
| -- | --- | --- |
| G1 | `/share/local` ungated | `features.localMultipeerShare` → FeatureUnavailable |
| G2 | `/proximity/radar` ungated | `features.proximityRadar` → FeatureUnavailable |
| G4 | Soft Signal chrome not fully pack-driven | SoftSignalButton uses `SOFT_SIGNAL_COPY.button` + `.hint` |
| G5 | Home/Settings market RF in store | CTAs hidden when RF features false |
| G6 | release:check lacks EAS mode pins | validate-release.mjs pins production/preview/dev/max |
| G7 | Server accepts dev attest in prod | migration 044 + GUC `app.litmo_allow_dev_age_attest` |

## Gaps closed — wave 2

| ID | Gap | Fix |
| -- | --- | --- |
| G3 | NFC/Bonjour always on | app.config strips RF plugins unless MAXIMUM |
| G8–G9 | soft_limit collapse | onboarding preserves soft_limit in bodyZones |
| G10 | TS↔Swift parity | `npm run parity:features` |
| G12 | Maestro demo path | maestro-app-store.yaml no fictional demo |
| G13 | Privacy 5.1.1 honesty | APPLE_PRIVACY_5_1_1.md + delete-data card |

## Wave 3 (overnight autonomous)

| ID | Work |
| -- | ---- |
| G11 | ADR 0060 resolution order aligned to platform-primary code |
| — | Relationship Model → Flood / Aftercare / Home wiring |

## Wave 4 — Agent 06 residual (2026-07-14)

| ID | Gap | Fix |
| -- | --- | --- |
| Agent 06 | Soft Signal mid-seal absent on mutual | Sticky `SoftSignalButton` on `/consent-snapshot/mutual`; `withdrawMutualSnapshot` + softSignal haptic; stop wins over seal arm |
| Agent 06 | Fingerprint rebuild on prepare edit | `fingerprintForMutualParties` · `isMutualFingerprintCurrent` · `isSelfDeclarationCurrentForMutual`; focus rebuild + vault persist; prepare `clearMutual` on re-save |
| Agent 06 | Stale fingerprint could keep seal | `parseMutualSnapshot` wipes affirmations + `sealedAt` when stored fingerprint ≠ content |
| Agent 06 | DEMO banner / mode Soft Signal copy | DEMO practice-partner banner retained; Soft Signal labels pack-driven via SoftSignalButton |

---

## Still open (honest)

| ID | Gap | Why open |
| -- | --- | -------- |
| — | Physical App Review submission | external; not inventable |
| backlog 9 | Expand App Store copy packs (Home/Safety/trauma chrome) | presentation polish; Soft Signal freeness unaffected |
| backlog 11 | Maximum diagnostics constitution panel | Max-only craft |
| backlog 14 | Platonic adult affirm on Entry | onboarding copy |
| backlog 15 | Dual-env + SPM in hosted CI | local `parity:features` exists |

---

## Verification run (wave 2 + Agent 06)

```text
npm run parity:features
→ Feature parity OK (14 keys × 2 modes). Soft Signal stop always true on both sides.

node --experimental-strip-types --test lib/sessionConsentSnapshotCore.test.ts
→ 7/7 pass (includes Agent 06 fingerprint + mid-seal + parse stale wipe)
```

---

## Law reaffirmed

- Soft Signal stop · dual seal · age gate · profile≠consent · fail-closed = **always on**
- Soft Signal mid-seal abandons seal; never completes after stop
- Mode changes presentation + RF only
- No runtime unlock from App Store Safe → Maximum

---

**Last updated:** 2026-07-14 (Agent 06 mid-seal residual closed)
