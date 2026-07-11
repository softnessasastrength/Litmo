# ADR 0001: Directional, fail-closed consent engine

**Status:** Accepted  
**Date:** 2026-07-11

## Context

Touch compatibility is asymmetric: one person may welcome receiving something they cannot or do not wish to offer. A single undirected preference would incorrectly broaden compatibility. Missing, stale, or contradictory information must not be interpreted as permission.

## Decision

The canonical framework-independent engine in `@litmo/domain` evaluates `a_receives_from_b` and `b_receives_from_a` separately. Every rule identifies a dimension, value, consent state, receive capability, offer capability, optional pressure, and optional maximum duration.

The engine:

- resolves state, pressure, and duration conservatively;
- excludes missing, invalid, stale, contradictory, or unavailable directions;
- separates welcomed, ask-first, and excluded results;
- emits machine-readable reasons and privacy-safe human explanations;
- always returns `consentGranted: false` because compatibility never grants consent;
- creates snapshots tied to exact profile IDs and versions;
- clears confirmations after material fingerprint changes or withdrawal.

## Alternatives considered

- A single mutual boolean was rejected because it loses direction and explanation.
- Client-specific engines were rejected because platforms could disagree on safety-critical semantics.
- Treating absent preferences as ask-first was rejected because absence is not informed permission.
- Using private notes in explanations was rejected because it would disclose unnecessary reasoning.

## Consequences

The model is explicit and testable but requires more profile data and UI explanation. Duplicate entries are currently treated as contradictory and excluded. Snapshot fingerprints are deterministic change identifiers, not cryptographic signatures or proof of authenticity.

## Follow-up work

- Persist canonical rules and snapshots under RLS.
- Add a practical-effect preview before profile-version creation.
- Replace the legacy backend overlap adapter after a documented migration contract exists.
- Obtain independent consent, privacy, accessibility, and abuse-case review.
