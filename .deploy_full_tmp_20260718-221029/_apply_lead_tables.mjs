/**
 * Apply lead capture tables migration
 * Usage: node _apply_lead_tables.mjs <ACCESS_TOKEN>
 */
import { readFileSync } from "fs";

const PROJECT_REF = "eoxcpubjoaninjyxtfko";
const ACCESS_TOKEN = process.argv[2];
if (!ACCESS_TOKEN) { console.error("Usage: node _apply_lead_tables.mjs <TOKEN>"); process.exit(1); }

const sql = readFileSync(
  new URL("./supabase/migrations/20260621000000_lead_capture_tables.sql", import.meta.url),
  "utf8"
).replace(/--[^\n]*/g, "").replace(/\n{3,}/g, "\n\n").trim();

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const json = await res.json();
if (res.ok) {
  console.log("✅ Lead capture tables migration applied successfully.");
} else {
  console.error("❌ Migration failed:", JSON.stringify(json, null, 2));
  process.exit(1);
}
