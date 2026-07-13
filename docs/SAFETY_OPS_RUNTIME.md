# Safety Operations Runtime — private-alpha law

**Status:** engineering ground truth (SAFETY-OPS-001)  
**Constitution:** [`LITMO_CONSTITUTION.md`](LITMO_CONSTITUTION.md)  
**Pure core:** `app/lib/safetyOpsCore.ts`  
**ADRs:** 0024–0035, 0037–0038, 0042, **0061**  
**Founder packet:** [`SAFETY_OPS_FOUNDER_DECISIONS.md`](SAFETY_OPS_FOUNDER_DECISIONS.md)

> Touch is not a transaction — it is a language.  
> Moderation is not a score — it is careful human judgment.

This document is the **runtime map** of what is implemented. It does not invent
legal, clinical, or safeguarding approval. External gates remain explicit.

---

## 1. System map (fail-closed)

```text
Participant                  Staff (is_staff_moderator)
    │                              │
    ├─ block (one-way)             ├─ list_moderation_queue
    ├─ submit_report ──► case ──►  ├─ claim / notes / evidence
    │      │                       ├─ resolve_case (coarse outcome)
    │      │                       ├─ apply matching_hold (single staff)
    │      ▼                       ├─ request_permanent_ban ──► pending
    │  rate_limit_events           │         │
    │  trust_events (append)       │         └─ confirm_permanent_ban
    │                              │              (distinct second staff)
    ├─ appeal restriction          ├─ list/resolve appeals
    ├─ Soft Signal (always free)   ├─ matching pause (not Soft Signal)
    └─ export_my_data              └─ issue invite / staff audit
```

**Never automatic:** permanent ban, matching hold, external referral, public
safety score, punishment from report counts or rate-limit trips.

---

## 2. Constitution → subsystem

| Subsystem | Articles | Invariant |
| --------- | -------- | --------- |
| Structured reports | II.5, III, X | Human review; private notes stay private |
| Moderation queue | II, II.5, III | Claim/escalate/resolve; no public case feed |
| Rate limits | II, IV, VII | Soft throttle only; never a ban |
| Trust ledger | II.4, III, X | Append-only provenance; never a score |
| Matching hold | II.5, IV, I | Human staff; Soft Signal preserved on others |
| Permanent ban HITL | II.5, VII, X | Dual confirm when required; fail closed |
| Appeals | II.5, IV, X | Human resolve; no auto-lift |
| Matching pause | I, II, IV | Blocks discovery/requests only |
| Private-alpha invite | VII, III, X | Hashed single-use; not verification |

Pure checks: `evaluateSafetyOpsFeature`, `SAFETY_OPS_CONSTITUTION_MAP`,
`permanentBanCompletionAllowed` in `safetyOpsCore.ts`.

---

## 3. Moderation / review queue

| Field | Values |
| ----- | ------ |
| Case | 1:1 with `user_reports` (`moderation_cases`) |
| `queue_status` | `open` → `in_progress` → `escalated` → `resolved` |
| Priority | Heuristic from category (underage=urgent; spam=low) |
| Notes | Staff-only append; never shown to parties |
| Evidence pack | Staff-shared message, counts, session meta; **no** device note plaintext |

**UI:** `/security/moderation`, `/security/moderation-case`  
**RPCs:** `list_moderation_queue`, `claim_moderation_case`, `add_moderation_note`,
`get_moderation_case_evidence`, `resolve_moderation_case`

---

## 4. Structured reports

Categories (closed enum): harassment, coercion_pressure, boundary_violation,
unsafe_behavior, impersonation, underage_concern, spam_scam, other.

Reporter-visible status only: `submitted` | `under_review` | `closed`  
Closed outcomes: `no_action` | `action_taken` | `info_needed`

Staff-shared message is platform-readable. Device-encrypted private notes are
boolean presence only to staff (ADR 0037).

---

## 5. Restriction lifecycle

```text
                 staff apply matching_hold
account ──────────────────────────────────► matching_hold (optional ends_at)
   │                                              │
   │                                              ├─► appeal (optional)
   │                                              │      upheld | lifted
   │                                              └─► lift_account_restriction
   │
   │         request_permanent_ban (staff A)
   └─────────────────────────────────────────► pending ban (72h)
                     │
                     ├─ cancel
                     └─ confirm (staff B ≠ A) ──► permanent_ban (indefinite)
```

Effects when applied (hold or ban): cancel `requested`; cancel pre-activation;
`safety_ended` for `active` (ADR 0035/0038). Discovery and new requests fail
closed for restricted accounts.

