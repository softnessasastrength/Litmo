# Trust system

The Trust Ledger records completed-session outcomes without presenting a person as certified safe.

## Principles

- Trust context is earned gradually and cannot replace current consent.
- Public views should expose minimal aggregate context, not sensitive session details.
- `Safe` outcomes may increment an affirmed-session count.
- `Neutral` outcomes are retained without reward or punishment.
- `Uncomfortable` outcomes remain private and enter a human-review workflow.
- No automatic score decrement, public accusation, or irreversible enforcement occurs from one outcome alone.
- Ledger immutability protects history; correction and appeal records must be additive.

The POC uses database constraints and append-only records. A production system requires independent abuse-prevention, identity, privacy, moderation, and legal review.

Chapter 4 stores each participant's post-session wrap-up privately and immutably. The counterpart cannot read it, and uncomfortable or safety-concern outcomes do not automatically create a public trust event or penalty. Chapter 5 must route those outcomes into access-controlled human review before any moderation action exists.
