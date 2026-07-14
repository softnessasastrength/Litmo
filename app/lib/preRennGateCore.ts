/**
 * Pre-Renn Regulation Gate — before you dump raw weather onto a human.
 * Containment job: hold “I need them to regulate me right now” until capacity exists.
 * Soft Signal free. Not a ban on contact — a fail-closed pause when flooded.
 */
export const PRE_RENN_GATE_VERSION = "0.1" as const;

export type GateVerdict = "green" | "yellow" | "red";

export type PreRennDraft = {
  bodyFlood: 1 | 2 | 3 | 4 | 5 | null;
  urgeToText: 1 | 2 | 3 | 4 | 5 | null;
  purpose: string;
  softSignalAcknowledged: boolean;
  delayPledgeMinutes: 0 | 5 | 15 | 30 | 60;
};

export type PreRennSnapshot = {
  id: string;
  version: typeof PRE_RENN_GATE_VERSION;
  sealedAt: string;
  bodyFlood: 1 | 2 | 3 | 4 | 5;
  urgeToText: 1 | 2 | 3 | 4 | 5;
  purpose: string;
  delayPledgeMinutes: number;
  verdict: GateVerdict;
  reasons: string[];
  recommendedHrefs: string[];
};

export type PreRennEntry = {
  snapshot: PreRennSnapshot;
  endedAt: string;
  endReason: "completed" | "soft_signal" | "honored_delay" | "engaged_anyway" | "abandoned";
  note: string;
};

export function defaultPreRennDraft(): PreRennDraft {
  return {
    bodyFlood: null,
    urgeToText: null,
    purpose: "",
    softSignalAcknowledged: false,
    delayPledgeMinutes: 15,
  };
}

export function canSealPreRenn(d: PreRennDraft): { ok: boolean; reason: string } {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal must stay free before any gate." };
  if (d.bodyFlood == null)
    return { ok: false, reason: "Name body flood (1 calm → 5 flooded)." };
  if (d.urgeToText == null)
    return { ok: false, reason: "Name urge to reach out (1 low → 5 nuclear)." };
  return { ok: true, reason: "Ready." };
}

/** Pure verdict: red = do not dump; yellow = regulate first; green = careful ok. */
export function computeVerdict(
  bodyFlood: number,
  urgeToText: number,
  purpose: string,
): { verdict: GateVerdict; reasons: string[]; recommendedHrefs: string[] } {
  const reasons: string[] = [];
  const hrefs: string[] = [];
  const purposeEmpty = purpose.trim().length < 2;

  if (bodyFlood >= 4) {
    reasons.push("Body is flooded — co-regulation request may become a dump.");
    hrefs.push("/too-much", "/soft-signal/practice", "/containment/lofi");
  }
  if (urgeToText >= 4) {
    reasons.push("Urge to text is high — delay can protect both of you.");
    hrefs.push("/parallel-play", "/need-scared", "/attachment-repair");
  }
  if (purposeEmpty && (bodyFlood >= 3 || urgeToText >= 3)) {
    reasons.push("No clear purpose yet — reach may be regulation-seeking.");
    hrefs.push("/interest-re", "/weather");
  }
  if (bodyFlood <= 2 && urgeToText <= 2) {
    reasons.push("Capacity looks present for careful, Soft-Signal-free contact.");
  }

  let verdict: GateVerdict = "green";
  if (bodyFlood >= 4 || urgeToText >= 5) verdict = "red";
  else if (bodyFlood >= 3 || urgeToText >= 3 || purposeEmpty) verdict = "yellow";

  if (verdict === "red") {
    hrefs.unshift("/soft-signal/practice", "/too-much");
  } else if (verdict === "yellow") {
    hrefs.unshift("/parallel-play", "/weather");
  }

  // de-dupe hrefs preserve order
  const seen = new Set<string>();
  const recommendedHrefs = hrefs.filter((h) => {
    if (seen.has(h)) return false;
    seen.add(h);
    return true;
  }).slice(0, 5);

  if (reasons.length === 0) {
    reasons.push("No red flags named. Soft Signal still free if that changes mid-reach.");
  }

  return { verdict, reasons, recommendedHrefs };
}

export function sealPreRenn(d: PreRennDraft): PreRennSnapshot | null {
  if (!canSealPreRenn(d).ok || d.bodyFlood == null || d.urgeToText == null)
    return null;
  const { verdict, reasons, recommendedHrefs } = computeVerdict(
    d.bodyFlood,
    d.urgeToText,
    d.purpose,
  );
  return {
    id: `pre-renn-${Date.now()}`,
    version: PRE_RENN_GATE_VERSION,
    sealedAt: new Date().toISOString(),
    bodyFlood: d.bodyFlood,
    urgeToText: d.urgeToText,
    purpose: d.purpose.trim().slice(0, 300),
    delayPledgeMinutes: d.delayPledgeMinutes,
    verdict,
    reasons,
    recommendedHrefs,
  };
}

export function verdictCopy(v: GateVerdict): { title: string; body: string } {
  if (v === "red")
    return {
      title: "RED · Do not dump right now",
      body: "Regulate first. Soft Signal free. Delay is care, not exile. Renn is not a fire extinguisher.",
    };
  if (v === "yellow")
    return {
      title: "YELLOW · Regulate a notch first",
      body: "You can reach carefully — after a short protocol, or with a clear purpose and Soft Signal free.",
    };
  return {
    title: "GREEN · Careful contact ok",
    body: "Capacity looks present. Soft Signal still free mid-conversation. No mind-reading contracts.",
  };
}

export function parsePreRennHistory(raw: unknown): PreRennEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && (x as PreRennEntry).snapshot,
  ) as PreRennEntry[];
}

export function summarizePreRenn(entries: PreRennEntry[]) {
  return {
    total: entries.length,
    red: entries.filter((e) => e.snapshot.verdict === "red").length,
    yellow: entries.filter((e) => e.snapshot.verdict === "yellow").length,
    green: entries.filter((e) => e.snapshot.verdict === "green").length,
    honored_delay: entries.filter((e) => e.endReason === "honored_delay").length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
  };
}
