import assert from "node:assert/strict";
import test from "node:test";
import { createAuthService } from "./authServiceCore.ts";

const session = { access_token: "redacted-test-token" };
const registrationOptions = {
  challenge_id: "registration-challenge",
  options: {
    challenge: "challenge",
    rp: { id: "softnessasastrength.com", name: "Litmo" },
    user: { id: "user", name: "person@example.test", displayName: "Person" },
  },
};
const authenticationOptions = {
  challenge_id: "authentication-challenge",
  options: { challenge: "challenge", rpId: "softnessasastrength.com" },
};

function dependencies(overrides: Record<string, unknown> = {}) {
  const auth = {
    signInWithOtp: async () => ({ data: {}, error: null }),
    verifyOtp: async () => ({ data: { session }, error: null }),
    signInWithPassword: async () => ({ data: { session }, error: null }),
    signOut: async () => ({ error: null }),
    passkey: {
      startRegistration: async () => ({
        data: registrationOptions,
        error: null,
      }),
      verifyRegistration: async () => ({
        data: { id: "passkey-1" },
        error: null,
      }),
      startAuthentication: async () => ({
        data: authenticationOptions,
        error: null,
      }),
      verifyAuthentication: async () => ({ data: { session }, error: null }),
      list: async () => ({ data: [{ id: "passkey-1" }], error: null }),
      delete: async () => ({ data: null, error: null }),
    },
    ...overrides,
  };
  const native = {
    register: async () => ({ id: "credential" }),
    authenticate: async () => ({ id: "credential" }),
  };
  return { auth, native };
}

test("account bootstrap sends an OTP without a password", async () => {
  let input: unknown;
  const deps = dependencies({
    signInWithOtp: async (value: unknown) => {
      input = value;
      return { data: {}, error: null };
    },
  });
  await createAuthService(
    { auth: deps.auth } as never,
    deps.native,
  ).requestAccountCode(" person@example.test ", "Person");
  assert.deepEqual(input, {
    email: "person@example.test",
    options: { shouldCreateUser: true, data: { display_name: "Person" } },
  });
});

test("ceremony gate is invoked around passkey sign-in", async () => {
  const calls: string[] = [];
  const deps = dependencies();
  await createAuthService(
    { auth: deps.auth } as never,
    deps.native,
    async (input) => {
      calls.push(`${input.phase}:${input.ceremony}:${input.outcome ?? ""}`);
    },
  ).signInWithPasskey();
  assert.ok(calls.some((c) => c.startsWith("start:authenticate")));
  assert.ok(calls.some((c) => c.includes("complete:authenticate:succeeded")));
});

test("successful passkey sign-in returns the verified session", async () => {
  const deps = dependencies();
  const result = await createAuthService(
    { auth: deps.auth } as never,
    deps.native,
  ).signInWithPasskey();
  assert.equal(result.access_token, "redacted-test-token");
});

test("duplicate passkey requests fail closed", async () => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const deps = dependencies();
  deps.native.authenticate = async () => {
    await blocked;
    return { id: "credential" };
  };
  const service = createAuthService({ auth: deps.auth } as never, deps.native);
  const first = service.signInWithPasskey();
  await assert.rejects(
    service.signInWithPasskey(),
    (error: unknown) =>
      (error as { code: string }).code === "auth_request_in_progress",
  );
  release();
  await first;
});

test("cancellation is surfaced and does not create a session", async () => {
  const deps = dependencies();
  deps.native.authenticate = async () => {
    throw { code: "ERR_PASSKEY_CANCELLED" };
  };
  await assert.rejects(
    createAuthService(
      { auth: deps.auth } as never,
      deps.native,
    ).signInWithPasskey(),
  );
});

test("the only passkey cannot be removed", async () => {
  const deps = dependencies();
  await assert.rejects(
    createAuthService({ auth: deps.auth } as never, deps.native).removePasskey(
      "passkey-1",
    ),
    (error: unknown) =>
      (error as { code: string }).code === "auth_recovery_required",
  );
});

test("development seed password sign-in returns a session", async () => {
  let seen: unknown;
  const deps = dependencies({
    signInWithPassword: async (value: unknown) => {
      seen = value;
      return { data: { session }, error: null };
    },
  });
  const result = await createAuthService(
    { auth: deps.auth } as never,
    deps.native,
  ).signInWithPassword("maya.demo@litmo.local", "LitmoDemo123!");
  assert.equal(result, session);
  assert.deepEqual(seen, {
    email: "maya.demo@litmo.local",
    password: "LitmoDemo123!",
  });
});

test("addPasskey aliases registration and verifies with Supabase", async () => {
  let verified = false;
  const deps = dependencies();
  deps.auth.passkey.verifyRegistration = async () => {
    verified = true;
    return { data: { id: "passkey-2" }, error: null };
  };
  const service = createAuthService({ auth: deps.auth } as never, deps.native);
  const result = await service.addPasskey();
  assert.equal((result as { id: string }).id, "passkey-2");
  assert.equal(verified, true);
});

test("isPasskeyPlatformReady respects native availability", async () => {
  const ready = createAuthService(
    { auth: dependencies().auth } as never,
    {
      register: async () => ({}),
      authenticate: async () => ({}),
      isAvailable: async () => true,
    },
  );
  assert.equal(await ready.isPasskeyPlatformReady(), true);

  const unavailable = createAuthService(
    { auth: dependencies().auth } as never,
    {
      register: async () => ({}),
      authenticate: async () => ({}),
      isAvailable: async () => false,
    },
  );
  assert.equal(await unavailable.isPasskeyPlatformReady(), false);
});

test("sign-in fails closed when native passkeys are unavailable", async () => {
  await assert.rejects(
    createAuthService(
      { auth: dependencies().auth } as never,
      {
        register: async () => ({}),
        authenticate: async () => ({}),
        isAvailable: async () => false,
      },
    ).signInWithPasskey(),
    (error: unknown) =>
      (error as { code: string }).code === "auth_passkey_unavailable",
  );
});
