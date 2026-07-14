# Relationship Constitution Generator v0.2

**This is currently a personal emotional containment system, not a public product.**

> Living private articles with version control and amendment process. **Not legal.** Soft Signal free.

**Route:** `/relationship-constitution`  
**Core:** `app/lib/relationshipConstitutionCore.ts`

---

## Purpose

Replace mind-reading contracts and sticky verbal “we already agreed” with a **versioned living document**.

Silence is **not** consent to an amendment.

---

## Default articles (seed)

- Soft Signal is free  
- Need is not a crime  
- Conflict is not exile  
- No mind-reading contracts  
- Parallel play is sacred  
- Amendments are honest  
- Repair is preferred when safe  
- This is not legal  

---

## Amendment process

| Action | Effect |
| ------ | ------ |
| Amend article | body update + version++ + amendment log |
| Add article | new article + version++ + log |
| Pending proposal | draft text stored (not articles yet) |
| Ratify proposal | proposal → amendment log + version++ + clear pending |
| Export / share | plain-text dump (never auto-sent) |

Every change is versioned. Amendment log keeps last 100 entries with `versionAfter` and `kind`.

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/RELATIONSHIP_CONSTITUTION.md` | Spec |
| `app/lib/relationshipConstitutionCore.ts` | Pure logic |
| `app/services/relationshipConstitutionStore.ts` | Persist |
| `app/app/relationship-constitution/index.tsx` | UI |

---

**Last updated:** 2026-07-13
