# Safety Operations & Beta-Ops Design (SAFETY-OPS-001)

**Status: draft proposal.** This document was drafted by a coding agent to satisfy
`TASKS.md`'s SAFETY-OPS-001 goal ("Define reporting, blocking, invitation expiry,
eligibility, human review, escalation, retention, and beta kill-switch behavior
before broader discovery"). It is **not** approved policy. Per SAFETY-OPS-001's
own stated ownership ("founder plus safety/product reviewer"), every proposal
below — and especially every item under "Open questions requiring a human
decision" — needs founder and, where noted, legal/clinical review before any of
it is implemented or represented to users. Nothing here authorizes new
implementation work; it is a starting point for that review conversation.

This doc has two jobs: (1) accurately describe what Chapter 5 already built, so
the next design conversation starts from the real system instead of a stale
mental model, and (2) propose a shape for the pieces Chapter 6
(`docs/roadmap/CHAPTER_6_PRIVATE_ALPHA.md`) still needs and SAFETY-OPS-001 was
asked to define.

## Design philosophy: data rights as an extension of consent, not a compliance bolt-on

Litmo's founding rule for touch is that consent is explicit, current, revocable,
session-specific, and never inferred from trust or compatibility
(`CURRENT_STATE.md`, `docs/CONSENT_FLOW.md`). We propose treating a person's
**data** the same way, and using the GDPR's structure as the vocabulary for
that — not because it is the only jurisdiction that matters, but because its
principles are the most complete existing articulation of "consent-first data
handling" and match this product's own ethics more closely than a
minimal-compliance checklist would:

- **Data minimization.** Already the practiced default: age eligibility stores a
  _declared range_, never a birthdate or ID (`0025-apple-declared-age-range-gate.md`);
  peer trust signals are two coarse facts (`account_age_days`, `completed_sessions`),
  never a score (ADR 0033); moderation evidence exposes a boolean
  (`has_device_private_note`) rather than decrypting a user's private note
  (ADR 0037). Any new data field proposed under this doc should justify itself
  against "what is the minimum fact that accomplishes the safety purpose,"
  not "what would be useful to collect."
- **Purpose limitation.** Trust events, rate-limit counters, and moderation
  case data exist to make specific safety decisions (matching eligibility,
  abuse throttling, human review) — not for engagement analytics, ranking, or
  any purpose a user did not agree to when the data was created. Chapter 6's
  planned "non-sensitive product analytics" must be scoped in writing to
  exclude consent answers, private notes, report narratives, and precise
  location (already stated in the chapter spec) before it is built.
- **Storage limitation.** Data should have a stated lifetime, not live
  indefinitely by default because deleting it was never designed. Today this is
  inconsistent: block rows are hard-deleted on unblock (no retention), while
  reports, moderation cases, and trust events are append-only with no deletion
  or retention policy at all. See "Retention & deletion" below for a proposal.
- **Right to erasure, access, and portability.** A user should be able to see
  what is held about them and ask for it to be deleted, with narrow,
  _documented_ exceptions (an open safety investigation), exactly as Chapter 6
  already specifies. This is currently **entirely unbuilt** (see Gap inventory)
  and should not be treated as a "nice to have" — it is the same ethical claim
  as consent revocability, applied to data instead of touch.
- **Privacy by design and default.** Every Chapter 5 RPC already fails closed
  and returns opaque errors rather than leaking why a request was denied
  (blocked vs. restricted vs. missing vs. underage all look identical to the
  requester). New surfaces (invite codes, kill-switch, notifications) should
  hold that same bar: default to the least-disclosing behavior, and require a
  specific reason to reveal more, not the reverse.
- **Lawful basis = the same explicit consent the product already requires.**
  We are not relying on "legitimate interest" hand-waving for sensitive data;
  the product's entire premise is that people opt in explicitly and can opt out
  at any time. Data practices should be describable to a user in one sentence
  they'd actually agree with.

None of this is a claim of legal GDPR compliance — that requires actual legal
review (jurisdiction, lawful-basis documentation, a real Article 30 record,
possibly a DPO decision), which is explicitly out of scope for a coding agent
to assert. It is a design stance: build as if the strictest reasonable
data-rights framework applies, because it is also the framework most consistent
with what this product already promises about touch.

## What Chapter 5 already built (ground truth, not proposal)

