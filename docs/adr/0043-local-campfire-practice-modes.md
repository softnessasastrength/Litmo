# ADR 0043 — Local Campfire practice modes

## Status

Accepted for a local, phone-visible MVP.

## Date

2026-07-13

## Context

The founder requested Campfire Mode as three related experiences: a group
gathering, quiet co-regulation, and a digital campfire. Litmo's current data and
consent model is pair-specific. Treating this request as authorization for
multi-person matching, durable group membership, or group Consent Snapshots
would silently expand safety-sensitive scope beyond the reviewed model.

The product also rejects engagement traps and treats the app as scaffolding
people should eventually outgrow. A campfire must therefore support presence
without scores, streaks, public activity, or surveillance.

## Decision

Implement one phone-visible Campfire hub with three device-local practices:

1. **Circle campfire:** two to eight people pass one phone around. Every seat
   independently opts in before the circle can begin. Readiness permits only
   joining the gathering; it does not permit touch, disclosure, advice, or a
   duration. A single prominent control lets anyone pause immediately without a
   reason.
2. **Quiet co-regulation:** an open-ended flame with an orientation timer. The
   timer is not a target and no duration is saved.
3. **Digital campfire:** a finite five-, ten-, or twenty-minute focus flame with
   visible progress and neutral stages. It has no task list, score, streak, or
   completion history.

All state is React component memory. Leaving the screen or restarting the app
clears it. Campfire requests no camera, microphone, contacts, location, health,
notification, or account data and emits no analytics.

Campfire is linked from Guided Practice. It is available in demo mode and real
account mode because it has no server authority and shares no data.

## Alternatives considered

- **Real multi-person sessions:** rejected for this milestone. The database,
  Consent Snapshot, authorization, emergency-stop, blocking, reporting, and
  moderation models are pair-specific and require a separate threat model and
  ADR before expansion.
- **A visual theme only:** rejected because it would not implement the requested
  social and co-regulation practices.
- **Persisted completion and streaks:** rejected because Campfire is presence,
  not engagement optimization or certification.
- **Audio fire, microphone synchrony, or wearable signals:** rejected because
  they add permissions, sensory assumptions, privacy risk, and platform
  dependencies without being necessary for the practice.

## Consequences

- Campfire is immediately phone-visible and backend-independent.
- Individual readiness and immediate stopping are represented in the UI.
- The group mode is a facilitated local ritual, not a Litmo group session and
  not evidence of consent.
- Timing is best-effort while the screen is open; there is no background
  notification or durable recovery.
- No Campfire participation appears in trust history or account export because
  no participation data is collected.

## Follow-up work

- Complete a physical VoiceOver and large-text review.
- If real multi-person Litmo sessions are ever proposed, design canonical group
  consent, per-participant withdrawal, blocking/reporting consequences,
  authorization, retention, and moderation before implementation.
- Consider an optional locally bundled soundscape only after sensory and
  accessibility review; it must remain off by default.
