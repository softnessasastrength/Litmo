/**
 * Protocol Recommender — pure suggestions from local patterns.
 * Containment job: reduce buffet paralysis without a creepy partner score.
 * Never: neediness scores, partner grades, auto-contact.
 */
import type { DebriefSummary, UnifiedDebriefEntry } from "./privateDebriefCore.ts";
import { summarizeDebriefs } from "./privateDebriefCore.ts";
import type { WeatherSnapshot } from "./weatherCore.ts";

export type ProtocolRec = {
  href: string;
  title: string;
  why: string;
  priority: number;
};

const CATALOG: readonly { href: string; title: string; tags: string[] }[] = [
  { href: "/pre-renn", title: "Pre-Renn Gate", tags: ["dump", "urge", "reach"] },
  { href: "/weather", title: "Nervous System Weather", tags: ["daily", "check"] },
  { href: "/aftercare", title: "Aftercare Protocol", tags: ["land", "post"] },
  { href: "/soft-signal/practice", title: "Soft Signal Practice", tags: ["exit", "soft_signal"] },
  { href: "/too-much", title: "I'm Too Much", tags: ["too_much_story", "abandon", "flooded"] },
  { href: "/need-scared", title: "Need ∧ Leave-fear", tags: ["dual_bind", "attachment"] },
  { href: "/reconcile", title: "Post-Fight Reconciliation", tags: ["repair", "conflict"] },
  { href: "/parallel-play", title: "Parallel Play Sacred", tags: ["parallel", "space"] },
  { href: "/attachment-repair", title: "Attachment Repair", tags: ["attachment", "hold"] },
  { href: "/conflict-sim", title: "Conflict Simulator", tags: ["conflict"] },
  { href: "/interest-re", title: "Interest Reverse Engineering", tags: ["fawn", "clear_yes"] },
  { href: "/spooning", title: "Spooning Protocol", tags: ["hold", "morning"] },
  { href: "/morning-cuddle", title: "Morning Cuddle", tags: ["morning"] },
  { href: "/not-ready-yet", title: "Not Ready Yet", tags: ["rest", "morning"] },
  { href: "/debrief-lab", title: "Private Debrief Lab", tags: ["data"] },
  { href: "/containment/lofi", title: "Containment Lo-Fi", tags: ["rest", "flooded"] },
  { href: "/masochist-mode", title: "Emotional Masochist Mode", tags: ["ceremony"] },
];

export type RecommenderInput = {
  debriefs?: UnifiedDebriefEntry[];
  summary?: DebriefSummary;
  weather?: WeatherSnapshot | null;
  hour?: number;
  softSignalHeavy?: boolean;
};

export function recommendProtocols(input: RecommenderInput): ProtocolRec[] {
  const summary = input.summary ?? summarizeDebriefs(input.debriefs ?? []);
  const hour = input.hour ?? new Date().getHours();
  const scores = new Map<string, { score: number; whys: string[] }>();

  const bump = (href: string, pts: number, why: string) => {
    const cur = scores.get(href) ?? { score: 0, whys: [] as string[] };
    cur.score += pts;
    if (why && !cur.whys.includes(why)) cur.whys.push(why);
    scores.set(href, cur);
  };

  // Soft Signal skill → practice still welcome but not shamed
  if (summary.soft_signal_rate >= 0.35) {
    bump("/soft-signal/practice", 2, "Soft Signal is already a skill — keep the muscle.");
  } else if (summary.total >= 3) {
    bump("/soft-signal/practice", 4, "Low Soft Signal rate in debriefs — practice the exit.");
  }

  // Tag themes
  for (const t of summary.top_tags.slice(0, 5)) {
    for (const c of CATALOG) {
      if (c.tags.includes(t.tag)) {
        bump(c.href, 2 + Math.min(3, t.count), `Recurring theme: ${t.tag}`);
      }
    }
  }

  // Source concentration
  const topSrc = summary.by_source[0];
  if (topSrc && topSrc.count >= 3) {
    if (topSrc.source === "too_much")
      bump("/need-scared", 3, "Lots of Too Much — dual-bind may name the other pole.");
    if (topSrc.source === "reconcile" || topSrc.source === "conflict_sim")
      bump("/aftercare", 3, "Conflict work needs landing gear.");
    if (topSrc.source === "spooning" || topSrc.source === "morning_cuddle")
      bump("/aftercare", 2, "Closeness protocols → aftercare.");
  }

  // Weather
  if (input.weather) {
    const w = input.weather;
    if (w.anxiety >= 4) bump("/too-much", 4, `Weather: ${w.skyLabel}`);
    if (w.attachmentHeat >= 4) bump("/need-scared", 4, "Attachment heat high.");
    if (w.capacityForOthers <= 2) bump("/pre-renn", 5, "Low capacity — gate before dump.");
    if (w.energy <= 2) bump("/not-ready-yet", 3, "Low energy weather.");
    if (w.capacityForOthers >= 4 && w.anxiety <= 2)
      bump("/parallel-play", 2, "Capacity open — sacred parallel ok.");
  }

  // Time of day
  if (hour >= 6 && hour < 10) {
    bump("/morning-cuddle", 2, "Morning window.");
    bump("/not-ready-yet", 2, "Morning window.");
    bump("/weather", 3, "Name the morning sky.");
  } else if (hour >= 22 || hour < 5) {
    bump("/pre-renn", 4, "Late-night dump risk is high.");
    bump("/containment/lofi", 2, "Night: lo-fi over essays.");
  }

  // Always offer weather + pre-renn lightly
  bump("/weather", 1, "Daily weather is free.");
  bump("/pre-renn", 1, "Gate before reach is free.");
  bump("/aftercare", 1, "Landing is free.");

  if (input.softSignalHeavy) {
    bump("/soft-signal/practice", 3, "You asked for Soft Signal weight.");
  }

  const recs: ProtocolRec[] = [];
  for (const c of CATALOG) {
    const s = scores.get(c.href);
    if (!s || s.score <= 0) continue;
    recs.push({
      href: c.href,
      title: c.title,
      why: s.whys[0] ?? "Suggested",
      priority: s.score,
    });
  }

  recs.sort((a, b) => b.priority - a.priority);
  return recs.slice(0, 6);
}
