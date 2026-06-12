-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE — FINANCIAL & TAXATION ENGINE (Horizontal Module)
-- Ledger · Invoicing · Receipts · Multi-Currency · Tax Rules · E-Invoicing
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── CHART OF ACCOUNTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_accounts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id),
  account_code  text        NOT NULL,
  account_name  text        NOT NULL,
  account_type  text        NOT NULL,  -- asset, liability, equity, revenue, expense
  parent_id     uuid        REFERENCES public.fin_accounts(id),
  normal_balance text       NOT NULL DEFAULT 'debit', -- debit | credit
  is_active     boolean     DEFAULT true,
  description   text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (tenant_id, account_code)
);

-- ─── GENERAL LEDGER ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_ledger_entries (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code      text        NOT NULL DEFAULT 'CMP-01',
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  account_id       uuid        REFERENCES public.fin_accounts(id),
  transaction_ref  text        NOT NULL,
  entry_type       text        NOT NULL CHECK (entry_type IN ('debit','credit')),
  amount           numeric(15,4) NOT NULL CHECK (amount > 0),
  currency         text        NOT NULL DEFAULT 'USD',
  amount_base      numeric(15,4),   -- amount in tenant default currency
  exchange_rate    numeric(12,6)  DEFAULT 1.0,
  description      text,
  entry_date       date        NOT NULL DEFAULT CURRENT_DATE,
  fiscal_year      int         NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int,
  fiscal_month     int         NOT NULL DEFAULT EXTRACT(MONTH FROM now())::int,
  source_type      text,        -- invoice, payment, payroll, manual, order
  source_id        uuid,
  is_reconciled    boolean     DEFAULT false,
  reconciled_at    timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- ─── INVOICES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_invoices (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code      text        NOT NULL DEFAULT 'CMP-01',
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  invoice_number   text        NOT NULL,
  invoice_type     text        NOT NULL DEFAULT 'standard', -- standard, proforma, credit_note, debit_note, recurring
  client_id        uuid,
  client_name      text,
  client_tax_id    text,
  client_email     text,
  client_address   jsonb       DEFAULT '{}',
  issue_date       date        NOT NULL DEFAULT CURRENT_DATE,
  due_date         date,
  currency         text        NOT NULL DEFAULT 'USD',
  exchange_rate    numeric(12,6) DEFAULT 1.0,
  subtotal         numeric(15,4) NOT NULL DEFAULT 0,
  tax_amount       numeric(15,4) DEFAULT 0,
  discount_amount  numeric(15,4) DEFAULT 0,
  total_amount     numeric(15,4) NOT NULL DEFAULT 0,
  paid_amount      numeric(15,4) DEFAULT 0,
  balance_due      numeric(15,4) DEFAULT 0,
  status           text        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','paid','partial','overdue','cancelled','void')),
  payment_terms    text,
  notes            text,
  footer_text      text,
  -- E-Invoicing compliance fields (Egypt ETA / KSA ZATCA / etc.)
  einvoice_uuid    text,
  einvoice_status  text        DEFAULT 'pending',
  einvoice_hash    text,
  einvoice_qr      text,        -- QR code data for embedded e-invoice
  einvoice_response jsonb      DEFAULT '{}',
  einvoice_authority text      DEFAULT 'ETA',
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

-- ─── INVOICE LINE ITEMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_invoice_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid        NOT NULL REFERENCES public.fin_invoices(id) ON DELETE CASCADE,
  tenant_id    uuid        NOT NULL,
  description  text        NOT NULL,
  quantity     numeric(10,3) NOT NULL DEFAULT 1,
  unit_price   numeric(15,4) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) DEFAULT 0,
  tax_rate     numeric(5,2) DEFAULT 0,
  tax_amount   numeric(15,4) DEFAULT 0,
  line_total   numeric(15,4) NOT NULL DEFAULT 0,
  product_id   uuid,
  sku          text,
  unit         text        DEFAULT 'unit',
  sort_order   int         DEFAULT 0
);

-- ─── RECEIPTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_receipts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code     text        NOT NULL DEFAULT 'CMP-01',
  user_id         uuid        NOT NULL REFERENCES auth.users(id),
  receipt_number  text        NOT NULL,
  invoice_id      uuid        REFERENCES public.fin_invoices(id),
  client_id       uuid,
  client_name     text,
  amount          numeric(15,4) NOT NULL,
  currency        text        NOT NULL DEFAULT 'USD',
  exchange_rate   numeric(12,6) DEFAULT 1.0,
  payment_method  text        NOT NULL DEFAULT 'cash',
                   -- cash | card | bank_transfer | stripe | paymob | instapay | cheque
  gateway_ref     text,
  gateway_payload jsonb       DEFAULT '{}',
  payment_date    date        NOT NULL DEFAULT CURRENT_DATE,
  notes           text,
  status          text        DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at      timestamptz DEFAULT now(),
  UNIQUE (tenant_id, receipt_number)
);

-- ─── MULTI-CURRENCY RATES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_currency_rates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  base_currency   text        NOT NULL DEFAULT 'USD',
  target_currency text        NOT NULL,
  rate            numeric(14,8) NOT NULL,
  source          text        DEFAULT 'manual', -- manual, ecb, openexchange, cboe
  rate_date       date        NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (tenant_id, base_currency, target_currency, rate_date)
);

-- ─── TAX RULES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_tax_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_name       text        NOT NULL,
  tax_code        text,        -- e.g. EGY-VAT-14, KSA-VAT-15
  tax_type        text        NOT NULL DEFAULT 'vat',
                  -- vat, sales_tax, withholding, income, customs, stamp_duty
  rate            numeric(6,4) NOT NULL,
  country_code    text,
  is_default      boolean     DEFAULT false,
  is_active       boolean     DEFAULT true,
  applies_to      text[]      DEFAULT '{}',  -- product, service, digital, physical
  authority_code  text,        -- National tax authority registration code
  description     text,
  created_at      timestamptz DEFAULT now()
);

