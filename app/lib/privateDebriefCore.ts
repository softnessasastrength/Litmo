/**
 * Unified private debrief lab — turns interactions into useful local data.
 * Precision without creep: no partner surveillance, no public scores, wipeable.
 */
export const PRIVATE_DEBRIEF_VERSION = 1 as const;

export type DebriefSource =
  | "spooning"
  | "morning_cuddle"
  | "conflict_sim"
  | "reconcile"
  | "too_much"
  | "need_scared"
  | "interest_re"
  | "parallel_play"
  | "manual"
  | "other";

export type UnifiedDebriefEntry = {
  id: string;
  version: typeof PRIVATE_DEBRIEF_VERSION;
  at: string;
  source: DebriefSource;
  /** Short human label */
  title: string;
  /** 1–5 felt safety / regulation after */
  regulation: 1 | 2 | 3 | 4 | 5 | null;
  worked: string;
  didnt: string;
  /** Tags for pattern without free-text creep in summaries */
  tags: string[];
  softSignalUsed: boolean;
};

export type DebriefSummary = {
  total: number;
  by_source: { source: DebriefSource; count: number }[];
  soft_signal_rate: number;
  top_tags: { tag: string; count: number }[];
  avg_regulation: number | null;
};

export function createManualDebrief(input: {
  title: string;
  regulation: 1 | 2 | 3 | 4 | 5 | null;
  worked: string;
  didnt: string;
  tags: string[];
  softSignalUsed: boolean;
  source?: DebriefSource;
}): UnifiedDebriefEntry {
  return {
    id: `debrief-${Date.now()}`,
    version: PRIVATE_DEBRIEF_VERSION,
    at: new Date().toISOString(),
    source: input.source ?? "manual",
    title: input.title.trim().slice(0, 120) || "Untitled debrief",
    regulation: input.regulation,
    worked: input.worked.trim().slice(0, 500),
    didnt: input.didnt.trim().slice(0, 500),
    tags: input.tags.map((t) => t.trim().slice(0, 40)).filter(Boolean).slice(0, 12),
    softSignalUsed: Boolean(input.softSignalUsed),
  };
}

export function summarizeDebriefs(entries: UnifiedDebriefEntry[]): DebriefSummary {
  const by = new Map<DebriefSource, number>();
  const tags = new Map<string, number>();
  let soft = 0;
  let regSum = 0;
  let regN = 0;
  for (const e of entries) {
    by.set(e.source, (by.get(e.source) ?? 0) + 1);
    if (e.softSignalUsed) soft += 1;
    if (e.regulation != null) {
      regSum += e.regulation;
      regN += 1;
    }
    for (const t of e.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
  }
  return {
    total: entries.length,
    by_source: [...by.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    soft_signal_rate: entries.length ? soft / entries.length : 0,
    top_tags: [...tags.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    avg_regulation: regN ? Math.round((regSum / regN) * 10) / 10 : null,
  };
}

export function parseDebriefLog(raw: unknown): UnifiedDebriefEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && typeof (x as UnifiedDebriefEntry).id === "string",
  ) as UnifiedDebriefEntry[];
}

/** Allowed tag vocabulary — precision without free-for-all creepy dossiers */
export const DEBRIEF_TAG_VOCAB = [
  "soft_signal",
  "fawn",
  "freeze",
  "repair",
  "hold",
  "space",
  "humor",
  "flooded",
  "clear_yes",
  "clear_no",
  "too_much_story",
  "dual_bind",
  "parallel",
  "morning",
  "conflict",
] as const;
