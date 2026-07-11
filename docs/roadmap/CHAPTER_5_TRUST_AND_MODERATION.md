# Chapter 5 — Trust and Moderation

## Mission

Build accountability without reducing human safety to a universal score.

Litmo must present specific, legible trust signals while preserving privacy, resisting retaliation, and routing serious concerns to human review.

## Trust principles

- Trust data supports judgment; it does not certify safety.
- No single score should imply that a person is safe or unsafe.
- Positive history does not override current consent.
- One report must not automatically trigger public punishment.
- Serious patterns must remain discoverable to authorized moderators.
- Retaliatory reporting and review manipulation must be considered explicitly.

## User-visible trust signals

Use specific indicators such as:

- Account age
- Profile completeness
- Completed sessions
- Repeat connections
- Community-guideline acknowledgment
- Optional verification state
- Active moderation restrictions
- Positive private session confirmations where disclosure is safe

Avoid public star ratings, popularity rankings, and public negative reviews.

## Append-only trust events

Create an append-only event model for:

- Account creation
- Profile completion
- Session completion
- Repeat connection
- Verification changes
- Report submission
- Moderation action
- Restriction expiration
- Appeal outcome

Events must have clear provenance, timestamps, actor authorization, and safe metadata.

## Blocking

- Blocking is immediate.
- Blocked accounts cannot discover, request, contact, or interact with one another.
- Blocking must not reveal which party initiated it.
- Existing future requests are cancelled safely.
- Historical records remain available only where required for moderation and audit.

## Reporting

Support structured report categories and optional private narrative.

Requirements:

- Preserve relevant session and audit references.
- Separate reporter-visible status from internal moderator notes.
- Minimize collection of unnecessary sensitive details.
- Protect report data with strict authorization.
- Acknowledge reports without promising a specific outcome.
- Provide emergency-resource language without presenting Litmo as emergency response.

## Moderation workflow

Create a human-review queue supporting:

- Triage priority
- Assigned moderator
- Evidence references
- Internal notes
- Temporary restrictions
- Permanent restrictions
- No-action outcomes
- Escalation
- Appeals
- Decision history

Moderation actions must be auditable and reversible where appropriate.

## Abuse resistance

Add controls for:

- Request spam
- Account cycling
- Report flooding
- Retaliatory reports
- Harassment after rejection
- Attempts to infer who blocked or reported someone
- Moderator privilege misuse

Use rate limits and anomaly signals as review inputs, not automatic proof of misconduct.

## Privacy

- Reports and moderator notes are never public.
- Participants do not see one another's private wrap-up answers.
- Public trust indicators reveal only what is necessary.
- Sensitive evidence access is role-restricted and audited.
- Data retention and deletion exceptions are documented.

## Testing

Cover:

- Blocking enforcement across discovery, requests, and sessions
- Unauthorized report access
- Duplicate reports
- Rate limiting
- Moderator role boundaries
- Temporary and permanent restrictions
- Appeals
- Audit history
- Retaliation-resistance scenarios
- Privacy of independent post-session responses

## Acceptance criteria

- No universal public safety score exists.
- Trust signals are specific and explainable.
- Blocking is immediate and non-disclosing.
- Reporting preserves evidence while minimizing sensitive data.
- Moderation decisions require authorized human action.
- Actions and appeals are auditable.
- Abuse controls exist for spam and retaliation.
- Private reports and wrap-ups remain private.
- Moderator permissions have automated tests.
- Limitations and escalation procedures are documented.
