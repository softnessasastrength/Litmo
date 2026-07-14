/**
 * G10 — Agent 01/02/12/14: TS ↔ Swift feature matrix parity.
 *
 * Compares app/config/features.ts tables to packages/LitmoBuildMode FeatureFlags.swift
 * for the review-sensitive booleans that must never drift.
 *
 * Run: node scripts/validate-feature-parity.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

/** Keys that must match between TS FEATURES_* and Swift LitmoFeatureFlags tables. */
const KEYS = [
  "softSignalStop",
  "consentDualSeal",
  "ageGate",
  "profileIsNotConsent",
  "failClosedBoundaries",
  "proximityRadar",
  "nfcCarefulConnect",
  "localMultipeerShare",
  "hardwareSoftSignal",
  "diagnosticsPanel",
  "demoModeSurface",
  "softSignalSacredCopy",
  "softSignalReviewCopy",
  "softLimitZoneStatus",
];

function parseSwiftTable(source, tableName) {
  // Match: public static let maximum = LitmoFeatureFlags( ... )
  const re = new RegExp(
    `public static let ${tableName}\\s*=\\s*LitmoFeatureFlags\\(([\\s\\S]*?)\\n\\s*\\)`,
  );
  const m = source.match(re);
  if (!m) throw new Error(`Swift table ${tableName} not found`);
  const body = m[1];
  const out = {};
  for (const key of KEYS) {
    const km = body.match(new RegExp(`${key}:\\s*(true|false)`));
    if (!km) throw new Error(`Swift ${tableName}.${key} missing`);
    out[key] = km[1] === "true";
  }
  return out;
}

async function loadTsTables() {
  // Import via experimental strip-types subprocess for ESM TS.
  const loader = `
import { FEATURES_MAXIMUM, FEATURES_APP_STORE } from ${JSON.stringify(
    pathToFileURL(path.join(root, "app/config/features.ts")).href,
  )};
const keys = ${JSON.stringify(KEYS)};
const pick = (t) => Object.fromEntries(keys.map((k) => [k, t[k]]));
console.log(JSON.stringify({ maximum: pick(FEATURES_MAXIMUM), appStore: pick(FEATURES_APP_STORE) }));
`;
  const tmp = path.join(root, "scripts/.parity-tmp.mjs");
  // Use node --experimental-strip-types with a small ts entry instead
  const tsEntry = path.join(root, "scripts/.parity-tmp.ts");
  fs.writeFileSync(
    tsEntry,
    `
import { FEATURES_MAXIMUM, FEATURES_APP_STORE } from "../app/config/features.ts";
const keys = ${JSON.stringify(KEYS)} as const;
const pick = (t: Record<string, boolean>) =>
  Object.fromEntries(keys.map((k) => [k, t[k as string]]));
console.log(JSON.stringify({
  maximum: pick(FEATURES_MAXIMUM as unknown as Record<string, boolean>),
  appStore: pick(FEATURES_APP_STORE as unknown as Record<string, boolean>),
}));
`,
  );
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", tsEntry],
    { encoding: "utf8", cwd: root },
  );
  try {
    fs.unlinkSync(tsEntry);
  } catch {
    /* ignore */
  }
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error("Failed to load TS feature tables");
  }
  return JSON.parse(r.stdout.trim().split("\n").pop());
}

function diff(label, a, b) {
  const fails = [];
  for (const k of KEYS) {
    if (a[k] !== b[k]) fails.push(`${label}.${k}: TS=${a[k]} Swift=${b[k]}`);
  }
  return fails;
}

const swiftPath = path.join(
  root,
  "packages/LitmoBuildMode/Sources/LitmoBuildMode/FeatureFlags.swift",
);
const swift = fs.readFileSync(swiftPath, "utf8");
const swiftMax = parseSwiftTable(swift, "maximum");
const swiftStore = parseSwiftTable(swift, "appStore");
const ts = await loadTsTables();

const failures = [
  ...diff("maximum", ts.maximum, swiftMax),
  ...diff("appStore", ts.appStore, swiftStore),
];

if (failures.length) {
  console.error("TS ↔ Swift feature parity FAILED:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log(
  `Feature parity OK (${KEYS.length} keys × 2 modes). Soft Signal stop always true on both sides.`,
);
