/**
 * BETA-001 Track B automated proof against the real seed accounts.
 *
 * Proves what the founder path depends on after `db reset` / setup-track-b-local:
 * - password grant for maya.demo + eli.demo (GoTrue token columns must be '')
 * - discovery_profiles includes the peer
 * - request → accept → dual snapshot confirm → active → Soft Signal → wrap-ups
 *   using the same seed profiles and trusted snapshot service the mobile app uses
 *
 * Does not create throwaway signup users. Requires local Supabase + service role.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createSessionSnapshotService } from "../backend/services/sessionSnapshotService.js";
import { createSupabaseSessionSnapshotRepository } from "../backend/services/supabaseSessionSnapshotRepository.js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SEED_PASSWORD = "LitmoDemo123!";
const MAYA = {
  email: "maya.demo@litmo.local",
  id: "10000000-0000-4000-8000-000000000001",
};
const ELI = {
  email: "eli.demo@litmo.local",
  id: "10000000-0000-4000-8000-000000000002",
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

async function signInSeed(email) {
  const storage = createStorage();
  const supabase = client(storage);
  const result = await supabase.auth.signInWithPassword({
    email,
    password: SEED_PASSWORD,
  });
  assert.equal(
    result.error,
    null,
    `seed sign-in ${email}: ${result.error?.message ?? result.error}`,
  );
  assert.ok(result.data.session?.access_token, `${email} must receive a token`);
  assert.ok(result.data.user?.id, `${email} must resolve a user id`);
  return {
    supabase,
    userId: result.data.user.id,
    accessToken: result.data.session.access_token,
  };
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

/**
 * Seed accounts persist across tests. End any leftover open pair session so
 * request_session creates a fresh `requested` row instead of reusing one.
 */
async function clearOpenPairSessions(actor, peerId) {
  const open = await actor.supabase.rpc("list_open_sessions");
  assert.equal(open.error, null, `list_open_sessions: ${open.error?.message}`);
  for (const row of open.data ?? []) {
    if (row.user_a !== peerId && row.user_b !== peerId) continue;

    if (row.status === "requested" || row.status === "accepted") {
      const cancel = await actor.supabase.rpc("transition_session", {
        p_session_id: row.id,
        p_to_state: "cancelled",
        p_idempotency_key: `track-b-cleanup-cancel-${row.id}`,
      });
      if (!cancel.error) continue;
    }

    // Pre-activation cancel may be role-gated; withdraw covers consent/active.
    const withdraw = await actor.supabase.rpc("withdraw_session_consent", {
      p_session_id: row.id,
      p_idempotency_key: `track-b-cleanup-withdraw-${row.id}`,
    });
    assert.equal(
      withdraw.error,
      null,
      `cleanup open ${row.status}: ${withdraw.error?.message}`,
    );
  }
}

