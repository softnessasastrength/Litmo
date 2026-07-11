# Chapter 6 — Private Alpha

## Mission

Prepare Litmo for a tightly controlled, invite-only adult alpha without representing the product as broadly safe or production-ready.

This chapter focuses on eligibility, privacy, operational safety, observability, controlled discovery, and distribution readiness.

## Invite-only access

- Require single-use or limited-use invite codes.
- Record invite provenance without exposing the inviter publicly.
- Support revocation and expiration.
- Rate-limit redemption attempts.
- Prevent invite codes from bypassing account restrictions.

## Adult eligibility

- Require an explicit adults-only age gate.
- Store only the minimum eligibility record necessary.
- Do not imply that self-attestation is identity verification.
- Document jurisdictions excluded from the alpha.
- Provide administrator controls to suspend enrollment.

Production identity verification remains a later legal, privacy, and vendor decision.

## Safety onboarding

Before discovery, users must acknowledge:

- Litmo is for non-sexual, platonic connection.
- Compatibility is not proof of safety.
- Consent is revocable at any moment.
- A user may stop without explaining why.
- Users should choose environments appropriate to their own risk tolerance.
- Litmo is not emergency response, therapy, or medical care.
- Community guidelines and reporting routes.

Use comprehension checks for essential rules rather than a single unread checkbox.

## Controlled discovery

- Use coarse location or user-selected regions, not precise live coordinates.
- Permit users to hide temporarily from discovery.
- Support neutral/public meeting preference.
- Apply blocks and moderation restrictions before results are returned.
- Minimize exposed profile data.
- Avoid engagement ranking that rewards urgency, popularity, or repeated requests.

## Trusted-contact check-in

Provide an optional workflow that lets a user:

- Select a trusted contact.
- Share a session window and user-authored note.
- Schedule a check-in reminder.
- Confirm they are okay or request their contact be prompted.
- Cancel the check-in.

Clearly state that this is a notification convenience, not monitoring or emergency response. Do not share detailed consent information with the trusted contact.

## Notifications

Add privacy-preserving notifications for:

- Request received
- Request accepted, declined, cancelled, or expired
- Consent confirmation needed
- Upcoming session reminder
- Trusted-contact check-in
- Report status update

Notification previews must avoid sensitive body-zone or consent details.

## Privacy controls

Implement:

- Account data export
- Account deletion request
- Discovery visibility controls
- Notification controls
- Trusted-contact deletion
- Clear retention disclosures
- Documented exceptions for moderation, fraud prevention, and legal obligations

Deletion must not silently destroy records that must be retained for an active safety investigation; those exceptions must be narrow and documented.

## Observability

Add privacy-conscious operational tooling:

- Crash reporting
- Structured server errors
- Health checks
- Non-sensitive product analytics
- Feature flags
- Audit logs for administrative actions
- Alerting for authentication, database, and notification failures

Analytics must not capture raw consent answers, private notes, report narratives, or exact location.

## Alpha feedback

Provide an in-app feedback route separating:

- Product bug
- Accessibility issue
- Confusing consent language
- General product feedback
- Safety concern

Safety concerns must route into the moderation workflow rather than a generic analytics system.

## Distribution readiness

Prepare:

- Separate development, staging, and alpha environments
- Documented secret management
- TestFlight/internal Android distribution configuration
- Release checklist
- Database migration and rollback procedure
- Incident-response contacts and runbook
- Feature-flag rollback
- Terms, privacy, safeguarding, accessibility, and clinical-risk review placeholders

Do not claim legal or safeguarding approval unless independent review has actually occurred.

## Testing

Cover:

- Invite creation, redemption, expiration, and revocation
- Adults-only gate
- Safety-onboarding completion
- Discovery privacy and blocking
- Coarse-location behavior
- Notification redaction
- Trusted-contact check-in and cancellation
- Export and deletion requests
- Environment separation
- Feature-flag rollback
- Administrative audit logs

Run a documented private-alpha rehearsal using only synthetic accounts and data.

## Acceptance criteria

- Enrollment is invite-only and administratively controllable.
- Adult eligibility and safety onboarding are enforced.
- Discovery does not expose precise live location.
- Notifications do not reveal sensitive consent details.
- Trusted-contact check-ins are optional and accurately described.
- Users can request export and deletion.
- Safety feedback routes to moderation.
- Analytics exclude sensitive content.
- Staging and alpha environments are separate.
- Release, rollback, and incident procedures are documented.
- The product continues to disclose that it is an alpha and not a safety guarantee.
