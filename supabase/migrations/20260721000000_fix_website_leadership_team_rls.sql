-- Fix Leadership Team CMS writes for admin roles.
-- Aligns the table with the same role-check pattern used by other website CMS tables.

ALTER TABLE public.website_leadership_team ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_leadership_team" ON public.website_leadership_team;
CREATE POLICY "public_read_leadership_team"
ON public.website_leadership_team
FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "admin_all_leadership_team" ON public.website_leadership_team;
CREATE POLICY "admin_all_leadership_team"
ON public.website_leadership_team
FOR ALL
USING (public.get_my_role() IN ('admin', 'superadmin', 'manager'))
WITH CHECK (public.get_my_role() IN ('admin', 'superadmin', 'manager'));