-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE — TELEMETRY, OBSERVABILITY & WEBHOOK ORCHESTRATION
-- Central Router Manager · Event Bus · Auto-Retry Queue · KemetRise Nervous System
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── TELEMETRY EVENTS (immutable audit ledger) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text        NOT NULL,   -- text to allow system-level events without FK
  sector_code     text        NOT NULL    DEFAULT 'SYSTEM',
  active_agent_id text        NOT NULL    DEFAULT 'A-AGENT-SYS',
  event_category  text        NOT NULL,   -- transaction, attendance, invoice, order, system, security
  event_name      text        NOT NULL,   -- invoice.created, qr.scan, order.placed, login.failed, etc.
  status          text        NOT NULL    DEFAULT 'success' CHECK (status IN ('success','error','warning','info')),
  source_table    text,
  source_id       text,
  user_id         text,
  ip_address      inet,
  user_agent      text,
  payload         jsonb       DEFAULT '{}',
  error_message   text,
  duration_ms     int,
  timestamp       timestamptz NOT NULL    DEFAULT now()
);

-- Partition hint: large table, time-series oriented
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_ts      ON public.telemetry_events(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_name     ON public.telemetry_events(event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_status         ON public.telemetry_events(status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_agent          ON public.telemetry_events(active_agent_id);

-- ─── WEBHOOK ENDPOINT REGISTRY ────────────────────────────────────────────
-- Tenants register their external endpoints to receive system events.
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  url             text        NOT NULL,
  secret          text,        -- HMAC secret for signature verification
  events          text[]      NOT NULL DEFAULT '{}',  -- event names to filter
  is_active       boolean     DEFAULT true,
  retry_attempts  int         DEFAULT 3,
  retry_delay_ms  int         DEFAULT 5000,
  timeout_ms      int         DEFAULT 10000,
  headers         jsonb       DEFAULT '{}',  -- extra headers to send
  format          text        DEFAULT 'json', -- json, form
  created_at      timestamptz DEFAULT now()
);

-- ─── WEBHOOK DELIVERY LOG ─────────────────────────────────────────────────
-- Table may already exist from earlier migrations — use ALTER to add ERP columns.
DO $erp_wd$ BEGIN
  -- Create fresh if not exists
  CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    status          text        NOT NULL DEFAULT 'pending',
    created_at      timestamptz DEFAULT now()
  );
END $erp_wd$;

-- Add ERP columns idempotently
ALTER TABLE public.webhook_deliveries
  ADD COLUMN IF NOT EXISTS endpoint_id      uuid        REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id        uuid,
  ADD COLUMN IF NOT EXISTS event_name       text,
  ADD COLUMN IF NOT EXISTS event_id         uuid,
  ADD COLUMN IF NOT EXISTS payload          jsonb       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS response_status  int,
  ADD COLUMN IF NOT EXISTS response_body    text,
  ADD COLUMN IF NOT EXISTS response_headers jsonb       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attempt_number   int         DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_attempts     int         DEFAULT 3,
  ADD COLUMN IF NOT EXISTS next_retry_at    timestamptz,
  ADD COLUMN IF NOT EXISTS duration_ms      int,
  ADD COLUMN IF NOT EXISTS error_message    text,
  ADD COLUMN IF NOT EXISTS sent_at          timestamptz;

-- Add CHECK constraint only if it doesn't exist
DO $wd_check$ BEGIN
  ALTER TABLE public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_status_check
    CHECK (status IN ('pending','success','failed','retrying','abandoned'));
EXCEPTION WHEN duplicate_object OR check_violation THEN NULL;
END $wd_check$;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status    ON public.webhook_deliveries(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant    ON public.webhook_deliveries(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint  ON public.webhook_deliveries(endpoint_id, created_at DESC);

-- ─── CENTRAL ROUTER OUTBOX (n8n integration) ──────────────────────────────
-- All system mutations emit to this outbox; n8n polls and routes to workflows.
CREATE TABLE IF NOT EXISTS public.central_router_outbox (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text        NOT NULL,
  sector_code     text        NOT NULL,
  active_agent_id text        NOT NULL,
  workflow_code   text,
  event_name      text        NOT NULL,
  status          text        NOT NULL DEFAULT 'success',
  payload         jsonb       NOT NULL DEFAULT '{}',
  timestamp       timestamptz NOT NULL DEFAULT now(),
  processed       boolean     DEFAULT false,
  processed_at    timestamptz,
  retry_count     int         DEFAULT 0,
  last_error      text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_central_router_unprocessed ON public.central_router_outbox(processed, created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_central_router_tenant      ON public.central_router_outbox(tenant_id, created_at DESC);

-- ─── RETRY QUEUE (auto-retry with exponential backoff) ───────────────────
CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id     uuid        REFERENCES public.webhook_deliveries(id) ON DELETE CASCADE,
  tenant_id       uuid,
  attempt_number  int         NOT NULL DEFAULT 1,
  scheduled_at    timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  status          text        DEFAULT 'pending', -- pending, processing, done, failed
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retry_queue_scheduled ON public.webhook_retry_queue(scheduled_at) WHERE status = 'pending';

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
ALTER TABLE public.telemetry_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_router_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_retry_queue   ENABLE ROW LEVEL SECURITY;

-- Telemetry: tenant-scoped read (text comparison for tenant_id)
CREATE POLICY "telemetry_select" ON public.telemetry_events FOR SELECT
  USING (
    tenant_id = auth.uid()::text
    OR tenant_id IN (
      SELECT id::text FROM public.tenants WHERE owner_user_id = auth.uid()
      UNION
      SELECT t.id::text FROM public.tenant_members tm
      JOIN public.tenants t ON t.id = tm.tenant_id
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  );

-- Service accounts / edge functions can insert telemetry
CREATE POLICY "telemetry_insert" ON public.telemetry_events FOR INSERT
  WITH CHECK (true);  -- Controlled by edge function auth

CREATE POLICY "webhook_endpoints_all"     ON public.webhook_endpoints     FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries    FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
CREATE POLICY "webhook_deliveries_insert" ON public.webhook_deliveries    FOR INSERT WITH CHECK (true);
CREATE POLICY "webhook_deliveries_update" ON public.webhook_deliveries    FOR UPDATE USING (true);
CREATE POLICY "central_router_select"     ON public.central_router_outbox FOR SELECT USING (
  tenant_id IN (
    SELECT id::text FROM public.tenants WHERE owner_user_id = auth.uid()
    UNION
    SELECT t.id::text FROM public.tenant_members tm
    JOIN public.tenants t ON t.id = tm.tenant_id
    WHERE tm.user_id = auth.uid() AND tm.is_active = true
  )
);
CREATE POLICY "central_router_insert"     ON public.central_router_outbox FOR INSERT WITH CHECK (true);
CREATE POLICY "retry_queue_all"           ON public.webhook_retry_queue   FOR ALL USING (true);

-- ─── MASTER EMIT FUNCTION: Routes all ERP events to Central Router ────────
-- Called by any table trigger or application code to emit a standardized payload.
CREATE OR REPLACE FUNCTION public.fn_emit_telemetry(
  p_tenant_id       text,
  p_sector_code     text,
  p_active_agent_id text,
  p_event_name      text,
  p_status          text     DEFAULT 'success',
  p_source_table    text     DEFAULT NULL,
  p_source_id       text     DEFAULT NULL,
  p_payload         jsonb    DEFAULT '{}',
  p_workflow_code   text     DEFAULT NULL,
  p_error_message   text     DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_outbox_id uuid;
BEGIN
  -- 1. Write to immutable telemetry ledger
  INSERT INTO public.telemetry_events
    (tenant_id, sector_code, active_agent_id, event_name, status,
     source_table, source_id, payload, error_message)
  VALUES
    (p_tenant_id, p_sector_code, p_active_agent_id, p_event_name, p_status,
     p_source_table, p_source_id, p_payload, p_error_message)
  RETURNING id INTO v_event_id;

  -- 2. Write to Central Router outbox for n8n pickup
  INSERT INTO public.central_router_outbox
    (tenant_id, sector_code, active_agent_id, workflow_code, event_name, status, payload)
  VALUES (
    p_tenant_id,
    p_sector_code,
    p_active_agent_id,
    p_workflow_code,
    p_event_name,
    p_status,
    jsonb_build_object(
      'tenant_id',       p_tenant_id,
      'sector_code',     p_sector_code,
      'active_agent_id', p_active_agent_id,
      'event_name',      p_event_name,
      'status',          p_status,
      'timestamp',       now(),
      'source_table',    p_source_table,
      'source_id',       p_source_id,
      'data',            p_payload
    )
  )
  RETURNING id INTO v_outbox_id;

  -- 3. Fan-out to registered tenant webhook endpoints
  INSERT INTO public.webhook_deliveries
    (endpoint_id, tenant_id, event_name, event_id, payload, status, max_attempts, next_retry_at)
  SELECT
    we.id,
    we.tenant_id,
    p_event_name,
    v_event_id,
    jsonb_build_object(
      'tenant_id',       p_tenant_id,
      'sector_code',     p_sector_code,
      'active_agent_id', p_active_agent_id,
      'status',          p_status,
      'timestamp',       now()::text
    ),
    'pending',
    we.retry_attempts,
    now()
  FROM public.webhook_endpoints we
  WHERE we.tenant_id::text = p_tenant_id
    AND we.is_active = true
    AND (we.events = '{}' OR p_event_name = ANY(we.events));

  RETURN v_event_id;
END;
$$;

-- ─── TRIGGER HELPER: Generic table mutation telemetry emitter ─────────────
-- Attach this to any table with tenant_id + sector_code columns.
CREATE OR REPLACE FUNCTION public.fn_table_telemetry_emit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_name  text;
  v_tenant_id   text;
  v_sector_code text;
  v_source_id   text;
BEGIN
  v_event_name  := TG_TABLE_NAME || '.' || lower(TG_OP);
  v_tenant_id   := COALESCE(NEW.tenant_id::text, OLD.tenant_id::text, 'unknown');
  v_sector_code := COALESCE(NEW.sector_code, 'SYSTEM');
  v_source_id   := COALESCE(NEW.id::text, OLD.id::text);

  PERFORM public.fn_emit_telemetry(
    v_tenant_id, v_sector_code, 'A-AGENT-SYS',
    v_event_name, 'success',
    TG_TABLE_NAME, v_source_id,
    jsonb_build_object('op', TG_OP)
  );
  RETURN NEW;
END;
$$;

-- ─── WIRE TELEMETRY TRIGGERS ON KEY TABLES ────────────────────────────────
CREATE OR REPLACE TRIGGER trg_tel_fin_invoices
  AFTER INSERT OR UPDATE ON public.fin_invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

CREATE OR REPLACE TRIGGER trg_tel_com_orders
  AFTER INSERT OR UPDATE ON public.com_orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

CREATE OR REPLACE TRIGGER trg_tel_hr_attendance
  AFTER INSERT ON public.hr_attendance_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

CREATE OR REPLACE TRIGGER trg_tel_hr_payroll_cycles
  AFTER UPDATE OF status ON public.hr_payroll_cycles
  FOR EACH ROW EXECUTE FUNCTION public.fn_table_telemetry_emit();

-- ─── FUNCTION: Retry failed webhook deliveries ────────────────────────────
-- Called by pg_cron or edge function on a schedule.
CREATE OR REPLACE FUNCTION public.fn_retry_webhook_deliveries()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  v_rec   record;
BEGIN
  FOR v_rec IN
    SELECT id, attempt_number, max_attempts, endpoint_id
    FROM public.webhook_deliveries
    WHERE status IN ('failed', 'retrying')
      AND next_retry_at <= now()
      AND attempt_number < max_attempts
  LOOP
    UPDATE public.webhook_deliveries
    SET
      status         = 'retrying',
      attempt_number = attempt_number + 1,
      next_retry_at  = now() + (5000 * attempt_number || ' milliseconds')::interval
    WHERE id = v_rec.id;

    INSERT INTO public.webhook_retry_queue (delivery_id, tenant_id, attempt_number, scheduled_at)
    SELECT v_rec.id, tenant_id, v_rec.attempt_number + 1, now()
    FROM public.webhook_deliveries WHERE id = v_rec.id;

    v_count := v_count + 1;
  END LOOP;

  -- Mark permanently failed (exceeded max_attempts)
  UPDATE public.webhook_deliveries
  SET status = 'abandoned'
  WHERE status = 'retrying'
    AND attempt_number >= max_attempts
    AND next_retry_at <= now();

  RETURN v_count;
END;
$$;
