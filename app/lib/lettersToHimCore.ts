/**
 * Letters To Him — Pillar 7 containment: "Grace Over Guilt."
 *
 * WHAT: A rare-use, self-directed ritual for naming an old regret (no detail
 *   required), naming what younger-you genuinely didn't know yet that you
 *   know now, and writing one sentence of grace — to him, not extracted as
 *   a lesson. That's the whole shape. There is no step sequence, no
 *   progress tracker, no "next step" — this is not a guided ritual like
 *   firstRitualCore.ts / secondRitualCore.ts, it's a single free-write you
 *   can seal whenever you have something, or never open again.
 * WHY: Pillar 7 of the Seven Pillars: "Grace Over Guilt — honor who you
 *   were, forgive him, don't drag his guilt into tomorrow." Grace is the
 *   point, not a resource to extract growth from. The moment this becomes
 *   another protocol to earn — a streak, a score, a "+1 growth" ledger —
 *   it has quietly reinvented the Emotional Masochist Circuit this project
 *   already warns against (see attachmentRepairCore.ts's masochist mode:
 *   turning care/repair into something you have to perform and grade
 *   yourself on). This file is deliberately thin to keep that from
 *   happening.
 * CONSENT: Not consent, not a diagnosis, not therapy. Sealing a letter is
 *   not an obligation and proves nothing about "healing enough." Nothing
 *   here is required except a single non-empty line of grace — regret and
 *   the "didn't know yet" line can both stay blank, "none of these yet"
 *   energy, matching this app's house style elsewhere.
 * EDGE CASES: A draft with only the grace field filled in is fully
 *   sealable. Whitespace-only grace does not count as content. Releasing a
 *   letter is a pure boolean flip with no timestamp and no ledger entry —
 *   it is not a debrief, it does not get scored, and it does not unlock
 *   anything.
 * NEVER: Track streaks, scores, "growth points," or completion state.
 *   Require regret or didntKnowYet to be filled in. Turn release into a
 *   ledger entry or a second protocol. Extract the grace line as a lesson
 *   or a takeaway — it is written to him, not about him.
 * SEE: attachmentRepairCore.ts ("Emotional Masochist Circuit" — the trap
 *   this file avoids rebuilding), firstRitualCore.ts / secondRitualCore.ts
 *   (guided-ritual pattern this file deliberately does NOT follow),
 *   relationshipModelCore.ts (trim/cap idiom for free-text fields).
 */

export const LETTERS_TO_HIM_VERSION = 1 as const;

/** A sealed letter. Free text is trimmed and capped; nothing is required but grace. */
export type LetterEntry = {
  id: string;
  writtenAt: string;
  /** The old regret, named — no detail required. Often left blank on purpose. */
  regret: string;
  /** What younger-you genuinely didn't know yet that you know now. Optional. */
  didntKnowYet: string;
  /** One sentence of grace, written to him — the only required field. */
  grace: string;
  /** Whether this letter has been marked "let go." Pure flag, no ledger. */
  released: boolean;
};

/** The in-progress, unsealed draft. All fields start empty — nothing pre-filled. */
export type LetterDraft = {
  regret: string;
  didntKnowYet: string;
  grace: string;
};

const MAX_FIELD_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 200;

export function defaultLetterDraft(): LetterDraft {
  return {
    regret: "",
    didntKnowYet: "",
    grace: "",
  };
}

/** The only gate: at least one real sentence of grace. Everything else may stay blank. */
export function canSealLetter(draft: LetterDraft): { ok: boolean; reason: string } {
  if (draft.grace.trim().length === 0) {
    return {
      ok: false,
      reason: "Write at least one sentence of grace — the rest can stay blank.",
    };
  }
  return { ok: true, reason: "" };
}

/** Seals a draft into a letter. Returns null if the grace line is empty — never throws. */
export function sealLetter(draft: LetterDraft): LetterEntry | null {
  if (!canSealLetter(draft).ok) return null;
  return {
    id: `letter-${Date.now()}`,
    writtenAt: new Date().toISOString(),
    regret: draft.regret.trim().slice(0, MAX_FIELD_LENGTH),
    didntKnowYet: draft.didntKnowYet.trim().slice(0, MAX_FIELD_LENGTH),
    grace: draft.grace.trim().slice(0, MAX_FIELD_LENGTH),
    released: false,
  };
}

/** Marks a letter "let go." Pure boolean flip — no timestamp, no ledger, no score. */
export function releaseLetter(entry: LetterEntry): LetterEntry {
  return { ...entry, released: true };
}

function isValidLetterEntry(v: unknown): v is LetterEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as Partial<LetterEntry>;
  return (
    typeof o.id === "string" &&
    typeof o.writtenAt === "string" &&
    typeof o.regret === "string" &&
    typeof o.didntKnowYet === "string" &&
    typeof o.grace === "string" &&
    typeof o.released === "boolean"
  );
}

/** Defensive parse for AsyncStorage round-trip — bad/missing data becomes [], never throws. */
export function parseLetterHistory(raw: unknown): LetterEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidLetterEntry).slice(0, MAX_HISTORY_LENGTH);
}
