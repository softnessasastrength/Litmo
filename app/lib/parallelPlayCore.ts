/**
 * Parallel Play But Make It Sacred — non-touch closeness protocol.
 * Co-presence without body contact. Soft Signal free.
 */
export const PARALLEL_PLAY_VERSION = "0.1" as const;

export type ParallelModeId =
  | "same_room_silence"
  | "shared_media"
  | "side_by_side_work"
  | "voice_notes_async"
  | "ritual_tea"
  | "undecided";

export type ParallelMode = {
  id: ParallelModeId;
  label: string;
  blurb: string;
  sacredRule: string;
  minutes: number | "open";
};

export const PARALLEL_MODES: readonly ParallelMode[] = [
  {
    id: "same_room_silence",
    label: "Same-room silence",
    blurb: "Bodies in one space. No obligatory talk. No obligatory touch.",
    sacredRule: "Silence is co-regulation, not punishment.",
    minutes: 15,
  },
  {
    id: "shared_media",
    label: "Shared media",
    blurb: "Show / music / game — parallel attention.",
    sacredRule: "Commentary optional. Soft Signal free mid-episode.",
    minutes: 30,
  },
  {
    id: "side_by_side_work",
    label: "Side-by-side work",
    blurb: "Laptops / books. Presence without performance.",
    sacredRule: "No productivity scoring. Connection ≠ output.",
    minutes: 45,
  },
  {
    id: "voice_notes_async",
    label: "Async voice notes",
    blurb: "Closeness across time. Reply when capacity exists.",
    sacredRule: "Delay is not discard. Soft Signal free to not reply yet.",
    minutes: "open",
  },
  {
    id: "ritual_tea",
    label: "Ritual tea / water",
    blurb: "Shared drink. Minimal words. Sacred ordinary.",
    sacredRule: "The drink is the ceremony. Touch not required.",
    minutes: 10,
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    sacredRule: "—",
    minutes: 0,
  },
] as const;

export type ParallelDraft = {
  modeId: ParallelModeId;
  intention: string;
  softSignalAcknowledged: boolean;
  noTouchAcknowledged: boolean;
};

export type ParallelSnapshot = {
  id: string;
  version: typeof PARALLEL_PLAY_VERSION;
  sealedAt: string;
  modeId: Exclude<ParallelModeId, "undecided">;
  intention: string;
};

export type ParallelEntry = {
  snapshot: ParallelSnapshot;
  endedAt: string;
  endReason: "completed" | "soft_signal" | "abandoned";
  feltConnected: boolean;
  note: string;
};

export function findParallel(id: ParallelModeId): ParallelMode {
  return PARALLEL_MODES.find((m) => m.id === id) ?? PARALLEL_MODES[PARALLEL_MODES.length - 1]!;
}

export function canSealParallel(d: ParallelDraft): { ok: boolean; reason: string } {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal free required." };
  if (!d.noTouchAcknowledged)
    return { ok: false, reason: "Acknowledge: this protocol is non-touch unless separately sealed." };
  if (d.modeId === "undecided") return { ok: false, reason: "Pick a sacred parallel mode." };
  return { ok: true, reason: "Ready." };
}

export function sealParallel(d: ParallelDraft): ParallelSnapshot | null {
  if (!canSealParallel(d).ok || d.modeId === "undecided") return null;
  return {
    id: `parallel-${Date.now()}`,
    version: PARALLEL_PLAY_VERSION,
    sealedAt: new Date().toISOString(),
    modeId: d.modeId,
    intention: d.intention.trim().slice(0, 300),
  };
}

export function parseParallelHistory(raw: unknown): ParallelEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as ParallelEntry[];
}
