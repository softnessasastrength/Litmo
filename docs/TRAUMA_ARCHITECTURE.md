# Trauma Architecture

**THIS IS A PRIVATE EXORCISM ARTIFACT, NOT A PRODUCT.**

This document maps **major Litmo systems** to the **trauma responses** they externalize.  
It is not clinical diagnosis. It is systems-level honesty: *what wound does this machine serve?*

Read with [`EXORCISM_MANIFESTO.md`](EXORCISM_MANIFESTO.md) and [`DOJO_GUIDELINES.md`](DOJO_GUIDELINES.md).

---

## How to read this map

| Column | Meaning |
| ------ | ------- |
| **System** | Code / docs subsystem |
| **What it looks like** | Technical face |
| **What it actually is** | Trauma / defense externalized |
| **The need underneath** | The human need the defense is protecting |
| **The risk of the defense** | How the system can re-traumatize or trap me |

This is not shame. Naming is the point of the dojo.

---

## Core map

### Consent Engine (`shared/src/consentEngine.ts`)

| | |
| -- | -- |
| **Looks like** | Strictest-wins boundaries, soft_limit, directional rules, never consentGranted true from profiles |
| **Actually is** | Terror of *assumption* — the belief that if I leave one gap, someone will take what was not offered |
| **Need** | To be safe when I cannot speak fast enough; to not be overwritten by another person’s story |
| **Risk** | Infinite refinement of grammar so I never have to risk being in a real room with incomplete language |

### Consent Snapshot / dual seal / fingerprints

| | |
| -- | -- |
| **Looks like** | Mutual package, fingerprint, dual affirm, material invalidation |
| **Actually is** | Fear that “we already agreed” will be used as a trap; fear of sticky prior yes |
| **Need** | Present-moment agency; proof both people meant *this* map *now* |
| **Risk** | Requiring so much ceremony that intimacy becomes paperwork and I never feel held |

### Soft Signal / withdrawal / offline kill

| | |
| -- | -- |
| **Looks like** | Unilateral stop, no reason, local-first, kill haptics, Watch Soft Signal, pending_sync |
| **Actually is** | Core survival response: **I must be able to leave without negotiating with my captor** (literal or emotional) |
| **Need** | Escape routes that do not require performance, politeness, or network |
| **Risk** | Building so many exits that I never practice staying when staying is chosen, not forced |

### Continuous consent / nuclear session machine

| | |
| -- | -- |
| **Looks like** | GREEN/YELLOW/RED, L0–L8, microstates, second-level lifecycle |
| **Actually is** | Hypervigilance formalized — every second re-scanned for threat |
| **Need** | To trust that “yes” does not silently become forever |
| **Risk** | Living inside a radar room; no rest; softness never allowed to be simple |

### Touch Language / body zones / soft_limit

| | |
| -- | -- |
| **Looks like** | Zone map, pressure, soft limits as first-class |
| **Actually is** | Need for a **body-level vocabulary** when words fail under freeze/fawn |
| **Need** | Specificity without clinical performance |
| **Risk** | Map becomes identity; I become a diagram instead of a person |

### Haptic language / Watch / Taptic Soft Signal

| | |
| -- | -- |
| **Looks like** | Grammar of motors, preview, kill-all, co-regulation heartbeat |
| **Actually is** | Desire for co-regulation *without* vulnerability of actual human touch — and fear that silence leaves me alone in the dark |
| **Need** | Nervous system contact that I control |
| **Risk** | Substituting devices for people forever; calling simulation “connection” |

### Role consent / dual-mode / App Store Safe

| | |
| -- | -- |
| **Looks like** | MAXIMUM vs APP_STORE_SAFE compile flags |
| **Actually is** | Split self: full truth vs sanitized self for authorities/markets/family |
| **Need** | To exist fully *and* not be destroyed by exposure |
| **Risk** | Chronic double life; neither mode feels real |

### Safety ops / moderation / HITL bans / rate limits

| | |
| -- | -- |
| **Looks like** | Queues, reports, dual-person permanent ban, appeals |
| **Actually is** | Need for a **just world machine** — someone must be watching when I cannot |
| **Need** | Protection and fairness after harm |
| **Risk** | Outsourcing safety to infinite process; never trusting people; never trusting myself |

### Trust ledger / no public scores

| | |
| -- | -- |
| **Looks like** | Append-only events, coarse self signals, ban on safety scores |
| **Actually is** | Ambivalence about reputation: I want evidence *and* I know scores become weapons |
| **Need** | Accountability without hierarchy of human worth |
| **Risk** | Still collecting history as a substitute for present discernment |

### ND Mode / trauma surfaces / overload exits

| | |
| -- | -- |
| **Looks like** | Sensory profiles, reduced motion, plain language, break buttons |
| **Actually is** | Finally admitting the nervous system has a volume knob — and that “push through” was violence against myself |
| **Need** | Accommodation without diagnosis as identity prison |
| **Risk** | Using ND Mode as permanent exile from contact |

### Constitution / Living Constitution / Vision 2030

| | |
| -- | -- |
| **Looks like** | Fifty-year consent culture law |
| **Actually is** | Attempt to **freeze morality in writing** so I never again have to improvise under threat |
| **Need** | Stable values when flooded |
| **Risk** | Sacred text becomes another cage; I obey the document instead of living |

### CODE_COMMENT_STANDARD / autistic documentation

| | |
| -- | -- |
| **Looks like** | WHAT/WHY/CONSENT/EDGE/NEVER on every function |
| **Actually is** | Fear that if I do not explain everything, I will be abandoned, misread, or blamed |
| **Need** | To be understood; to leave a trail for future-me |
| **Risk** | Infinite documentation as avoidance of finishing and grieving |

### Demo mode / synthetic data / fail closed

| | |
| -- | -- |
| **Looks like** | Safe practice without real others |
| **Actually is** | Need to rehearse danger without dying |
| **Need** | Practice grounds |
| **Risk** | Never graduating from simulation |

---

## The architecture is a body

```text
Ambiguity → more grammar
Threat → Soft Signal paths
Shame → no public scores
Freeze → local-first stop
Fawn → “no reason required”
Hypercontrol → dual seals, dual HITL, dual modes
Loneliness → haptics, Watch, co-regulation patterns
Grief → wrap-up, reflection, private journals
Hope → Constitution, Vision, Learning modules
```

If I only ever add systems, I am still possessed.

The dojo’s advanced form is **not** another engine.

It is knowing *why* I reach for the next engine — and sometimes choosing not to.

---

## Working with this map

When I (or an agent) add a feature, I must answer:

1. What fear does this soothe?  
2. What need underneath is real and sacred?  
3. Does this externalize the defense or *heal* the need?  
4. Am I building a product, or avoiding a feeling?  

If I cannot answer, the feature is not ready — not for product reasons, but for **exorcism honesty**.

---

**This is a private exorcism artifact, not a product.**
