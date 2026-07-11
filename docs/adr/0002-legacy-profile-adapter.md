# ADR 0002: Legacy profile to canonical consent-rule adapter

**Status:** Accepted
**Date:** 2026-07-11

## Context

Chapter 2 persists two independently versioned tables per user: `touch_profile_versions` (pressure, duration, environments, hold types) and `consent_preference_versions` (body zones with a welcomed/ask_first/off_limits status and per-zone pressure, plus free-text hard stops). Both use the domain shapes `TouchLanguageProfileSchema` and `ConsentPreferenceSchema`.

The Chapter 3 canonical engine (`docs/adr/0001-directional-consent-engine.md`) evaluates a single `ConsentProfileVersion`: one `id`, one `version`, and a flat list of directional `ConsentRule` entries keyed by dimension and value. Neither legacy table can feed the engine without a documented mapping, and `backend/routes/consent.js` still runs a separate, non-directional overlap implementation. This ADR defines that mapping so the legacy adapter is no longer undocumented ad hoc logic.

## Decision

Add a pure function in `@litmo/domain` that combines one `TouchLanguageProfile` and one `ConsentPreference` (from the same save) into one `ConsentProfileVersion`:

- **Identity.** `save_profile_versions` always inserts a new touch row and a new consent row in the same transaction, so their versions move in lockstep. The adapter uses the touch row's `id`, `userId`, `version`, and `createdAt` as canonical, and **throws** if the supplied touch and consent versions do not match. A mismatch means the two tables have drifted apart in a way this ADR does not define; failing closed is safer than guessing which is current.
- **Body zones → `body_zone`.** Each `BodyZonePreference` becomes one rule: `dimension: "body_zone"`, `value: zone`, `state: status`, `pressure: zone.pressure`. Chapter 2 has no concept of directional receive/offer capability, so every mapped rule sets `canReceive: true, canOffer: true`. This is a conservative default only in the sense that it is symmetric, not permissive: the engine still requires both participants' rules to agree, and `off_limits` still wins.
- **Hard stops → `body_zone`, forced `off_limits`.** Each hard-stop string becomes a `body_zone` rule with `state: "off_limits"`, `canReceive: false, canOffer: false`, `pressure: null`. A hard stop for a zone name the counterpart never lists is still safe: unmatched dimension/value pairs are already excluded as `missing_preference`, so nothing was going to be permitted there regardless.
- **Environments → `environment`.** Each listed environment becomes a `welcomed`, symmetric rule. Chapter 2 has no way to mark an environment `off_limits` or `ask_first`; an environment absent from the list is excluded as `missing_preference`, which is the conservative default already, not a broadened permission.
- **Hold types → `contact_type`.** Each free-text hold type becomes a `welcomed`, symmetric rule, matched by exact case-insensitive string per the engine's existing normalization.
- **Top-level pressure and duration → `pressure` / `duration`, value `"general"`.** These represent a general ceiling rather than a specific zone. `duration` maps `brief -> 15`, `few_minutes -> 30`, and `decide_together -> null`. A `null` maximum is not "unlimited": the engine's `duration()` rule takes the other participant's bound whenever one side is `null`, so `decide_together` only ever contributes the counterpart's limit, never removes one.
- **Private notes.** The two separate `privateNervousSystemNotes` fields are concatenated with a newline into the canonical profile's single note field when both are present. Notes are carried for future audit use only; the engine never reads them and they never appear in compatibility output or explanations (already covered by existing tests).
- **Staleness.** The adapter does not set `validUntil`; Chapter 2 has no expiry concept yet. This is a known gap, not a broadened permission — the engine still fails closed on missing or contradictory data through every other rule.

## Alternatives considered

- Deriving canonical rules directly inside `backend/routes/consent.js` was rejected: it would duplicate Chapter 3 semantics in an untested, framework-coupled location instead of the shared, exhaustively tested domain package.
- Treating hard stops as a distinct dimension was rejected: the fixed `consentDimensions` enum has no slot for it, and folding it into `body_zone` with `off_limits` produces the same fail-closed result without widening the schema.
- Marking environments/hold types as `ask_first` by default instead of `welcomed` was rejected: Chapter 2 users explicitly opted into these values already (they are not absent data), so treating an explicit selection as requiring a fresh ask would misrepresent what the user chose. Absence, not presence, is what is treated conservatively (`missing_preference`).

## Consequences

The legacy Express `/api/consent/overlap` route becomes explicitly deprecated but is retained unmodified as a compatibility shim until a client migration removes it (`docs/KNOWN_LIMITATIONS.md`). A new canonical `/api/consent/compatibility` route uses this adapter and the Chapter 3 engine directly. The adapter does not change any database schema or persisted shape; it is a read-time transform only.

## Follow-up work

- Capture directional (receive vs. offer) preferences explicitly in a future profile-editing UI instead of assuming symmetry.
- Add an expiry/staleness concept to Chapter 2 profile versions so `validUntil` is meaningful.
- Remove the legacy `/overlap` route once no client depends on it.
