import { spawnSync } from 'node:child_process';

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Integration environment unavailable: ${missing.join(', ')}. Start local Supabase and export its client values.`);
  process.exit(2);
}
const result = spawnSync(process.execPath, ['--test', 'integration/*.test.mjs'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
