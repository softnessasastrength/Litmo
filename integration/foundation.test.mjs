import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
const password = "IntegrationOnly123!";
const createStorage = (values = new Map()) => ({
  getItem: async (name) => values.get(name) ?? null,
  setItem: async (name, value) => void values.set(name, value),
  removeItem: async (name) => void values.delete(name),
});
const client = (storage = createStorage()) =>
  createClient(url, key, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

test("account, persistence, versioning, restoration, and RLS isolation", async () => {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const storageA = createStorage();
  const a = client(storageA);
  const b = client();
  const signupA = await a.auth.signUp({
    email: `chapter2-a-${nonce}@example.test`,
    password,
    options: { data: { display_name: "Integration A" } },
  });
  const signupB = await b.auth.signUp({
    email: `chapter2-b-${nonce}@example.test`,
    password,
    options: { data: { display_name: "Integration B" } },
  });
  assert.equal(signupA.error, null);
  assert.equal(signupB.error, null);
  assert.ok(signupA.data.session);
  assert.ok(signupB.data.session);
  const userA = signupA.data.user.id;
  const userB = signupB.data.user.id;
  const progress = await a
    .from("onboarding_progress")
    .update({
      current_step: "touch_language",
      draft_profile: { questionIndex: 3 },
    })
    .eq("user_id", userA)
    .select()
    .single();
  assert.equal(progress.error, null);
  assert.equal(progress.data.current_step, "touch_language");
  const first = await a.rpc("save_profile_versions", {
    touch_profile: { pressure: "light" },
    consent_preferences: {
      bodyZones: [{ zone: "hands", status: "ask_first", pressure: "light" }],
    },
  });
  const second = await a.rpc("save_profile_versions", {
    touch_profile: { pressure: "medium" },
    consent_preferences: {
      bodyZones: [{ zone: "hands", status: "ask_first", pressure: "medium" }],
    },
  });
  assert.equal(first.error, null);
  assert.equal(second.error, null);
  assert.deepEqual(first.data[0], { touch_version: 1, consent_version: 1 });
  assert.deepEqual(second.data[0], { touch_version: 2, consent_version: 2 });
  const crossRead = await a
    .from("touch_profile_versions")
    .select("id")
    .eq("user_id", userB);
  assert.equal(crossRead.error, null);
  assert.equal(crossRead.data.length, 0);
  const crossUpdate = await a
    .from("profiles")
    .update({ display_name: "Not allowed" })
    .eq("user_id", userB)
    .select();
  assert.equal(crossUpdate.error, null);
  assert.equal(crossUpdate.data.length, 0);
  const restored = client(storageA);
  const restoredSession = await restored.auth.getSession();
  assert.equal(restoredSession.error, null);
  assert.equal(restoredSession.data.session?.user.id, userA);
  assert.equal((await a.auth.signOut()).error, null);
  assert.equal((await a.auth.getSession()).data.session, null);
});
