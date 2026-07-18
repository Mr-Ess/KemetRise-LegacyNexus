/**
 * Apply missing column fixes for CMS tables
 * Usage: node _apply_cms_columns.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Get your token from: https://supabase.com/dashboard/account/tokens
 */
const PROJECT_REF = 'eoxcpubjoaninjyxtfko';
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error('Usage: node _apply_cms_columns.mjs <TOKEN>');
  console.error('Get token from: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const SQL = `
-- Add missing created_at / updated_at to CMS tables
ALTER TABLE public.website_faqs
  ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_stats
  ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_plans
  ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_contact_submissions
  ADD COLUMN IF NOT EXISTS sort_order  int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_settings
  ADD COLUMN IF NOT EXISTS sort_order  int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

ALTER TABLE public.website_testimonials
  ADD COLUMN IF NOT EXISTS sort_order  int DEFAULT 0;

SELECT 'Done — all missing columns added' AS result;
`;

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  }
);
const body = await res.text();
if (!res.ok) {
  console.error('❌  HTTP', res.status, body);
  process.exit(1);
}
console.log('✅  Migration applied:\n', body);
