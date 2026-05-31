-- ============================================================
-- Add dedicated columns to all useEntities tables so every
-- form field is stored as a queryable column, not just JSONB.
-- ============================================================

-- ============ PROJECTS ============
-- (description, start_date, end_date, budget_amount already exist)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS human_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT,
  ADD COLUMN IF NOT EXISTS budget             TEXT,
  ADD COLUMN IF NOT EXISTS team               JSONB   NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.projects SET
  human_count        = COALESCE(human_count,        (data->>'humanCount')::INTEGER, 0),
  ai_count           = COALESCE(ai_count,           (data->>'aiCount')::INTEGER,    0),
  responsible_person = COALESCE(responsible_person, data->>'responsiblePerson'),
  budget             = COALESCE(budget,             data->>'budget'),
  team               = COALESCE(NULLIF(team,'[]'::jsonb), data->'team', '[]'::jsonb),
  description        = COALESCE(description,        data->>'description'),
  start_date         = COALESCE(start_date,         (data->>'startDate')::DATE),
  end_date           = COALESCE(end_date,           (data->>'endDate')::DATE)
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- ============ DIGITAL INHERITANCE ============
ALTER TABLE public.digital_inheritance
  ADD COLUMN IF NOT EXISTS relationship       TEXT,
  ADD COLUMN IF NOT EXISTS email              TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp           TEXT,
  ADD COLUMN IF NOT EXISTS access_level       TEXT,
  ADD COLUMN IF NOT EXISTS assets             TEXT,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS photo_url          TEXT,
  ADD COLUMN IF NOT EXISTS human_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT;

UPDATE public.digital_inheritance SET
  relationship       = COALESCE(relationship,       data->>'relationship'),
  email              = COALESCE(email,              data->>'email'),
  phone              = COALESCE(phone,              data->>'phone'),
  whatsapp           = COALESCE(whatsapp,           data->>'whatsapp'),
  access_level       = COALESCE(access_level,       data->>'accessLevel'),
  assets             = COALESCE(assets,             data->>'assets'),
  notes              = COALESCE(notes,              data->>'notes'),
  photo_url          = COALESCE(photo_url,          data->>'photoUrl'),
  human_count        = COALESCE(human_count,        (data->>'humanCount')::INTEGER, 0),
  ai_count           = COALESCE(ai_count,           (data->>'aiCount')::INTEGER,    0),
  responsible_person = COALESCE(responsible_person, data->>'responsiblePerson')
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- ============ SUCCESS PARTNERS ============
ALTER TABLE public.success_partners
  ADD COLUMN IF NOT EXISTS company            TEXT,
  ADD COLUMN IF NOT EXISTS role               TEXT,
  ADD COLUMN IF NOT EXISTS contribution       TEXT,
  ADD COLUMN IF NOT EXISTS email              TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS human_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT;

UPDATE public.success_partners SET
  company            = COALESCE(company,            data->>'company'),
  role               = COALESCE(role,               data->>'role'),
  contribution       = COALESCE(contribution,       data->>'contribution'),
  email              = COALESCE(email,              data->>'email'),
  phone              = COALESCE(phone,              data->>'phone'),
  human_count        = COALESCE(human_count,        (data->>'humanCount')::INTEGER, 0),
  ai_count           = COALESCE(ai_count,           (data->>'aiCount')::INTEGER,    0),
  responsible_person = COALESCE(responsible_person, data->>'responsiblePerson')
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- ============ AFFILIATES ============
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS code               TEXT,
  ADD COLUMN IF NOT EXISTS commission         TEXT,
  ADD COLUMN IF NOT EXISTS referrals          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS region             TEXT,
  ADD COLUMN IF NOT EXISTS email              TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS human_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT;

