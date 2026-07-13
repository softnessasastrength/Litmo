# ADR 0042 — Recommended private-alpha safety-operations foundation

- **Status:** accepted for engineering; external-review gates remain
- **Date:** 2026-07-13
- **Decision owner:** founder

## Context

BETA-001 passed, but broader private-alpha use remained blocked by the absence
of admission controls, a platform matching pause, bounded operational data
lifetimes, and a portable self-export. The founder explicitly selected the
recommended actions in `docs/SAFETY_OPS_FOUNDER_DECISIONS.md`.

Some recommendations are product/engineering decisions. Others require
qualified legal, privacy, safeguarding, or independent human review. Engineering
must not collapse those categories or represent provisional values as approved
policy.

## Decision

Implement the first fail-closed private-alpha foundation:

1. founder/staff-issued, single-use invitation codes;
2. seven-day invitation expiry and revocation support;
3. explicit private-alpha membership gating for discovery and new requests;
4. a staff-controlled routine kill-switch that pauses discovery and new
   requests without removing Soft Signal, withdrawal, wrap-up, blocking, or
   reporting;
5. a staff-only 90-day minimal block/unblock tombstone with no reason field;
6. 30-day cleanup for rate-limit events and unused expired/revoked invitations;
7. a self-only structured export of categories already available to the user.

Existing accounts at migration time form the initial named cohort. New accounts
must redeem an invitation before entering discovery or requesting a session.
Membership is not identity verification, proof of safety, compatibility,
consent, or legal eligibility.

The following remain deliberately blocked:

- destructive retention for reports, cases, notes, and trust events;
- a complete account-deletion workflow and server-session revocation;
- jurisdiction claims or geographic eligibility enforcement;
- an external-referral policy;
- naming/training an independent backup reviewer;
- two-person permanent-ban approval.

## Alternatives considered

- Leave admission and pause controls entirely operational/manual.
- Store plaintext invite codes.
- Allow participant-issued invite budgets immediately.
- Make the routine kill-switch force-end active sessions.
- Delete safety records automatically using unreviewed time periods.
- Treat invitation or age-range admission as verification.

## Consequences

- New matching activity fails closed when the platform is paused or membership
  is absent.
- Existing local/seed accounts continue working as the initial cohort.
- Invitation plaintext exists only at issuance; the database stores a hash.
- Active sessions retain participant-controlled stop and completion paths
  during a routine matching pause.
- External TestFlight remains blocked until deletion, hosted release,
  disclosure, and independent-review requirements are satisfied.
- The provisional cleanup function must be scheduled by trusted operations; it
  is not exposed to ordinary authenticated users.
