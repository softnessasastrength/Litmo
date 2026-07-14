# Apple App Store Guideline 5.1.1 — Privacy honesty (engineering)

**Status:** Engineering honesty pack — **not** a claim of App Review approval  
**Date:** 2026-07-13  
**Related:** `docs/GDPR.md` · `/privacy/delete-data` · `privacyService` · ADR 0058 local-first

> G13 residual from 16-agent swarm: Review must never see over-claims about deletion.

---

## What we claim in-app (allowed)

| Claim | Truth |
| ----- | ----- |
| Wipe this device | Immediate local AsyncStorage / SecureStore / vault wipe of known Litmo keys |
| Soft Signal ends session | Unilateral local stop; no privacy form required |
| Export my data | Best-effort portability summary for the signed-in user |
| Erasure request | Recorded for ops; human-in-the-loop until destructive retention is approved |

## What we must not claim

| Over-claim | Why forbidden |
| ---------- | ------------- |
| “One tap deletes your entire cloud account forever” | Complete automated erasure is **blocked** until legal/ops owners approve destructive workflows |
| “All backups and logs gone instantly” | Backups, audit rows, and processor retention may outlive local wipe |
| “We never store personal data” | Accounts, profiles, consent versions exist under RLS when signed in |
| “GDPR certified / fully compliant” | Requires qualified legal review — engineering alignment only |

---

## Dual-mode note

- **App Store Safe:** RF/NFC/Multipeer off; still full wipe + Soft Signal + erasure request UI  
- **Maximum Mode:** same privacy honesty; more local containment keys in wipe list  

Mode never weakens Soft Signal freeness or fail-closed consent.

---

## Checklist before store submission

- [ ] Privacy Policy URL live and matches in-app notice  
- [ ] Delete account path visible without hunting (Settings → privacy)  
- [ ] Copy matches this honesty pack (no “instant full cloud wipe”)  
- [ ] Local wipe tested on a production-like build  
- [ ] Erasure request creates a durable server row when authenticated  
- [ ] No demo-only privacy theater as the only delete path  

---

**Last updated:** 2026-07-13
