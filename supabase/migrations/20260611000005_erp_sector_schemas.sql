-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE — VERTICAL SECTOR EXTRACTION LAYERS
-- EDU-01 · MED-01 · SPT-01 · LEG-01 · TUR-01 · CMP-01
-- Dynamically loaded based on tenant.sector_code
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- [EDU-01] EDUCATION & COURSES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.edu_instructors (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       uuid        REFERENCES auth.users(id),
  employee_id   uuid,
  full_name     text        NOT NULL,
  specialization text,
  bio           text,
  hourly_rate   numeric(10,4) DEFAULT 0,
  rating        numeric(3,2) DEFAULT 0,
  is_active     boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_courses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  instructor_id   uuid        REFERENCES public.edu_instructors(id),
  title           text        NOT NULL,
  code            text        NOT NULL,
  description     text,
  category        text,
  level           text        DEFAULT 'beginner', -- beginner, intermediate, advanced
  duration_hours  numeric(6,2) DEFAULT 0,
  sessions_count  int         DEFAULT 0,
  price           numeric(10,4) DEFAULT 0,
  currency        text        DEFAULT 'USD',
  max_students    int         DEFAULT 30,
  is_active       boolean     DEFAULT true,
  materials_url   text,
  syllabus        jsonb       DEFAULT '[]',
  created_at      timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.edu_class_schedules (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id     uuid        NOT NULL REFERENCES public.edu_courses(id) ON DELETE CASCADE,
  instructor_id uuid        REFERENCES public.edu_instructors(id),
  session_date  date        NOT NULL,
  start_time    time        NOT NULL,
  end_time      time        NOT NULL,
  room          text,
  online_url    text,
  session_type  text        DEFAULT 'in_person', -- in_person, online, hybrid
  status        text        DEFAULT 'scheduled', -- scheduled, completed, cancelled
  notes         text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_enrollments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id       uuid        NOT NULL REFERENCES public.edu_courses(id),
  student_name    text        NOT NULL,
  student_email   text,
  student_phone   text,
  customer_id     uuid,
  enrollment_date date        NOT NULL DEFAULT CURRENT_DATE,
  status          text        DEFAULT 'active', -- active, completed, suspended, refunded
  -- Subscription balance deduction model
  balance_sessions int        DEFAULT 0,   -- Prepaid session credits
  sessions_used    int        DEFAULT 0,
  session_fee      numeric(10,4) DEFAULT 0, -- Fee deducted per session attended
  total_paid       numeric(10,4) DEFAULT 0,
  total_deducted   numeric(10,4) DEFAULT 0,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.edu_session_attendance (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  schedule_id    uuid        NOT NULL REFERENCES public.edu_class_schedules(id),
  enrollment_id  uuid        NOT NULL REFERENCES public.edu_enrollments(id),
  attended       boolean     DEFAULT false,
  check_in_time  timestamptz,
  fee_deducted   numeric(10,4) DEFAULT 0,
  balance_before int,
  balance_after  int,
  notes          text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (schedule_id, enrollment_id)
);

-- Auto-deduct session fee on attendance
CREATE OR REPLACE FUNCTION public.fn_edu_deduct_session_fee()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_enrollment record;
BEGIN
  IF NEW.attended = true AND (OLD.attended = false OR OLD.attended IS NULL) THEN
    SELECT * INTO v_enrollment FROM public.edu_enrollments WHERE id = NEW.enrollment_id;

    IF v_enrollment.balance_sessions > 0 THEN
      NEW.fee_deducted   := v_enrollment.session_fee;
      NEW.balance_before := v_enrollment.balance_sessions;
      NEW.balance_after  := v_enrollment.balance_sessions - 1;

      UPDATE public.edu_enrollments
      SET balance_sessions = balance_sessions - 1,
          sessions_used    = sessions_used + 1,
          total_deducted   = total_deducted + v_enrollment.session_fee
      WHERE id = NEW.enrollment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_edu_deduct_session_fee
  BEFORE INSERT OR UPDATE OF attended ON public.edu_session_attendance
  FOR EACH ROW EXECUTE FUNCTION public.fn_edu_deduct_session_fee();

-- ═══════════════════════════════════════════════════════════════════════════
-- [MED-01] MEDICAL & HEALTHCARE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.med_patients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_number   text        NOT NULL,
  full_name        text        NOT NULL,
  date_of_birth    date,
  gender           text        CHECK (gender IN ('male','female','other','unknown')),
  blood_type       text,
  national_id      text,
  insurance_id     text,
  insurance_provider text,
  phone            text,
  email            text,
  address          jsonb       DEFAULT '{}',
  emergency_contact jsonb      DEFAULT '{}',
  allergies        text[]      DEFAULT '{}',
  chronic_conditions text[]    DEFAULT '{}',
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, patient_number)
);

