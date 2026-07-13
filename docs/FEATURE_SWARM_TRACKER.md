# Litmo Feature Swarm Tracker

**Created:** 2026-07-13  
**Purpose:** Clean task tracking for the five parallel major feature streams (multi-agent swarm).  
**Authority:** Living tracker. Implementation truth is still code + ADRs + chapter docs.  
**Constitution:** trauma-informed · neurodivergent-friendly · local-first · E2E encrypted where appropriate · never invent consent or safety scores.

> Touch is not a transaction — it is a language.

## Swarm overview

| Agent | Stream | Primary status | Canonical docs |
| ----- | ------ | -------------- | -------------- |
| **1 · Core Experience** | Touch Language | **Shipped on main** | [TOUCH_LANGUAGE.md](TOUCH_LANGUAGE.md) |
| **2 · Safety Systems** | Consent Snapshot + Soft Signal + trauma tools | **Shipped on main** | [CONSENT_SNAPSHOT_SYSTEM.md](CONSENT_SNAPSHOT_SYSTEM.md) · [SOFT_SIGNAL.md](SOFT_SIGNAL.md) · [TRAUMA_INFORMED_SAFETY.md](TRAUMA_INFORMED_SAFETY.md) |
| **3 · Connection Layer** | Proximity · NFC · QR · Multipeer | **Shipped on main** | [PROXIMITY_LAYER.md](PROXIMITY_LAYER.md) · [NFC_FEATURES.md](NFC_FEATURES.md) · [LOCAL_SHARE.md](LOCAL_SHARE.md) |
| **4 · Learning & Growth** | Guided Learning (lived + foundations) | **Shipped on main** | [LEARNING_SYSTEM.md](LEARNING_SYSTEM.md) |
| **5 · Hardware Vision** | Device OS + Soft Edge haptics | **Design shipped** (not a SKU) | [HARDWARE/DEVICE_OS.md](HARDWARE/DEVICE_OS.md) · [HARDWARE_DEVICE_EXPERIENCE.md](HARDWARE_DEVICE_EXPERIENCE.md) · [HARDWARE/HAPTICS.md](HARDWARE/HAPTICS.md) |

Cross-cutting foundations also shipped: [LOCAL_FIRST.md](LOCAL_FIRST.md) (ADR 0058), trauma-informed safety (ADR 0059).

**Statuses:** `shipped` · `design-only` · `gap` · `blocked` · `verify-physical`

---

## Agent 1 — Core Experience (Touch Language)

| Field | Value |
| ----- | ----- |
| **Status** | shipped |
| **Tip commits** | `4df7eff` full TL · vault via local-first `98504bd` |
| **Surfaces** | `/touch-language` hub · `/edit` · `/share` · onboarding boundaries |
| **Capabilities** | Pressure, speed, duration, environments, hold types, 12-zone map (welcomed / ask-first / soft limit / off limits), hard/soft limits, private notes, Secure Store, AES-GCM partner share (notes stripped) |
| **Tests** | `touchLanguageCore.test.ts`, proximity TL helpers |
| **Local-first** | `touchLanguageStore` → `localVault` |
| **E2E crypto** | Share packages AES-GCM + unlock code |

### Swarm audit (Agent 1) — 2026-07-13

Mostly complete. Gaps: shared/server profile drops `speed` + `soft_limit`; hard-limit→zone heuristic untested; deep-link TL share intake missing.

### Follow-ups (non-blocking)

| ID | Task | Status |
| -- | ---- | ------ |
| TL-F1 | Physical device smoke of body map + Dynamic Type | verify-physical |
| TL-F2 | Optional cloud backup of TL domain (already vault-eligible) | shipped path; user opt-in |
| TL-F3 | Dual-device share smoke | verify-physical |
| TL-F4 | Preserve `speed` + `soft_limit` in shared/server mapping | gap |
| TL-F5 | Test + harden hard-limit zone override; deep-link share intake | gap |

---

