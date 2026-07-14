# Emotional Masochist Mode v0.2

**This is currently a personal emotional containment system, not a public product.**

> Global intensity / ritualization toggle. **Soft Signal freeness is never reduced.**

**Route:** `/masochist-mode`  
**Core:** `app/lib/masochistModeCore.ts`  
**Store:** `litmo.masochist_mode.v1`

---

## Purpose

Name the pattern: **choosing denser ritual as regulation** — sometimes love, sometimes over-protocoling, often both.

This mode is self-aware. Enabling it is allowed. Disabling it is Soft Signal free.

---

## Preferences

| Flag | Effect |
| ---- | ------ |
| `enabled` | Master switch |
| `denserScripts` | Reconcile interleaves denser ceremony steps |
| `preferEdge` | Bias toward Edge-capable paths where they exist (still capped) |
| `ceremonialCopy` | Parallel Play shows ceremonial entry/exit language |
| `intensityAsRegulation` | Self-aware label that intensity is a regulation strategy |

**Intensity labels:** `baseline` · `lit` · `dense` · `ceremonial` · `cathedral`

**Density multiplier:** 1.0 off · ~1.2 on · ~1.5 denser scripts

---

## Hard invariants

1. Soft Signal freeness is never reduced by this mode.  
2. Edge remains capped where Edge exists; preferEdge is bias not override.  
3. Intensity is allowed as regulation — and allowed to be turned off.  
4. Choosing denser ritual is not proof of brokenness.  
5. Turning the mode off is always Soft Signal free.  

---

## Consumers (wired)

| Consumer | Behavior when mode on |
| -------- | --------------------- |
| Hub | Banner + intensity label |
| `/reconcile` | denser step interleave |
| `/parallel-play` | ceremonial copy on seal |
| Attachment Repair Cathedral | separate Edge circuit (existing) |

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/EMOTIONAL_MASOCHIST_MODE.md` | Spec |
| `app/lib/masochistModeCore.ts` | Pure logic |
| `app/services/masochistModeStore.ts` | Persist |
| `app/app/masochist-mode/index.tsx` | UI |

---

**Last updated:** 2026-07-13
