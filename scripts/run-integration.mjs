import { spawnSync } from "node:child_process";
let integrationEnv = { ...process.env };
if (
  !integrationEnv.SUPABASE_URL ||
  !integrationEnv.SUPABASE_ANON_KEY ||
  !integrationEnv.SUPABASE_SERVICE_ROLE_KEY
) {
  const status = spawnSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
  });
  if (status.status === 0) {
    const local = JSON.parse(status.stdout);
    integrationEnv = {
      ...integrationEnv,
      SUPABASE_URL: integrationEnv.SUPABASE_URL ?? local.API_URL,
      SUPABASE_ANON_KEY: integrationEnv.SUPABASE_ANON_KEY ?? local.ANON_KEY,
      // Service role is required only for the trusted snapshot-creation
      // boundary exercised by the Chapter 4 two-client lifecycle scenario.
      SUPABASE_SERVICE_ROLE_KEY:
        integrationEnv.SUPABASE_SERVICE_ROLE_KEY ?? local.SERVICE_ROLE_KEY,
    };
  }
}
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missing = required.filter((name) => !integrationEnv[name]);
if (missing.length) {
  console.error(
    `Integration environment unavailable: ${missing.join(", ")}. Start local Supabase and export its client values.`,
  );
  process.exit(2);
}
const result = spawnSync(
  process.execPath,
  ["--test", "integration/*.test.mjs"],
  { stdio: "inherit", env: integrationEnv },
);
process.exit(result.status ?? 1);
