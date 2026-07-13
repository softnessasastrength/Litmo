# ADR 0061 — Safety-ops pure domain core, HITL permanent ban, ledger expansion

- **Status:** accepted for engineering; external-review gates remain
- **Date:** 2026-07-13
- **Decision owner:** founder (via SAFETY-OPS-001 recommended directions)
- **Constitution:** Articles I, II.4–II.6, III, IV, VII, VIII.6, X

## Context

Chapter 5 already shipped structured reports, moderation queue, rate limits,
trust events, account restrictions, appeals, staff console UI, and private-alpha
admission (ADR 0042 / migration 036). Remaining product risk:

1. Permanent ban could be applied by a single staff RPC despite founder S10
   (“two-person confirmation when staffing permits”).
2. Queue/restriction/appeal law lived only in SQL and screens — no pure domain
   twin for agents, unit tests, or Constitution mapping.
3. Trust ledger and rate limits lacked appeal / ban-request provenance types.

External blockers remain: named second reviewer, legal/privacy retention,
jurisdiction policy, external referral. Engineering must not invent those.

## Decision

1. **`app/lib/safetyOpsCore.ts`** is the pure fail-closed product law for:
   - report priority heuristics;
   - queue transitions;
   - restriction shape validation;
   - appeal submit/resolve rules;
   - rate-limit budgets;
   - trust event types and forbidden display patterns;
   - permanent-ban dual-HITL policy;
   - matching-pause scope safety;
   - Constitution article map per subsystem.

2. **Migration 042** adds:
   - `platform_safety_settings` with defaults
     `two_person_permanent_ban_required=true`,
     `named_second_owner_configured=false` (service-role write only);
   - `permanent_ban_requests` dual-confirm workflow
     (`request_permanent_ban` / `confirm_permanent_ban` / cancel / list);
   - direct `apply_account_restriction(..., permanent_ban)` fails closed when
     two-person is required;
   - `staff_action_audit` append-only HITL evidence;
   - trust event types: `appeal_submitted`, `appeal_resolved`,
     `permanent_ban_requested`, `permanent_ban_confirmed`,
     `matching_pause_changed`, `private_alpha_enrolled`;
   - rate-limit action `appeal` (5 / 24h) wired into submit appeal.

3. **Staff console** shows permanent-ban blocked copy until completion is
   allowed; when allowed, only **request** is exposed on the case screen —
   confirm remains a distinct staff identity via pending list / RPC.

4. **Honest boundaries:** this ADR does not claim legal, clinical, or
   safeguarding approval. Flipping `named_second_owner_configured` requires a
   real named human documented in the repository (TASKS / founder decisions).

## Alternatives considered

- Leave single-staff permanent ban forever. Rejected: violates S10 and Art VII.
- Auto-ban after N reports. Rejected: Art II.5 human review.
- Client-only dual confirm. Rejected: server must enforce.
- Invent named second owner in code. Rejected: durable-agent honesty rule.

## Consequences

- Existing permanent-ban session tests must disable two-person for synthetic
  session-end checks, or use the dual path with two staff + named flag.
- Matching holds remain single-staff (reversible-class).
- External private alpha still blocked until named second reviewer is real.
- Agents must treat `safetyOpsCore` + this ADR as authoritative for moderation
  product law alongside ADR 0042.

## Related

- `docs/SAFETY_OPS_RUNTIME.md`
- `docs/SAFETY_OPS_FOUNDER_DECISIONS.md` (S7, S8, S10)
- ADR 0026–0034, 0037, 0042
- `docs/CONSTITUTION_ENFORCEMENT.md`
