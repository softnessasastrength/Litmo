/**
 * The Map, Not The Mirror — first guided ritual for someone new to Litmo.
 *
 * WHAT: A short, four-step solo sequence for "younger me" — someone convinced
 *   they're too much, scared of ruining a good thing, with no map for how to
 *   show up safely. It does not ask for a diagnosis or a partner. It reuses
 *   the existing containment building blocks (trigger naming from
 *   tooMuchCore, Soft Signal, Attachment Repair reassurance lines) instead of
 *   duplicating them — this is sequencing and voice, not new safety logic.
 * WHY: Per REAL_PURPOSE.md / this session's direction: "turn Litmo into a
 *   compassionate, step-by-step companion... without requiring a shitload of
 *   therapy first." Every step is armor, not homework — nothing here is
 *   required, gated, or scored.
 * CONSENT: This is not consent, not a diagnosis, not therapy. Soft Signal
 *   freeness is never reduced by ritual state. Steps are optional and
 *   resumable in any order; the sequence is a suggestion, not a gate.
 * NEVER: Score progress, imply completion proves anyone is "fixed" or safe,
 *   require finishing before Soft Signal or any other protocol is usable.
 * SEE: docs/FIRST_RITUAL.md, tooMuchCore.ts, attachmentRepairCore.ts,
 *   softSignalCore.ts, weatherCore.ts.
 */
import { TOO_MUCH_TRIGGERS, type TooMuchTriggerId } from "./tooMuchCore.ts";

export const FIRST_RITUAL_VERSION = 1 as const;

export type FirstRitualStepId =
  | "name_it"
  | "locate_it"
  | "the_armor"
  | "first_reassurance";

export type FirstRitualStep = {
  id: FirstRitualStepId;
  title: string;
  /** The "wise, slightly unhinged older brother" framing for this step. */
  voiceLine: string;
  /** Where this step's actual mechanic already lives — reused, not rebuilt. */
  reuses: string;
};

export const FIRST_RITUAL_STEPS: readonly FirstRitualStep[] = [
  {
    id: "name_it",
    title: "Name it",
    voiceLine:
      "First thing: what's the story your body tells you about being too much? Not the whole history. Just the one that fires. Pick the closest one — we'll get more precise later, or never, your call.",
    reuses: "tooMuchCore.TOO_MUCH_TRIGGERS (pick one, no diagnosis)",
  },
  {
    id: "locate_it",
    title: "Locate it, not fix it",
    voiceLine:
      "We're not solving anything yet. We're just naming today's weather so it doesn't quietly become someone else's job to read your mood for you.",
    reuses: "weatherCore (a normal check-in, reframed as day-one, not a test)",
  },
  {
    id: "the_armor",
    title: "The armor, not the homework",
    voiceLine:
      "Here's the only rule that actually matters: you can always stop. No explanation, not to me, not to anyone, not ever. Feel that once on purpose, before you ever need it for real.",
    reuses: "softSignalCore / SoftSignalButton (one practice rep)",
  },
  {
    id: "first_reassurance",
    title: "First reassurance",
    voiceLine:
      "Last one for today. A few lines that are true whether or not you believe them yet. You don't have to earn these.",
    reuses: "tooMuchCore.REASSURANCE_LINES / attachmentRepairCore (short cut)",
  },
] as const;

export type FirstRitualProgress = {
  version: typeof FIRST_RITUAL_VERSION;
  completedSteps: FirstRitualStepId[];
  /** Step 1's pick — which story resonated, if any. Never required. */
  chosenTriggerId: TooMuchTriggerId | null;
  startedAt: string;
  updatedAt: string;
};

export function defaultFirstRitualProgress(): FirstRitualProgress {
  const now = new Date().toISOString();
  return {
    version: FIRST_RITUAL_VERSION,
    completedSteps: [],
    chosenTriggerId: null,
    startedAt: now,
    updatedAt: now,
  };
}

export function findFirstRitualStep(id: FirstRitualStepId): FirstRitualStep {
  return FIRST_RITUAL_STEPS.find((s) => s.id === id) ?? FIRST_RITUAL_STEPS[0]!;
}

/** Marks a step complete. Re-marking is a no-op, not an error. Never a gate. */
export function markStepComplete(
  progress: FirstRitualProgress,
  stepId: FirstRitualStepId,
): FirstRitualProgress {
  if (progress.completedSteps.includes(stepId)) return progress;
  return {
    ...progress,
    completedSteps: [...progress.completedSteps, stepId],
    updatedAt: new Date().toISOString(),
  };
}

export function setChosenTrigger(
  progress: FirstRitualProgress,
  triggerId: TooMuchTriggerId | null,
): FirstRitualProgress {
  return { ...progress, chosenTriggerId: triggerId, updatedAt: new Date().toISOString() };
}

/** First step not yet completed, or null when every step is done. Never blocks navigation. */
export function nextIncompleteStep(
  progress: FirstRitualProgress,
): FirstRitualStep | null {
  const next = FIRST_RITUAL_STEPS.find(
    (s) => !progress.completedSteps.includes(s.id),
  );
  return next ?? null;
}

export function isRitualComplete(progress: FirstRitualProgress): boolean {
  return FIRST_RITUAL_STEPS.every((s) => progress.completedSteps.includes(s.id));
}

/** Defensive parse for AsyncStorage round-trip — bad/missing data resets, never crashes. */
export function parseFirstRitualProgress(raw: unknown): FirstRitualProgress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<FirstRitualProgress>;
  const validSteps: FirstRitualStepId[] = Array.isArray(o.completedSteps)
    ? o.completedSteps.filter((id): id is FirstRitualStepId =>
        FIRST_RITUAL_STEPS.some((s) => s.id === id),
      )
    : [];
  const validTrigger = TOO_MUCH_TRIGGERS.some((t) => t.id === o.chosenTriggerId)
    ? (o.chosenTriggerId as TooMuchTriggerId)
    : null;
  return {
    version: FIRST_RITUAL_VERSION,
    completedSteps: validSteps,
    chosenTriggerId: validTrigger,
    startedAt: typeof o.startedAt === "string" ? o.startedAt : new Date().toISOString(),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
  };
}

/** Mode-aware closing line — never names a real person to a stranger. */
export function firstReassuranceClosing(partnerName: string): string {
  return `You don't owe anyone a finished version of yourself before you're allowed closeness — not ${partnerName}, not future-you, not this app.`;
}
