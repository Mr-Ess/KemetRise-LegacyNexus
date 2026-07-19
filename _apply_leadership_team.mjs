/**
 * Apply website_leadership_team migration to Supabase
 * Usage: node _apply_leadership_team.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Get your token from: https://supabase.com/dashboard/account/tokens
 */
const PROJECT_REF = 'eoxcpubjoaninjyxtfko';
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error('Usage: node _apply_leadership_team.mjs <TOKEN>');
  console.error('Get token from: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const SQL = `
-- Website CMS: leadership team records editable by superadmin/admin
CREATE TABLE IF NOT EXISTS public.website_leadership_team (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  role_ar    TEXT NOT NULL,
  role_en    TEXT NOT NULL,
  avatar     TEXT DEFAULT 'KR',
  color_key  TEXT DEFAULT 'primary',
  sort_order INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.website_leadership_team
(name_ar, name_en, role_ar, role_en, avatar, color_key, sort_order, is_active)
VALUES
('يوسف السيد', 'Youssef El-Sayed', 'المدير التنفيذي والمؤسس', 'CEO & Founder', 'YE', 'primary', 1, TRUE),
('منى إبراهيم', 'Mona Ibrahim', 'مدير التقنية', 'CTO', 'MI', 'indigo', 2, TRUE),
('كريم ناصر', 'Kareem Nasser', 'رئيس المنتج', 'Head of Product', 'KN', 'emerald', 3, TRUE),
('دينا فؤاد', 'Dina Fouad', 'رئيسة التسويق', 'Head of Marketing', 'DF', 'pink', 4, TRUE)
ON CONFLICT DO NOTHING;

ALTER TABLE public.website_leadership_team ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'website_leadership_team' 
    AND policyname = 'public_read_leadership_team'
  ) THEN
    CREATE POLICY "public_read_leadership_team"
    ON public.website_leadership_team
    FOR SELECT
    USING (is_active = TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'website_leadership_team' 
    AND policyname = 'admin_all_leadership_team'
  ) THEN
    CREATE POLICY "admin_all_leadership_team"
    ON public.website_leadership_team
    FOR ALL
    USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
  END IF;
END $$;

SELECT 'Done — website_leadership_team table created and seeded' AS result;
`;

console.log('🚀 Applying website_leadership_team migration...');

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
