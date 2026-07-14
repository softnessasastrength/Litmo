import fs from "node:fs";
import path from "node:path";
const environment = process.env.EXPO_PUBLIC_APP_ENV;
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
const failures = [];
if (!["staging", "production"].includes(environment))
  failures.push("release environment must be staging or production");
if (!url.startsWith("https://") || /localhost|127\.0\.0\.1/.test(url))
  failures.push("release Supabase URL must be non-local HTTPS");
if (!anon || /replace-with|service_role/i.test(anon))
  failures.push("release anon key is missing or unsafe");
const eas = JSON.parse(fs.readFileSync("app/eas.json", "utf8"));
if (eas.build.preview.env.EXPO_PUBLIC_APP_ENV !== "staging")
  failures.push("preview must target staging");
if (eas.build.production.env.EXPO_PUBLIC_APP_ENV !== "production")
  failures.push("production profile mismatch");
// Agent 02/14 — dual-mode EAS pins (G6): store production must be app_store;
// internal maximum profiles must pin maximum so binaries cannot drift.
const pin = (profile, key, expected) => {
  const got = eas.build?.[profile]?.env?.[key];
  if (got !== expected)
    failures.push(
      `EAS ${profile}.${key} must be ${expected} (got ${got ?? "missing"})`,
    );
};
pin("production", "EXPO_PUBLIC_LITMO_BUILD_MODE", "app_store");
pin("production", "EXPO_PUBLIC_LITMO_PLATFORM", "ios");
pin("preview", "EXPO_PUBLIC_LITMO_BUILD_MODE", "app_store");
pin("preview", "EXPO_PUBLIC_LITMO_PLATFORM", "ios");
pin("development", "EXPO_PUBLIC_LITMO_BUILD_MODE", "maximum");
pin("production_maximum_internal", "EXPO_PUBLIC_LITMO_BUILD_MODE", "maximum");
pin("device_beta", "EXPO_PUBLIC_LITMO_BUILD_MODE", "maximum");
if (
  !fs
    .readFileSync("app/ios/Litmo/Litmo.entitlements", "utf8")
    .includes("com.apple.developer.associated-domains")
)
  failures.push("Associated Domains entitlement missing");
if (!fs.existsSync("app/ios/Litmo/PrivacyInfo.xcprivacy"))
  failures.push("privacy manifest missing");
if (!fs.existsSync("docs/deployment/apple-app-site-association"))
  failures.push("AASA file missing");
for (const file of ["app/.env", "backend/.env"])
  if (fs.existsSync(file))
    failures.push(`${file} cannot be a release secret source`);
const visit = (entry) =>
  fs.readdirSync(entry).forEach((name) => {
    if (name === "node_modules" || name === "dist" || name === "build") return;
    const full = path.join(entry, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) return visit(full);
    if (!/\.(ts|tsx|js)$/.test(name)) return;
    const text = fs.readFileSync(full, "utf8");
    if (
      /SUPABASE_SERVICE_ROLE_KEY\s*=|eyJ[a-zA-Z0-9_-]{40,}\.[a-zA-Z0-9_-]{20,}/.test(
        text,
      )
    )
      failures.push(`possible embedded secret: ${full}`);
    if (/console\.(log|debug)\(/.test(text))
      failures.push(`unreviewed console diagnostic: ${full}`);
  });
["app/app", "app/context", "app/services", "backend"].forEach(visit);
if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log(
  `Release validation passed for ${environment}; no values were logged.`,
);