## Agent 2 — Safety Systems (Consent Snapshot + Soft Signal)

| Field | Value |
| ----- | ----- |
| **Status** | shipped |
| **Tip commits** | `bba672a` Consent Snapshot · `1e79fb5` Soft Signal · `42b5008` trauma safety |
| **Surfaces** | `/consent-snapshot/prepare` · `/mutual` · active session Soft Signal · `/soft-signal/practice` · `/log` · `/safety/*` |
| **Capabilities** | Pre-session declaration; dual seal; Soft Signal impossible-to-miss control; local stop first; private log; panic cover; quick exit; session timeout; present-moment verify; skippable reflection |
| **Tests** | `sessionConsentSnapshotCore.test.ts`, soft signal cores, `traumaSafetyCore.test.ts` |
| **Invariants** | Unilateral stop; no reason; not emergency services; not safety certificate |

### Swarm audit (Agent 2) — 2026-07-13

Shipped foundations. Soft Signal offline path coded; physical chaos tests open. Active Soft Signal could be buried under secondary controls → **fixed 2026-07-13 sticky pin**.

### Follow-ups

| ID | Task | Status |
| -- | ---- | ------ |
| SS-F1 | Wire agreed session duration into dual server snapshot (today timeout is local pref) | gap |
| SS-F2 | Hardware Soft Signal bridge on physical device | design-ready / not SKU |
| SS-F3 | VoiceOver smoke: Soft Signal + panic cover under stress | verify-physical |
| SS-F4 | Sticky Soft Signal on active session | **shipped** (swarm closeout) |
| SS-F5 | Offline Soft Signal airplane/kill chaos proof | verify-physical |

---

## Agent 3 — Connection Layer (Proximity · NFC · QR)

| Field | Value |
| ----- | ----- |
| **Status** | shipped |
| **Tip commits** | `d97e821` Proximity hub · NFC/QR docs and modules prior |
| **Surfaces** | `/proximity` · `/proximity/radar` · `/nfc/connect` · `/share/local` |
| **Capabilities** | Opt-in anonymous radar; TL shape compatibility % (coarse axes); NFC tag careful-connect; encrypted QR; Multipeer AirDrop-style; Soft Signal exit; radios off by default |
| **Crypto** | Ephemeral ECDH + AES-GCM local share; QR envelopes; never auto-consent |
| **Platform** | Real radio needs iOS dev build; Expo Go practice paths |

### Swarm audit (Agent 3) — 2026-07-13

Engineering foundation complete. Settings bypassed hub gates → **fixed** (Settings → hub). Hub Soft Signal lacked radio teardown → **fixed**.

### Follow-ups

| ID | Task | Status |
| -- | ---- | ------ |
| CX-F1 | Two-device Multipeer physical smoke | verify-physical |
| CX-F2 | NFC physical tag smoke (dev build) | verify-physical |
| CX-F3 | Independent crypto review before external beta | blocked on named reviewer |
| CX-F4 | Settings → proximity hub gates | **shipped** (swarm closeout) |
| CX-F5 | Hub Soft Signal global radio teardown | **shipped** (swarm closeout) |

---

## Agent 4 — Learning & Growth (Guided Learning)

| Field | Value |
| ----- | ----- |
| **Status** | shipped |
| **Tip commits** | `015ecb8` full curriculum + paths |
| **Surfaces** | Learn tab · `/learning/[id]` · paths · quiz soft-close · product practice CTAs |
| **Curriculum** | 6 lived lessons + 6 foundations; ≥2 scenarios per lived module; themes include consent, nervous system, boundaries, recovery, communication, self-compassion |
| **Aftercare** | Covered inside Nervous System Safety, Recovering from Violation, Self-Compassion, and trauma reflection aftercare step — not a separate 7th lived module title |
| **ND** | Progressive disclosure, breaks, read-aloud, jump list |

### Swarm audit (Agent 4) — 2026-07-13

