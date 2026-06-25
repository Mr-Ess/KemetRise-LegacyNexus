/**
 * Apply the page_permissions migration to Supabase
 *
 * Usage:
 *   node _apply_permissions_migration.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Get your personal access token at:
 *   https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const PROJECT_REF  = "eoxcpubjoaninjyxtfko";
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error("\n❌  No access token provided.");
  console.error("\nUsage:  node _apply_permissions_migration.mjs <YOUR_ACCESS_TOKEN>");
  console.error("\nGet your token at:  https://supabase.com/dashboard/account/tokens\n");
  process.exit(1);
}

const __dir = dirname(fileURLToPath(import.meta.url));
const sql   = readFileSync(
  join(__dir, "supabase", "migrations", "20260625000001_page_permissions.sql"),
  "utf8"
);

async function run() {
  console.log("\n⏳  Applying migration: 20260625000001_page_permissions.sql ...\n");

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();

  if (!res.ok) {
    console.error(`❌  API error ${res.status}:\n${body}\n`);
    process.exit(1);
  }

  console.log("✅  Migration applied successfully!\n", body);
}

run();
