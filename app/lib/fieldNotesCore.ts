/**
 * Private Field Notes — freeform local notes with controlled tags.
 * Containment job: capture thought without turning it into a partner message.
 * Soft Signal free. Wipeable. Not a diary for surveillance.
 */
export const FIELD_NOTES_VERSION = 1 as const;

export type FieldNote = {
  id: string;
  version: typeof FIELD_NOTES_VERSION;
  at: string;
  body: string;
  tags: string[];
  mood: 1 | 2 | 3 | 4 | 5 | null;
};

export const FIELD_NOTE_TAGS = [
  "urge",
  "gratitude",
  "fear",
  "repair",
  "dream",
  "body",
  "renn_adjacent",
  "build",
  "rest",
  "joke",
  "soft_signal",
] as const;

export function createFieldNote(input: {
  body: string;
  tags: string[];
  mood: 1 | 2 | 3 | 4 | 5 | null;
}): FieldNote | null {
  const body = input.body.trim().slice(0, 2000);
  if (body.length < 1) return null;
  return {
    id: `note-${Date.now()}`,
    version: FIELD_NOTES_VERSION,
    at: new Date().toISOString(),
    body,
    tags: input.tags
      .map((t) => t.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 8),
    mood: input.mood,
  };
}

export function parseFieldNotes(raw: unknown): FieldNote[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && typeof (x as FieldNote).id === "string",
  ) as FieldNote[];
}

export function summarizeFieldNotes(notes: FieldNote[]) {
  const tags = new Map<string, number>();
  for (const n of notes) {
    for (const t of n.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
  }
  return {
    total: notes.length,
    top_tags: [...tags.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}
