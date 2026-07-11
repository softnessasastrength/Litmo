import fs from "node:fs";
const local = {};
if (fs.existsSync("app/.env"))
  for (const line of fs.readFileSync("app/.env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) local[match[1]] = match[2];
  }
const environment = { ...local, ...process.env };
const required = ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY"];
const missing = required.filter((name) => !environment[name]?.trim());
if (missing.length) {
  console.error(
    `Missing client-safe environment variables: ${missing.join(", ")}. Copy app/.env.example to app/.env.`,
  );
  process.exit(1);
}
if (
  Object.keys(environment).some(
    (name) =>
      name.startsWith("EXPO_PUBLIC_") && /SERVICE|SECRET|JWT/.test(name),
  )
) {
  console.error(
    "Refusing to start: a privileged-looking value uses the EXPO_PUBLIC_ prefix.",
  );
  process.exit(1);
}
console.log("Environment names validated. Values were not logged.");
