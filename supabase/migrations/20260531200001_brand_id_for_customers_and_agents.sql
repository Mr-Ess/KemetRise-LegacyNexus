-- Add brand_id to customers table so customers can be linked to a brand
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_brand_id ON public.customers(brand_id);

-- Add brand_id to affiliated_agents table
ALTER TABLE public.affiliated_agents
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_affiliated_agents_brand_id ON public.affiliated_agents(brand_id);
