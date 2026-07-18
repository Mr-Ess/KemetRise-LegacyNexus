-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE — ADVANCED HR & ATTENDANCE SYSTEM (Horizontal Module)
-- Payroll Automation · QR Attendance · Biometric Integration · Deduction Rules
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── DEDUCTION RULE ENGINE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_deduction_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_name       text        NOT NULL,
  rule_type       text        NOT NULL DEFAULT 'fixed',
                  -- fixed, percentage, bracket, absence_penalty, session_fee
  applies_to      text        NOT NULL DEFAULT 'all', -- all, department, employee_type, individual
  target_ids      uuid[]      DEFAULT '{}',
  amount          numeric(10,4),
  percentage      numeric(5,2),
  bracket_table   jsonb       DEFAULT '[]',  -- [{min, max, rate}]
  trigger_event   text,        -- monthly, per_absence, per_late_minute, per_missed_session
  max_deduction   numeric(10,4),
  is_active       boolean     DEFAULT true,
  description     text,
  created_at      timestamptz DEFAULT now()
);

-- ─── ATTENDANCE QR TOKENS ─────────────────────────────────────────────────
-- Each employee has a rotating encrypted QR code for attendance scanning
CREATE TABLE IF NOT EXISTS public.hr_qr_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id uuid        NOT NULL,
  user_id     uuid        REFERENCES auth.users(id),
  token_hash  text        NOT NULL,  -- bcrypt hash of the QR payload
  payload     text        NOT NULL,  -- encrypted payload for QR generation
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_used     boolean     DEFAULT false,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (tenant_id, employee_id, token_hash)
);

-- ─── ATTENDANCE EVENTS (QR + Biometric) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_attendance_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code     text        NOT NULL DEFAULT 'CMP-01',
  employee_id     uuid        NOT NULL,
  user_id         uuid        REFERENCES auth.users(id),
  event_date      date        NOT NULL DEFAULT CURRENT_DATE,
  event_type      text        NOT NULL, -- check_in, check_out, break_start, break_end
  scan_method     text        NOT NULL DEFAULT 'qr', -- qr, fingerprint, facial, rfid, manual
  scan_timestamp  timestamptz NOT NULL DEFAULT now(),
  location_lat    numeric(10,7),
  location_lng    numeric(10,7),
  device_id       text,        -- Biometric device identifier
  qr_token_id     uuid        REFERENCES public.hr_qr_tokens(id),
  is_valid        boolean     DEFAULT true,
  override_reason text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ─── DAILY ATTENDANCE SUMMARY ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_attendance_summary (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id       uuid        NOT NULL,
  summary_date      date        NOT NULL,
  status            text        NOT NULL DEFAULT 'present',
                    -- present, absent, late, half_day, on_leave, holiday, remote
  check_in          timestamptz,
  check_out         timestamptz,
  work_minutes      int         DEFAULT 0,
  overtime_minutes  int         DEFAULT 0,
  late_minutes      int         DEFAULT 0,
  early_leave_mins  int         DEFAULT 0,
  break_minutes     int         DEFAULT 0,
  deduction_amount  numeric(10,4) DEFAULT 0,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (tenant_id, employee_id, summary_date)
);

-- ─── BIOMETRIC DEVICE INTEGRATION ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_biometric_devices (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_name  text        NOT NULL,
  device_type  text        NOT NULL DEFAULT 'fingerprint', -- fingerprint, facial, iris, rfid
  device_serial text,
  ip_address   text,
  location     text,
  api_endpoint text,        -- Device's HTTP API for polling events
  api_key_enc  text,        -- Encrypted API key
  webhook_url  text,        -- Our endpoint to receive device pushes
  is_active    boolean     DEFAULT true,
  last_sync_at timestamptz,
  sync_status  text        DEFAULT 'idle', -- idle, syncing, error
  created_at   timestamptz DEFAULT now()
);

-- ─── BIOMETRIC RAW EVENTS (from device push) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_biometric_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_id       uuid        REFERENCES public.hr_biometric_devices(id),
  device_serial   text,
  employee_ref    text        NOT NULL,  -- Device-side employee ID / fingerprint ID
  employee_id     uuid,        -- Mapped to our employee record
  event_type      text        NOT NULL,  -- check_in, check_out
  raw_timestamp   timestamptz NOT NULL,
  raw_payload     jsonb       DEFAULT '{}',
  processed       boolean     DEFAULT false,
  processed_at    timestamptz,
  mapping_status  text        DEFAULT 'pending', -- pending, mapped, unmatched
  created_at      timestamptz DEFAULT now()
);

