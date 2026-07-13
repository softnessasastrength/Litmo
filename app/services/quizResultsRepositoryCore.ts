/**
 * Pure helpers for optional owner-only quiz result backup.
 *
 * Fail-closed rules:
 * - Never invent a result from missing/invalid data.
 * - Partner comparison is never serialized for server backup.
 * - Local and remote merges prefer the newer completedAt per quiz only.
 */

import type { ArchetypeId } from "../data/quiz.ts";
import type { QuizCatalogId } from "../data/quizCatalog.ts";

export type StoredQuizResult = {
  quizId: QuizCatalogId;
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  mixPercent: { hearth: number; lantern: number; tidepool: number };
  notes: string[];
  completedAt: string;
  modeLabel?: string;
};

export type QuizResultsMap = Partial<Record<QuizCatalogId, StoredQuizResult>>;

export type QuizResultServerPayload = {
  p_quiz_id: string;
  p_primary_archetype: string;
  p_secondary_archetype: string | null;
  p_mix_hearth: number;
  p_mix_lantern: number;
  p_mix_tidepool: number;
  p_insight_notes: string[];
  p_mode_label: string | null;
  p_completed_at: string;
};

export type QuizResultServerRow = {
  quiz_id?: unknown;
  primary_archetype?: unknown;
  secondary_archetype?: unknown;
  mix_hearth?: unknown;
  mix_lantern?: unknown;
  mix_tidepool?: unknown;
  insight_notes?: unknown;
  mode_label?: unknown;
  completed_at?: unknown;
};

const ARCHETYPES = new Set<string>(["hearth", "lantern", "tidepool"]);

export function isArchetypeId(value: unknown): value is ArchetypeId {
  return typeof value === "string" && ARCHETYPES.has(value);
}

function isFinitePercent(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function normalizeNotes(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > 12) return null;
  const notes: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    if (item.length > 280) return null;
    notes.push(item);
  }
  return notes;
}

/** Reject incomplete or contradictory result objects rather than guessing. */
export function parseStoredQuizResult(value: unknown): StoredQuizResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.quizId !== "string" || row.quizId.length < 1) return null;
  if (!isArchetypeId(row.primary)) return null;
  if (
    row.secondary !== null &&
    row.secondary !== undefined &&
    !isArchetypeId(row.secondary)
  ) {
    return null;
  }
  const mix = row.mixPercent;
  if (!mix || typeof mix !== "object" || Array.isArray(mix)) return null;
  const mixRecord = mix as Record<string, unknown>;
  if (
    !isFinitePercent(mixRecord.hearth) ||
    !isFinitePercent(mixRecord.lantern) ||
    !isFinitePercent(mixRecord.tidepool)
  ) {
    return null;
  }
  const notes = normalizeNotes(row.notes);
  if (!notes) return null;
  if (typeof row.completedAt !== "string" || !row.completedAt) return null;
  const completedMs = Date.parse(row.completedAt);
  if (!Number.isFinite(completedMs)) return null;
  if (
    row.modeLabel !== undefined &&
    row.modeLabel !== null &&
    (typeof row.modeLabel !== "string" || row.modeLabel.length > 120)
  ) {
    return null;
  }

  const result: StoredQuizResult = {
    quizId: row.quizId as QuizCatalogId,
    primary: row.primary,
    secondary: isArchetypeId(row.secondary) ? row.secondary : null,
    mixPercent: {
      hearth: Math.round(mixRecord.hearth),
      lantern: Math.round(mixRecord.lantern),
      tidepool: Math.round(mixRecord.tidepool),
    },
    notes,
    completedAt: row.completedAt,
  };
  if (typeof row.modeLabel === "string" && row.modeLabel.trim()) {
    result.modeLabel = row.modeLabel.trim();
  }
  return result;
}

export function parseQuizResultsMap(raw: string | null): QuizResultsMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: QuizResultsMap = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      const result = parseStoredQuizResult(
        value && typeof value === "object"
          ? {
              ...(value as object),
              quizId: (value as { quizId?: string }).quizId ?? key,
            }
          : null,
      );
      if (result) out[result.quizId] = result;
    }
    return out;
  } catch {
    return {};
  }
}

export function rowToStoredResult(
  row: QuizResultServerRow | null | undefined,
): StoredQuizResult | null {
  if (!row) return null;
  return parseStoredQuizResult({
    quizId: row.quiz_id,
    primary: row.primary_archetype,
    secondary: row.secondary_archetype ?? null,
    mixPercent: {
      hearth: row.mix_hearth,
      lantern: row.mix_lantern,
      tidepool: row.mix_tidepool,
    },
    notes: row.insight_notes,
    completedAt: row.completed_at,
    modeLabel: row.mode_label ?? undefined,
  });
}

export function rowsToQuizResultsMap(
  rows: QuizResultServerRow[] | null | undefined,
): QuizResultsMap {
  if (!rows || !Array.isArray(rows)) return {};
  const out: QuizResultsMap = {};
  for (const row of rows) {
    const result = rowToStoredResult(row);
    if (result) out[result.quizId] = result;
  }
  return out;
}

export function resultToServerPayload(
  result: StoredQuizResult,
): QuizResultServerPayload {
  return {
    p_quiz_id: result.quizId,
    p_primary_archetype: result.primary,
    p_secondary_archetype: result.secondary,
    p_mix_hearth: result.mixPercent.hearth,
    p_mix_lantern: result.mixPercent.lantern,
    p_mix_tidepool: result.mixPercent.tidepool,
    p_insight_notes: result.notes.slice(0, 12).map((n) => n.slice(0, 280)),
    p_mode_label: result.modeLabel?.trim() || null,
    p_completed_at: result.completedAt,
  };
}

/**
 * Prefer the newer completedAt per quiz. Invalid/missing sides contribute
 * nothing — never invents a result either side lacks.
 */
export function mergeQuizResults(
  local: QuizResultsMap,
  remote: QuizResultsMap,
): QuizResultsMap {
  const keys = new Set([
    ...Object.keys(local),
    ...Object.keys(remote),
  ] as QuizCatalogId[]);
  const out: QuizResultsMap = {};
  for (const key of keys) {
    const a = local[key] ? parseStoredQuizResult(local[key]) : null;
    const b = remote[key] ? parseStoredQuizResult(remote[key]) : null;
    if (a && b) {
      const aTime = Date.parse(a.completedAt);
      const bTime = Date.parse(b.completedAt);
      out[key] = bTime > aTime ? b : a;
    } else if (a) {
      out[key] = a;
    } else if (b) {
      out[key] = b;
    }
  }
  return out;
}

export function resultsMapsEqual(
  a: QuizResultsMap,
  b: QuizResultsMap,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = a[key as QuizCatalogId];
    const right = b[key as QuizCatalogId];
    if (!left && !right) continue;
    if (!left || !right) return false;
    if (
      left.quizId !== right.quizId ||
      left.primary !== right.primary ||
      left.secondary !== right.secondary ||
      left.completedAt !== right.completedAt ||
      left.modeLabel !== right.modeLabel ||
      left.mixPercent.hearth !== right.mixPercent.hearth ||
      left.mixPercent.lantern !== right.mixPercent.lantern ||
      left.mixPercent.tidepool !== right.mixPercent.tidepool ||
      left.notes.length !== right.notes.length ||
      left.notes.some((n, i) => n !== right.notes[i])
    ) {
      return false;
    }
  }
  return true;
}
