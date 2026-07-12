# Consent withdrawal and emergency stop

## Core invariant

Starting requires mutual agreement. Stopping never does.

`withdraw_session_consent(session_id,idempotency_key)` is the canonical safety authority. It uses the same snapshot-then-session lock order as confirmation, serializes against activation, verifies the actor is a participant, and chooses `cancelled` before activation or `soft_signaled` while active. In the same transaction it marks snapshots withdrawn, deletes every confirmation, writes one minimal audit event, sets terminal session state, and records active-session end time. It accepts no reason field.

If activation commits first, withdrawal observes `active` and immediately soft-signals it. If withdrawal commits first, the terminal session rejects activation. Thus every serialized outcome ends stopped; ambiguous authority never restores consent.

## Idempotency and replay

The participant supplies a 1–128 character request identifier. A repeated identifier returns the first resulting state and writes no duplicate event. Terminal sessions cannot reactivate, reconfirm, resume, or complete normally. Stale fingerprint confirmation is rejected because withdrawal clears confirmations and marks the snapshot withdrawn.

The shared audit contains only actor, server timestamp, prior/resulting state, request identifier, and empty metadata. It contains no reason, safety category, boundary, note, or counterpart-visible explanation.

## Offline-first mobile flow

The emergency-stop button performs these operations in order:

1. Disable the active-session controls and timer locally.
2. Lock the sensitive-data decrypt boundary immediately, without Face ID or passkey interaction.
3. Persist a minimal `{sessionId,idempotencyKey}` pending action in the passcode-required, this-device-only Keychain.
4. Attempt the database function.
5. On success, delete the pending action and show stopped.
6. On failure, remain stopped locally, show awaiting sync, and retry the same identifier during authenticated restoration.

The pending record has no reason or session content. A malformed pending record remains fail-closed and never resumes the session.

## User-facing states and language

- **Stopping:** controls disabled; “Stopping…”
- **Stopped:** “The session has ended.”
- **Stopped locally, awaiting sync:** the device states that the session cannot resume locally and Litmo will retry privately.
- **Counterpart unavailable/cancelled/terminal:** represented by the server terminal state without a reason.
- **Sync failure/retry required:** retains the local stop and durable action; network failure never re-enables controls.

Language is direct, non-blaming, and never asks for justification.

## Notification privacy

Notification content is fixed to “Open Litmo for a private update.” It contains no name, session, consent, boundary, withdrawal, or safety information. Private detail remains behind application unlock. Remote push delivery/retry infrastructure is not yet deployed; failure to deliver a notification never affects terminal authority.

## Threat model and limitations

The database protects against modified clients, duplicate/replayed requests, unauthorized callers, confirmation reuse, and activation/withdrawal races. The local pending action protects against offline operation and app termination after the durable local write.

The real request/discovery flow does not yet pass persisted session IDs into every screen, and Supabase Realtime/push infrastructure is not wired. The server invariant and repository path are real; the visible demo remains synthetic when no `sessionId` is present. Old clients can display stale content until they fetch/reconnect, but cannot mutate a terminal session or activate from invalid confirmations. Independent device/network chaos testing and physical-device termination testing remain required before external beta.
