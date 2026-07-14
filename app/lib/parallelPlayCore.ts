/**
 * Parallel Play But Make It Sacred — non-touch closeness protocol.
 * Co-presence without body contact. Soft Signal free.
 * v0.2: entry/exit rituals, more modes, ceremonial language under masochist.
 */
export const PARALLEL_PLAY_VERSION = "0.2" as const;

export type ParallelModeId =
  | "same_room_silence"
  | "shared_media"
  | "side_by_side_work"
  | "voice_notes_async"
  | "ritual_tea"
  | "parallel_walk"
  | "reading_corner"
  | "undecided";

export type ParallelMode = {
  id: ParallelModeId;
  label: string;
  blurb: string;
  sacredRule: string;
  entryRitual: string;
  exitRitual: string;
  minutes: number | "open";
};

export const PARALLEL_MODES: readonly ParallelMode[] = [
  {
    id: "same_room_silence",
    label: "Same-room silence",
    blurb: "Bodies in one space. No obligatory talk. No obligatory touch.",
    sacredRule: "Silence is co-regulation, not punishment.",
    entryRitual: "Sit. Soft Signal free. No agenda sentence required.",
    exitRitual: "One optional word of thanks — or leave in peace.",
    minutes: 15,
  },
  {
    id: "shared_media",
    label: "Shared media",
    blurb: "Show / music / game — parallel attention.",
    sacredRule: "Commentary optional. Soft Signal free mid-episode.",
    entryRitual: "Pick media. Confirm Soft Signal free. Press play without performance.",
    exitRitual: "Stop when capacity ends. No spoilers-as-bond tax.",
    minutes: 30,
  },
  {
    id: "side_by_side_work",
    label: "Side-by-side work",
    blurb: "Laptops / books. Presence without performance.",
    sacredRule: "No productivity scoring. Connection ≠ output.",
    entryRitual: "State: I am here. Soft Signal free. Work is not a test.",
    exitRitual: "Close laptop without apology for unfinished tasks.",
    minutes: 45,
  },
  {
    id: "voice_notes_async",
    label: "Async voice notes",
    blurb: "Closeness across time. Reply when capacity exists.",
    sacredRule: "Delay is not discard. Soft Signal free to not reply yet.",
    entryRitual: "Record or receive without demanding immediate reply.",
    exitRitual: "Archive the thread mentally: delay ≠ discard.",
    minutes: "open",
  },
  {
    id: "ritual_tea",
    label: "Ritual tea / water",
    blurb: "Shared drink. Minimal words. Sacred ordinary.",
    sacredRule: "The drink is the ceremony. Touch not required.",
    entryRitual: "Make or pour. Sit. First sip is the seal.",
    exitRitual: "Empty cup · Soft Signal free · no forced debrief.",
    minutes: 10,
  },
  {
    id: "parallel_walk",
    label: "Parallel walk",
    blurb: "Side-by-side movement. Talk optional.",
    sacredRule: "Pace is co-regulated. Soft Signal free to split paths.",
    entryRitual: "Pick direction. Soft Signal free to turn around anytime.",
    exitRitual: "Arrive or part without making distance a verdict.",
    minutes: 20,
  },
  {
    id: "reading_corner",
    label: "Reading corner",
    blurb: "Separate books, shared air.",
    sacredRule: "Pages are privacy. Presence is gift, not surveillance.",
    entryRitual: "Open books. Soft Signal free. No quiz later.",
    exitRitual: "Close books. Optional one-line share — not required.",
    minutes: 30,
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    sacredRule: "—",
    entryRitual: "—",
    exitRitual: "—",
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
  ceremonial: boolean;
};

export type ParallelEntry = {
  snapshot: ParallelSnapshot;
  endedAt: string;
  endReason: "completed" | "soft_signal" | "abandoned";
  feltConnected: boolean;
  note: string;
};

export function findParallel(id: ParallelModeId): ParallelMode {
  return (
    PARALLEL_MODES.find((m) => m.id === id) ??
    PARALLEL_MODES[PARALLEL_MODES.length - 1]!
  );
}

export function canSealParallel(d: ParallelDraft): {
  ok: boolean;
  reason: string;
} {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal free required." };
  if (!d.noTouchAcknowledged)
    return {
      ok: false,
      reason:
        "Acknowledge: this protocol is non-touch unless separately sealed.",
    };
  if (d.modeId === "undecided")
    return { ok: false, reason: "Pick a sacred parallel mode." };
  return { ok: true, reason: "Ready." };
}

export function sealParallel(
  d: ParallelDraft,
  ceremonial = false,
): ParallelSnapshot | null {
  if (!canSealParallel(d).ok || d.modeId === "undecided") return null;
  return {
    id: `parallel-${Date.now()}`,
    version: PARALLEL_PLAY_VERSION,
    sealedAt: new Date().toISOString(),
    modeId: d.modeId,
    intention: d.intention.trim().slice(0, 300),
    ceremonial: Boolean(ceremonial),
  };
}

export function ceremonialLine(mode: ParallelMode, ceremonial: boolean): string {
  if (!ceremonial) return mode.sacredRule;
  return `✦ ${mode.sacredRule} · Entry: ${mode.entryRitual} · Exit: ${mode.exitRitual}`;
}

export function parseParallelHistory(raw: unknown): ParallelEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as ParallelEntry[];
}

export function summarizeParallel(entries: ParallelEntry[]) {
  const by = new Map<string, number>();
  let connected = 0;
  for (const e of entries) {
    by.set(e.snapshot.modeId, (by.get(e.snapshot.modeId) ?? 0) + 1);
    if (e.feltConnected) connected += 1;
  }
  return {
    total: entries.length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
    felt_connected_rate: entries.length ? connected / entries.length : 0,
    by_mode: [...by.entries()].map(([id, count]) => ({
      id,
      count,
      label: findParallel(id as ParallelModeId).label,
    })),
  };
}
