/**
 * Relationship Constitution — living document with versions + amendments.
 * Local only. Not legal. Soft Signal free.
 */
export const REL_CONSTITUTION_VERSION_SCHEMA = 1 as const;

export type Amendment = {
  id: string;
  at: string;
  articleId: string;
  summary: string;
  body: string;
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
];

export function createConstitution(title = "Our Relationship Constitution"): ConstitutionDoc {
  const now = new Date().toISOString();
  return {
    schema: REL_CONSTITUTION_VERSION_SCHEMA,
    id: `const-${Date.now()}`,
    title,
    createdAt: now,
    updatedAt: now,
    version: 1,
    preamble:
      "This is a living private document for humans who love infrastructure. Not legal. Soft Signal free.",
    articles: DEFAULT_ARTICLES.map((a) => ({ ...a })),
    amendments: [],
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
  const amendment: Amendment = {
    id: `amd-${Date.now()}`,
    at: new Date().toISOString(),
    articleId,
    summary: summary.trim().slice(0, 200),
    body: newBody.trim().slice(0, 2000),
  };
  return {
    ...doc,
    articles,
    amendments: [amendment, ...doc.amendments].slice(0, 100),
    version: doc.version + 1,
    updatedAt: amendment.at,
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
  const amendment: Amendment = {
    id: `amd-${Date.now()}`,
    at: new Date().toISOString(),
    articleId: id,
    summary: `Added article: ${article.title}`,
    body: article.body,
  };
  return {
    ...doc,
    articles: [...doc.articles, article],
    amendments: [amendment, ...doc.amendments].slice(0, 100),
    version: doc.version + 1,
    updatedAt: amendment.at,
  };
}

export function parseConstitution(raw: unknown): ConstitutionDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as ConstitutionDoc;
  if (!Array.isArray(o.articles)) return null;
  return o;
}
