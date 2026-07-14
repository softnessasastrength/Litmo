/**
 * Unified private debrief lab — turns interactions into useful local data.
 * Precision without creep: no partner surveillance, no public scores, wipeable.
 * v0.2: insights, anti-creep rules, confidence, forbidden fields.
 */
export const PRIVATE_DEBRIEF_VERSION = 2 as const;

export type DebriefSource =
  | "spooning"
  | "morning_cuddle"
  | "conflict_sim"
  | "reconcile"
  | "too_much"
  | "need_scared"
  | "interest_re"
  | "parallel_play"
  | "attachment_repair"
  | "not_ready_yet"
  | "pre_renn"
  | "weather"
  | "aftercare"
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
  /** Optional: would I do this protocol again? */
  again: boolean | null;
};

export type DebriefSummary = {
  total: number;
  by_source: { source: DebriefSource; count: number }[];
  soft_signal_rate: number;
  top_tags: { tag: string; count: number }[];
  avg_regulation: number | null;
  again_rate: number | null;
};

export type DebriefInsight = {
  id: string;
  kind: "pattern" | "safety" | "skill" | "caution";
  text: string;
};

/** What we never store — precision without creep */
export const DEBRIEF_FORBIDDEN = [
  "Partner messages or voice notes content",
  "Partner location / last-seen / reply latency scores",
  "Secret recordings or screenshots of the other person",
  "Public or shareable 'safety scores' about partners",
  "Neediness / clinginess / red-flag scores about self or other",
  "Cross-user analytics or cloud dossiers",
  "Anything that cannot be wiped locally in one burn",
] as const;

export function createManualDebrief(input: {
  title: string;
  regulation: 1 | 2 | 3 | 4 | 5 | null;
  worked: string;
  didnt: string;
  tags: string[];
  softSignalUsed: boolean;
  source?: DebriefSource;
  again?: boolean | null;
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
    tags: input.tags
      .map((t) => t.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 12),
    softSignalUsed: Boolean(input.softSignalUsed),
    again: input.again ?? null,
  };
}

export function summarizeDebriefs(
  entries: UnifiedDebriefEntry[],
): DebriefSummary {
  const by = new Map<DebriefSource, number>();
  const tags = new Map<string, number>();
  let soft = 0;
  let regSum = 0;
  let regN = 0;
  let againYes = 0;
  let againN = 0;
  for (const e of entries) {
    by.set(e.source, (by.get(e.source) ?? 0) + 1);
    if (e.softSignalUsed) soft += 1;
    if (e.regulation != null) {
      regSum += e.regulation;
      regN += 1;
    }
    if (e.again != null) {
      againN += 1;
      if (e.again) againYes += 1;
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
    again_rate: againN ? againYes / againN : null,
  };
}

/** Pattern insights — helpful, never a partner dossier */
export function generateInsights(
  entries: UnifiedDebriefEntry[],
): DebriefInsight[] {
  const s = summarizeDebriefs(entries);
  const out: DebriefInsight[] = [];
  if (s.total === 0) {
    out.push({
      id: "empty",
      kind: "skill",
      text: "No debriefs yet. Precision starts after one honest entry — not a spreadsheet of shame.",
    });
    return out;
  }
  if (s.soft_signal_rate >= 0.3) {
    out.push({
      id: "ss-skill",
      kind: "skill",
      text: `Soft Signal used in ${Math.round(s.soft_signal_rate * 100)}% of debriefs — that is skill, not failure.`,
    });
  }
  if (s.avg_regulation != null && s.avg_regulation <= 2.5) {
    out.push({
      id: "reg-low",
      kind: "caution",
      text: "Average regulation is low. Prefer shorter protocols, Soft Signal early, and rest over harder rituals.",
    });
  }
  if (s.avg_regulation != null && s.avg_regulation >= 4) {
    out.push({
      id: "reg-high",
      kind: "pattern",
      text: "Average regulation is solid. Keep what works; denser ritual is optional, not required.",
    });
  }
  const top = s.top_tags[0];
  if (top && top.count >= 2) {
    out.push({
      id: "tag-top",
      kind: "pattern",
      text: `Recurring tag: ${top.tag} (${top.count}×). Treat as a theme, not a diagnosis.`,
    });
  }
  if (s.by_source[0] && s.by_source[0].count >= 3) {
    out.push({
      id: "src-top",
      kind: "pattern",
      text: `Most debriefs from ${s.by_source[0].source}. Consider whether that protocol is serving regulation or avoidance.`,
    });
  }
  out.push({
    id: "anti-creep",
    kind: "safety",
    text: "This lab never tracks partner reply speed, location, or secret dossiers. Useful ≠ surveillance.",
  });
  return out;
}

export function parseDebriefLog(raw: unknown): UnifiedDebriefEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) =>
      x &&
      typeof x === "object" &&
      typeof (x as UnifiedDebriefEntry).id === "string",
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
  "attachment",
  "ceremony",
  "rest",
  "edge",
] as const;
