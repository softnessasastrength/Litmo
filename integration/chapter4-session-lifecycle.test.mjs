/**
 * Deterministic two-client Chapter 4 lifecycle integration scenario.
 *
 * Covers: request → accept → consent_pending → trusted snapshot creation →
 * dual confirmation → activation → Soft Signal → independent private wrap-ups.
 *
 * Uses existing repo boundaries only:
 * - authenticated Supabase RPCs (request/transition/confirm/withdraw/wrap-up)
 * - the same trusted snapshot service the Express route uses
 *   (backend/services/sessionSnapshotService.js + service-role repository)
 *
 * Requires local Supabase (Docker). Snapshot creation also needs
 * SUPABASE_SERVICE_ROLE_KEY (supplied by scripts/run-integration.mjs).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createSessionSnapshotService } from "../backend/services/sessionSnapshotService.js";
import { createSupabaseSessionSnapshotRepository } from "../backend/services/supabaseSessionSnapshotRepository.js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = "IntegrationOnly123!";

/** Compatible Chapter 2 shapes the legacy adapter + consent engine accept. */
const compatibleTouch = {
  pressure: "medium",
  duration: "few_minutes",
  environments: ["public_calm"],
  holdTypes: ["hand_holding"],
};
const compatibleConsent = {
  bodyZones: [{ zone: "hands", status: "welcomed", pressure: "medium" }],
  hardStops: [],
};

const createStorage = (values = new Map()) => ({
  getItem: async (name) => values.get(name) ?? null,
  setItem: async (name, value) => void values.set(name, value),
  removeItem: async (name) => void values.delete(name),
});

