# Pre-Renn Regulation Gate v0.1

**This is currently a personal emotional containment system, not a public product.**

> Before you dump weather onto a human. Soft Signal free. Not a ban on contact.

**Route:** `/pre-renn`  
**Core:** `app/lib/preRennGateCore.ts`

---

## Containment job

Hold “I need them to regulate me right now” until capacity exists — so Renn is less likely to be used as a fire extinguisher.

---

## Inputs

| Axis | Range |
| ---- | ----- |
| Body flood | 1 calm → 5 flooded |
| Urge to text / reach | 1 low → 5 nuclear |
| Purpose of reach | free text (messy ok) |
| Delay pledge | 0 / 5 / 15 / 30 / 60 min |
| Soft Signal free | required |

## Verdicts

| Verdict | Meaning |
| ------- | ------- |
| **RED** | Do not dump. Regulate first. Soft Signal free. |
| **YELLOW** | Regulate a notch first; careful reach possible. |
| **GREEN** | Capacity looks present. Soft Signal still free mid-reach. |

Honoring the delay is logged as a **win**. Engaging anyway is honest, not shamed.

---

## Code map

| Path | Role |
| ---- | ---- |
| `app/lib/preRennGateCore.ts` | Pure logic |
| `app/services/preRennGateStore.ts` | History + debrief ingest |
| `app/app/pre-renn/index.tsx` | UI |

---

**Last updated:** 2026-07-13
