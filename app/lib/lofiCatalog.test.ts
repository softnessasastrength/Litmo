import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LOFI_TRACKS,
  clampVolume,
  defaultTrackForProtocol,
  findLofiTrack,
  nextTrackId,
  prevTrackId,
  tracksForProtocol,
} from "./lofiCatalog.ts";

describe("lofiCatalog", () => {
  it("has protocol coverage + https uris + attribution", () => {
    assert.ok(LOFI_TRACKS.length >= 7);
    for (const t of LOFI_TRACKS) {
      assert.ok(t.uri.startsWith("https://"));
      assert.ok(t.attribution.includes("Kevin MacLeod"));
      assert.equal(t.license, "CC BY 4.0");
    }
    assert.ok(defaultTrackForProtocol("spooning").canonTitle.includes("Spoon"));
    assert.equal(tracksForProtocol("soft_signal").length >= 1, true);
  });

  it("clamp volume and next/prev wrap", () => {
    assert.equal(clampVolume(2), 1);
    assert.equal(clampVolume(-1), 0);
    assert.equal(clampVolume(0.4), 0.4);
    const first = LOFI_TRACKS[0]!.id;
    const last = LOFI_TRACKS[LOFI_TRACKS.length - 1]!.id;
    assert.equal(nextTrackId(last), first);
    assert.equal(prevTrackId(first), last);
    assert.ok(findLofiTrack(first));
  });
});
