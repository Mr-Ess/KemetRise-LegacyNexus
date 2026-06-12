-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE ERP — Migration 008
-- Dynamic Sector Registry, Education Module, HR QR Sessions,
-- Finance Tax Rules, Commerce product_type columns
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. DYNAMIC SECTOR REGISTRY ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.erp_sector_registry (
  code        text PRIMARY KEY,
  label       text NOT NULL,
  icon        text NOT NULL DEFAULT '🏢',
  color       text NOT NULL DEFAULT '#6366f1',
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  config      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_sector_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sectors_read_all" ON public.erp_sector_registry;
CREATE POLICY "sectors_read_all" ON public.erp_sector_registry
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "sectors_manage" ON public.erp_sector_registry;
CREATE POLICY "sectors_manage" ON public.erp_sector_registry
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

INSERT INTO public.erp_sector_registry (code, label, icon, color, description, sort_order) VALUES
  ('EDU-01', 'Education & Courses',   '🎓', '#6366f1', 'Online/offline education, courses, student tracking',  1),
  ('MED-01', 'Medical & Healthcare',  '🏥', '#ef4444', 'Clinics, hospitals, patient management, appointments', 2),
  ('SPT-01', 'Sports & Gyms',         '🏋️', '#f97316', 'Gym management, memberships, training sessions',      3),
  ('LEG-01', 'Legal Services',        '⚖️', '#8b5cf6', 'Law firms, case management, client billing',           4),
  ('TUR-01', 'Tourism & Travel',      '✈️', '#06b6d4', 'Travel agencies, bookings, tour packages',             5),
  ('CMP-01', 'Companies & Services',  '🏢', '#10b981', 'General business, B2B services, consulting',           6),
  ('RET-01', 'Retail & E-Commerce',   '🛒', '#f59e0b', 'Retail stores, online shops, inventory management',    7),
  ('MULTI',  'Multi-Sector',          '🌐', '#64748b', 'Multi-sector tenant spanning several industries',       8)
ON CONFLICT (code) DO NOTHING;

-- ─── 2. EDUCATION MODULE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.edu_courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  instructor_name text,
  price           numeric(12,2) NOT NULL DEFAULT 0,
  max_students    integer DEFAULT 30,
  is_active       boolean NOT NULL DEFAULT true,
  start_date      date,
  end_date        date,
  schedule_info   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_enrollments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.edu_courses(id) ON DELETE CASCADE,
  student_name    text NOT NULL,
  student_email   text,
  student_phone   text,
  enrolled_at     timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','dropped','suspended')),
  paid_amount     numeric(12,2) NOT NULL DEFAULT 0,
  balance_due     numeric(12,2) NOT NULL DEFAULT 0,
  notes           text
);

CREATE TABLE IF NOT EXISTS public.edu_attendance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id   uuid NOT NULL REFERENCES public.edu_enrollments(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES public.edu_courses(id) ON DELETE CASCADE,
  attended_at     timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'present'
    CHECK (status IN ('present','absent','late','excused'))
);

ALTER TABLE public.edu_courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_attendance  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edu_courses_all" ON public.edu_courses;
CREATE POLICY "edu_courses_all"     ON public.edu_courses
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "edu_enrollments_all" ON public.edu_enrollments;
CREATE POLICY "edu_enrollments_all" ON public.edu_enrollments
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "edu_attendance_all" ON public.edu_attendance;
CREATE POLICY "edu_attendance_all"  ON public.edu_attendance
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ─── 3. HR QR SESSIONS + ATTENDANCE LOG ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_qr_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  label       text,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  scans_count integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_attendance_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_id   text,
  check_type    text NOT NULL DEFAULT 'in' CHECK (check_type IN ('in','out')),
  source        text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','qr','biometric','app')),
  qr_session_id uuid REFERENCES public.hr_qr_sessions(id) ON DELETE SET NULL,
  device_id     text,
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  notes         text
);

ALTER TABLE public.hr_qr_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_qr_all" ON public.hr_qr_sessions;
CREATE POLICY "hr_qr_all"  ON public.hr_qr_sessions
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_att_all" ON public.hr_attendance_log;
CREATE POLICY "hr_att_all" ON public.hr_attendance_log
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Function to generate QR session
CREATE OR REPLACE FUNCTION public.fn_create_qr_session(
  p_tenant_id uuid,
  p_label     text DEFAULT NULL,
  p_minutes   integer DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_session public.hr_qr_sessions;
BEGIN
  INSERT INTO public.hr_qr_sessions (tenant_id, label, expires_at)
  VALUES (p_tenant_id, p_label, now() + (p_minutes || ' minutes')::interval)
  RETURNING * INTO v_session;
  RETURN row_to_json(v_session);
END;
$$;
GRANT EXECUTE ON FUNCTION public.fn_create_qr_session TO authenticated;

-- ─── 4. FINANCE TAX RULES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_tax_rules (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  rate_pct   numeric(6,4) NOT NULL DEFAULT 0,
  tax_type   text NOT NULL DEFAULT 'vat'
    CHECK (tax_type IN ('vat','income','withholding','custom')),
  authority  text,
  is_default boolean NOT NULL DEFAULT false,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_tax_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fin_tax_all" ON public.fin_tax_rules;
CREATE POLICY "fin_tax_all" ON public.fin_tax_rules
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ─── 5. COMMERCE: digital product columns ────────────────────────────────
ALTER TABLE public.com_products ADD COLUMN IF NOT EXISTS
  file_url text;
ALTER TABLE public.com_products ADD COLUMN IF NOT EXISTS
  download_limit integer;
ALTER TABLE public.com_products ADD COLUMN IF NOT EXISTS
  low_stock_threshold integer NOT NULL DEFAULT 5;

-- ─── 6. HR EMPLOYEES table (if not exists from migration 004) ─────────────
CREATE TABLE IF NOT EXISTS public.hr_employees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  employee_code   text,
  department      text,
  position        text,
  email           text,
  phone           text,
  hire_date       date,
  base_salary     numeric(12,2) DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hr_employees_all" ON public.hr_employees;
CREATE POLICY "hr_employees_all" ON public.hr_employees
  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
