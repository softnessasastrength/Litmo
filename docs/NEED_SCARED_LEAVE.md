# I Need You But I'm Scared You'll Leave — Ritual v0.1

**This is currently a personal emotional containment system, not a public product.**

> **Both poles are true. The ritual is learning to hold them without collapsing into fawn or preemptive exile.**

**Route:** `/need-scared`  
**Also:** Attachment Repair Cathedral · Too Much panic room  
**Core:** `app/lib/needScaredCore.ts`

---

## Purpose

Maximum granularity on the dual bind:

1. **I need you** (proximity, words, body, time, proof, co-silence…)  
2. **I'm scared you'll leave** (if I ask, if I need, if I'm real, if I stop performing…)  

…so that bind has a sealed ritual map and is less likely to dump raw onto **Renn**.

Soft Signal is God Mode. This is **not** a Consent Snapshot and **not** a demand on a partner until you choose to use an optional ask line outside the app.

---

## Granular axes

### Need pole (what I need)
| Id | Label |
| -- | ----- |
| proximity | Physical nearness |
| words | Verbal reassurance |
| body_hold | Hold / spoon / weight |
| time | Unhurried time |
| proof | Explicit “I'm not leaving” |
| co_silence | Quiet together |
| check_in | Planned check-in |
| repair | Repair after friction |
| other | Named free-text |

### Fear pole (what I'm scared of)
| Id | Label |
| -- | ----- |
| leave_if_ask | Leave if I ask |
| leave_if_need | Leave if I need |
| leave_if_real | Leave if I'm fully real |
| leave_if_stop | Leave if I stop performing |
| leave_if_too_much | Leave because I'm too much |
| leave_if_conflict | Leave after conflict |
| replace | Be replaced |
| gradual_fade | Slow fade / quiet discard |
| other | Named free-text |

### Intensity (each pole 1–5) + body spot + Soft Signal ack

### Ritual phases
1. **Admit dual bind** — both poles named  
2. **Granular seal** — need + fear + intensities + body  
3. **Both/and holding** — scripted steps that refuse either/or collapse  
4. **Optional ask line** — construct a small honest reach (never auto-sent)  
5. **Reassurance for both poles**  
6. **Debrief + private ledger**  
7. **Pattern summary** (local)

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/NEED_SCARED_LEAVE.md` | Spec |
| `app/lib/needScaredCore.ts` | Pure logic |
| `app/lib/needScaredCore.test.ts` | Tests |
| `app/services/needScaredStore.ts` | History |
| `app/app/need-scared/index.tsx` | Ritual UI |

---

**Last updated:** 2026-07-13
