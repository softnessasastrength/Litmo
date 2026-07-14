# Litmo GDPR & data-protection alignment

**Status:** Engineering implementation + product policy draft  
**Date:** 2026-07-13  
**Not legal advice.** Controller identity, DPO, legal bases for public launch,  
retention schedules, and subprocessor contracts require qualified legal review  
before claiming full GDPR compliance for a public service.

This document is the repository source of truth for **privacy by design**,  
**data minimization**, **export/portability**, **erasure process**, and  
**transparent notices** in the Litmo codebase.

---

## 1. Principles (privacy by design)

| Principle | Litmo practice |
| --------- | -------------- |
| **Lawfulness & transparency** | In-app Privacy Policy + Data Protection screens; draft legal notice in `PRIVACY_POLICY_DRAFT.md` |
| **Purpose limitation** | Consent, Touch Language, sessions, safety ops — not ads/analytics profiling |
| **Data minimization** | Discovery exposes only intentional fields; private notes/app-encrypted; no seal keys on server |
| **Accuracy** | User-editable profile/touch/consent versions; snapshots versioned |
| **Storage limitation** | POC cascade-on-session-delete; production windows **blocked** until legal review |
| **Integrity & confidentiality** | RLS, device-bound encryption (ADR 0011), passkey/Keychain secrets, privacy-safe logs |
| **Accountability** | ADRs, DATA_CLASSIFICATION, migrations, this file, KNOWN_LIMITATIONS |

**Constitution:** Consent is session-specific and revocable. Touch profiles and  
Consent Snapshots are **sensitive**; they never become public safety scores.

---

## 2. Roles (to be finalized legally)

**Reality check:** no incorporated entity or "operator" currently exists — this is a placeholder for if the founder ever operates Litmo for real external users, not a description of a real controller today.

| Role | Current engineering stance |
| ---- | -------------------------- |
| **Controller** | No entity exists yet; placeholder is "Softness as a Strength / Litmo operator" if this ever needs a public notice |
| **Processors** | Supabase (hosting/auth/db), Apple (passkeys/biometrics), Expo (build) — list in privacy policy |
| **Data subject** | Authenticated adult users; demo mode has **no** server account |

---

## 3. Categories of personal data

See also `docs/DATA_CLASSIFICATION.md`.

### High priority (sensitive / special handling)

| Category | Examples | Storage | Subject rights notes |
| -------- | -------- | ------- | -------------------- |
| **Touch Language / body rules** | Zones, pressure, hard stops, versions | Server RLS owner + snapshot use | Export via `export_my_data`; not discovery |
| **Consent preferences** | Body-zone consent rules, private notes (encrypted) | Server + app-encrypted notes | Export; notes may be unreadable without device keys |
| **Consent Snapshots** | Fingerprint, profile versions, invalidation | Shared only with session counterpart | Participant-readable; deleted with session in POC |
| **Session wrap-up notes** | Encrypted free text | Owner-only | Export limited; device keys required for plaintext |
| **Partner quiz E2E** | Ciphertext packages, local ratchets | Device Secure Store; optional opaque relay | Not in full server export; wipe on local erase |

### Other personal data

Account identity, discovery profile fields, session lifecycle audit (no raw notes),  
reports (private notes excluded from peer/export where designed), trust events,  
quiz_result_summaries (owner-only), device registration digests, staff ops data.

### Explicitly not collected (current product)

- Advertising IDs / third-party analytics SDKs (none configured)
- Precise live location
- Public safety scores
- Biometric templates (stay with Apple)

---

## 4. Legal bases (product intent — legal must confirm)

| Processing | Intended basis | Notes |
| ---------- | -------------- | ----- |
| Account + authentication | Contract / legitimate interest | Passkeys; Apple holds biometrics |
| Touch / consent preferences | Contract + explicit consent for intimate categories | User-authored; versioned |
| Session activation & snapshots | Contract | Dual confirmation required |
| Safety reports / moderation | Legitimate interest + legal obligation (where applicable) | Human review |
| Optional quiz backup | Consent / contract | Owner-only; not partner compare |
| Demo mode | N/A (no account) | Device-local only; synthetic data |

