import assert from "node:assert/strict";
import test from "node:test";
import { createDeviceRegistrationService } from "./deviceRegistrationServiceCore.ts";

function dependencies(stored: string | null = null) {
  let value = stored;
  let signedOut = false;
  const calls: Array<{ name: string; input: Record<string, unknown> }> = [];
  const storage = {
    get: async () => value,
    set: async (next: string) => {
      value = next;
    },
    clear: async () => {
      value = null;
    },
  };
  const client = {
    rpc: async (name: string, input: Record<string, unknown>) => {
      calls.push({ name, input });
      return name === "verify_auth_device"
        ? { data: true, error: null }
        : { data: null, error: null };
    },
    auth: {
      signOut: async () => {
        signedOut = true;
        return { error: null };
      },
    },
  };
  let sequence = 0;
  const service = createDeviceRegistrationService({
    storage: storage as never,
    client: client as never,
    randomUUID: () =>
      `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
    platform: "ios",
  });
  return {
    service,
    calls,
    getStored: () => value,
    isSignedOut: () => signedOut,
  };
}

test("registration creates and stores a device-bound identity after server acceptance", async () => {
  const deps = dependencies();
  const id = await deps.service.register();
  assert.equal(id, "00000000-0000-4000-8000-000000000001");
  assert.equal(deps.calls[0]?.name, "register_auth_device");
  assert.match(deps.getStored() ?? "", /00000000-0000-4000-8000-000000000001/);
});

test("corrupt local identity is cleared and replaced instead of crashing bootstrap", async () => {
  const deps = dependencies("not-json");
  await deps.service.register();
  assert.doesNotMatch(deps.getStored() ?? "", /not-json/);
});

test("revoking the current installation clears secrets and signs out immediately", async () => {
  const identity = {
    id: "00000000-0000-4000-8000-000000000009",
    secret: "s".repeat(72),
  };
  const deps = dependencies(JSON.stringify(identity));
  await deps.service.revoke(identity.id);
  assert.equal(deps.getStored(), null);
  assert.equal(deps.isSignedOut(), true);
});
