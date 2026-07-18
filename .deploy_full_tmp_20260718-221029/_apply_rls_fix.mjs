/**
 * Apply user_profiles RLS fix migration
 * Usage: node _apply_rls_fix.mjs <ACCESS_TOKEN>
 */
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'eoxcpubjoaninjyxtfko';
const ACCESS_TOKEN = process.argv[2];
if (!ACCESS_TOKEN) { console.error('Usage: node _apply_rls_fix.mjs <TOKEN>'); process.exit(1); }

async function run() {
  let sql = await readFile(
    resolve(__dirname, 'supabase/migrations/20260620300000_fix_user_profiles_rls.sql'),
    'utf8'
  );
  sql = sql.replace(/--[^\n]*/g, '').replace(/\n{3,}/g, '\n\n').trim();

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) { console.error('Failed:', body); process.exit(1); }
  console.log('\n✅  RLS fix applied!\n', body);
}
run();
