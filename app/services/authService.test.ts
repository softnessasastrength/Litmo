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
