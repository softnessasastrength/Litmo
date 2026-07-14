import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealPreRenn,
  computeVerdict,
  sealPreRenn,
  defaultPreRennDraft,
} from "./preRennGateCore.ts";
import {
  canSealWeather,
  sealWeather,
  skyLabel,
  weatherSuggestions,
  defaultWeatherDraft,
} from "./weatherCore.ts";
import {
  AFTERCARE_MODES,
  canSealAftercare,
  resolveAftercareSteps,
  sealAftercare,
  findAftercare,
} from "./aftercareCore.ts";
import { recommendProtocols } from "./protocolRecommenderCore.ts";
import { createManualDebrief } from "./privateDebriefCore.ts";
import {
  FLOOD_STEPS,
  createFloodEntry,
  summarizeFlood,
} from "./floodProtocolCore.ts";
import {
  canSealApology,
  composeApology,
  sealApology,
  defaultApologyDraft,
} from "./apologyCraftCore.ts";
import { createFieldNote, summarizeFieldNotes } from "./fieldNotesCore.ts";

describe("cook session protocols", () => {
  it("pre-renn red when flooded", () => {
    const v = computeVerdict(5, 4, "need them to fix me");
    assert.equal(v.verdict, "red");
    assert.ok(v.recommendedHrefs.includes("/soft-signal/practice"));
    const d = {
      ...defaultPreRennDraft(),
      bodyFlood: 5 as const,
      urgeToText: 4 as const,
      purpose: "spiral",
      softSignalAcknowledged: true,
      delayPledgeMinutes: 15 as const,
    };
    assert.equal(canSealPreRenn(d).ok, true);
    const s = sealPreRenn(d);
    assert.ok(s);
    assert.equal(s!.verdict, "red");
  });

  it("pre-renn green when calm + purpose", () => {
    const v = computeVerdict(1, 1, "share a funny cat video");
    assert.equal(v.verdict, "green");
  });

  it("weather sky labels + seal", () => {
    assert.ok(skyLabel(1, 5, 2, 1).includes("Storm") || skyLabel(1, 5, 2, 1).length > 3);
    const d = {
      ...defaultWeatherDraft(),
      energy: 3 as const,
      anxiety: 4 as const,
      attachmentHeat: 4 as const,
      capacityForOthers: 2 as const,
      softSignalAcknowledged: true,
      note: "weird day",
    };
    assert.equal(canSealWeather(d).ok, true);
    const s = sealWeather(d);
    assert.ok(s);
    assert.ok(s!.skyLabel.length > 2);
    assert.ok(weatherSuggestions(s!).length >= 1);
  });

  it("aftercare modes + denser", () => {
    const modes = AFTERCARE_MODES.filter((m) => m.id !== "undecided");
    assert.ok(modes.length >= 5);
    const mode = findAftercare("after_flood");
    const base = resolveAftercareSteps(mode, false);
    const dense = resolveAftercareSteps(mode, true);
    assert.ok(dense.length >= base.length);
    const d = {
      modeId: "after_conflict" as const,
      softSignalAcknowledged: true,
      partnerLine: "I care about us",
    };
    assert.equal(canSealAftercare(d).ok, true);
    assert.ok(sealAftercare(d, true)?.denser);
  });

  it("flood protocol minimal steps", () => {
    assert.ok(FLOOD_STEPS.length >= 6);
    const e = createFloodEntry(["stop", "body", "soft_signal"], "soft_signal");
    assert.equal(e.endReason, "soft_signal");
    assert.equal(summarizeFlood([e]).soft_signal, 1);
  });

  it("apology craft composes without auto-send", () => {
    const d = {
      ...defaultApologyDraft(),
      impact: "the silence after dinner hurt",
      mySlice: "I froze and left without a map",
      notDoing: "self-annihilation monologue",
      repairOffer: "we time-box a repair talk tomorrow",
      softSignalAcknowledged: true,
    };
    assert.equal(canSealApology(d).ok, true);
    const line = composeApology(d);
    assert.ok(line.includes("Soft Signal free"));
    assert.ok(sealApology(d)?.composedLine);
  });

  it("field notes capture", () => {
    const n = createFieldNote({
      body: "urge to text is high; writing here instead",
      tags: ["urge", "renn_adjacent"],
      mood: 2,
    });
    assert.ok(n);
    assert.equal(summarizeFieldNotes([n!]).total, 1);
  });

  it("recommender ranks without partner data", () => {
    const debriefs = [
      createManualDebrief({
        title: "flood",
        regulation: 2,
        worked: "",
        didnt: "",
        tags: ["too_much_story", "flooded"],
        softSignalUsed: true,
        source: "too_much",
      }),
      createManualDebrief({
        title: "flood2",
        regulation: 2,
        worked: "",
        didnt: "",
        tags: ["too_much_story"],
        softSignalUsed: false,
        source: "too_much",
      }),
      createManualDebrief({
        title: "flood3",
        regulation: 3,
        worked: "",
        didnt: "",
        tags: ["too_much_story"],
        softSignalUsed: true,
        source: "too_much",
      }),
    ];
    const recs = recommendProtocols({
      debriefs,
      hour: 23,
      weather: {
        id: "w",
        version: "0.1",
        sealedAt: new Date().toISOString(),
        energy: 2,
        anxiety: 5,
        attachmentHeat: 4,
        capacityForOthers: 1,
        note: "",
        skyLabel: "Storm",
      },
    });
    assert.ok(recs.length >= 2);
    assert.ok(recs.some((r) => r.href === "/pre-renn" || r.href === "/too-much"));
    assert.ok(recs.every((r) => r.why.length > 0));
  });
});
