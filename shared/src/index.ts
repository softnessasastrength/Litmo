import { z } from "zod";

export const pressureValues = ["light", "medium", "firm"] as const;
export const durationValues = [
  "brief",
  "few_minutes",
  "decide_together",
] as const;
export const environmentValues = [
  "public_calm",
  "outdoors",
  "hosted_community",
] as const;
export const boundaryValues = ["off_limits", "ask_first", "welcomed"] as const;
export const sessionStatusValues = [
  "requested",
  "consent_pending",
  "consented",
  "active",
  "completed",
  "exited",
  "cancelled",
] as const;
export const sessionOutcomeValues = [
  "safe",
  "neutral",
  "uncomfortable",
] as const;

const uuid = z.uuid();
const timestamp = z.iso.datetime({ offset: true });
const privateNote = z.string().trim().max(1000).nullable().default(null);

export const UserSchema = z.object({
  id: uuid,
  email: z.email(),
  createdAt: timestamp,
});
export const UserProfileSchema = z.object({
  userId: uuid,
  displayName: z.string().trim().min(1).max(80),
  pronouns: z.string().trim().max(40).nullable(),
  bio: z.string().trim().max(280).nullable(),
  vibeArchetype: z.string().trim().max(60).nullable(),
  onboardingCompletedAt: timestamp.nullable(),
});
export const BodyZonePreferenceSchema = z
  .object({
    zone: z.string().trim().min(1).max(60),
    status: z.enum(boundaryValues),
    pressure: z.enum(pressureValues).nullable(),
  })
  .superRefine((value, context) => {
    if (value.status !== "off_limits" && value.pressure === null)
      context.addIssue({
        code: "custom",
        path: ["pressure"],
        message: "Pressure is required for a zone that is not off limits.",
      });
  });
export const TouchLanguageProfileSchema = z.object({
  pressure: z.enum(pressureValues),
  duration: z.enum(durationValues),
  environments: z.array(z.enum(environmentValues)).min(1),
  holdTypes: z.array(z.string().trim().min(1).max(60)).max(20),
  privateNervousSystemNotes: privateNote,
});
export const ConsentPreferenceSchema = z.object({
  bodyZones: z.array(BodyZonePreferenceSchema).min(1).max(30),
  hardStops: z.array(z.string().trim().min(1).max(120)).max(20),
  privateNervousSystemNotes: privateNote,
});
export const SessionRequestSchema = z
  .object({
    id: uuid,
    requesterId: uuid,
    recipientId: uuid,
    createdAt: timestamp,
  })
  .refine((value) => value.requesterId !== value.recipientId, {
    message: "A user cannot request a session with themselves.",
  });
export const SessionSchema = z
  .object({
    id: uuid,
    userAId: uuid,
    userBId: uuid,
    status: z.enum(sessionStatusValues),
    createdAt: timestamp,
    startedAt: timestamp.nullable(),
    endedAt: timestamp.nullable(),
  })
  .refine((value) => value.userAId !== value.userBId, {
    message: "Session participants must be different users.",
  });
export const ConsentSnapshotSchema = z.object({
  id: uuid,
  sessionId: uuid,
  touchProfileVersionA: z.number().int().positive(),
  touchProfileVersionB: z.number().int().positive(),
  consentVersionA: z.number().int().positive(),
  consentVersionB: z.number().int().positive(),
  overlap: z.record(z.string(), z.unknown()),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: timestamp,
});
export const SessionOutcomeSchema = z.object({
  sessionId: uuid,
  userId: uuid,
  outcome: z.enum(sessionOutcomeValues),
  privateNote,
  createdAt: timestamp,
});
export const TrustEventSchema = z.object({
  id: uuid,
  userId: uuid,
  sessionId: uuid.nullable(),
  eventType: z.enum([
    "profile_completed",
    "session_affirmed",
    "session_neutral",
    "session_uncomfortable",
  ]),
  createdAt: timestamp,
});

export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type BodyZonePreference = z.infer<typeof BodyZonePreferenceSchema>;
export type TouchLanguageProfile = z.infer<typeof TouchLanguageProfileSchema>;
export type ConsentPreference = z.infer<typeof ConsentPreferenceSchema>;
export type SessionRequest = z.infer<typeof SessionRequestSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type ConsentSnapshot = z.infer<typeof ConsentSnapshotSchema>;
export type SessionOutcome = z.infer<typeof SessionOutcomeSchema>;
export type TrustEvent = z.infer<typeof TrustEventSchema>;

export function serializeValidated<T>(
  schema: z.ZodType<T>,
  input: unknown,
): string {
  return JSON.stringify(schema.parse(input));
}

export * from "./consentEngine.ts";
export * from "./consentSnapshot.ts";
export * from "./legacyProfileAdapter.ts";
