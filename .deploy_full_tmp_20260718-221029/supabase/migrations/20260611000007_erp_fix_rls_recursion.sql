-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE ERP — FIX: Infinite RLS recursion on tenants / tenant_members
--
-- Root cause:
--   tenants_select  → queries tenant_members
--   tenant_members_select → queries tenants   (LOOP)
--
-- Also: get_user_tenant_ids() queries tenants while tenants RLS is active
--
-- Fix strategy:
--   1. Rebuild get_user_tenant_ids() with SET row_security = off
--   2. Simplify tenant_members policies to NEVER query tenants
--   3. Simplify tenants policies to NEVER query tenant_members via subquery
--      that itself triggers tenant_members RLS that re-queries tenants
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. REBUILD HELPER FUNCTIONS WITH row_security = off ──────────────────
-- This breaks the recursion: inside these SECURITY DEFINER functions,
-- RLS is bypassed so they can safely query tenants & tenant_members directly.

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT id FROM public.tenants WHERE owner_user_id = auth.uid()
  UNION
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND owner_user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = p_tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

-- ─── 2. DROP ALL EXISTING POLICIES on tenants & tenant_members ────────────

DROP POLICY IF EXISTS "tenants_select"          ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert"          ON public.tenants;
DROP POLICY IF EXISTS "tenants_update"          ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete"          ON public.tenants;
DROP POLICY IF EXISTS "tenant_members_select"   ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_insert"   ON public.tenant_members;
DROP POLICY IF EXISTS "tenant_members_update"   ON public.tenant_members;
DROP POLICY IF EXISTS "workflow_registry_select" ON public.workflow_registry;
DROP POLICY IF EXISTS "workflow_registry_write"  ON public.workflow_registry;
DROP POLICY IF EXISTS "sector_configs_all"       ON public.sector_configs;

-- ─── 3. TENANTS — safe non-recursive policies ────────────────────────────
-- Uses get_user_tenant_ids() which has row_security=off, breaking the loop.

DROP POLICY IF EXISTS "erp_tenants_select" ON public.tenants;
CREATE POLICY "erp_tenants_select" ON public.tenants FOR SELECT
  USING ( id IN (SELECT public.get_user_tenant_ids()) );

DROP POLICY IF EXISTS "erp_tenants_insert" ON public.tenants;
CREATE POLICY "erp_tenants_insert" ON public.tenants FOR INSERT
  WITH CHECK ( owner_user_id = auth.uid() );

DROP POLICY IF EXISTS "erp_tenants_update" ON public.tenants;
CREATE POLICY "erp_tenants_update" ON public.tenants FOR UPDATE
  USING ( public.is_tenant_admin(id) );

DROP POLICY IF EXISTS "erp_tenants_delete" ON public.tenants;
CREATE POLICY "erp_tenants_delete" ON public.tenants FOR DELETE
  USING ( owner_user_id = auth.uid() );

-- ─── 4. TENANT MEMBERS — never cross-reference tenants in policy ──────────
-- Simple rule: you can see rows where you are the member OR any row in
-- a tenant you own. We check ownership via get_user_tenant_ids() (row_security=off).

DROP POLICY IF EXISTS "erp_tenant_members_select" ON public.tenant_members;
CREATE POLICY "erp_tenant_members_select" ON public.tenant_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR tenant_id IN (SELECT public.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS "erp_tenant_members_insert" ON public.tenant_members;
CREATE POLICY "erp_tenant_members_insert" ON public.tenant_members FOR INSERT
  WITH CHECK (
    public.is_tenant_admin(tenant_id)
  );

DROP POLICY IF EXISTS "erp_tenant_members_update" ON public.tenant_members;
CREATE POLICY "erp_tenant_members_update" ON public.tenant_members FOR UPDATE
  USING (
    public.is_tenant_admin(tenant_id)
  );

DROP POLICY IF EXISTS "erp_tenant_members_delete" ON public.tenant_members;
CREATE POLICY "erp_tenant_members_delete" ON public.tenant_members FOR DELETE
  USING (
    public.is_tenant_admin(tenant_id)
  );

-- ─── 5. WORKFLOW REGISTRY & SECTOR CONFIGS ───────────────────────────────

DROP POLICY IF EXISTS "erp_workflow_registry_select" ON public.workflow_registry;
CREATE POLICY "erp_workflow_registry_select" ON public.workflow_registry FOR SELECT
  USING ( tenant_id IN (SELECT public.get_user_tenant_ids()) );

DROP POLICY IF EXISTS "erp_workflow_registry_write" ON public.workflow_registry;
CREATE POLICY "erp_workflow_registry_write" ON public.workflow_registry FOR ALL
  USING ( public.is_tenant_admin(tenant_id) );

DROP POLICY IF EXISTS "erp_sector_configs_all" ON public.sector_configs;
CREATE POLICY "erp_sector_configs_all" ON public.sector_configs FOR ALL
  USING ( tenant_id IN (SELECT public.get_user_tenant_ids()) );
