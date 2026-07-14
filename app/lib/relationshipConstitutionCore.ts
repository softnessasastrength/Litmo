/**
 * Relationship Constitution — living document with versions + amendments.
 * Local only. Not legal. Soft Signal free.
 * v0.2: proposal/ratify, export text, version snapshots.
 */
export const REL_CONSTITUTION_VERSION_SCHEMA = 2 as const;

export type Amendment = {
  id: string;
  at: string;
  articleId: string;
  summary: string;
  body: string;
  /** Version number after this amendment */
  versionAfter: number;
  kind: "amend" | "add" | "preamble" | "ratify";
};

export type ConstitutionArticle = {
  id: string;
  title: string;
  body: string;
};

export type ConstitutionDoc = {
  schema: typeof REL_CONSTITUTION_VERSION_SCHEMA;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  preamble: string;
  articles: ConstitutionArticle[];
  amendments: Amendment[];
  /** Optional pending proposal text before ratify */
  pendingProposal: string | null;
};

export const DEFAULT_ARTICLES: ConstitutionArticle[] = [
  {
    id: "a0",
    title: "Soft Signal is free",
    body: "Either person may stop any interaction without explanation or penalty.",
  },
  {
    id: "a1",
    title: "Need is not a crime",
    body: "Naming a need is allowed. A need is not automatic consent from the other.",
  },
  {
    id: "a2",
    title: "Conflict is not exile",
    body: "Friction does not by itself end the bond. Repair paths are preferred when safe.",
  },
  {
    id: "a3",
    title: "No mind-reading contracts",
    body: "We do not require the other to know unspoken tests. We ask when we can.",
  },
  {
    id: "a4",
    title: "Parallel play is sacred",
    body: "Co-presence without touch or talk can count as closeness.",
  },
  {
    id: "a5",
    title: "Amendments are honest",
    body: "This document can change. Changes are versioned. Silence is not consent to an amendment.",
  },
  {
    id: "a6",
    title: "Repair is preferred when safe",
    body: "When capacity exists, we prefer repair archetypes over permanent exile math. Soft Signal still free.",
  },
  {
    id: "a7",
    title: "This is not legal",
    body: "This constitution is a living private map for humans. It is not a court document.",
  },
];

export function createConstitution(
  title = "Our Relationship Constitution",
): ConstitutionDoc {
  const now = new Date().toISOString();
  return {
    schema: REL_CONSTITUTION_VERSION_SCHEMA,
    id: `const-${Date.now()}`,
    title,
    createdAt: now,
    updatedAt: now,
    version: 1,
    preamble:
      "This is a living private document for humans who love infrastructure. Not legal. Soft Signal free. Silence is not consent to an amendment.",
    articles: DEFAULT_ARTICLES.map((a) => ({ ...a })),
    amendments: [],
    pendingProposal: null,
  };
}

export function setPendingProposal(
  doc: ConstitutionDoc,
  text: string,
): ConstitutionDoc {
  return {
    ...doc,
    pendingProposal: text.trim().slice(0, 2000) || null,
    updatedAt: new Date().toISOString(),
  };
}

/** Ratify a pending proposal into amendment log + version bump without changing articles. */
export function ratifyProposal(doc: ConstitutionDoc): ConstitutionDoc {
  if (!doc.pendingProposal?.trim()) return doc;
  const at = new Date().toISOString();
  const version = doc.version + 1;
  const amendment: Amendment = {
    id: `amd-${Date.now()}`,
    at,
    articleId: "proposal",
    summary: "Ratified proposal",
    body: doc.pendingProposal.trim().slice(0, 2000),
    versionAfter: version,
    kind: "ratify",
  };
  return {
    ...doc,
    pendingProposal: null,
    amendments: [amendment, ...doc.amendments].slice(0, 100),
    version,
    updatedAt: at,
  };
}