test("Track B seed accounts: password grant, discovery, full lifecycle", async () => {
  assert.ok(url, "SUPABASE_URL is required");
  assert.ok(anonKey, "SUPABASE_ANON_KEY is required");
  assert.ok(
    serviceRoleKey,
    "SUPABASE_SERVICE_ROLE_KEY is required for trusted snapshot creation",
  );

  const maya = await signInSeed(MAYA.email);
  const eli = await signInSeed(ELI.email);
  assert.equal(maya.userId, MAYA.id);
  assert.equal(eli.userId, ELI.id);

  // Discovery should surface the peer (seed personas are requestable).
  const discovery = await maya.supabase.rpc("discovery_profiles");
  assert.equal(
    discovery.error,
    null,
    `discovery_profiles: ${discovery.error?.message}`,
  );
  const peer = (discovery.data ?? []).find((row) => row.user_id === ELI.id);
  assert.ok(peer, "maya must see eli in discovery_profiles");
  assert.ok(
    typeof peer.display_name === "string" && peer.display_name.length > 0,
    "discovery row must expose a display name",
  );
  // Peer signals are facts, not a score field.
  assert.equal(
    Object.prototype.hasOwnProperty.call(peer, "safety_score"),
    false,
  );

  await clearOpenPairSessions(maya, ELI.id);
  await clearOpenPairSessions(eli, MAYA.id);

  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // --- request (maya → eli) ---
  const request = await maya.supabase.rpc("request_session", {
    p_recipient_id: ELI.id,
    p_idempotency_key: `track-b-request-${nonce}`,
  });
  assert.equal(
    request.error,
    null,
    `request_session: ${request.error?.message}`,
  );
  const sessionId = request.data;
  assert.equal(typeof sessionId, "string");
  assert.equal(
    (await sessionStatus(maya.supabase, sessionId)).status,
    "requested",
  );

  const incoming = await eli.supabase.rpc("list_incoming_requests");
  assert.equal(incoming.error, null, incoming.error?.message);
  const listed = (incoming.data ?? []).find((row) => row.id === sessionId);
  assert.ok(listed, "eli must see maya's pending request");
  assert.equal(listed.requester_id, MAYA.id);
  assert.ok(listed.expires_at, "incoming request exposes expires_at");

  // --- accept + consent review ---
  const accept = await eli.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "accepted",
    p_idempotency_key: `track-b-accept-${nonce}`,
  });
  assert.equal(accept.error, null, accept.error?.message);
  assert.equal(accept.data, "accepted");

  const consentPending = await eli.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "consent_pending",
    p_idempotency_key: `track-b-pending-${nonce}`,
  });
  assert.equal(consentPending.error, null, consentPending.error?.message);
  assert.equal(consentPending.data, "consent_pending");

  // --- trusted snapshot (seed profiles already version 1000) ---
  const createSnapshot = createSessionSnapshotService(
    createSupabaseSessionSnapshotRepository(),
  );
  const snapshot = await createSnapshot({
    accessToken: maya.accessToken,
    sessionId,
  });
  assert.ok(snapshot.id);
  assert.match(snapshot.fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(snapshot.compatibility.consentGranted, false);

  const confirmMaya = await maya.supabase.rpc("confirm_session_snapshot", {
    p_snapshot_id: snapshot.id,
    p_fingerprint: snapshot.fingerprint,
  });
  assert.equal(confirmMaya.error, null, confirmMaya.error?.message);

  const confirmEli = await eli.supabase.rpc("confirm_session_snapshot", {
    p_snapshot_id: snapshot.id,
    p_fingerprint: snapshot.fingerprint,
  });
  assert.equal(confirmEli.error, null, confirmEli.error?.message);
  assert.equal(confirmEli.data, "ready");

  // --- activate + Soft Signal ---
  const activate = await maya.supabase.rpc("transition_session", {
    p_session_id: sessionId,
    p_to_state: "active",
    p_idempotency_key: `track-b-active-${nonce}`,
  });
  assert.equal(activate.error, null, activate.error?.message);
  assert.equal(activate.data, "active");
  assert.ok((await sessionStatus(eli.supabase, sessionId)).started_at);

  const softSignal = await eli.supabase.rpc("withdraw_session_consent", {
    p_session_id: sessionId,
    p_idempotency_key: `track-b-soft-${nonce}`,
  });
  assert.equal(softSignal.error, null, softSignal.error?.message);
  assert.equal(softSignal.data, "soft_signaled");
  assert.equal(
    (await sessionStatus(maya.supabase, sessionId)).status,
    "soft_signaled",
  );

  const wrapMaya = await maya.supabase.rpc("submit_session_wrapup", {
    p_session_id: sessionId,
    p_outcome: "soft_signal_used",
    p_private_note: null,
    p_idempotency_key: `track-b-wrap-maya-${nonce}`,
  });
  assert.equal(wrapMaya.error, null, wrapMaya.error?.message);

  const wrapEli = await eli.supabase.rpc("submit_session_wrapup", {
    p_session_id: sessionId,
    p_outcome: "ended_normally",
    p_private_note: null,
    p_idempotency_key: `track-b-wrap-eli-${nonce}`,
  });
  assert.equal(wrapEli.error, null, wrapEli.error?.message);

  // Privacy: each only sees own wrap-up.
  const mayaWraps = await maya.supabase
    .from("session_wrapups")
    .select("id,user_id")
    .eq("session_id", sessionId);
  assert.equal(mayaWraps.error, null);
  assert.equal(mayaWraps.data.length, 1);
  assert.equal(mayaWraps.data[0].user_id, MAYA.id);

  assert.equal((await maya.supabase.auth.signOut()).error, null);
  assert.equal((await eli.supabase.auth.signOut()).error, null);
});

test("Track B seed accounts: all four password grants succeed", async () => {
  assert.ok(url && anonKey);
  for (const email of [
    "maya.demo@litmo.local",
    "eli.demo@litmo.local",
    "eli-persona.demo@litmo.local",
    "jonah-persona.demo@litmo.local",
  ]) {
    const signed = await signInSeed(email);
    assert.ok(signed.accessToken);
    assert.equal((await signed.supabase.auth.signOut()).error, null);
  }
});