---

## 5. Data subject rights (implementation)

| Right | Implementation status |
| ----- | --------------------- |
| **Access / portability** | `export_my_data()` RPC + in-app **Export my data**; enhanced with **device-local** categories in export screen |
| **Erasure** | **Request erasure** recorded (`account_erasure_requests`); **immediate device-local wipe**; full auth.user destruction **blocked** until legal/ops owners (KNOWN_LIMITATIONS) |
| **Rectification** | Profile / touch / consent edit flows |
| **Restriction** | Matching holds / blocks (safety); not a general “restrict processing” UI yet |
| **Object** | Soft Signal / withdraw session consent anytime |
| **Withdraw consent** | Session withdrawal; share/compare withdraw on quizzes; erase request |
| **Complain** | Contact channel TBD in public notice — listed as incomplete |

---

## 6. Consent mechanisms (product + GDPR)

1. **Age eligibility** — adult gate before real matching.  
2. **Session consent** — explicit dual Consent Snapshot confirmation; revocable.  
3. **Sensitive free text** — device-bound encryption; Face ID step-up for private screens.  
4. **Privacy notice** — in-app policy; optional acceptance record (`privacy_notice_acceptances`) when signed in.  
5. **Partner quiz share/compare** — four explicit gates + E2E ciphertext (never implied by weather).  
6. **Neurodivergent Mode** — preference only; not a special-category health inference.

---

## 7. Data minimization rules (engineering)

- Discovery returns only intentional public fields.  
- Logs use `privacySafeMetadata` — no body zones, notes, tokens.  
- Notifications: no sensitive payload content.  
- Partner quiz: server relay refuses private key material.  
- Export omits other users’ private notes and report private notes.  
- Demo: no server account; warn users not to put real intimate data in demos.

---

## 8. Retention (current honest state)

| Data | Current behavior | Production |
| ---- | ---------------- | ---------- |
| Sessions / snapshots | Cascade delete with session (POC) | Windows undecided — legal review |
| Block tombstones | ~90-day purge helper | Confirmed private-alpha design |
| Quiz E2E relay | 7-day expiry + purge helper | Keep |
| Erasure requests | Kept for ops until fulfilled | Required for accountability |
| Complete account deletion | **Not automated** | Blocked pending legal/ops |

---

## 9. App surfaces (this workstream)

| Screen | Path | Purpose |
| ------ | ---- | ------- |
| Privacy Policy | `/privacy/policy` | Transparent notice |
| Data Protection | `/privacy/data-protection` | Rights, categories, contacts placeholders |
| Export | `/security/data-export` | Portability + local categories |
| Delete / erase | `/privacy/delete-data` | Request + local wipe |

Settings links: Privacy Policy, Data protection & rights, Export, Delete my data.

---

## 10. Migrations

- `039_gdpr_privacy_and_erasure.sql` — notice acceptances + erasure request queue (no auto hard-delete of `auth.users`).

---

## 11. What “maximum alignment” does **not** claim

- Full public-launch GDPR certification  
- Named DPO / EU representative  
- Completed DPIA for production stranger matching  
- Automatic irreversible server wipe of all categories  
- Legal sign-off on bases and retention  

Those remain **external blockers** (see `TASKS.md` SAFETY-OPS / KNOWN_LIMITATIONS).

---

## 12. Related documents

- `docs/DATA_CLASSIFICATION.md`  
- `docs/PRIVACY_POLICY_DRAFT.md`  
- `docs/ISO27701.md` — PIMS / ISO 27701 small-team compliance roadmap  
- `docs/SENSITIVE_DATA_ENCRYPTION.md` (if present)  
- ADR 0011 device-bound encryption  
- ADR 0050/0051/0052 quizzes  
- ADR 0042 private-alpha safety ops  
