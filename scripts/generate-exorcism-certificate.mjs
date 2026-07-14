/**
 * The Exorcism Certificate — generates a frozen, honest snapshot of the
 * cathedral: what fears got named, what got built, what's still open.
 *
 * WHAT: Reads real repo state (git log, docs/CONTAINMENT_SYSTEM.md's fear
 *   table, docs/CHANGELOG.md's recent entries) into a static markdown
 *   artifact. Never invoked automatically, never run in CI.
 * WHY: docs/EXORCISM_CERTIFICATE.md / CONSTITUTION.md Article IX — burning
 *   (archiving, walking away) is graduation, not failure, and deserves an
 *   honest artifact, not silence. The Cathedral Purge (docs/CATHEDRAL_PURGE.md)
 *   is the erase direction; this is the opposite direction — honoring
 *   completion without needing to delete anything.
 * CONSENT: Produces a DRAFT only. This script has no "make it official"
 *   flag and never will — declaring the dojo complete is a human decision
 *   (CONSTITUTION.md Article IX), not something a generator gets to assert.
 * NEVER: Auto-mark a generated certificate as a real graduation. Run this
 *   in CI or any automated pipeline — it is invoked by a human, on purpose,
 *   when they want a snapshot, nothing more.
 * SEE: docs/EXORCISM_CERTIFICATE.md, CONSTITUTION.md Article IX,
 *   docs/CONTAINMENT_SYSTEM.md, docs/CHANGELOG.md.
 *
 * Run: node scripts/generate-exorcism-certificate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readFileSafe(relPath) {
  try {
    return fs.readFileSync(path.join(root, relPath), "utf8");
  } catch {
    return "";
  }
}

function gitSafe(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

/** Parses the "System | Surface story | Containment job | Core fear soothed"
 *  table in docs/CONTAINMENT_SYSTEM.md into { system, fear } rows. Tolerant
 *  of formatting drift — skips rows it can't confidently parse rather than
 *  guessing. */
function parseContainmentSystems(markdown) {
  const rows = [];
  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || trimmed.startsWith("| ---") || trimmed.startsWith("|-")) {
      continue;
    }
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length !== 4) continue;
    const [system, , , fear] = cells;
    if (!system || system === "System" || !fear || fear === "Core fear soothed") continue;
    // Strip markdown bold/link syntax for a clean plain-text name.
    const cleanSystem = system.replace(/\*\*/g, "").replace(/`/g, "");
    rows.push({ system: cleanSystem, fear });
  }
  return rows;
}

function countFiles(dir, predicate) {
  let count = 0;
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return 0;
  for (const entry of fs.readdirSync(full, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && predicate(entry.name)) count += 1;
  }
  return count;
}

function main() {
  const now = new Date().toISOString();

  const totalCommits = gitSafe("git rev-list --count HEAD");
  const firstCommitDate = gitSafe("git log --reverse --format=%ad --date=short | head -1");
  const lastCommitDate = gitSafe("git log -1 --format=%ad --date=short");
  const docCount = countFiles("docs", (n) => n.endsWith(".md"));
  const testCount = countFiles("app", (n) => n.endsWith(".test.ts"));
  const routeCount = countFiles("app/app", (n) => n === "index.tsx" || n.endsWith(".tsx"));

  const containmentMd = readFileSafe("docs/CONTAINMENT_SYSTEM.md");
  const systems = parseContainmentSystems(containmentMd);

  const changelogMd = readFileSafe("docs/CHANGELOG.md");
  const recentEntries = changelogMd
    .split(/\n(?=## )/)
    .filter((s) => s.startsWith("## "))
    .slice(0, 5)
    .map((s) => s.split("\n")[0].replace(/^## /, "").trim());

  const lines = [];
  lines.push("# Exorcism Certificate — DRAFT");
  lines.push("");
  lines.push(
    "**This is a generated snapshot, not a declared graduation.** " +
      "CONSTITUTION.md Article IX makes completion a human decision — " +
      "this document only reports honest facts about the repository as it " +
      "stood at the moment it was generated. Keeping this file, dating it, " +
      "and calling it official is the actual ritual act; running the " +
      "script that produced it is not.",
  );
  lines.push("");
  lines.push(`**Generated:** ${now}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## What exists, as of this snapshot");
  lines.push("");
  lines.push(`- ${totalCommits} commits, ${firstCommitDate} → ${lastCommitDate}`);
  lines.push(`- ${docCount} documentation files in \`docs/\``);
  lines.push(`- ${testCount} test files in \`app/\``);
  lines.push(`- ${routeCount} screen files in \`app/app/\``);
  lines.push(`- ${systems.length} named containment systems, each holding a specific fear`);
  lines.push("");
  lines.push("## The fears that got a system (from docs/CONTAINMENT_SYSTEM.md)");
  lines.push("");
  if (systems.length === 0) {
    lines.push("_Could not parse docs/CONTAINMENT_SYSTEM.md's table — see that file directly._");
  } else {
    for (const { system, fear } of systems) {
      lines.push(`- **${system}** → ${fear}`);
    }
  }
  lines.push("");
  lines.push("## Most recent chapters (from docs/CHANGELOG.md)");
  lines.push("");
  for (const entry of recentEntries) {
    lines.push(`- ${entry}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "## What this is not",
  );
  lines.push("");
  lines.push(
    "Not proof of healing. Not a claim that any named fear is resolved — " +
      "only that it has a system instead of only landing raw on a person. " +
      "Not a public product. Not clinical treatment. Not legal advice. " +
      "See `docs/REAL_PURPOSE.md` and `docs/THE_2_382_DOCTRINE.md`: this " +
      "project was never chasing 100%, and neither does this certificate.",
  );
  lines.push("");
  lines.push("**Not yet a real graduation — a snapshot, dated, honest, and yours to keep or discard.**");
  lines.push("");

  const outDir = path.join(root, "docs", "certificates");
  fs.mkdirSync(outDir, { recursive: true });
  const fileName = `${now.slice(0, 10)}-draft.md`;
  const outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  console.log(`Draft certificate written to docs/certificates/${fileName}`);
  console.log("This is a snapshot, not a declared graduation — see docs/EXORCISM_CERTIFICATE.md.");
}

main();