**Matching hold:** single staff OK.  
**Permanent ban:** when `two_person_permanent_ban_required` (default **true**):

1. `named_second_owner_configured` must be **true** (service-role only; requires
   a real human named in-repo — currently **false**).
2. ≥ 2 `staff_roles` rows.
3. Staff A `request_permanent_ban`; staff B `confirm_permanent_ban`.

Direct `apply_account_restriction(..., permanent_ban)` raises until two-person
policy is off (synthetic tests only).

---

## 6. Appeals process

| Rule | Behavior |
| ---- | -------- |
| Who | Restricted user only |
| Open | One open appeal per restriction |
| Statement | 1–2000 chars; staff-readable; not public |
| Rate limit | 5 appeals / 24h (`appeal` action) |
| Resolve | Staff `upheld` or `lifted` only |
| Lift via appeal | Sets restriction lifted + trust event `via=appeal` |

**UI:** `/security/appeals`, `/security/staff-appeals`

---

## 7. Rate limiting

| Action | Window | Max |
| ------ | ------ | --- |
| session_request | 1 hour | 20 |
| report | 24 hours | 15 |
| block / unblock | 24 hours | 40 |
| invite_redeem | 1 hour | 10 |
| appeal | 24 hours | 5 |

Table: `rate_limit_events` (append-only counters). Message is non-revealing.
**Not punishment. Not ban. Not trust score.**

Provisional cleanup: 30 days (ADR 0042) — ops-scheduled, not user-callable.

---

## 8. Trust event append-only ledger

Table: `trust_events`. Insert via security-definer only. No update/delete for
authenticated clients.

Types include session lifecycle, report_submitted, moderation_closed,
account_restricted / lifted, appeal_submitted / resolved,
permanent_ban_requested / confirmed, matching_pause_changed,
private_alpha_enrolled.

Self summary: `my_trust_signals()` — coarse self facts only.  
Peer summary: account age days + completed sessions — **not** a safety score
(ADR 0033). Forbidden: public scores, star ratings, auto-ban from score.

---

## 9. Staff console logic

| Action | Staff | Notes |
| ------ | ----- | ----- |
| Queue / claim / note / resolve | moderator/admin | |
| Matching hold | moderator/admin | Single human |
| Request permanent ban | moderator/admin | Only if policy allows completion |
| Confirm permanent ban | **different** staff | Dual HITL |
| Appeals list/resolve | moderator/admin | |
| Matching pause | staff | Preserves Soft Signal |
| Issue invite | staff | Hashed code once |
| Flip named_second_owner | **service_role only** | Never self-service |
| Export other users | **never** | Self export only |

Audit: `staff_action_audit` append-only.

---

## 10. Human-in-the-loop requirements

| Decision | HITL requirement | Status |
| -------- | ---------------- | ------ |
| Close moderation case | Single staff | Implemented |
| Matching hold | Single staff | Implemented |
| Permanent ban | Two distinct staff + named second owner flag | Machinery implemented; **flag false** until real owner |
| Appeal resolve | Single staff | Implemented |
| External referral | Legal/safeguarding policy | **Blocked** |
| Destructive retention | Legal/privacy | **Blocked** |
| Account deletion completion | Legal/privacy/security | Partial / blocked per ADR 0042 |

---

## 11. Migrations & tests

| Artifact | Role |
| -------- | ---- |
| 024–035 | Chapter 5 reports, queue, rate limits, trust, restrictions, appeals, evidence |
| 036 | Private-alpha invites, pause, export, tombstone |
| **042** | HITL ban, audit, ledger/rate expansion |
| `app/lib/safetyOpsCore.ts` | Pure unit law |
| `supabase/tests/safety_ops_hitl_ledger.test.sql` | Dual-confirm fail-closed |

---

## 12. What remains blocked (do not invent)

- Named backup reviewer (S7)
- `named_second_owner_configured = true` without documented human
- Jurisdiction eligibility enforcement (S3)
- External-referral policy (S8)
- Destructive retention of reports/cases/trust (S5)
- Complete account deletion with legal hold workflow (S6)
- Claims of legal/clinical approval

---

## 13. Agent resume checklist

1. Read this file + founder decisions + ADR 0042 + ADR 0061.
2. Prefer pure `safetyOpsCore` over inventing new enums in UI.
3. Fail closed on permanent ban without dual HITL capacity.
4. Never auto-punish from reports or rate limits.
5. Update docs/tests with any safety-ops behavior change.