UPDATE public.affiliates SET
  code               = COALESCE(code,               data->>'code'),
  commission         = COALESCE(commission,         data->>'commission'),
  referrals          = COALESCE(referrals,          (data->>'referrals')::INTEGER, 0),
  region             = COALESCE(region,             data->>'region'),
  email              = COALESCE(email,              data->>'email'),
  phone              = COALESCE(phone,              data->>'phone'),
  notes              = COALESCE(notes,              data->>'notes'),
  human_count        = COALESCE(human_count,        (data->>'humanCount')::INTEGER, 0),
  ai_count           = COALESCE(ai_count,           (data->>'aiCount')::INTEGER,    0),
  responsible_person = COALESCE(responsible_person, data->>'responsiblePerson')
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- ============ BRANCHES ============
-- (branch_type, address, lat, lng, manager_id already exist)
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS human_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT,
  ADD COLUMN IF NOT EXISTS shifts             JSONB   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_tasks           TEXT;

UPDATE public.branches SET
  human_count        = COALESCE(human_count,        (data->>'humanCount')::INTEGER,  0),
  ai_count           = COALESCE(ai_count,           (data->>'aiCount')::INTEGER,     0),
  responsible_person = COALESCE(responsible_person, data->>'responsiblePerson'),
  shifts             = COALESCE(NULLIF(shifts,'[]'::jsonb), data->'shifts', '[]'::jsonb),
  ai_tasks           = COALESCE(ai_tasks,           data->>'aiTasks'),
  branch_type        = COALESCE(branch_type,        data->>'type', 'Main'),
  address            = COALESCE(address,            data->>'address')
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- ============ LEGENDARY JOURNEY ============
ALTER TABLE public.legendary_journey
  ADD COLUMN IF NOT EXISTS date               TEXT,
  ADD COLUMN IF NOT EXISTS description        TEXT,
  ADD COLUMN IF NOT EXISTS category           TEXT,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT;

UPDATE public.legendary_journey SET
  date               = COALESCE(date,               data->>'date'),
  description        = COALESCE(description,        data->>'description'),
  category           = COALESCE(category,           data->>'category'),
  responsible_person = COALESCE(responsible_person, data->>'responsiblePerson')
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- ============ CUSTOMERS ============
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email              TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS company            TEXT,
  ADD COLUMN IF NOT EXISTS total_orders       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp           TEXT,
  ADD COLUMN IF NOT EXISTS human_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_count           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responsible_person TEXT;

UPDATE public.customers SET
  email              = COALESCE(email,              data->>'email'),
  phone              = COALESCE(phone,              data->>'phone'),
  company            = COALESCE(company,            data->>'company'),
  total_orders       = COALESCE(total_orders,       (data->>'totalOrders')::INTEGER,    0),
  loyalty_points     = COALESCE(loyalty_points,     (data->>'loyaltyPoints')::INTEGER,  0),
  notes              = COALESCE(notes,              data->>'notes'),
  whatsapp           = COALESCE(whatsapp,           data->>'whatsapp'),
  human_count        = COALESCE(human_count,        (data->>'humanCount')::INTEGER, 0),
  ai_count           = COALESCE(ai_count,           (data->>'aiCount')::INTEGER,    0),
  responsible_person = COALESCE(responsible_person, data->>'responsiblePerson')
WHERE data IS NOT NULL AND data != '{}'::jsonb;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_projects_human_count        ON public.projects(human_count);
CREATE INDEX IF NOT EXISTS idx_projects_responsible        ON public.projects(responsible_person);
CREATE INDEX IF NOT EXISTS idx_customers_email             ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone             ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_company           ON public.customers(company);
CREATE INDEX IF NOT EXISTS idx_affiliates_code             ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_region           ON public.affiliates(region);
CREATE INDEX IF NOT EXISTS idx_di_access_level             ON public.digital_inheritance(access_level);
CREATE INDEX IF NOT EXISTS idx_branches_human_count        ON public.branches(human_count);
CREATE INDEX IF NOT EXISTS idx_legendary_journey_date      ON public.legendary_journey(date);
CREATE INDEX IF NOT EXISTS idx_legendary_journey_category  ON public.legendary_journey(category);
