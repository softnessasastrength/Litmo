# ADR 0059 — Trauma-informed safety system

## Status

Accepted — 2026-07-13

## Context

Soft Signal and emergency withdrawal provide unilateral stop. Users also need:

- A **panic** path that reduces social pressure after stop  
- A **quick exit** that does not trap them in dense UI  
- Optional **time boundaries** so capacity is not overspent  
- **Present-moment checks** before contact without fake safety scores  
- **Post-session reflection** that helps process without forced trauma narrative  

Clinical, emergency-dispatch, and public scoring systems are out of scope and constitutionally unsafe as product claims.

## Decision

1. Build a **trauma safety layer** on top of Soft Signal (`traumaSafetyCore` / service / store).  
2. **Panic mode** = Soft Signal first, then optional calm cover screen. Stop is never delayed for cover animation.  
3. **Quick exit** = Soft Signal + wrap-up navigation.  
4. **Session timeout** = local optional prefs; warning + auto Soft Signal or calm prompt; off by default.  
5. **Partner verification** = present-moment private checklist with explicit non-certificate flags.  
6. **Reflection** = optional multi-step skippable prompts; private device archive; wrap-up links but does not require.  
7. Copy always states Litmo is **not emergency services** and reflection is **not therapy**.

## Consequences

### Positive

- Aligns product tools with trauma-informed practice (choice, capacity, no forced processing).  
- Reuses Soft Signal authority — no second competing stop system.  
- Works offline for prefs, verification, reflection, and Soft Signal practice.

### Negative / tradeoffs

- Timeout is currently **device preference**, not dual-agreed on the server snapshot.  
- Panic cover cannot force the user out of iOS; it only reduces in-app pressure.  
- Reflection content needs ongoing plain-language / clinical editorial review.

### Non-decisions

- No automatic emergency dispatch or trusted-contact SMS in this ADR.  
- No partner-visible verification badges.  
- No mandatory wrap-up or mandatory reflection.

## Alternatives considered

| Alternative | Why rejected |
| ----------- | ------------ |
| Separate “panic” stop without Soft Signal | Fragments authority; risk of incomplete withdrawal |
| Forced post-session questionnaire | Re-traumatizing; compliance theater |
| Public partner safety badges | False security; constitutionally forbidden |
| Always-on countdown shame timer | Violates capacity and consent culture |

## References

- `docs/TRAUMA_INFORMED_SAFETY.md`  
- `docs/SOFT_SIGNAL.md`  
- `docs/CONSENT_WITHDRAWAL_AND_EMERGENCY_STOP.md`  
- ADR 0012 (single-party withdrawal)  
