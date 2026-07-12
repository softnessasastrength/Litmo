# Consent and Safety

Consent in Litmo is explicit, current, revocable, and session-specific.

## Core rules

- Consent is never inferred.
- The strictest compatible boundary wins.
- Both participants must affirm the same immutable Consent Snapshot.
- A session cannot become active before mutual confirmation.
- Either participant may withdraw before or during a session.
- The Soft Signal ends the interaction immediately.
- Stopping requires no explanation and no counterpart approval.
- Trust history provides context, not certainty.

## Consent Snapshot

A Consent Snapshot is the exact, immutable intersection of the participants' current compatible boundaries for one session. It is not a general agreement and does not carry over automatically to another session.

If either participant changes a relevant profile version, the old snapshot must not silently remain authoritative.

## Fail-closed behavior

When consent data is missing, stale, contradictory, unavailable, or ambiguous, Litmo should refuse activation rather than guess.

## Soft Signal and withdrawal

Starting requires agreement. Stopping never does.

A stop should:

1. take effect locally immediately;
2. disable the active session interface;
3. invalidate prior confirmations;
4. prevent reactivation of the terminal session;
5. synchronize safely when connectivity returns;
6. notify the counterpart without exposing a private reason.

## Trust Ledger

The Trust Ledger records carefully limited, authorized history. It must never imply that a person is universally safe, assign public scores, or turn prior participation into future consent.

## Human review

Reports, uncomfortable outcomes, and ambiguous safety concerns require careful human handling. Automation must not make unsupported conclusions about intent, harm, or personal character.