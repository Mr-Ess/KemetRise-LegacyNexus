-- Add missing dedicated columns to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS responsible_person TEXT,
  ADD COLUMN IF NOT EXISTS tasks              TEXT,
  ADD COLUMN IF NOT EXISTS branch_name        TEXT;

-- Backfill from existing JSONB data
UPDATE public.employees SET
  responsible_person = COALESCE(responsible_person, (data->>'responsiblePerson')::TEXT),
  tasks              = COALESCE(tasks,              (data->>'tasks')::TEXT),
  branch_name        = COALESCE(branch_name,        (data->>'branch')::TEXT),
  position           = COALESCE(position,           (data->>'position')::TEXT),
  specialization     = COALESCE(specialization,     (data->>'specialization')::TEXT),
  email              = COALESCE(email,              (data->>'email')::TEXT),
  phone              = COALESCE(phone,              (data->>'phone')::TEXT)
WHERE data IS NOT NULL AND data != '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_employees_responsible ON public.employees(responsible_person);
CREATE INDEX IF NOT EXISTS idx_employees_branch_name ON public.employees(branch_name);
