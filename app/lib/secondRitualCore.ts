/**
 * Two Maps, One Table — the "bringing someone in" guided ritual.
 *
 * WHAT: A short, four-step sequence for once "younger me" actually has a
 *   partner and wants to bring some of this in — without turning them into
 *   a case study. Reuses existing screens/content instead of duplicating
 *   them: Weather, the already-built encrypted Touch Language share flow
 *   (/touch-language/share), Relationship Model, and Attachment Repair's
 *   reassurance script. This file is sequencing and voice, not new
 *   cryptography or new consent machinery.
 * WHY: docs/REAL_PURPOSE.md's "North star addition (2026-07-14)" names the
 *   sequence explicitly: self-understanding first (first-ritual), shared
 *   language second (this one). See docs/FIRST_RITUAL.md and
 *   docs/SECOND_RITUAL.md.
 * CONSENT: Not consent, not a diagnosis, not therapy. Sharing a Touch
 *   Language map is never itself consent to touch (touchLanguageShareCore
 *   already enforces this — reqConsent/notTouch flags). Soft Signal freeness
 *   is unaffected by ritual state. Steps are optional, resumable, any order.
 * NEVER: Score progress, imply completion proves the relationship is safe,
 *   require finishing before any other protocol is usable, name a real
 *   third party — this is phase-2 content and only relevant once a real
 *   partner exists, but the copy itself must stay generic.
 * SEE: firstRitualCore.ts (same pattern), touchLanguageShareCore.ts,
 *   relationshipModelCore.ts, attachmentRepairCore.ts (RITUAL_SCRIPTS.mommy_issues).
 */
import { RITUAL_SCRIPTS } from "./attachmentRepairCore.ts";

export const SECOND_RITUAL_VERSION = 1 as const;

export type SecondRitualStepId =
  | "check_your_weather"
  | "share_the_map"
  | "name_the_bond"
  | "shared_reassurance";

export type SecondRitualStep = {
  id: SecondRitualStepId;
  title: string;
  /** The "wise, slightly unhinged older brother" framing for this step. */
  voiceLine: string;
  /** Where this step's actual mechanic already lives — reused, not rebuilt. */
  reuses: string;
  /** Route this step links out to for the real mechanic. */
  href: string;
  linkLabel: string;
};

export const SECOND_RITUAL_STEPS: readonly SecondRitualStep[] = [
  {
    id: "check_your_weather",
    title: "Check your own weather first",
    voiceLine:
      "Before you hand somebody your map, check your own sky. This isn't about being calm enough to earn closeness — it's just easier to be clear when you're not already flooded.",
    reuses: "weatherCore (existing daily check-in)",
    href: "/weather",
    linkLabel: "Open Nervous System Weather",
  },
  {
    id: "share_the_map",
    title: "Share the map, not your whole self",
    voiceLine:
      "You don't owe anyone your whole nervous system on day one. You can hand them a map instead — pressure, pace, zones, hard stops. It's encrypted, it expires, and reading it is never consent to touch. That's not cold. That's just accurate.",
    reuses: "touchLanguageShareCore.ts (existing encrypted share/import flow)",
    href: "/touch-language/share",
    linkLabel: "Open Touch Language share",
  },
  {
    id: "name_the_bond",
    title: "Name the bond, together",
    voiceLine:
      "This next part isn't a test you two are taking. It's a shared vocabulary — what phase you're actually in, what closeness looks like this week. It's a map, not a mirror, and definitely not a grade.",
    reuses: "relationshipModelCore.ts (existing bond map)",
    href: "/relationship-model",
    linkLabel: "Open Relationship Model",
  },
  {
    id: "shared_reassurance",
    title: "Shared reassurance",
    voiceLine:
      "Last one. A few lines that are true whether or not either of you believes them yet. Say them out loud if it's not weird, or just read them. Both count.",
    reuses: "attachmentRepairCore.RITUAL_SCRIPTS.mommy_issues",
    href: "/attachment-repair",
    linkLabel: "Open Attachment Repair Cathedral",
  },
] as const;

export type SecondRitualProgress = {
  version: typeof SECOND_RITUAL_VERSION;
  completedSteps: SecondRitualStepId[];
  startedAt: string;
  updatedAt: string;
};

export function defaultSecondRitualProgress(): SecondRitualProgress {
  const now = new Date().toISOString();
  return {
    version: SECOND_RITUAL_VERSION,
    completedSteps: [],
    startedAt: now,
    updatedAt: now,
  };
}

export function findSecondRitualStep(id: SecondRitualStepId): SecondRitualStep {
  return SECOND_RITUAL_STEPS.find((s) => s.id === id) ?? SECOND_RITUAL_STEPS[0]!;
}

/** Marks a step complete. Re-marking is a no-op, not an error. Never a gate. */
export function markStepComplete(
  progress: SecondRitualProgress,
  stepId: SecondRitualStepId,
): SecondRitualProgress {
  if (progress.completedSteps.includes(stepId)) return progress;
  return {
    ...progress,
    completedSteps: [...progress.completedSteps, stepId],
    updatedAt: new Date().toISOString(),
  };
}

/** First step not yet completed, or null when every step is done. Never blocks navigation. */
export function nextIncompleteStep(
  progress: SecondRitualProgress,
): SecondRitualStep | null {
  const next = SECOND_RITUAL_STEPS.find(
    (s) => !progress.completedSteps.includes(s.id),
  );
  return next ?? null;
}

export function isRitualComplete(progress: SecondRitualProgress): boolean {
  return SECOND_RITUAL_STEPS.every((s) => progress.completedSteps.includes(s.id));
}

/** Defensive parse for AsyncStorage round-trip — bad/missing data resets, never crashes. */
export function parseSecondRitualProgress(raw: unknown): SecondRitualProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<SecondRitualProgress>;
  const validSteps: SecondRitualStepId[] = Array.isArray(o.completedSteps)
    ? o.completedSteps.filter((id): id is SecondRitualStepId =>
        SECOND_RITUAL_STEPS.some((s) => s.id === id),
      )
    : [];
  return {
    version: SECOND_RITUAL_VERSION,
    completedSteps: validSteps,
    startedAt: typeof o.startedAt === "string" ? o.startedAt : new Date().toISOString(),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
  };
}

/** Reused verbatim from Attachment Repair Cathedral — already generic, no real names. */
export function sharedReassuranceLines(): readonly string[] {
  return RITUAL_SCRIPTS.mommy_issues;
}
