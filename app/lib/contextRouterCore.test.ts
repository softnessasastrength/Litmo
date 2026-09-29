import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeContext } from "./contextRouterCore.ts";

describe("context router", () => {
  it("routes flood and low capacity to the smallest landing path", () => {
    assert.equal(routeContext({ state: "flooded" }).href, "/flood");
    assert.equal(
      routeContext({ state: "need_to_communicate", capacity: "low", goal: "ask" }).href,
      "/flood",
    );
  });

  it("routes repair before reflective work", () => {
    assert.equal(
      routeContext({ state: "post_conflict", capacity: "some" }).href,
      "/reconcile",
    );
    assert.equal(
      routeContext({ state: "understand_myself", goal: "repair", capacity: "open" }).href,
      "/reconcile",
    );
  });

  it("gates outward communication", () => {
    assert.equal(
      routeContext({ state: "need_to_communicate", goal: "ask", capacity: "some" }).href,
      "/pre-renn",
    );
  });

  it("holds the closeness/fear dual bind", () => {
    assert.equal(
      routeContext({ state: "closeness_scared", capacity: "some" }).href,
      "/need-scared",
    );
  });

  it("allows low-pressure closeness when explicitly wanted and capacity is open", () => {
    assert.equal(
      routeContext({ state: "closeness_scared", goal: "be_close", capacity: "open" }).href,
      "/parallel-play",
    );
  });

  it("defaults reflection to weather rather than inventing a crisis", () => {
    const result = routeContext({ state: "understand_myself", goal: "understand" });
    assert.equal(result.href, "/weather");
    assert.ok(result.why.length > 0);
  });
});
