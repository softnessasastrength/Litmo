import assert from "node:assert/strict";
import test from "node:test";
import { createAuthService } from "./authServiceCore.ts";
function fakeAuth(overrides: Record<string, unknown> = {}) {
  return {
    signUp: async () => ({
      data: { session: { access_token: "public-test-token" } },
      error: null,
    }),
    signInWithPassword: async () => ({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    }),
    signOut: async () => ({ error: null }),
    ...overrides,
  } as never;
}
test("successful signup returns the established session", async () => {
  const service = createAuthService({ auth: fakeAuth() });
  const session = await service.signUp(
    "person@example.test",
    "long-password",
    "Person",
  );
  assert.equal(session?.access_token, "public-test-token");
});
test("invalid credentials return the stable public error", async () => {
  const service = createAuthService({ auth: fakeAuth() });
  await assert.rejects(
    service.signIn("bad@example.test", "wrong-password"),
    (error: unknown) =>
      (error as { code: string }).code === "auth_invalid_credentials",
  );
});
test("logout delegates to the authoritative auth client", async () => {
  let called = false;
  const service = createAuthService({
    auth: fakeAuth({
      signOut: async () => {
        called = true;
        return { error: null };
      },
    }),
  });
  await service.signOut();
  assert.equal(called, true);
});
