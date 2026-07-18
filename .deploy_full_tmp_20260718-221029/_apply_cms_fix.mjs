/**
 * Apply website CMS schema fix + seed migration
 * Usage: node _apply_cms_fix.mjs <ACCESS_TOKEN>
 */

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'eoxcpubjoaninjyxtfko';
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error('Usage: node _apply_cms_fix.mjs <TOKEN>');
  process.exit(1);
}

async function applyMigration(filePath) {
  const sql = await readFile(resolve(__dirname, filePath), 'utf8');
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`);
  return body;
}

async function run() {
  console.log('\n🔄  Applying schema fix + seed migration...');
  try {
    let sql = await readFile(
      resolve(__dirname, 'supabase/migrations/20260620200000_fix_website_cms_schema_and_seed.sql'),
      'utf8'
    );
    // Strip single-line comments to avoid Unicode encoding issues with box chars
    sql = sql.replace(/--[^\n]*/g, '').replace(/\n{3,}/g, '\n\n').trim();

    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`);
    console.log('✅  Done!', body.length > 200 ? body.slice(0, 200) + '...' : body);
  } catch (err) {
    console.error('\n❌  Failed:', err.message);
    process.exit(1);
  }
}

run();
