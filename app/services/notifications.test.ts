import assert from "node:assert/strict";
import test from "node:test";
import { privacySafeNotificationContent } from "./notificationsCore.ts";

test("notification defaults reveal no identity, session, consent, or safety content", () => {
  const serialized = JSON.stringify(privacySafeNotificationContent());
  assert.equal(
    serialized,
    '{"title":"Litmo","body":"Open Litmo for a private update."}',
  );
  assert.doesNotMatch(
    serialized,
    /session|consent|withdraw|safety|name|boundary/i,
  );
});
