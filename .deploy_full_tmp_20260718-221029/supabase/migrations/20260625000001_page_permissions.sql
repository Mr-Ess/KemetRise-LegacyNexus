-- ═══════════════════════════════════════════════════════════════════
-- KemetRise: Roles & Permissions System — Page Permissions + Admin RPCs
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Update user_roles RLS to include superadmin ───────────────────
DROP POLICY IF EXISTS "Users view own roles"    ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles"     ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select"       ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_write"  ON public.user_roles;

CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin','admin')
    )
  );

CREATE POLICY "user_roles_admin_write" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin','admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin','admin')
    )
  );

-- ── 2. page_permissions table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path          TEXT NOT NULL UNIQUE,
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  is_public     BOOLEAN NOT NULL DEFAULT false,
  label_en      TEXT,
  label_ar      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read page permissions (needed for frontend guards)
DROP POLICY IF EXISTS "page_perms_read"  ON public.page_permissions;
DROP POLICY IF EXISTS "page_perms_admin" ON public.page_permissions;

CREATE POLICY "page_perms_read" ON public.page_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "page_perms_admin" ON public.page_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('superadmin','admin')
    )
  );

-- ── 3. RPC: assign_user_role ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_user_id UUID,
  p_role    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization check
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('superadmin','admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges: only superadmin/admin can assign roles';
  END IF;

  -- Insert into user_roles (cast text → app_role)
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, p_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid role value: %', p_role;
  END;

  -- Sync user_profiles.role for backward compat
  UPDATE public.user_profiles
  SET role = p_role
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_user_role(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assign_user_role(uuid, text) TO authenticated;

-- ── 4. RPC: revoke_user_role ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_user_role(
  p_user_id UUID,
  p_role    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('superadmin','admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges: only superadmin/admin can revoke roles';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = p_user_id
    AND role    = p_role::app_role;

  -- Reset user_profiles.role to 'user'
  UPDATE public.user_profiles
  SET role = 'user'
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) TO authenticated;

-- ── 5. RPC: update_page_permission ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_page_permission(
  p_path          TEXT,
  p_allowed_roles TEXT[],
  p_is_public     BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('superadmin','admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  INSERT INTO public.page_permissions (path, allowed_roles, is_public)
  VALUES (p_path, p_allowed_roles, p_is_public)
  ON CONFLICT (path) DO UPDATE SET
    allowed_roles = EXCLUDED.allowed_roles,
    is_public     = EXCLUDED.is_public,
    updated_at    = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_page_permission(text, text[], boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_page_permission(text, text[], boolean) TO authenticated;

-- ── 6. RPC: get_users_with_profiles (enriched user list) ─────────────
CREATE OR REPLACE FUNCTION public.get_users_with_profiles()
RETURNS TABLE (
  id          UUID,
  email       TEXT,
  full_name   TEXT,
  phone       TEXT,
  role        TEXT,
  is_verified BOOLEAN,
  is_suspended BOOLEAN,
  created_at  TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    au.id,
    au.email,
    COALESCE(up.full_name, split_part(au.email,'@',1)) AS full_name,
    up.phone,
    COALESCE(up.role, 'user')  AS role,
    COALESCE(up.is_verified, false)  AS is_verified,
    COALESCE(up.is_suspended, false) AS is_suspended,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  ORDER BY au.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_users_with_profiles() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_users_with_profiles() TO authenticated;

-- ── 7. Seed default page permissions ─────────────────────────────────
INSERT INTO public.page_permissions (path, allowed_roles, is_public, label_en, label_ar) VALUES
  ('/dashboard',           ARRAY['superadmin','admin','manager','staff','partner','agent','vendor','marketing','user'], false, 'Dashboard',            'لوحة التحكم'),
  ('/permissions',         ARRAY['superadmin','admin'],                                                                false, 'Permissions',          'الصلاحيات'),
  ('/admin',               ARRAY['superadmin','admin'],                                                                false, 'Admin Portal',         'بوابة الإدارة'),
  ('/admin/users',         ARRAY['superadmin','admin'],                                                                false, 'Admin Users',          'إدارة المستخدمين'),
  ('/admin/sectors',       ARRAY['superadmin','admin'],                                                                false, 'Sector Factory',       'مصنع القطاعات'),
  ('/admin/analytics',     ARRAY['superadmin','admin'],                                                                false, 'Admin Analytics',      'تحليلات الإدارة'),
  ('/admin/website',       ARRAY['superadmin','admin'],                                                                false, 'Website Manager',      'مدير الموقع'),
  ('/operations',          ARRAY['superadmin','admin','manager'],                                                       false, 'Operations Hub',       'مركز العمليات'),
  ('/audit-logs',          ARRAY['superadmin','admin'],                                                                false, 'Audit Logs',           'سجلات المراجعة'),
  ('/employees',           ARRAY['superadmin','admin','manager'],                                                       false, 'Employees',            'الموظفون'),
  ('/finance-analytics',   ARRAY['superadmin','admin','manager'],                                                       false, 'Finance Analytics',    'التحليل المالي'),
  ('/settings',            ARRAY['superadmin','admin','manager','staff','user'],                                        false, 'Settings',             'الإعدادات'),
  ('/brands',              ARRAY['superadmin','admin','manager'],                                                       false, 'Brands Hub',           'مركز العلامات'),
  ('/erp',                 ARRAY['superadmin','admin','manager'],                                                       false, 'ERP Cockpit',          'مركز تخطيط الموارد'),
  ('/marketing',           ARRAY['superadmin','admin','manager','marketing'],                                           false, 'Marketing',            'التسويق'),
  ('/reports',             ARRAY['superadmin','admin','manager'],                                                       false, 'Reports',              'التقارير'),
  ('/notifications',       ARRAY['superadmin','admin','manager','staff','user'],                                        false, 'Notifications',        'الإشعارات'),
  ('/digital-inheritance', ARRAY['superadmin','admin'],                                                                false, 'Digital Inheritance',  'الإرث الرقمي'),
  ('/legendary-journey',   ARRAY['superadmin','admin','manager'],                                                       false, 'Legendary Journey',    'الرحلة الأسطورية'),
  ('/payment-gateways',    ARRAY['superadmin','admin'],                                                                false, 'Payment Gateways',     'بوابات الدفع'),
  ('/backups',             ARRAY['superadmin','admin'],                                                                false, 'Backups',              'النسخ الاحتياطية'),
  ('/automations',         ARRAY['superadmin','admin','manager'],                                                       false, 'Automations',          'الأتمتة'),
  ('/team',                ARRAY['superadmin','admin','manager'],                                                       false, 'Team',                 'الفريق'),
  ('/referrals',           ARRAY['superadmin','admin','manager','agent'],                                               false, 'Referrals',            'الإحالات'),
  ('/affiliates',          ARRAY['superadmin','admin','manager'],                                                       false, 'Affiliates',           'التابعون'),
  ('/manager',             ARRAY['superadmin','admin','manager'],                                                       false, 'Manager Portal',       'بوابة المدير'),
  ('/staff',               ARRAY['superadmin','admin','manager','staff'],                                               false, 'Staff Portal',         'بوابة الموظف'),
  ('/provider',            ARRAY['superadmin','admin','manager','provider'],                                            false, 'Provider Portal',      'بوابة مزود الخدمة'),
  ('/partner',             ARRAY['superadmin','admin','manager','partner'],                                             false, 'Partner Portal',       'بوابة الشريك'),
  ('/agent',               ARRAY['superadmin','admin','manager','agent'],                                               false, 'Agent Portal',         'بوابة الوكيل'),
  ('/vendor',              ARRAY['superadmin','admin','manager','vendor'],                                              false, 'Vendor Portal',        'بوابة البائع')
ON CONFLICT (path) DO NOTHING;