CREATE TABLE IF NOT EXISTS public.med_doctors (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id    uuid,
  full_name      text        NOT NULL,
  specialization text        NOT NULL,
  license_number text,
  consultation_fee numeric(10,4) DEFAULT 0,
  currency       text        DEFAULT 'USD',
  schedule       jsonb       DEFAULT '{}',  -- weekly availability
  is_active      boolean     DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_appointments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id     uuid        NOT NULL REFERENCES public.med_patients(id),
  doctor_id      uuid        REFERENCES public.med_doctors(id),
  appointment_date date      NOT NULL,
  start_time     time        NOT NULL,
  end_time       time,
  appointment_type text      DEFAULT 'consultation', -- consultation, follow_up, procedure, emergency
  status         text        DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
  chief_complaint text,
  notes          text,
  fee            numeric(10,4) DEFAULT 0,
  is_billed      boolean     DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_ehr_records (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id        uuid        NOT NULL REFERENCES public.med_patients(id),
  appointment_id    uuid        REFERENCES public.med_appointments(id),
  doctor_id         uuid        REFERENCES public.med_doctors(id),
  visit_date        date        NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint   text,
  diagnosis         text,
  icd_codes         text[]      DEFAULT '{}',
  treatment_plan    text,
  clinical_notes    text,
  vital_signs       jsonb       DEFAULT '{}',  -- {bp, pulse, temp, weight, height, spo2}
  lab_results       jsonb       DEFAULT '{}',
  imaging_refs      text[]      DEFAULT '{}',
  follow_up_date    date,
  is_confidential   boolean     DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_prescriptions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id       uuid        NOT NULL REFERENCES public.med_patients(id),
  ehr_id           uuid        REFERENCES public.med_ehr_records(id),
  doctor_id        uuid        REFERENCES public.med_doctors(id),
  prescription_date date       NOT NULL DEFAULT CURRENT_DATE,
  medications      jsonb       NOT NULL DEFAULT '[]',
                   -- [{name, dosage, frequency, duration, instructions}]
  notes            text,
  is_dispensed     boolean     DEFAULT false,
  dispensed_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.med_billing_categories (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  code         text        NOT NULL,
  category     text        DEFAULT 'consultation', -- consultation, lab, imaging, procedure, medication, room
  default_price numeric(10,4) DEFAULT 0,
  currency     text        DEFAULT 'USD',
  insurance_code text,
  is_active    boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- [SPT-01] SPORTS & GYMS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.spt_membership_plans (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_name      text        NOT NULL,
  plan_code      text        NOT NULL,
  duration_days  int         NOT NULL DEFAULT 30,
  price          numeric(10,4) NOT NULL,
  currency       text        DEFAULT 'USD',
  access_zones   text[]      DEFAULT '{}',  -- gym, pool, sauna, classes, etc.
  sessions_included int      DEFAULT -1,   -- -1 = unlimited
  freeze_days_allowed int    DEFAULT 0,
  is_active      boolean     DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (tenant_id, plan_code)
);

CREATE TABLE IF NOT EXISTS public.spt_members (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_number    text        NOT NULL,
  full_name        text        NOT NULL,
  email            text,
  phone            text,
  date_of_birth    date,
  gender           text,
  photo_url        text,
  rfid_card        text,        -- RFID card number for access gate
  emergency_contact jsonb      DEFAULT '{}',
  customer_id      uuid,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, member_number)
);

CREATE TABLE IF NOT EXISTS public.spt_subscriptions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id         uuid        NOT NULL REFERENCES public.spt_members(id),
  plan_id           uuid        NOT NULL REFERENCES public.spt_membership_plans(id),
  start_date        date        NOT NULL DEFAULT CURRENT_DATE,
  end_date          date        NOT NULL,
  status            text        DEFAULT 'active', -- active, expired, frozen, cancelled
  sessions_used     int         DEFAULT 0,
  freeze_days_used  int         DEFAULT 0,
  freeze_until      date,
  amount_paid       numeric(10,4) DEFAULT 0,
  trainer_id        uuid,
  invoice_id        uuid        REFERENCES public.fin_invoices(id),
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spt_trainers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id    uuid,
  full_name      text        NOT NULL,
  specialization text,
  hourly_rate    numeric(10,4) DEFAULT 0,
  assigned_members_count int DEFAULT 0,
  certifications text[]      DEFAULT '{}',
  is_active      boolean     DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spt_access_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id      uuid        REFERENCES public.spt_members(id),
  gate_id        text,
  access_type    text        DEFAULT 'entry', -- entry, exit
  access_method  text        DEFAULT 'rfid',  -- rfid, qr, facial, manual
  access_time    timestamptz NOT NULL DEFAULT now(),
  was_granted    boolean     DEFAULT true,
  denial_reason  text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spt_session_bookings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id      uuid        NOT NULL REFERENCES public.spt_members(id),
  trainer_id     uuid        REFERENCES public.spt_trainers(id),
  session_date   date        NOT NULL,
  start_time     time        NOT NULL,
  end_time       time,
  session_type   text        DEFAULT 'personal', -- personal, group, class
  status         text        DEFAULT 'booked', -- booked, completed, cancelled, no_show
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- [LEG-01] LEGAL SERVICES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.leg_cases (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_number      text        NOT NULL,
  title            text        NOT NULL,
  case_type        text,        -- civil, criminal, commercial, family, labour, administrative
  client_id        uuid,
  client_name      text,
  opposing_party   text,
  court_name       text,
  judge_name       text,
  assigned_lawyer_id uuid,
  open_date        date        NOT NULL DEFAULT CURRENT_DATE,
  close_date       date,
  status           text        DEFAULT 'open', -- open, pending, closed, won, lost, settled, dropped
  priority         text        DEFAULT 'normal', -- low, normal, high, urgent
  description      text,
  outcome          text,
  retention_contract_id uuid,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, case_number)
);

CREATE TABLE IF NOT EXISTS public.leg_documents (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id        uuid        REFERENCES public.leg_cases(id),
  title          text        NOT NULL,
  doc_type       text        DEFAULT 'pleading', -- pleading, evidence, contract, court_order, correspondence, template
  file_url       text,
  file_hash      text,        -- SHA-256 for tamper evidence
  version        int         DEFAULT 1,
  is_confidential boolean    DEFAULT false,
  filed_date     date,
  expiry_date    date,
  tags           text[]      DEFAULT '{}',
  uploaded_by    uuid        REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_lawyers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id      uuid,
  full_name        text        NOT NULL,
  bar_number       text,
  specializations  text[]      DEFAULT '{}',
  hourly_rate      numeric(10,4) DEFAULT 0,
  court_rate       numeric(10,4) DEFAULT 0,   -- Per court session fee
  currency         text        DEFAULT 'USD',
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_appointments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id         uuid        REFERENCES public.leg_cases(id),
  lawyer_id       uuid        REFERENCES public.leg_lawyers(id),
  client_id       uuid,
  appt_date       date        NOT NULL,
  start_time      time        NOT NULL,
  appt_type       text        DEFAULT 'client_meeting', -- client_meeting, court_hearing, deposition
  status          text        DEFAULT 'scheduled',
  location        text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_contracts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id         uuid        REFERENCES public.leg_cases(id),
  client_id       uuid,
  client_name     text,
  contract_type   text        DEFAULT 'retainer', -- retainer, contingency, fixed_fee, hourly
  start_date      date        NOT NULL DEFAULT CURRENT_DATE,
  end_date        date,
  retainer_amount numeric(12,4) DEFAULT 0,
  hourly_rate     numeric(10,4) DEFAULT 0,
  currency        text        DEFAULT 'USD',
  status          text        DEFAULT 'active',
  terms           text,
  signed_at       timestamptz,
  file_url        text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leg_billing_timesheets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  case_id        uuid        REFERENCES public.leg_cases(id),
  lawyer_id      uuid        REFERENCES public.leg_lawyers(id),
  entry_date     date        NOT NULL DEFAULT CURRENT_DATE,
  entry_type     text        NOT NULL DEFAULT 'hourly', -- hourly, court_session, flat
  hours          numeric(6,2),
  rate           numeric(10,4),
  court_sessions int         DEFAULT 0,
  court_rate     numeric(10,4),
  amount         numeric(12,4) NOT NULL DEFAULT 0,
  currency       text        DEFAULT 'USD',
  description    text,
  is_billed      boolean     DEFAULT false,
  invoice_id     uuid        REFERENCES public.fin_invoices(id),
  created_at     timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- [TUR-01] TOURISM & TRAVEL
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tur_destinations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  country_code text,
  region       text,
  description  text,
  images       jsonb       DEFAULT '[]',
  is_active    boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tur_trips (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trip_code         text        NOT NULL,
  title             text        NOT NULL,
  destination_id    uuid        REFERENCES public.tur_destinations(id),
  trip_type         text        DEFAULT 'group', -- group, private, corporate, hajj_umrah
  departure_date    date        NOT NULL,
  return_date       date        NOT NULL,
  departure_airport text,
  price_per_person  numeric(10,4) NOT NULL,
  currency          text        DEFAULT 'USD',
  max_capacity      int         DEFAULT 20,
  booked_count      int         DEFAULT 0,
  includes          jsonb       DEFAULT '[]',  -- ['flight','hotel','visa','transport']
  excludes          jsonb       DEFAULT '[]',
  itinerary         jsonb       DEFAULT '[]',
  status            text        DEFAULT 'active', -- active, full, completed, cancelled
  created_at        timestamptz DEFAULT now(),
  UNIQUE (tenant_id, trip_code)
);

CREATE TABLE IF NOT EXISTS public.tur_hotel_allotments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hotel_name        text        NOT NULL,
  destination_id    uuid        REFERENCES public.tur_destinations(id),
  room_type         text        NOT NULL, -- single, double, triple, suite
  total_rooms       int         NOT NULL DEFAULT 0,
  available_rooms   int         NOT NULL DEFAULT 0,
  cost_per_night    numeric(10,4) DEFAULT 0,
  sell_price        numeric(10,4) DEFAULT 0,
  currency          text        DEFAULT 'USD',
  check_in_date     date,
  check_out_date    date,
  contract_ref      text,
  is_active         boolean     DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tur_bookings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_number   text        NOT NULL,
  trip_id          uuid        REFERENCES public.tur_trips(id),
  customer_id      uuid,
  customer_name    text        NOT NULL,
  customer_email   text,
  customer_phone   text,
  passenger_count  int         NOT NULL DEFAULT 1,
  passengers       jsonb       DEFAULT '[]',  -- [{name, passport, dob, nationality}]
  hotel_id         uuid        REFERENCES public.tur_hotel_allotments(id),
  room_count       int         DEFAULT 1,
  total_amount     numeric(14,4) NOT NULL,
  paid_amount      numeric(14,4) DEFAULT 0,
  currency         text        DEFAULT 'USD',
  agent_id         uuid,        -- External agent / affiliate
  commission_rate  numeric(5,2) DEFAULT 0,
  commission_amount numeric(12,4) DEFAULT 0,
  status           text        DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  visa_status      text        DEFAULT 'not_required',
  notes            text,
  invoice_id       uuid        REFERENCES public.fin_invoices(id),
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, booking_number)
);

