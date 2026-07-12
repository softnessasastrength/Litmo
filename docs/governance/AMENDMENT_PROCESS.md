# Governance Amendment Process

Governance is durable but not immutable. It may change when evidence, experience, law, community needs, or the product's maturity justify revision.

## Required process

Every amendment must:

1. identify the exact text and authority being changed;
2. explain the problem that current governance does not adequately address;
3. describe expected benefits, risks, and foreseeable misuse;
4. evaluate effects on consent, safety, privacy, accessibility, accountability, and contributor continuity;
5. include an ADR or equivalent durable decision record;
6. use a dedicated pull request with a clearly labeled governance diff;
7. receive explicit founder approval before merge;
8. update cross-references, agent instructions, and machine-readable state when applicable;
9. state an effective date and any migration or grandfathering rules.

## Prohibited shortcuts

An amendment may not be justified solely by:

- implementation convenience;
- pressure to ship;
- model recommendation;
- competitor behavior;
- engagement or growth targets;
- the existence of technical capability;
- a desire to retroactively authorize already-completed work.

## Emergency amendments

There are no silent emergency amendments. Immediate protective action may be taken under the emergency rule in `DECISION_RIGHTS.md`, but permanent governance change must still complete the normal amendment process.

## Versioning

Material amendments should assign a governance version and record it in the PR, ADR, and `project-state.json`. Editorial corrections that do not change meaning may be merged through normal documentation review but must remain auditable.

## Interpretation disputes

When reasonable contributors disagree about governance meaning, use the more protective interpretation temporarily and escalate for explicit human resolution. Record the resolution durably rather than relying on private conversation.
