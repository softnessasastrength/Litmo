/**
 * Apology Craft Simulator — practice repair language without dumping essays.
 * Containment job: accountable apology ≠ self-annihilation or prosecution.
 * Soft Signal free. Never auto-sent.
 */
export const APOLOGY_CRAFT_VERSION = "0.1" as const;

export type ApologyDraft = {
  impact: string;
  mySlice: string;
  notDoing: string;
  repairOffer: string;
  softSignalAcknowledged: boolean;
};

export type ApologySnapshot = {
  id: string;
  version: typeof APOLOGY_CRAFT_VERSION;
  sealedAt: string;
  impact: string;
  mySlice: string;
  notDoing: string;
  repairOffer: string;
  composedLine: string;
};

export type ApologyEntry = {
  snapshot: ApologySnapshot;
  endedAt: string;
  endReason: "completed" | "soft_signal" | "scrapped" | "abandoned";
  note: string;
};

export function defaultApologyDraft(): ApologyDraft {
  return {
    impact: "",
    mySlice: "",
    notDoing: "",
    repairOffer: "",
    softSignalAcknowledged: false,
  };
}

export function canSealApology(d: ApologyDraft): { ok: boolean; reason: string } {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal free required." };
  if (d.impact.trim().length < 2)
    return { ok: false, reason: "Name the impact (one sentence)." };
  if (d.mySlice.trim().length < 2)
    return { ok: false, reason: "Own your slice only — not the whole weather." };
  return { ok: true, reason: "Ready." };
}

/** Compose a non-self-annihilating apology line (never auto-sent). */
export function composeApology(d: ApologyDraft): string {
  const impact = d.impact.trim().slice(0, 200);
  const slice = d.mySlice.trim().slice(0, 200);
  const notDoing = d.notDoing.trim().slice(0, 160);
  const offer = d.repairOffer.trim().slice(0, 200);
  const parts = [
    impact ? `I see that ${impact}.` : "",
    slice ? `My part: ${slice}.` : "",
    notDoing ? `I'm not doing: ${notDoing}.` : "",
    offer ? `Would it help if ${offer}?` : "What would help you feel safer with me right now?",
    "Soft Signal free either way.",
  ].filter(Boolean);
  return parts.join(" ");
}

export function sealApology(d: ApologyDraft): ApologySnapshot | null {
  if (!canSealApology(d).ok) return null;
  return {
    id: `apology-${Date.now()}`,
    version: APOLOGY_CRAFT_VERSION,
    sealedAt: new Date().toISOString(),
    impact: d.impact.trim().slice(0, 200),
    mySlice: d.mySlice.trim().slice(0, 200),
    notDoing: d.notDoing.trim().slice(0, 160),
    repairOffer: d.repairOffer.trim().slice(0, 200),
    composedLine: composeApology(d).slice(0, 800),
  };
}

export function parseApologyHistory(raw: unknown): ApologyEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && (x as ApologyEntry).snapshot,
  ) as ApologyEntry[];
}

export function summarizeApology(entries: ApologyEntry[]) {
  return {
    total: entries.length,
    completed: entries.filter((e) => e.endReason === "completed").length,
    scrapped: entries.filter((e) => e.endReason === "scrapped").length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
  };
}

export const APOLOGY_ANTI_PATTERNS = [
  "I'm the worst person alive (self-annihilation)",
  "If you hadn't… (prosecution)",
  "I'm sorry you feel that way (non-apology)",
  "I'll never do anything again (impossible contract)",
  "Please just tell me I'm not bad (regulation dump)",
] as const;