-- ─── ENHANCED PAYROLL CYCLES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_payroll_cycles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cycle_name      text        NOT NULL,  -- e.g. "June 2026"
  pay_period_start date       NOT NULL,
  pay_period_end  date        NOT NULL,
  pay_date        date        NOT NULL,
  status          text        NOT NULL DEFAULT 'draft',
                  -- draft, processing, approved, paid, cancelled
  total_gross     numeric(15,4) DEFAULT 0,
  total_deductions numeric(15,4) DEFAULT 0,
  total_net       numeric(15,4) DEFAULT 0,
  processed_by    uuid        REFERENCES auth.users(id),
  processed_at    timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ─── PAYROLL ENTRIES (per employee per cycle) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_payroll_entries (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cycle_id             uuid        NOT NULL REFERENCES public.hr_payroll_cycles(id) ON DELETE CASCADE,
  employee_id          uuid        NOT NULL,
  base_salary          numeric(12,4) DEFAULT 0,
  hourly_rate          numeric(10,4),
  hours_worked         numeric(8,2)  DEFAULT 0,
  overtime_hours       numeric(8,2)  DEFAULT 0,
  overtime_rate_mult   numeric(4,2)  DEFAULT 1.5,
  gross_pay            numeric(12,4) DEFAULT 0,
  -- Deductions breakdown
  tax_deduction        numeric(12,4) DEFAULT 0,
  social_insurance     numeric(12,4) DEFAULT 0,
  absence_deduction    numeric(12,4) DEFAULT 0,
  late_deduction       numeric(12,4) DEFAULT 0,
  session_deduction    numeric(12,4) DEFAULT 0,  -- Education sector
  other_deductions     numeric(12,4) DEFAULT 0,
  total_deductions     numeric(12,4) DEFAULT 0,
  -- Additions
  bonuses              numeric(12,4) DEFAULT 0,
  commissions          numeric(12,4) DEFAULT 0,
  allowances           numeric(12,4) DEFAULT 0,
  total_additions      numeric(12,4) DEFAULT 0,
  net_pay              numeric(12,4) DEFAULT 0,
  -- Attendance stats for this cycle
  days_present         int           DEFAULT 0,
  days_absent          int           DEFAULT 0,
  days_late            int           DEFAULT 0,
  overtime_minutes     int           DEFAULT 0,
  payment_method       text          DEFAULT 'bank_transfer',
  payment_ref          text,
  status               text          DEFAULT 'pending', -- pending, approved, paid
  paid_at              timestamptz,
  notes                text,
  deduction_breakdown  jsonb         DEFAULT '[]',  -- [{rule_id, name, amount}]
  created_at           timestamptz   DEFAULT now()
);