-- ─── E-INVOICE WEBHOOK LOG ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_einvoice_webhooks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id    uuid        REFERENCES public.fin_invoices(id),
  event_type    text        NOT NULL, -- submission, acceptance, rejection, cancellation, query
  authority     text        NOT NULL DEFAULT 'ETA',  -- ETA, ZATCA, FDMS, etc.
  payload       jsonb       NOT NULL DEFAULT '{}',
  response      jsonb       DEFAULT '{}',
  status        text        DEFAULT 'pending' CHECK (status IN ('pending','success','error','retrying')),
  attempts      int         DEFAULT 0,
  max_attempts  int         DEFAULT 3,
  retry_delay_ms int        DEFAULT 5000,
  next_retry_at timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- ─── PAYMENT GATEWAY CONFIGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_gateway_configs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gateway_name  text        NOT NULL, -- stripe, paymob, instapay, paypal, fawry
  is_active     boolean     DEFAULT true,
  is_default    boolean     DEFAULT false,
  config_enc    jsonb       DEFAULT '{}',  -- encrypted gateway credentials
  webhook_secret text,
  supported_currencies text[] DEFAULT '{"USD"}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (tenant_id, gateway_name)
);

-- ─── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fin_ledger_tenant_date    ON public.fin_ledger_entries(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_fin_ledger_sector         ON public.fin_ledger_entries(sector_code);
CREATE INDEX IF NOT EXISTS idx_fin_ledger_source         ON public.fin_ledger_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_fin_invoices_tenant_status ON public.fin_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fin_invoices_sector       ON public.fin_invoices(sector_code);
CREATE INDEX IF NOT EXISTS idx_fin_invoices_due_date     ON public.fin_invoices(due_date) WHERE status NOT IN ('paid','cancelled','void');
CREATE INDEX IF NOT EXISTS idx_fin_receipts_tenant       ON public.fin_receipts(tenant_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_fin_einvoice_status       ON public.fin_einvoice_webhooks(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_fin_currency_date         ON public.fin_currency_rates(tenant_id, rate_date DESC);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
ALTER TABLE public.fin_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_ledger_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_invoice_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_receipts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_currency_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_tax_rules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_einvoice_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_gateway_configs   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fin_accounts_all" ON public.fin_accounts;
CREATE POLICY "fin_accounts_all"          ON public.fin_accounts          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_ledger_all" ON public.fin_ledger_entries;
CREATE POLICY "fin_ledger_all"            ON public.fin_ledger_entries    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_invoices_all" ON public.fin_invoices;
CREATE POLICY "fin_invoices_all"          ON public.fin_invoices          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_invoice_items_all" ON public.fin_invoice_items;
CREATE POLICY "fin_invoice_items_all"     ON public.fin_invoice_items     FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_receipts_all" ON public.fin_receipts;
CREATE POLICY "fin_receipts_all"          ON public.fin_receipts          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_currency_rates_all" ON public.fin_currency_rates;
CREATE POLICY "fin_currency_rates_all"    ON public.fin_currency_rates    FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_tax_rules_all" ON public.fin_tax_rules;
CREATE POLICY "fin_tax_rules_all"         ON public.fin_tax_rules         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_einvoice_webhooks_all" ON public.fin_einvoice_webhooks;
CREATE POLICY "fin_einvoice_webhooks_all" ON public.fin_einvoice_webhooks FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "fin_gateway_configs_all" ON public.fin_gateway_configs;
CREATE POLICY "fin_gateway_configs_all"   ON public.fin_gateway_configs   FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ─── FUNCTION: Auto-calculate invoice totals ──────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_sync_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.fin_invoices
  SET
    subtotal    = items.subtotal,
    tax_amount  = items.tax_total,
    total_amount= items.subtotal + items.tax_total - COALESCE(discount_amount, 0),
    balance_due = items.subtotal + items.tax_total - COALESCE(discount_amount, 0) - COALESCE(paid_amount, 0),
    updated_at  = now()
  FROM (
    SELECT
      SUM(quantity * unit_price * (1 - discount_pct/100)) AS subtotal,
      SUM(tax_amount)                                      AS tax_total
    FROM public.fin_invoice_items WHERE invoice_id = NEW.invoice_id
  ) items
  WHERE id = NEW.invoice_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_invoice_items_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.fin_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_invoice_totals();

-- ─── FUNCTION: Auto-update balance_due when paid_amount changes ───────────
CREATE OR REPLACE FUNCTION public.fn_invoice_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.balance_due := GREATEST(0, NEW.total_amount - NEW.paid_amount);
  NEW.status := CASE
    WHEN NEW.paid_amount >= NEW.total_amount THEN 'paid'
    WHEN NEW.paid_amount > 0                THEN 'partial'
    ELSE NEW.status
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_invoice_balance
  BEFORE UPDATE OF paid_amount ON public.fin_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_invoice_balance();

-- ─── FUNCTION: Create ledger entry on receipt ─────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_receipt_to_ledger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.fin_ledger_entries
      (tenant_id, sector_code, user_id, transaction_ref, entry_type, amount, currency, description, source_type, source_id)
    VALUES
      (NEW.tenant_id, NEW.sector_code, NEW.user_id, NEW.receipt_number, 'debit',
       NEW.amount, NEW.currency, 'Receipt: ' || COALESCE(NEW.receipt_number,''), 'receipt', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_receipt_ledger
  AFTER INSERT ON public.fin_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_receipt_to_ledger();
