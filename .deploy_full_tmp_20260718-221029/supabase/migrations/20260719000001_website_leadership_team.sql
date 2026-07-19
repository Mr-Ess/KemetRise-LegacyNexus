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

CREATE POLICY "public_read_leadership_team"
ON public.website_leadership_team
FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "admin_all_leadership_team"
ON public.website_leadership_team
FOR ALL
USING (auth.jwt() ->> 'role' IN ('superadmin','admin'));
