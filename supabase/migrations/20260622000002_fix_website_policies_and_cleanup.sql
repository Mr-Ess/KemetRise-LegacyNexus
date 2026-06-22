-- =============================================================================
-- FIX: website table admin policies used 'super_admin' (wrong) instead of
--      'superadmin' (correct enum value). Admins could not manage CMS content.
-- FIX: Drop deprecated clients.api_key raw plaintext column.
-- Date: 2026-06-22
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Fix 'super_admin' → 'superadmin' in all website table policies
-- Affected tables: website_projects, website_agents, website_portfolio,
--                  website_partners, and any other website_* tables
-- ─────────────────────────────────────────────────────────────────────────────

-- website_projects
DROP POLICY IF EXISTS "wp_proj_admin_all" ON public.website_projects;
CREATE POLICY "wp_proj_admin_all"
  ON public.website_projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'manager')
    )
  );

-- website_agents
DROP POLICY IF EXISTS "wa_admin_all" ON public.website_agents;
CREATE POLICY "wa_admin_all"
  ON public.website_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'manager')
    )
  );

-- website_portfolio (if it exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'website_portfolio') THEN
    DROP POLICY IF EXISTS "wport_admin_all" ON public.website_portfolio;
    EXECUTE $p$
      CREATE POLICY "wport_admin_all"
        ON public.website_portfolio FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
    $p$;
  END IF;
END $$;

-- website_partners (if it exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'website_partners') THEN
    DROP POLICY IF EXISTS "wpart_admin_all" ON public.website_partners;
    EXECUTE $p$
      CREATE POLICY "wpart_admin_all"
        ON public.website_partners FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
    $p$;
  END IF;
END $$;

-- website_services (if it exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'website_services') THEN
    DROP POLICY IF EXISTS "ws_admin_all" ON public.website_services;
    EXECUTE $p$
      CREATE POLICY "ws_admin_all"
        ON public.website_services FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
    $p$;
  END IF;
END $$;

-- website_products (if it exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'website_products') THEN
    DROP POLICY IF EXISTS "wprod_admin_all" ON public.website_products;
    EXECUTE $p$
      CREATE POLICY "wprod_admin_all"
        ON public.website_products FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'superadmin', 'manager')
          )
        )
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Drop deprecated clients.api_key plaintext column
-- (api_key_hash was added in 20260531200000_security_hardening.sql)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'clients'
      AND column_name  = 'api_key'
  ) THEN
    -- Zero out any remaining raw values before dropping
    UPDATE public.clients SET api_key = NULL WHERE api_key IS NOT NULL;
    ALTER TABLE public.clients DROP COLUMN api_key;
  END IF;
END $$;

COMMENT ON COLUMN public.clients.api_key_hash IS
  'bcrypt hash of the client API key. Raw key is shown once at creation. api_key (plaintext) column was dropped on 2026-06-22.';