All of this lives in Postgres/Supabase migrations as `security definer` RPC
functions called directly from the Expo app via `supabase.rpc(...)` — there is
no Express backend involvement in any safety/moderation logic (`backend/routes/`
only covers Chapter 3/4 compatibility, consent, and session-snapshot concerns).

| Area                             | Status                      | Key pieces                                                                                                                                                                                                             |
| -------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blocking                         | **Implemented**             | One-way, non-disclosing (`user_blocks`, ADR 0024); ends open sessions on block (ADR 0040); rate-limited unblock path; UI at `app/app/security/blocked.tsx`                                                             |
| Reports                          | **Implemented**             | Structured categories, reporter-visible coarse status only, reported party has zero access (ADR 0026); staff-shared plaintext message distinct from device-encrypted private note (ADR 0037)                           |
| Moderation review queue          | **Implemented**             | `staff_roles` (service-role-only, no self-service grant), auto-created `moderation_cases` with heuristic priority, claim/note/resolve RPCs (ADR 0027); mobile console at `app/app/security/moderation*.tsx` (ADR 0032) |
| Restrictions                     | **Implemented, one UI gap** | `matching_hold` and `permanent_ban`, human-staff-action-only, both end open sessions (ADR 0030, 0038, 0040); **no mobile UI button to apply a permanent ban** — console only exposes a fixed 7-day hold                |
| Appeals                          | **Implemented**             | Self-service submit, staff uphold/lift (ADR 0034)                                                                                                                                                                      |
| Rate limits                      | **Implemented**             | Session requests, reports, block/unblock; explicitly not automatic punishment (ADR 0028)                                                                                                                               |
| Trust events                     | **Implemented**             | Append-only ledger; self-only coarse signals; peer-visible facts (not a score) (ADR 0029, 0033)                                                                                                                        |
| Age gate                         | **Implemented**             | Apple Declared Age Range, coarse range only, fails closed in production (ADR 0025)                                                                                                                                     |
| Invitation / invite codes        | **Unbuilt**                 | Zero schema/RPC/UI. Chapter 6 spec only.                                                                                                                                                                               |
| Account deletion / export        | **Unbuilt**                 | Zero schema/RPC/UI. Explicitly blocks external TestFlight per `docs/RELEASE_AND_TESTFLIGHT.md`.                                                                                                                        |
| Beta kill-switch / feature flags | **Unbuilt**                 | No mechanism anywhere in the repo.                                                                                                                                                                                     |
| Trusted-contact check-in         | **Unbuilt**                 | Chapter 6 spec only.                                                                                                                                                                                                   |

## Proposals for the unbuilt pieces

Each proposal below is a starting shape, not a spec ready for implementation.
Flagging explicitly where a human decision gates the design, not just the build.

### 1. Invitation / invite-only enrollment

- Single-use or capped-use codes tied to an issuing account (`invited_by`),
  never exposed to the invitee (mirrors the non-disclosure pattern already used
  for blocks — the inviter's identity is provenance for staff, not a social
  feature).
- Expiry (`expires_at`) and staff/self revocation, rate-limited redemption
  attempts (extend the existing `rate_limit_events` action enum with an
  `invite_redeem` action rather than inventing a parallel mechanism).
- Redemption must compose with existing restriction checks the same way
  `request_session()` already composes block/age/restriction checks — an
  invite code must not be a bypass for a banned or restricted account trying to
  re-enroll under a new identity. This is explicitly called out as a
  requirement in `CHAPTER_6_PRIVATE_ALPHA.md` and is the main reason this
  shouldn't be built as a bolt-on separate from the existing restriction system.
- **Open question:** does invite issuance start out founder-only (simplest,
  matches current solo-operator reality), or does every enrolled user get a
  small invite budget? The latter is a product/growth decision, not an
  engineering one.

### 2. Retention & deletion (GDPR-aligned by design, per the philosophy above)

Proposed default retention posture, **explicitly a proposal for founder/legal
sign-off, not a decided policy**:

- **Trust events, moderation cases/notes, resolved reports:** retain for a
  bounded window after resolution (e.g. proposed 12 months) to support abuse
  pattern detection and appeals, then either delete or irreversibly aggregate.
  The current schema has no expiry at all — this is a real gap, not a tuning
  question.
