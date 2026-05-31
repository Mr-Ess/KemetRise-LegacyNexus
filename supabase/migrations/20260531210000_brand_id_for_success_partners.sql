-- Add brand_id to success_partners so every partner can be linked to a brand
ALTER TABLE public.success_partners
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_success_partners_brand_id ON public.success_partners(brand_id);
