# SAFETY-OPS-001 Founder Decision Packet

**Status:** recommended options selected by the founder on 2026-07-13; engineering implementation authorized. External-review gates remain.

This packet turns the open questions in [SAFETY_OPS_DESIGN.md](SAFETY_OPS_DESIGN.md)
into explicit founder decisions. It does not replace safety, legal, privacy, or
clinical review. A selected option records product intent; any row marked
"external review required" remains provisional until that review is documented.

## How to use this packet

For each decision:

1. select one option or write a replacement;
2. record the rationale, reviewer, and date;
3. identify any external review still required;
4. promote accepted decisions into focused ADRs before implementation.

Recommended options were selected by the founder on 2026-07-13, authorizing the
engineering foundation described in ADR 0042. SAFETY-OPS-001 remains active,
not complete: named human roles and external-review dispositions are still
required before the corresponding release claims or destructive workflows.

## Decision summary

| ID  | Decision                    | Recommended private-alpha default                                 | Founder selection | External review required |
| --- | --------------------------- | ----------------------------------------------------------------- | ----------------- | ------------------------ |
| S1  | Alpha access                | Founder-issued, single-use invitations                            | Accepted*         | Safety/product           |
| S2  | Invite expiry               | 7 days; revoke at any time                                        | Accepted*         | No                       |
| S3  | Eligibility and geography   | Named adults only; smallest reviewed jurisdiction set             | Accepted*         | Legal/privacy            |
| S4  | Kill-switch scope           | Pause discovery and new requests; preserve stop/wrap-up           | Accepted*         | Safety/product           |
| S5  | Data lifecycle              | Bounded provisional windows below                                 | Accepted*         | Legal/privacy            |
| S6  | Account deletion and export | Immediate access disable; reviewed deletion/export workflow       | Accepted*         | Legal/privacy/security   |
| S7  | Review staffing             | Founder plus independent backup before external alpha             | Accepted*         | Safety/governance        |
| S8  | Escalation                  | Human decisions; no automatic external referral except legal duty | Accepted*         | Legal/safeguarding       |
| S9  | Block-history tombstone     | Minimal 90-day abuse-control tombstone                            | Accepted*         | Privacy/safety           |
| S10 | Permanent-ban authority     | Staff-only; two-person confirmation when staffing permits         | Accepted*         | Safety/governance        |

_Accepted means the recommended product direction is authorized. It does not convert an external-review requirement into legal, privacy, clinical, or safeguarding approval._

## S1 — Who can issue invitations?

**Recommended:** founder/staff-issued, single-use invitations for the first
private alpha. Enrolled participants receive no invite budget initially.

- **Option A — Founder/staff only (recommended):** smallest abuse surface and
  matches present moderation capacity.
- **Option B — Participant invite budget:** each eligible participant may issue
  a small capped number; requires provenance, revocation, and inviter-abuse rules.
- **Option C — Cohort import:** staff enroll a pre-reviewed named cohort without
  transferable codes.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Rationale:** Conservative private-alpha default selected; retain every stated review and release gate.  
**Reviewer/date:** Founder, 2026-07-13

## S2 — How long should invitations remain valid?

**Recommended:** expire after 7 days, redeem once, and remain revocable until
redeemed. Redemption attempts are rate-limited and audit-logged. Expired,
revoked, or invalid invitations return the same non-disclosing response.

- **Option A — 24 hours:** tightest control; higher support burden.
- **Option B — 7 days (recommended):** bounded without creating needless urgency.
- **Option C — 30 days:** easier coordination; larger leakage/reuse window.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Rationale:** Conservative private-alpha default selected; retain every stated review and release gate.  
**Reviewer/date:** Founder, 2026-07-13

## S3 — Who is eligible, and where may the alpha operate?

**Recommended product posture:** named adults only, no stranger-scale discovery,
and the smallest jurisdiction set that legal/privacy review can support. Apple
Declared Age Range remains a coarse eligibility signal, not identity or
government-ID verification.

This decision must name:

- minimum age;
- allowed jurisdictions;
- excluded jurisdictions;
- whether participants must be personally known to the founder or referred by a
  known participant;
- what evidence, if any, is retained to establish invitation eligibility.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Legal/privacy disposition:** Required before external alpha  
**Reviewer/date:** Founder, 2026-07-13

## S4 — What does the beta kill-switch do?

**Recommended:** the routine kill-switch prevents discovery results and new
session requests. It does **not** remove the Soft Signal, withdrawal, wrap-up,
blocking, reporting, or access to already-required safety controls. Active
sessions are not silently force-ended by the routine switch.

A separate incident action may safety-end all open sessions, but it must be
explicit, staff-audit-logged, and visually distinguished from routine pause.

- **Option A — New activity pause (recommended).**
- **Option B — New activity pause plus force-end all active sessions.**
- **Option C — Multiple scoped flags:** discovery, requests, activation, and
  emergency stop-all controlled independently.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Rationale:** Conservative private-alpha default selected; retain every stated review and release gate.  
**Reviewer/date:** Founder, 2026-07-13

## S5 — What provisional data lifetimes should engineering design around?