-- ─── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hr_qr_tokens_employee        ON public.hr_qr_tokens(tenant_id, employee_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_events_date    ON public.hr_attendance_events(tenant_id, event_date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_events_emp     ON public.hr_attendance_events(employee_id, event_date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_summary_date   ON public.hr_attendance_summary(tenant_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_hr_biometric_events_proc     ON public.hr_biometric_events(tenant_id, processed, created_at);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_entries_cycle     ON public.hr_payroll_entries(cycle_id);
CREATE INDEX IF NOT EXISTS idx_hr_payroll_entries_employee  ON public.hr_payroll_entries(employee_id, tenant_id);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
ALTER TABLE public.hr_deduction_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_qr_tokens            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_summary   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_biometric_devices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_biometric_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_cycles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_entries      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_deduction_rules_all" ON public.hr_deduction_rules;
CREATE POLICY "hr_deduction_rules_all"   ON public.hr_deduction_rules   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_qr_tokens_all" ON public.hr_qr_tokens;
CREATE POLICY "hr_qr_tokens_all"         ON public.hr_qr_tokens         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_attendance_events_all" ON public.hr_attendance_events;
CREATE POLICY "hr_attendance_events_all" ON public.hr_attendance_events  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_attendance_summary_all" ON public.hr_attendance_summary;
CREATE POLICY "hr_attendance_summary_all" ON public.hr_attendance_summary FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_biometric_devices_all" ON public.hr_biometric_devices;
CREATE POLICY "hr_biometric_devices_all" ON public.hr_biometric_devices  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_biometric_events_all" ON public.hr_biometric_events;
CREATE POLICY "hr_biometric_events_all"  ON public.hr_biometric_events   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_payroll_cycles_all" ON public.hr_payroll_cycles;
CREATE POLICY "hr_payroll_cycles_all"    ON public.hr_payroll_cycles     FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "hr_payroll_entries_all" ON public.hr_payroll_entries;
CREATE POLICY "hr_payroll_entries_all"   ON public.hr_payroll_entries    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ─── FUNCTION: Generate encrypted QR token ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_generate_qr_token(
  p_tenant_id   uuid,
  p_employee_id uuid,
  p_user_id     uuid DEFAULT NULL
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_payload  text;
  v_hash     text;
  v_token_id uuid;
BEGIN
  -- Expire previous tokens for this employee
  UPDATE public.hr_qr_tokens
  SET is_used = true
  WHERE tenant_id = p_tenant_id
    AND employee_id = p_employee_id
    AND is_used = false
    AND expires_at > now();

  -- Build payload: tenant:employee:timestamp:nonce
  v_payload := encode(
    convert_to(
      p_tenant_id::text || ':' || p_employee_id::text || ':' || extract(epoch from now())::text || ':' || gen_random_uuid()::text,
      'UTF8'
    ),
    'base64'
  );
  v_hash := encode(sha256(convert_to(v_payload, 'UTF8')), 'hex');

  INSERT INTO public.hr_qr_tokens (tenant_id, employee_id, user_id, token_hash, payload, expires_at)
  VALUES (p_tenant_id, p_employee_id, p_user_id, v_hash, v_payload, now() + interval '24 hours')
  RETURNING id INTO v_token_id;

  RETURN v_payload;
END;
$$;

-- ─── FUNCTION: Process QR scan attendance ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_process_qr_scan(
  p_tenant_id   uuid,
  p_qr_payload  text,
  p_event_type  text DEFAULT 'check_in'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token       record;
  v_event_id    uuid;
BEGIN
  -- Validate QR token
  SELECT * INTO v_token
  FROM public.hr_qr_tokens
  WHERE tenant_id = p_tenant_id
    AND payload = p_qr_payload
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_expired_token');
  END IF;

  -- Record attendance event
  INSERT INTO public.hr_attendance_events
    (tenant_id, employee_id, user_id, event_type, scan_method, qr_token_id)
  VALUES
    (p_tenant_id, v_token.employee_id, v_token.user_id, p_event_type, 'qr', v_token.id)
  RETURNING id INTO v_event_id;

  -- Mark token as used if check_out (one scan per day per direction)
  IF p_event_type = 'check_out' THEN
    UPDATE public.hr_qr_tokens SET is_used = true WHERE id = v_token.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_event_id,
    'employee_id', v_token.employee_id,
    'event_type', p_event_type,
    'timestamp', now()
  );
END;
$$;

-- ─── FUNCTION: Auto-calculate payroll entry deductions ────────────────────
CREATE OR REPLACE FUNCTION public.fn_calculate_payroll_entry()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_deductions := COALESCE(NEW.tax_deduction, 0)
                        + COALESCE(NEW.social_insurance, 0)
                        + COALESCE(NEW.absence_deduction, 0)
                        + COALESCE(NEW.late_deduction, 0)
                        + COALESCE(NEW.session_deduction, 0)
                        + COALESCE(NEW.other_deductions, 0);

  NEW.total_additions := COALESCE(NEW.bonuses, 0)
                       + COALESCE(NEW.commissions, 0)
                       + COALESCE(NEW.allowances, 0);

  NEW.gross_pay := COALESCE(NEW.base_salary, 0)
                 + COALESCE(NEW.total_additions, 0);

  NEW.net_pay := GREATEST(0, NEW.gross_pay - NEW.total_deductions);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_calculate_payroll_entry
  BEFORE INSERT OR UPDATE ON public.hr_payroll_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_calculate_payroll_entry();