export function amendArticle(
  doc: ConstitutionDoc,
  articleId: string,
  summary: string,
  newBody: string,
): ConstitutionDoc {
  const articles = doc.articles.map((a) =>
    a.id === articleId ? { ...a, body: newBody.trim().slice(0, 2000) } : a,
  );
  const at = new Date().toISOString();
  const version = doc.version + 1;
  const amendment: Amendment = {
    id: `amd-${Date.now()}`,
    at,
    articleId,
    summary: summary.trim().slice(0, 200),
    body: newBody.trim().slice(0, 2000),
    versionAfter: version,
    kind: "amend",
  };
  return {
    ...doc,
    articles,
    amendments: [amendment, ...doc.amendments].slice(0, 100),
    version,
    updatedAt: at,
  };
}

export function addArticle(
  doc: ConstitutionDoc,
  title: string,
  body: string,
): ConstitutionDoc {
  const id = `a${Date.now()}`;
  const article: ConstitutionArticle = {
    id,
    title: title.trim().slice(0, 120),
    body: body.trim().slice(0, 2000),
  };
  const at = new Date().toISOString();
  const version = doc.version + 1;
  const amendment: Amendment = {
    id: `amd-${Date.now()}`,
    at,
    articleId: id,
    summary: `Added article: ${article.title}`,
    body: article.body,
    versionAfter: version,
    kind: "add",
  };
  return {
    ...doc,
    articles: [...doc.articles, article],
    amendments: [amendment, ...doc.amendments].slice(0, 100),
    version,
    updatedAt: at,
  };
}

export function updatePreamble(
  doc: ConstitutionDoc,
  preamble: string,
  summary = "Preamble update",
): ConstitutionDoc {
  const at = new Date().toISOString();
  const version = doc.version + 1;
  const body = preamble.trim().slice(0, 2000);
  const amendment: Amendment = {
    id: `amd-${Date.now()}`,
    at,
    articleId: "preamble",
    summary: summary.trim().slice(0, 200),
    body,
    versionAfter: version,
    kind: "preamble",
  };
  return {
    ...doc,
    preamble: body,
    amendments: [amendment, ...doc.amendments].slice(0, 100),
    version,
    updatedAt: at,
  };
}

/** Plain-text export for sharing offline (never auto-sent). */
export function exportConstitutionText(doc: ConstitutionDoc): string {
  const lines = [
    `# ${doc.title}`,
    `Version ${doc.version} · updated ${doc.updatedAt.slice(0, 10)}`,
    ``,
    `## Preamble`,
    doc.preamble,
    ``,
    `## Articles`,
  ];
  for (const a of doc.articles) {
    lines.push(``, `### ${a.id}: ${a.title}`, a.body);
  }
  lines.push(``, `## Recent amendments`);
  for (const m of doc.amendments.slice(0, 20)) {
    lines.push(
      `- v${m.versionAfter} · ${m.kind} · ${m.summary} · ${m.at.slice(0, 10)}`,
    );
  }
  lines.push(
    ``,
    `— Soft Signal free · not legal · silence is not consent to amendments`,
  );
  return lines.join("\n");
}

export function parseConstitution(raw: unknown): ConstitutionDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<ConstitutionDoc>;
  if (!Array.isArray(o.articles)) return null;
  return {
    schema: REL_CONSTITUTION_VERSION_SCHEMA,
    id: typeof o.id === "string" ? o.id : `const-${Date.now()}`,
    title: typeof o.title === "string" ? o.title : "Our Relationship Constitution",
    createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
    version: typeof o.version === "number" ? o.version : 1,
    preamble:
      typeof o.preamble === "string"
        ? o.preamble
        : createConstitution().preamble,
    articles: o.articles as ConstitutionArticle[],
    amendments: Array.isArray(o.amendments)
      ? (o.amendments as Amendment[])
      : [],
    pendingProposal:
      typeof o.pendingProposal === "string" ? o.pendingProposal : null,
  };
}
