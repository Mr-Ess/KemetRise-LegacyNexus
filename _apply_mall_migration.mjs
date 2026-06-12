/**
 * Apply marketplace + Digital Mall migrations directly via Supabase Management API.
 * Skips the erp_comprehensive_modules migration (requires erp_tenants to exist first).
 *
 * Usage:
 *   node _apply_mall_migration.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Get your personal access token at:
 *   https://supabase.com/dashboard/account/tokens
 */

import { readFile } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'eoxcpubjoaninjyxtfko'

const ACCESS_TOKEN = process.argv[2]
if (!ACCESS_TOKEN) {
  console.error('\n❌  No access token provided.')
  console.error('\nUsage:  node _apply_mall_migration.mjs <YOUR_ACCESS_TOKEN>')
  console.error('\nGet your token at:  https://supabase.com/dashboard/account/tokens\n')
  process.exit(1)
}

// Only apply the migrations we need — skip erp_comprehensive_modules (needs erp_tenants)
const MIGRATIONS = [
  'supabase/migrations/20260612200000_marketplace_listings.sql',
  'supabase/migrations/20260612210000_marketplace_categories.sql',
  'supabase/migrations/20260612220000_marketplace_types.sql',
  'supabase/migrations/20260612300000_digital_mall.sql',
]

async function runSQL(sql, label) {
  console.log(`\n🚀  Applying: ${label} …`)
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  )
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }

  if (!res.ok) {
    console.error(`❌  Failed (HTTP ${res.status}):`)
    console.error(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
    return false
  }
  console.log(`✅  Done: ${label}`)
  return true
}

let allOk = true
for (const relPath of MIGRATIONS) {
  const filePath = resolve(__dirname, relPath)
  const sql = await readFile(filePath, 'utf8')
  const ok = await runSQL(sql, relPath.split('/').pop())
  if (!ok) allOk = false
}

if (allOk) {
  console.log('\n🎉  All migrations applied successfully! Digital Mall is ready.')
} else {
  console.error('\n⚠️   Some migrations failed. Check errors above.')
  process.exit(1)
}