The values below are **recommended engineering defaults**, not claims about
legal sufficiency:

| Data                          | Recommended provisional lifetime                 | Notes                                                                  |
| ----------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Unredeemed invitation         | Delete 30 days after expiry/revocation           | Keep only minimal audit fact if abuse investigation requires it        |
| Rate-limit events             | 30 days                                          | Operational abuse control only                                         |
| Block tombstone after unblock | 90 days                                          | Pair identifiers + timestamps only; never user-visible                 |
| Resolved reports/cases/notes  | 12 months after final appeal resolution          | Subject to scoped legal/safety hold                                    |
| Trust events                  | 12 months, then delete or irreversibly aggregate | Never convert into a public score                                      |
| Product diagnostics           | 30 days                                          | Exclude consent, notes, reports, precise location, and message content |

Alternatives are shorter windows, longer explicitly justified windows, or no
collection for a category. "Keep forever" is not an acceptable silent default.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Legal/privacy disposition:** Required before implementation  
**Reviewer/date:** Founder, 2026-07-13

## S6 — What happens when a participant requests deletion or export?

**Recommended product behavior:**

1. disable account access immediately and end open sessions safely;
2. revoke devices and server sessions;
3. make the account undiscoverable;
4. clear device-local sensitive state with explicit confirmation;
5. provide a structured export of the participant's own data;
6. delete or anonymize data within a published bounded period;
7. retain only data covered by a specific, documented active-case or legal hold;
8. notify the requester when deletion is complete or explain the narrow retained
   categories without exposing another participant.

The founder must choose the ordinary completion target (for example 7 or 30
days), the cancellation/grace rule, and who approves a scoped hold.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Legal/privacy/security disposition:** Required before external TestFlight  
**Reviewer/date:** Founder, 2026-07-13

## S7 — Who reviews safety cases?

**Recommended:** external private alpha does not begin until at least one named,
trained backup reviewer exists in addition to the founder. A reviewer must
recuse from any case involving themselves or a close personal conflict. Staff
access is least-privilege, time-bounded where possible, and audit-logged.

- **Option A — Founder only:** acceptable only for founder-controlled synthetic
  testing; not recommended for external alpha.
- **Option B — Founder plus one backup (recommended minimum).**
- **Option C — Contracted safeguarding/moderation service:** more resilient but
  requires vendor, privacy, training, and data-processing review.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Named role owner(s):** Pending  
**Reviewer/date:** Founder, 2026-07-13

## S8 — What is the escalation boundary?

**Recommended:** Litmo may apply an internal matching hold or permanent ban only
through human review. A report, keyword, rate limit, or model output never
automatically punishes a participant or contacts an outside authority.

The external-referral threshold, mandatory-reporting obligations, preservation
steps, and emergency language must be written with qualified legal and
safeguarding review. Litmo must not represent ordinary moderation as emergency
response or clinical care.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Legal/safeguarding disposition:** Required  
**Incident contact list owner:** Pending  
**Reviewer/date:** Founder, 2026-07-13

## S9 — Is block history retained after unblock?

**Recommended:** retain a minimal, staff-only tombstone for 90 days containing
only the pair, block/unblock timestamps, and system audit identifiers. Do not
retain a reason because blocking requires none. Never disclose the tombstone to
either participant or use it as a public trust signal.

- **Option A — No history:** strongest minimization; weaker abuse-cycle review.
- **Option B — 90-day minimal tombstone (recommended).**
- **Option C — Retain with moderation cases only:** create history only when a
  separate report or case provides a defined safety purpose.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Rationale:** Conservative private-alpha default selected; retain every stated review and release gate.  
**Reviewer/date:** Founder, 2026-07-13

## S10 — Who may impose a permanent ban?

**Recommended:** staff-only authority. When two qualified reviewers exist,
permanent bans require a second-person confirmation; an urgent temporary
matching hold may be applied immediately by one reviewer. Appeals must be
reviewable by someone other than the original decision-maker whenever staffing
permits.

- **Option A — Founder alone:** current technical reality, but a governance
  single point of failure.
- **Option B — One reviewer for holds; two for permanent bans (recommended).**
- **Option C — One reviewer for all actions:** faster, with greater error and
  conflict risk.

**Founder selection:** Recommended option accepted (2026-07-13)  
**Rationale:** Conservative private-alpha default selected; retain every stated review and release gate.  
**Reviewer/date:** Founder, 2026-07-13

## Decisions that may proceed without legal conclusions

After founder review, engineering can safely convert S1, S2, and S4 into
proposed ADRs and implementation plans, provided Chapter 6 is separately
promoted. S5, S6, and S8 require external review before their policies are
represented as settled. S3 and S7 require named human operating boundaries,
not merely code.

## Completion gate

SAFETY-OPS-001 may move from `pending` to `completed` only when:

- S1–S10 have a recorded disposition;
- unresolved review items have named owners and block the appropriate release
  stage;
- accepted product decisions have ADRs;
- threat and abuse cases are linked to each accepted design;
- release documentation states what remains unavailable;
- no selected policy is described as legally or clinically approved without
  evidence.
