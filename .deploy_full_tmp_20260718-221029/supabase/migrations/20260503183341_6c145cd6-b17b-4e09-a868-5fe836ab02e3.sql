
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_branches_brand ON public.branches(brand_id);
CREATE INDEX IF NOT EXISTS idx_employees_brand ON public.employees(brand_id);
CREATE INDEX IF NOT EXISTS idx_projects_brand ON public.projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_services_brand ON public.services(brand_id);
