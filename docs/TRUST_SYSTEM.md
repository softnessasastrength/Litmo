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
