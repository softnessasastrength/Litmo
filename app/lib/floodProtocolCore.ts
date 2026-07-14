/**
 * Flood Protocol — minimum viable containment when language is gone.
 * Containment job: one button path when too-much + conflict + pre-renn all feel like essays.
 * Soft Signal free. No performance. No partner contact.
 */
export const FLOOD_PROTOCOL_VERSION = "0.1" as const;

export type FloodStepId =
  | "stop"
  | "body"
  | "water"
  | "delay"
  | "soft_signal"
  | "later";

export type FloodStep = {
  id: FloodStepId;
  label: string;
  script: string;
};

export const FLOOD_STEPS: readonly FloodStep[] = [
  {
    id: "stop",
    label: "Stop the dump",
    script:
      "You do not have to finish the thought, the text, or the build spiral. Soft Signal free.",
  },
  {
    id: "body",
    label: "Body first",
    script: "Feet on floor. Longer exhale than inhale. Three times. No essay required.",
  },
  {
    id: "water",
    label: "Water / food / cold",
    script: "One animal need: water, snack, cold water on face, or blanket. Pick one.",
  },
  {
    id: "delay",
    label: "Delay dump pledge",
    script:
      "No raw dump to a human for at least 20 minutes. Delay is care, not exile.",
  },
  {
    id: "soft_signal",
    label: "Soft Signal",
    script: "Soft Signal is free even from yourself. Practice is a win.",
  },
  {
    id: "later",
    label: "Later map",
    script:
      "When quieter: Pre-Renn Gate, Too Much room, or Debrief Lab. Not now.",
  },
] as const;

export type FloodEntry = {
  id: string;
  version: typeof FLOOD_PROTOCOL_VERSION;
  startedAt: string;
  endedAt: string;
  stepsTouched: FloodStepId[];
  endReason: "completed" | "soft_signal" | "abandoned";
  note: string;
};

export function createFloodEntry(
  stepsTouched: FloodStepId[],
  endReason: FloodEntry["endReason"],
  note = "",
): FloodEntry {
  const now = new Date().toISOString();
  return {
    id: `flood-${Date.now()}`,
    version: FLOOD_PROTOCOL_VERSION,
    startedAt: now,
    endedAt: now,
    stepsTouched: [...new Set(stepsTouched)].slice(0, 12),
    endReason,
    note: note.trim().slice(0, 200),
  };
}

export function parseFloodHistory(raw: unknown): FloodEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && typeof (x as FloodEntry).id === "string",
  ) as FloodEntry[];
}

export function summarizeFlood(entries: FloodEntry[]) {
  return {
    total: entries.length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
    avg_steps:
      entries.length === 0
        ? 0
        : Math.round(
            (entries.reduce((a, e) => a + e.stepsTouched.length, 0) /
              entries.length) *
              10,
          ) / 10,
  };
}