- **Block history after unblock:** `docs/CHAPTER_5_NEXT_STEPS.md` already flags
  this as an open product decision (currently hard-deleted on unblock). Proposal:
  keep a minimal tombstone (pair + timestamp, no reason) for a short window
  (e.g. 90 days) to catch block/unblock/re-block abuse cycling, then purge —
  but this trades off against the "blocked party never learns they were
  blocked" guarantee and needs explicit sign-off that a tombstone doesn't leak
  anything back to either party.
- **Account deletion request:** user-initiated RPC that deletes/anonymizes
  profile, boundaries, and non-safety-relevant data on request, **except**
  narrow, documented holds for an open moderation case or restriction appeal
  involving that account (exactly as Chapter 6 specifies) — the exception must
  be scoped to the specific open case, not a blanket "safety data is exempt."
- **Data export:** a self-service RPC returning the same categories of data a
  user can already see piecemeal (profile, boundaries, own reports, own trust
  signals, own session history) in one structured export — this is largely an
  aggregation of existing self-only RPCs, not new data collection.
- **Open question requiring legal review, not engineering judgment:** whether
  any report category (e.g. `underage_concern`) carries a legal retention or
  reporting obligation that would override a user's deletion request. This
  document does not and cannot resolve that — flagging it so it isn't silently
  skipped.

### 3. Beta kill-switch

- Proposal: a single staff-controlled `platform_flags` table (or a `matching_paused`
  boolean readable via a cheap RPC) that, when set, makes `discovery_profiles()`
  and `request_session()` fail closed platform-wide with the same honest,
  non-alarming copy already used for individual restrictions — reusing the
  existing fail-closed pattern rather than inventing a new one.
- Should be staff-audit-logged (who flipped it, when) — Chapter 6 already
  specs "audit logs for administrative actions" as a requirement this can share.
- **Open question:** does the kill-switch pause new session requests only, or
  also force-end active sessions (like a permanent ban does today)? Proposal:
  start with new-requests-only — force-ending active sessions platform-wide is
  a much bigger intervention and should require a separate, explicit incident
  decision, not be bundled into routine kill-switch semantics.

### 4. Escalation ladder

Today, `underage_concern` and `coercion_pressure`/`unsafe_behavior`/`boundary_violation`
reports get elevated priority (`urgent`/`high`) in the moderation queue
automatically, but "elevated priority in a queue only the founder currently
staffs" is not really an escalation ladder — it's a sort order. Proposal for
what an actual ladder needs, **all pending founder decision**:

- A defined second tier beyond "founder reviews the queue" for when the
  founder is unavailable or the report implicates the founder's own conduct
  (solo-operator conflict-of-interest case).
- A documented threshold for when a case moves from "internal moderation
  action" (hold/ban) to "referred outside the product" (law enforcement,
  legal counsel) — this is a legal question, not a product one, and should not
  be answered by an agent.
- A written incident-response contact list, per Chapter 6's own requirement,
  which by definition requires human names/contacts an agent cannot supply.

### 5. Human review capacity (operational reality check)

Every "staff-only" surface built in Chapter 5 assumes a `staff_roles` row
exists, which today is granted only via direct database write by whoever holds
`service_role` access — there is no in-app staff onboarding. At current
solo-operator scale this is honestly fine (it fails closed by default, which is
the right posture), but it means the entire moderation/appeals/kill-switch
system currently has exactly one possible reviewer. Before "broader discovery"
(this doc's own trigger condition per `ROADMAP.md`), that single point of
failure — both operationally (founder unavailable) and ethically (founder
reviewing reports made about the founder) — needs an explicit decision, not
just more code.

## Explicit non-goals of this document

Consistent with `AGENTS.md`'s constraint against inventing new product
chapters or legal conclusions:

- This document does not authorize starting Chapter 6 implementation.
- This document does not constitute legal review, a DPO opinion, or a claim of
  GDPR/CCPA/any-jurisdiction compliance.
- This document does not decide jurisdiction exclusions for the alpha —
  Chapter 6 requires that decision to be made and documented, and it isn't
  made here.
- This document does not name real incident-response contacts, legal counsel,
  or moderation staff beyond the founder.

## Suggested next step

Founder review of the "Open question" items above, in order of what blocks the
most other work: (1) retention/deletion posture, since it blocks external
TestFlight per `docs/RELEASE_AND_TESTFLIGHT.md` regardless of this doc; (2)
who staffs escalation beyond the founder; (3) invite-issuance model. Once those
are decided, this document should be split into per-feature ADRs the way
Chapter 5's decisions were (one ADR per accepted decision), rather than
implemented directly from this proposal doc.