const client = (storage = createStorage()) =>
  createClient(url, anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

async function signUp(label, nonce) {
  const storage = createStorage();
  const supabase = client(storage);
  const result = await supabase.auth.signUp({
    email: `chapter4-${label}-${nonce}@example.test`,
    password,
    options: { data: { display_name: `Chapter4 ${label}` } },
  });
  assert.equal(result.error, null, `${label} signup: ${result.error?.message}`);
  assert.ok(result.data.session, `${label} must receive a session`);
  assert.ok(result.data.user?.id, `${label} must receive a user id`);

  // Private-alpha admission is a production gate. Integration accounts are
  // synthetic and are admitted explicitly through the trusted test boundary.
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admission = await admin.from("private_alpha_memberships").insert({
    user_id: result.data.user.id,
    enrolled_by: null,
  });
  assert.equal(admission.error, null, `${label} private-alpha admission: ${admission.error?.message}`);

  return { supabase, userId: result.data.user.id, accessToken: result.data.session.access_token };
}

async function saveCompatibleProfiles(supabase) {
  const { data, error } = await supabase.rpc("save_profile_versions", {
    touch_profile: compatibleTouch,
    consent_preferences: compatibleConsent,
  });
  assert.equal(error, null, `save_profile_versions: ${error?.message}`);
  assert.equal(data[0].touch_version, 1);
  assert.equal(data[0].consent_version, 1);
  // Adult eligibility is required before request_session (ADR 0025).
  const age = await supabase.rpc("record_age_signal", {
    p_status: "adult",
    p_source: "development_self_attest",
    p_lower: null,
    p_upper: null,
  });
  assert.equal(age.error, null, `record_age_signal: ${age.error?.message}`);
}

async function sessionStatus(supabase, sessionId) {
  const { data, error } = await supabase
    .from("sessions")
    .select("status,started_at")
    .eq("id", sessionId)
    .single();
  assert.equal(error, null, `session read: ${error?.message}`);
  return data;
}

test("two clients: request, accept, dual snapshot confirm, activate, Soft Signal, private wrap-ups", async () => {
  assert.ok(url, "SUPABASE_URL is required");
  assert.ok(anonKey, "SUPABASE_ANON_KEY is required");
  assert.ok(
    serviceRoleKey,
    "SUPABASE_SERVICE_ROLE_KEY is required for trusted snapshot creation",
  );

  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const a = await signUp("a", nonce);
  const b = await signUp("b", nonce);

  await saveCompatibleProfiles(a.supabase);
  await saveCompatibleProfiles(b.supabase);

  // --- request ---
  const request = await a.supabase.rpc("request_session", {
    p_recipient_id: b.userId,
    p_idempotency_key: `request-${nonce}`,
  });
  assert.equal(request.error, null, `request_session: ${request.error?.message}`);
  const sessionId = request.data;
  assert.equal(typeof sessionId, "string");
  assert.equal((await sessionStatus(a.supabase, sessionId)).status, "requested");

  // Recipient sees the pending request; requester does not list self-requests.
  const incoming = await b.supabase.rpc("list_incoming_requests");
  assert.equal(incoming.error, null, `list_incoming_requests: ${incoming.error?.message}`);
  const listed = (incoming.data ?? []).find((row) => row.id === sessionId);
  assert.ok(listed, "recipient must see the pending request");
  assert.equal(listed.requester_id, a.userId);
  assert.ok(listed.expires_at, "request must expose an expiration timestamp");

  // --- accept (recipient only) then enter consent review ---
  const accept = await b.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "accepted",
    p_idempotency_key: `accept-${nonce}`,
  });
  assert.equal(accept.error, null, `accept: ${accept.error?.message}`);
  assert.equal(accept.data, "accepted");

  const consentPending = await b.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "consent_pending",
    p_idempotency_key: `consent-pending-${nonce}`,
  });
  assert.equal(
    consentPending.error,
    null,
    `consent_pending: ${consentPending.error?.message}`,
  );
  assert.equal(consentPending.data, "consent_pending");

  // --- trusted snapshot creation (same service the Express route uses) ---
  const createSnapshot = createSessionSnapshotService(
    createSupabaseSessionSnapshotRepository(),
  );
  const snapshot = await createSnapshot({
    accessToken: a.accessToken,
    sessionId,
  });
  assert.ok(snapshot.id);
  assert.match(snapshot.fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(snapshot.compatibility.consentGranted, false);
  assert.equal(snapshot.compatibility.eligible, true);

  // --- dual confirmation of the exact fingerprint ---
  const confirmA = await a.supabase.rpc("confirm_session_snapshot", {
    p_snapshot_id: snapshot.id,
    p_fingerprint: snapshot.fingerprint,
  });
  assert.equal(confirmA.error, null, `confirm A: ${confirmA.error?.message}`);
  assert.equal(confirmA.data, "consent_pending");

  const confirmB = await b.supabase.rpc("confirm_session_snapshot", {
    p_snapshot_id: snapshot.id,
    p_fingerprint: snapshot.fingerprint,
  });
  assert.equal(confirmB.error, null, `confirm B: ${confirmB.error?.message}`);
  assert.equal(confirmB.data, "ready");
  assert.equal((await sessionStatus(a.supabase, sessionId)).status, "ready");

  // --- activation ---
  const activate = await a.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "active",
    p_idempotency_key: `activate-${nonce}`,
  });
  assert.equal(activate.error, null, `activate: ${activate.error?.message}`);
  assert.equal(activate.data, "active");
  const active = await sessionStatus(b.supabase, sessionId);
  assert.equal(active.status, "active");
  assert.ok(active.started_at, "activation must record started_at");

  // --- Soft Signal ends the session for both ---
  const softSignal = await a.supabase.rpc("withdraw_session_consent", {
    p_session_id: sessionId,
    p_idempotency_key: `withdraw-${nonce}`,
  });
  assert.equal(
    softSignal.error,
    null,
    `Soft Signal: ${softSignal.error?.message}`,
  );
  assert.equal(softSignal.data, "soft_signaled");
  assert.equal(
    (await sessionStatus(b.supabase, sessionId)).status,
    "soft_signaled",
  );

  // Terminal: reactivation fails closed.
  const reopen = await b.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "active",
    p_idempotency_key: `reopen-${nonce}`,
  });
  assert.ok(reopen.error, "terminal Soft Signal session must reject reactivation");

  // --- independent private wrap-ups ---
  const wrapA = await a.supabase.rpc("submit_session_wrapup", {
    p_session_id: sessionId,
    p_outcome: "soft_signal_used",
    p_private_note: null,
    p_idempotency_key: `wrap-a-${nonce}`,
  });
  assert.equal(wrapA.error, null, `wrap-up A: ${wrapA.error?.message}`);
  assert.ok(wrapA.data);

  const wrapB = await b.supabase.rpc("submit_session_wrapup", {
    p_session_id: sessionId,
    p_outcome: "ended_normally",
    p_private_note: null,
    p_idempotency_key: `wrap-b-${nonce}`,
  });
  assert.equal(wrapB.error, null, `wrap-up B: ${wrapB.error?.message}`);
  assert.ok(wrapB.data);
  assert.notEqual(wrapA.data, wrapB.data);

  const ownA = await a.supabase
    .from("session_wrapups")
    .select("id,user_id,outcome,private_note")
    .eq("session_id", sessionId);
  assert.equal(ownA.error, null);
  assert.equal(ownA.data.length, 1);
  assert.equal(ownA.data[0].user_id, a.userId);
  assert.equal(ownA.data[0].outcome, "soft_signal_used");

  const ownB = await b.supabase
    .from("session_wrapups")
    .select("id,user_id,outcome")
    .eq("session_id", sessionId);
  assert.equal(ownB.error, null);
  assert.equal(ownB.data.length, 1);
  assert.equal(ownB.data[0].user_id, b.userId);
  assert.equal(ownB.data[0].outcome, "ended_normally");

  // Counterpart cannot read the other's wrap-up row (RLS).
  const crossA = await a.supabase
    .from("session_wrapups")
    .select("id")
    .eq("id", wrapB.data);
  assert.equal(crossA.error, null);
  assert.equal(crossA.data.length, 0);

  // --- append-only audit trail visible to participants ---
  const events = await a.supabase
    .from("session_events")
    .select("prior_state,resulting_state,event_type")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  assert.equal(events.error, null, `session_events: ${events.error?.message}`);
  const resulting = events.data.map((row) => row.resulting_state);
  for (const required of [
    "requested",
    "accepted",
    "consent_pending",
    "ready",
    "active",
    "soft_signaled",
  ]) {
    assert.ok(
      resulting.includes(required),
      `audit trail must include transition to ${required}`,
    );
  }

  assert.equal((await a.supabase.auth.signOut()).error, null);
  assert.equal((await b.supabase.auth.signOut()).error, null);
});

