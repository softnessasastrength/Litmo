# Data classification

| Class             | Examples                                                                                      | Exposure and handling                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Public            | Product documentation, generic consent education                                              | May be published after review.                                                                                                      |
| Discovery-visible | Display name, pronouns, short bio, provisional vibe archetype                                 | Returned only by the intentional discovery function to authenticated users; never includes consent or private notes.                |
| Private profile   | Email, onboarding progress, incomplete drafts                                                 | Owner-only under RLS. Minimize collection and retention.                                                                            |
| Sensitive consent | Body-zone status, pressure, hard stops, Touch Language versions, private nervous-system notes | Owner-only, versioned, excluded from discovery and general logs. Session-specific disclosure belongs to later consent architecture. |
| Shared session audit | Session identifier, participant actor, lifecycle states, event timestamp, idempotency key, enumerated source/trigger metadata | Readable only by the two session participants under RLS; append-only through `transition_session(...)`. Contains no raw notes or consent details. Deleted with the parent session by cascade under the current POC schema; production retention/deletion policy remains undecided. |
| Shared Consent Snapshot | Exact profile IDs/versions, fingerprint, conservative compatibility output, withdrawal actor/time, invalidation actor/time | Readable only by both session participants; server-created and deleted with the parent session. Never includes private nervous-system notes. Material profile edits retain the snapshot as invalidated history but clear confirmations. Production retention remains undecided. |
| Private snapshot confirmation | Participant ID, exact fingerprint, confirmation timestamp | Owner-readable only; the counterpart cannot inspect a pending decision. Cleared on withdrawal and deleted with the snapshot/session. |
| Moderation        | Reports, evidence, moderator notes, restrictions                                              | Not implemented in Chapter 2. Future access must be role-restricted, audited, and human-reviewed.                                   |
| Secrets           | Service-role keys, JWT secrets, database passwords, signing credentials                       | Server secret manager only. Never source control, mobile bundles, logs, or `EXPO_PUBLIC_` variables.                                |

## Logging rule

Identifiers and stable public error codes may be logged in development when necessary. Raw consent answers, body zones, private notes, passwords, tokens, session contents, report narratives, and secrets must not be logged.

## Discovery rule

Data is not discovery-visible merely because it belongs to a profile. Adding a discovery field requires an explicit database-function change, privacy review, and documentation update.
