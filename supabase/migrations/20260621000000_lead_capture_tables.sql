
CREATE TABLE IF NOT EXISTS public.service_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      uuid,
  service_name    text,
  service_name_ar text,
  service_name_en text,
  full_name       text NOT NULL,
  customer_name   text,
  email           text NOT NULL,
  customer_email  text,
  phone           text,
  customer_phone  text,
  company         text,
  company_name    text,
  message         text,
  status          text NOT NULL DEFAULT 'pending',
  source          text DEFAULT 'website',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sr_public_insert" ON public.service_requests;
CREATE POLICY "sr_public_insert"
  ON public.service_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "sr_admin_select" ON public.service_requests;
CREATE POLICY "sr_admin_select"
  ON public.service_requests FOR SELECT
  USING (public.get_my_role() IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "sr_admin_update" ON public.service_requests;
CREATE POLICY "sr_admin_update"
  ON public.service_requests FOR UPDATE
  USING (public.get_my_role() IN ('superadmin', 'admin'));

CREATE TABLE IF NOT EXISTS public.website_partner_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  company_name    text,
  country         text,
  partner_type    text,
  website_url     text,
  annual_revenue  text,
  message         text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wpa_public_insert" ON public.website_partner_applications;
CREATE POLICY "wpa_public_insert"
  ON public.website_partner_applications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "wpa_admin_select" ON public.website_partner_applications;
CREATE POLICY "wpa_admin_select"
  ON public.website_partner_applications FOR SELECT
  USING (public.get_my_role() IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "wpa_admin_update" ON public.website_partner_applications;
CREATE POLICY "wpa_admin_update"
  ON public.website_partner_applications FOR UPDATE
  USING (public.get_my_role() IN ('superadmin', 'admin'));

CREATE TABLE IF NOT EXISTS public.website_agent_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  company_name    text,
  country         text,
  region          text,
  territory       text,
  experience_years text,
  existing_network text,
  message         text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_agent_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waa_public_insert" ON public.website_agent_applications;
CREATE POLICY "waa_public_insert"
  ON public.website_agent_applications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "waa_admin_select" ON public.website_agent_applications;
CREATE POLICY "waa_admin_select"
  ON public.website_agent_applications FOR SELECT
  USING (public.get_my_role() IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "waa_admin_update" ON public.website_agent_applications;
CREATE POLICY "waa_admin_update"
  ON public.website_agent_applications FOR UPDATE
  USING (public.get_my_role() IN ('superadmin', 'admin'));

CREATE TABLE IF NOT EXISTS public.website_project_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  company_name    text,
  country         text,
  project_type    text,
  project_scope   text,
  budget_range    text,
  timeline        text,
  message         text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_project_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wpr_public_insert" ON public.website_project_requests;
CREATE POLICY "wpr_public_insert"
  ON public.website_project_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "wpr_admin_select" ON public.website_project_requests;
CREATE POLICY "wpr_admin_select"
  ON public.website_project_requests FOR SELECT
  USING (public.get_my_role() IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "wpr_admin_update" ON public.website_project_requests;
CREATE POLICY "wpr_admin_update"
  ON public.website_project_requests FOR UPDATE
  USING (public.get_my_role() IN ('superadmin', 'admin'));
