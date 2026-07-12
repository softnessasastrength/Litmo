import {
  toConsentProfileVersion,
  type ConsentPreference,
  type ConsentProfileVersion,
  type TouchLanguageProfile,
} from "@litmo/domain";

/**
 * Chapter 3 synthetic fixtures only. Discovery, matches, and sessions remain
 * mock until Chapter 4 wires real two-participant data; this file lets the
 * mock Consent Snapshot screen run the real canonical engine against
 * plausible mock inputs instead of a hardcoded display array.
 */
const FIXED_CREATED_AT = "2026-07-11T10:00:00Z";
const personaIds = ["self", "maya", "eli", "jonah"] as const;
export type MockPersonaId = (typeof personaIds)[number];
const touchId: Record<MockPersonaId, string> = {
  self: "20000000-0000-4000-8000-000000000001",
  maya: "20000000-0000-4000-8000-000000000002",
  eli: "20000000-0000-4000-8000-000000000003",
  jonah: "20000000-0000-4000-8000-000000000004",
};
export const personaUserId: Record<MockPersonaId, string> = {
  self: "10000000-0000-4000-8000-000000000001",
  maya: "10000000-0000-4000-8000-000000000002",
  eli: "10000000-0000-4000-8000-000000000003",
  jonah: "10000000-0000-4000-8000-000000000004",
};
const legacyProfiles: Record<
  MockPersonaId,
  { touch: TouchLanguageProfile; consent: ConsentPreference }
> = {
  self: {
    touch: {
      pressure: "medium",
      duration: "few_minutes",
      environments: ["hosted_community"],
      holdTypes: ["side_by_side"],
      privateNervousSystemNotes: null,
    },
    consent: {
      bodyZones: [
        { zone: "hands", status: "welcomed", pressure: "medium" },
        { zone: "shoulders", status: "ask_first", pressure: "light" },
        { zone: "upper_back", status: "welcomed", pressure: "medium" },
      ],
      hardStops: ["face"],
      privateNervousSystemNotes: null,
    },
  },
  maya: {
    touch: {
      pressure: "medium",
      duration: "brief",
      environments: ["hosted_community", "public_calm"],
      holdTypes: ["side_by_side", "hand_holding"],
      privateNervousSystemNotes: null,
    },
    consent: {
      bodyZones: [
        { zone: "hands", status: "welcomed", pressure: "medium" },
        { zone: "shoulders", status: "ask_first", pressure: "medium" },
        { zone: "upper_back", status: "welcomed", pressure: "firm" },
      ],
      hardStops: [],
      privateNervousSystemNotes: null,
    },
  },
  eli: {
    touch: {
      pressure: "light",
      duration: "decide_together",
      environments: ["outdoors"],
      holdTypes: ["hand_holding"],
      privateNervousSystemNotes: null,
    },
    consent: {
      bodyZones: [{ zone: "hands", status: "welcomed", pressure: "light" }],
      hardStops: ["shoulders"],
      privateNervousSystemNotes: null,
    },
  },
  jonah: {
    touch: {
      pressure: "firm",
      duration: "few_minutes",
      environments: ["hosted_community"],
      holdTypes: ["side_by_side"],
      privateNervousSystemNotes: null,
    },
    consent: {
      bodyZones: [
        { zone: "hands", status: "welcomed", pressure: "firm" },
        { zone: "upper_back", status: "welcomed", pressure: "firm" },
      ],
      hardStops: [],
      privateNervousSystemNotes: null,
    },
  },
};
export function mockConsentProfileVersion(
  personaId: string,
): ConsentProfileVersion {
  const id: MockPersonaId = (personaIds as readonly string[]).includes(
    personaId,
  )
    ? (personaId as MockPersonaId)
    : "maya";
  const legacy = legacyProfiles[id];
  return toConsentProfileVersion({
    touchId: touchId[id],
    touchVersion: 1,
    consentVersion: 1,
    userId: personaUserId[id],
    createdAt: FIXED_CREATED_AT,
    touch: legacy.touch,
    consent: legacy.consent,
  });
}
export const mockSnapshotNow = new Date(FIXED_CREATED_AT);
