-- =============================================================================
-- FIX: website_settings RLS for CMS writes
-- Reason: Existing policy depends on auth.jwt()->>'role', which may not include
--         app role values used by this project. This blocked footer/settings save.
-- Date: 2026-08-04
-- =============================================================================

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_settings" ON public.website_settings;

CREATE POLICY "admin_all_settings"
  ON public.website_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'superadmin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'superadmin', 'manager')
    )
  );