CREATE TABLE IF NOT EXISTS public.tur_agent_commissions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id     uuid        NOT NULL REFERENCES public.tur_bookings(id),
  agent_id       uuid,
  agent_name     text,
  booking_amount numeric(12,4) NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(12,4) NOT NULL,
  currency       text        DEFAULT 'USD',
  status         text        DEFAULT 'pending', -- pending, approved, paid
  paid_at        timestamptz,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- [CMP-01] COMPANIES & PROFESSIONAL SERVICES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cmp_projects (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_code     text        NOT NULL,
  title            text        NOT NULL,
  client_id        uuid,
  client_name      text,
  project_manager_id uuid,
  start_date       date,
  end_date         date,
  status           text        DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  priority         text        DEFAULT 'normal',
  budget           numeric(14,4) DEFAULT 0,
  currency         text        DEFAULT 'USD',
  spent_amount     numeric(14,4) DEFAULT 0,
  completion_pct   numeric(5,2) DEFAULT 0,
  description      text,
  tags             text[]      DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, project_code)
);

CREATE TABLE IF NOT EXISTS public.cmp_milestones (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id     uuid        NOT NULL REFERENCES public.cmp_projects(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text,
  due_date       date,
  completion_date date,
  status         text        DEFAULT 'pending', -- pending, in_progress, completed, delayed, cancelled
  payment_amount numeric(12,4) DEFAULT 0,   -- Milestone-based billing amount
  is_billed      boolean     DEFAULT false,
  invoice_id     uuid        REFERENCES public.fin_invoices(id),
  sort_order     int         DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cmp_service_tickets (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ticket_number    text        NOT NULL,
  project_id       uuid        REFERENCES public.cmp_projects(id),
  client_id        uuid,
  client_name      text,
  subject          text        NOT NULL,
  description      text,
  ticket_type      text        DEFAULT 'support', -- support, bug, feature, inquiry, change_request
  priority         text        DEFAULT 'normal', -- low, normal, high, urgent, critical
  status           text        DEFAULT 'open', -- open, in_progress, pending_client, resolved, closed
  assigned_to      uuid        REFERENCES auth.users(id),
  sla_policy_id    uuid,
  sla_due_at       timestamptz,
  sla_breached     boolean     DEFAULT false,
  first_response_at timestamptz,
  resolved_at      timestamptz,
  closed_at        timestamptz,
  tags             text[]      DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, ticket_number)
);

CREATE TABLE IF NOT EXISTS public.cmp_sla_policies (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  policy_name           text        NOT NULL,
  priority_level        text        NOT NULL, -- low, normal, high, urgent, critical
  first_response_hours  numeric(6,2) NOT NULL DEFAULT 4,
  resolution_hours      numeric(6,2) NOT NULL DEFAULT 24,
  escalation_hours      numeric(6,2),
  business_hours_only   boolean     DEFAULT true,
  notification_emails   text[]      DEFAULT '{}',
  is_active             boolean     DEFAULT true,
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cmp_timesheets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id     uuid        REFERENCES public.cmp_projects(id),
  ticket_id      uuid        REFERENCES public.cmp_service_tickets(id),
  employee_id    uuid,
  user_id        uuid        REFERENCES auth.users(id),
  entry_date     date        NOT NULL DEFAULT CURRENT_DATE,
  start_time     time,
  end_time       time,
  hours          numeric(6,2) NOT NULL DEFAULT 0,
  hourly_rate    numeric(10,4) DEFAULT 0,
  billable_amount numeric(12,4) DEFAULT 0,
  is_billable    boolean     DEFAULT true,
  description    text,
  status         text        DEFAULT 'pending', -- pending, approved, rejected, billed
  approved_by    uuid        REFERENCES auth.users(id),
  approved_at    timestamptz,
  invoice_id     uuid        REFERENCES public.fin_invoices(id),
  created_at     timestamptz DEFAULT now()
);

-- ─── BULK RLS FOR ALL SECTOR TABLES ──────────────────────────────────────
ALTER TABLE public.edu_instructors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_class_schedules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_session_attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_doctors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_ehr_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_prescriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.med_billing_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_membership_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_trainers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_access_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spt_session_bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_cases                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_lawyers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_contracts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leg_billing_timesheets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_destinations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_trips                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_hotel_allotments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tur_agent_commissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_milestones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_service_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_sla_policies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_timesheets           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edu_instructors_all"        ON public.edu_instructors        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_courses_all"            ON public.edu_courses            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_class_schedules_all"    ON public.edu_class_schedules    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_enrollments_all"        ON public.edu_enrollments        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "edu_session_attendance_all" ON public.edu_session_attendance FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_patients_all"           ON public.med_patients           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_doctors_all"            ON public.med_doctors            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_appointments_all"       ON public.med_appointments       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_ehr_records_all"        ON public.med_ehr_records        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_prescriptions_all"      ON public.med_prescriptions      FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "med_billing_categories_all" ON public.med_billing_categories FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_membership_plans_all"   ON public.spt_membership_plans   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_members_all"            ON public.spt_members            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_subscriptions_all"      ON public.spt_subscriptions      FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_trainers_all"           ON public.spt_trainers           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_access_logs_all"        ON public.spt_access_logs        FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "spt_session_bookings_all"   ON public.spt_session_bookings   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_cases_all"              ON public.leg_cases              FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_documents_all"          ON public.leg_documents          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_lawyers_all"            ON public.leg_lawyers            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_appointments_all"       ON public.leg_appointments       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_contracts_all"          ON public.leg_contracts          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "leg_billing_timesheets_all" ON public.leg_billing_timesheets FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_destinations_all"       ON public.tur_destinations       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_trips_all"              ON public.tur_trips              FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_hotel_allotments_all"   ON public.tur_hotel_allotments   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_bookings_all"           ON public.tur_bookings           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "tur_agent_commissions_all"  ON public.tur_agent_commissions  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_projects_all"           ON public.cmp_projects           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_milestones_all"         ON public.cmp_milestones         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_service_tickets_all"    ON public.cmp_service_tickets    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_sla_policies_all"       ON public.cmp_sla_policies       FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "cmp_timesheets_all"         ON public.cmp_timesheets         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ─── SECTOR INDEXES ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_edu_courses_tenant       ON public.edu_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edu_enrollments_course   ON public.edu_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_edu_attendance_schedule  ON public.edu_session_attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_med_patients_tenant      ON public.med_patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_med_appointments_date    ON public.med_appointments(tenant_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_spt_members_tenant       ON public.spt_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spt_subscriptions_status ON public.spt_subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_spt_access_logs_time     ON public.spt_access_logs(tenant_id, access_time DESC);
CREATE INDEX IF NOT EXISTS idx_leg_cases_status         ON public.leg_cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leg_documents_case       ON public.leg_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_tur_bookings_status      ON public.tur_bookings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tur_trips_dates          ON public.tur_trips(departure_date, return_date);
CREATE INDEX IF NOT EXISTS idx_cmp_projects_status      ON public.cmp_projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cmp_tickets_status       ON public.cmp_service_tickets(tenant_id, status, sla_due_at);
CREATE INDEX IF NOT EXISTS idx_cmp_timesheets_project   ON public.cmp_timesheets(project_id, entry_date);
