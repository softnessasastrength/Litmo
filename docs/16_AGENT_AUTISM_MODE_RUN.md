# 16-Agent Autism Mode — Run Log

**Date:** 2026-07-13  
**Parent:** [`DUAL_MODE_16_AGENT_SWARM.md`](DUAL_MODE_16_AGENT_SWARM.md)  
**Framing:** Dual-mode store integrity + containment honesty. Soft Signal freeness never reduced.

> Sixteen specialists. Maximum granularity. Engine stays sacred. Store skin stays calm.

---

## Roster disposition (this run)

| # | Role | This run |
| - | ---- | -------- |
| 01 | Monorepo Systems Architect | release:check EAS pin asserts |
| 02 | Compile-Time Flags Engineer | EAS pins + feature gate surfaces |
| 03 | Consent Domain Steward | Safety-core matrix tests (RF off, Soft Signal on) |
| 04 | Soft Signal Specialist | SoftSignalButton pack-driven labels/hints |
| 05 | Onboarding Flow Designer | deferred (no P0 regression) |
| 06 | Snapshot Dual-Seal Designer | deferred |
| 07 | Touch Language / Body Map Lead | deferred soft_limit (P1 residual) |
| 08 | Proximity / NFC / Multipeer Gatekeeper | **G1/G2/G5 closed** — share/local, radar, Home/Settings CTAs |
| 09 | Auth / Age / Passkey Lead | **G7** migration 044 reject dev attest without GUC |
| 10 | App Review Survival Specialist | FeatureUnavailable honest copy |
| 11 | Maximum Mode Experience Lead | RF remains Maximum-only |
| 12 | macOS Native + SPM Lead | deferred parity CI |
| 13 | Security / Local-First / Privacy Lead | wipe keys already cover containment; RF not leaked in store UI |
| 14 | CI / Test Matrix Engineer | buildMode tests + release pin checks |
| 15 | Accessibility / ND / Trauma Lead | Soft Signal a11y labels retained; pack hint still no-reason |
| 16 | Docs / ADR / Stewardship Lead | this file + gap board update + CHANGELOG |

---

## Gaps closed

| ID | Gap | Fix |
| -- | --- | --- |
| G1 | `/share/local` ungated | `features.localMultipeerShare` → FeatureUnavailable |
| G2 | `/proximity/radar` ungated | `features.proximityRadar` → FeatureUnavailable |
| G4 | Soft Signal chrome not fully pack-driven | SoftSignalButton uses `SOFT_SIGNAL_COPY.button` + `.hint` |
| G5 | Home/Settings market RF in store | CTAs hidden when RF features false |
| G6 | release:check lacks EAS mode pins | validate-release.mjs pins production/preview/dev/max |
| G7 | Server accepts dev attest in prod | migration 044 + GUC `app.litmo_allow_dev_age_attest` |

## Still open (honest)

| ID | Gap | Why open |
| -- | --- | -------- |
| G3 | NFC/Bonjour plugins always on for store IPA | prebuild conditional plugins — residual |
| G8–G9 | soft_limit onboarding/server | P1 |
| G10 | TS↔Swift machine parity CI | P1 |
| G12 | Maestro demo path | P1 |
| G13 | Privacy deletion honesty 5.1.1 | distribution residual |

---

## Law reaffirmed

- Soft Signal stop · dual seal · age gate · profile≠consent · fail-closed = **always on**
- Mode changes presentation + RF only
- No runtime unlock from App Store Safe → Maximum

---

**Last updated:** 2026-07-13
