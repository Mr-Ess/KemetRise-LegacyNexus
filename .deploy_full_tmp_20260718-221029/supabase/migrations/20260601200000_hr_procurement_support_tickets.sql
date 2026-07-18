-- ═══════════════════════════════════════════════════════════════════════════
-- HR & WORKFORCE TABLES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hr_employees (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id         uuid,
  full_name        text        NOT NULL,
  job_title        text,
  department       text,
  hire_date        date,
  salary           numeric(12,2),
  employment_type  text        DEFAULT 'full-time',
  email            text,
  phone            text,
  status           text        DEFAULT 'active',
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_attendance (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id     uuid,
  employee_id  uuid,
  date         date        NOT NULL,
  check_in     text,
  check_out    text,
  status       text        DEFAULT 'present',
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id     uuid,
  employee_id  uuid,
  leave_type   text,
  start_date   date,
  end_date     date,
  reason       text,
  status       text        DEFAULT 'pending',
  approved_by  text,
  approved_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_payroll (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id     uuid,
  employee_id  uuid,
  month_year   text        NOT NULL,
  base_salary  numeric(12,2),
  bonuses      numeric(12,2) DEFAULT 0,
  deductions   numeric(12,2) DEFAULT 0,
  net_pay      numeric(12,2),
  status       text        DEFAULT 'pending',
  paid_at      timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_performance (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id       uuid,
  employee_id    uuid,
  review_period  text        NOT NULL,
  score          numeric(4,1),
  strengths      text,
  improvements   text,
  reviewer       text,
  created_at     timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PROCUREMENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id       uuid,
  po_number      text,
  vendor_name    text,
  vendor_id      uuid,
  order_date     date,
  delivery_date  date,
  total_amount   numeric(14,2),
  status         text        DEFAULT 'draft',
  notes          text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_contracts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id        uuid,
  vendor_name     text        NOT NULL,
  contract_value  numeric(14,2),
  start_date      date,
  end_date        date,
  payment_terms   text,
  status          text        DEFAULT 'pending',
  notes           text,
  file_url        text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rfq_requests (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id           uuid,
  item_description   text        NOT NULL,
  quantity           numeric(10,2),
  deadline           date,
  preferred_vendor   text,
  budget_limit       numeric(14,2),
  status             text        DEFAULT 'open',
  notes              text,
  created_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.procurement_budget (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id          uuid,
  department        text        NOT NULL,
  fiscal_year       text        NOT NULL,
  allocated_budget  numeric(14,2),
  spent_amount      numeric(14,2) DEFAULT 0,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SUPPORT TICKETS & REPLIES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text        NOT NULL,
  category     text        DEFAULT 'General',
  priority     text        DEFAULT 'medium',
  status       text        DEFAULT 'open',
  assigned_to  text,
  resolution   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid        REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  message    text        NOT NULL,
  is_staff   boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.hr_employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_performance       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contracts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_budget   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies       ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- HR
CREATE POLICY "hr_employees_owner"      ON public.hr_employees      FOR ALL USING (user_id = auth.uid());
CREATE POLICY "hr_attendance_owner"     ON public.hr_attendance     FOR ALL USING (user_id = auth.uid());
CREATE POLICY "hr_leave_owner"          ON public.hr_leave_requests FOR ALL USING (user_id = auth.uid());
CREATE POLICY "hr_payroll_owner"        ON public.hr_payroll        FOR ALL USING (user_id = auth.uid());
CREATE POLICY "hr_performance_owner"    ON public.hr_performance    FOR ALL USING (user_id = auth.uid());

-- Procurement
CREATE POLICY "purchase_orders_owner"   ON public.purchase_orders   FOR ALL USING (user_id = auth.uid());
CREATE POLICY "vendor_contracts_owner"  ON public.vendor_contracts  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "rfq_requests_owner"      ON public.rfq_requests      FOR ALL USING (user_id = auth.uid());
CREATE POLICY "procurement_budget_owner" ON public.procurement_budget FOR ALL USING (user_id = auth.uid());

-- Support tickets: owner sees all replies to their tickets
CREATE POLICY "support_tickets_owner"   ON public.support_tickets   FOR ALL USING (user_id = auth.uid());
CREATE POLICY "ticket_replies_owner"    ON public.ticket_replies    FOR ALL USING (
  ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_hr_employees_user_id       ON public.hr_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_user_id      ON public.hr_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_date         ON public.hr_attendance(date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_employee_id  ON public.hr_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_user_id           ON public.hr_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_status            ON public.hr_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_leave_employee_id       ON public.hr_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_user_id         ON public.hr_payroll(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_month           ON public.hr_payroll(month_year);
CREATE INDEX IF NOT EXISTS idx_hr_performance_user_id     ON public.hr_performance(user_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id    ON public.purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_user_id   ON public.vendor_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_user_id       ON public.rfq_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_procurement_budget_user_id ON public.procurement_budget(user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id    ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status     ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id   ON public.ticket_replies(ticket_id);