test("two clients: cancel outgoing request and list open mid-lifecycle sessions", async () => {
  assert.ok(url && anonKey);
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const a = await signUp("cancel-a", nonce);
  const b = await signUp("cancel-b", nonce);
  await saveCompatibleProfiles(a.supabase);
  await saveCompatibleProfiles(b.supabase);

  const request = await a.supabase.rpc("request_session", {
    p_recipient_id: b.userId,
    p_idempotency_key: `cancel-req-${nonce}`,
  });
  assert.equal(request.error, null, request.error?.message);
  const sessionId = request.data;

  const outgoing = await a.supabase.rpc("list_outgoing_requests");
  assert.equal(outgoing.error, null);
  assert.ok(
    (outgoing.data ?? []).some((row) => row.id === sessionId),
    "requester sees outgoing request",
  );

  const cancel = await a.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "cancelled",
    p_idempotency_key: `cancel-${nonce}`,
  });
  assert.equal(cancel.error, null, cancel.error?.message);
  assert.equal(cancel.data, "cancelled");

  const outgoingAfter = await a.supabase.rpc("list_outgoing_requests");
  assert.equal(outgoingAfter.error, null);
  assert.equal(
    (outgoingAfter.data ?? []).some((row) => row.id === sessionId),
    false,
  );

  // Fresh request → accept → consent_pending shows in list_open_sessions.
  const request2 = await a.supabase.rpc("request_session", {
    p_recipient_id: b.userId,
    p_idempotency_key: `open-req-${nonce}`,
  });
  assert.equal(request2.error, null, request2.error?.message);
  const openId = request2.data;

  const accept = await b.supabase.rpc("transition_session", {
    p_session_id: openId,
    p_to_state: "accepted",
    p_idempotency_key: `open-accept-${nonce}`,
  });
  assert.equal(accept.error, null);
  const pending = await b.supabase.rpc("transition_session", {
    p_session_id: openId,
    p_to_state: "consent_pending",
    p_idempotency_key: `open-pending-${nonce}`,
  });
  assert.equal(pending.error, null);

  const openA = await a.supabase.rpc("list_open_sessions");
  const openB = await b.supabase.rpc("list_open_sessions");
  assert.equal(openA.error, null, openA.error?.message);
  assert.equal(openB.error, null, openB.error?.message);
  assert.ok((openA.data ?? []).some((row) => row.id === openId));
  assert.ok((openB.data ?? []).some((row) => row.id === openId));
  assert.equal(
    (openA.data ?? []).find((row) => row.id === openId)?.status,
    "consent_pending",
  );

  assert.equal((await a.supabase.auth.signOut()).error, null);
  assert.equal((await b.supabase.auth.signOut()).error, null);
});
