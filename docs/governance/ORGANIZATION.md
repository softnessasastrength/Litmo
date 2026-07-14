# Organizational Model

**Reality check:** today this is one founder plus AI coding agents — there is no team filling the distinct "stewardship" roles below. Read them as hypothetical role definitions for if the project ever grew, not as filled positions (in particular, "Independent review" is not currently staffed; see `CURRENT_STATE.md`'s open item: "named second reviewer... not inventable").

Litmo may be built by a changing mix of human and AI contributors. Roles are defined by responsibility, not vendor, model, employment status, or repository permission.

## Accountable human ownership

At least one identified human must remain accountable for mission, governance, protected decisions, release authorization, and the consequences of operating the product.

AI systems may advise and implement. They do not replace accountable human ownership.

## Functional roles

### Product and philosophy stewardship

Maintains mission, protected principles, user promises, roadmap intent, and boundaries around what Litmo refuses to become.

### Safety and consent stewardship

Reviews consent semantics, session lifecycle, emergency behavior, moderation, abuse cases, and fail-safe defaults.

### Privacy and security stewardship

Reviews identity, authentication, encryption, secrets, data minimization, retention, deletion, access control, and incident risk.

### Accessibility stewardship

Ensures core experiences remain usable across assistive technologies, sensory needs, language clarity, motion preferences, and device constraints.

### Architecture and implementation

Translates approved product intent into maintainable, tested, documented systems.

### Documentation and continuity

Keeps repository artifacts synchronized, navigable, model-portable, and sufficient for a new contributor to resume work.

### Independent review

Challenges assumptions, verifies tests and claims, inspects regressions, and checks alignment with governance.

### Release operations

Maintains reproducible builds, signing boundaries, packaging, deployment evidence, rollback paths, and release records.

## Recommended multi-agent workflow

For material work, prefer distinct roles even when several are performed by different AI systems:

1. a human authorizes the milestone and protected boundaries;
2. an implementing contributor builds on a feature branch;
3. an independent contributor reviews code, tests, safety, and documentation;
4. CI supplies reproducible automated evidence;
5. an accountable human approves protected changes and merge;
6. a release operator follows the documented release process.

## Scaling principle

When Litmo gains contributors, authority should become more explicit rather than more informal. Add maintainers, review requirements, escalation paths, and domain ownership without weakening the constitutional principles.

## Vendor and model resilience

The organization must tolerate contributors, models, vendors, and tools disappearing. No essential workflow or institutional knowledge may depend on one provider's private state.

## Disagreement

Disagreement is recorded through review comments, ADR alternatives, risk notes, and explicit decisions. The goal is not forced consensus; it is auditable reasoning and accountable resolution.