Feature-complete. Aftercare embedded (not a 7th module). Presence haptic was dead → **fixed**. Aftercare scenario added on nervous-system module.

### Follow-ups

| ID | Task | Status |
| -- | ---- | ------ |
| LN-F1 | Aftercare interactive scenario (embedded) | **shipped** (swarm closeout) |
| LN-F2 | Plain-language / clinical editorial review of lived lessons | blocked on reviewer |
| LN-F3 | VoiceOver smoke of one lived scenario module | verify-physical |
| LN-F4 | Presence haptic on module entry | **shipped** (swarm closeout) |

---

## Agent 5 — Hardware Vision (Device OS)

| Field | Value |
| ----- | ----- |
| **Status** | design-only (intentional) |
| **Tip commits** | `b77c7a6` Device OS · haptics v4 · device experience |
| **Scope** | Power-on → shutdown; Resting / Nearby / Invite / Review / Together / Quiet; Soft Signal interrupt; OS bans (no browser/feed); Soft Edge multi-modal haptics |
| **Not** | Manufacturing authorization or shipping firmware |

### Swarm audit (Agent 5) — 2026-07-13

Design complete for power→shutdown, Soft Signal interrupt, zero-distraction bans. No device implementation (intentional).

### Follow-ups

| ID | Task | Status |
| -- | ---- | ------ |
| HW-F1 | Soft Signal multi-modal matrix (single copy source across OS/Experience/Haptics) | design open |
| HW-F2 | Care drawer + haptics intensity map (not a Settings app) | design open |
| HW-F3 | Lifecycle wireframe pack power→stop→off | design open |
| HW-F4 | Prototype Soft Signal hardware bridge against phone `softSignalHardware` | gap (engineering) |

---

## Cross-cutting checklist

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| Trauma-informed | shipped | Soft Signal, panic, reflection skip, learning recovery module, copy non-claims |
| Neurodivergent-friendly | shipped | ND Mode, clear language, progressive disclosure, reduced motion, haptics optional |
| Local-first | shipped | `localVault`, offline personal domains, ADR 0058 |
| E2E encrypted where appropriate | shipped | Quiz partner DR, local share ECDH+AES-GCM, TL share, QR envelopes; personal backup opaque |
| Documentation updated | in progress this swarm | This tracker + CURRENT_STATE + TASKS + CHANGELOG |
| Clean task tracking | shipped | This file + TASKS.md swarm section |

---

## Swarm closeout — 2026-07-13

Five explore agents audited each stream. All five major builds were **already on `main`**. Closeout PR shipped:

- Sticky Soft Signal on active session  
- Learning presence haptic  
- Proximity hub Soft Signal tears down radar + Multipeer  
- Settings routes to Proximity hub (gates)  
- Aftercare scenario on Nervous System Safety  
- This tracker  

## Priority backlog (swarm residual)

Ordered for agents continuing after this tracker:

1. **CX-F3** — name independent crypto reviewer (external beta gate).  
2. **SS-F1** — dual-agreed session duration on Consent Snapshot (server + UI).  
3. **TL-F4 / TL-F5** — server mapping for speed/soft_limit + hard-limit tests.  
4. **Physical smokes** — Soft Signal offline chaos, Multipeer, NFC, VO (ACCESS-001).  
5. **HW-F1–F3** — design matrix + wireframes (no manufacturing).  
6. **SAFETY-OPS-001** — remains active milestone for alpha ops (separate from this swarm).

---

## How to update this tracker

1. After each material PR: set stream status, add commit, mark follow-ups.  
2. Mirror blocking items into `TASKS.md` with status `blocked`/`pending`.  
3. Never mark “shipped” without code on `main` or explicit design-only note.  
4. Never claim physical device verification without founder/agent evidence.

## Related

- `TASKS.md` — execution ledger  
- `CURRENT_STATE.md` — handoff  
- `project-state.json` — machine-readable  
- `docs/CHANGELOG.md`  
- `docs/KNOWN_LIMITATIONS.md`  
