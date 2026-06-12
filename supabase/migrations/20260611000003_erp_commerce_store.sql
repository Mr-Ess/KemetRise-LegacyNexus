-- ═══════════════════════════════════════════════════════════════════════════
-- KEMETRISE — ADVANCED REVENUE ENGINE & MULTI-COMMERCE STORE
-- Products (Digital+Physical) · Orders · Inventory · Payment Gateway Mapping
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PRODUCT CATALOG ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.com_products (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code      text        NOT NULL DEFAULT 'CMP-01',
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  name             text        NOT NULL,
  slug             text        NOT NULL,
  description      text,
  product_type     text        NOT NULL DEFAULT 'physical',
                   -- physical, digital, service, subscription, bundle
  sku              text,
  barcode          text,
  price            numeric(12,4) NOT NULL DEFAULT 0,
  compare_price    numeric(12,4),
  cost_price       numeric(12,4),
  currency         text        NOT NULL DEFAULT 'USD',
  tax_rule_id      uuid        REFERENCES public.fin_tax_rules(id),
  category         text,
  tags             text[]      DEFAULT '{}',
  -- Physical goods
  weight_kg        numeric(8,3),
  dimensions       jsonb       DEFAULT '{}',  -- {length, width, height}
  requires_shipping boolean    DEFAULT false,
  -- Digital goods
  file_url         text,        -- secure signed URL
  download_limit   int         DEFAULT -1,   -- -1 = unlimited
  license_type     text        DEFAULT 'single', -- single, multi, enterprise
  -- Stock
  track_inventory  boolean     DEFAULT false,
  stock_qty        int         DEFAULT 0,
  low_stock_alert  int         DEFAULT 5,
  allow_backorder  boolean     DEFAULT false,
  -- Status
  is_active        boolean     DEFAULT true,
  is_featured      boolean     DEFAULT false,
  images           jsonb       DEFAULT '[]',
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- ─── LICENSE KEYS (Digital Products) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.com_license_keys (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.com_products(id),
  license_key  text        NOT NULL,
  order_id     uuid,
  buyer_email  text,
  activated_at timestamptz,
  expires_at   timestamptz,
  usage_count  int         DEFAULT 0,
  max_uses     int         DEFAULT 1,
  status       text        DEFAULT 'available', -- available, assigned, activated, revoked
  created_at   timestamptz DEFAULT now(),
  UNIQUE (tenant_id, license_key)
);

-- ─── WAREHOUSE / INVENTORY ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.com_warehouses (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  code       text        NOT NULL,
  address    jsonb       DEFAULT '{}',
  is_active  boolean     DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.com_inventory (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.com_products(id) ON DELETE CASCADE,
  warehouse_id uuid        REFERENCES public.com_warehouses(id),
  qty_on_hand  int         NOT NULL DEFAULT 0,
  qty_reserved int         DEFAULT 0,
  qty_available int        GENERATED ALWAYS AS (qty_on_hand - qty_reserved) STORED,
  reorder_point int        DEFAULT 5,
  reorder_qty  int         DEFAULT 10,
  last_updated timestamptz DEFAULT now(),
  UNIQUE (tenant_id, product_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS public.com_inventory_movements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id   uuid        NOT NULL REFERENCES public.com_products(id),
  warehouse_id uuid        REFERENCES public.com_warehouses(id),
  movement_type text       NOT NULL, -- in, out, adjustment, transfer, return
  qty          int         NOT NULL,
  reference    text,
  source_type  text,        -- order, purchase_order, adjustment, transfer
  source_id    uuid,
  notes        text,
  performed_by uuid        REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now()
);

-- ─── ORDERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.com_orders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sector_code    text        NOT NULL DEFAULT 'CMP-01',
  user_id        uuid        NOT NULL REFERENCES auth.users(id),
  order_number   text        NOT NULL,
  customer_id    uuid,
  customer_name  text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb     DEFAULT '{}',
  billing_address  jsonb     DEFAULT '{}',
  order_type     text        NOT NULL DEFAULT 'standard', -- standard, subscription, digital, wholesale
  status         text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  fulfillment_status text    DEFAULT 'unfulfilled', -- unfulfilled, partial, fulfilled
  payment_status text        DEFAULT 'unpaid', -- unpaid, paid, partial, refunded
  currency       text        NOT NULL DEFAULT 'USD',
  exchange_rate  numeric(12,6) DEFAULT 1.0,
  subtotal       numeric(15,4) DEFAULT 0,
  tax_amount     numeric(15,4) DEFAULT 0,
  shipping_cost  numeric(10,4) DEFAULT 0,
  discount_amount numeric(15,4) DEFAULT 0,
  total_amount   numeric(15,4) NOT NULL DEFAULT 0,
  paid_amount    numeric(15,4) DEFAULT 0,
  gateway        text,        -- stripe, paymob, instapay, cash
  gateway_ref    text,
  gateway_payload jsonb      DEFAULT '{}',
  coupon_code    text,
  notes          text,
  metadata       jsonb       DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (tenant_id, order_number)
);

-- ─── ORDER LINE ITEMS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.com_order_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid        NOT NULL REFERENCES public.com_orders(id) ON DELETE CASCADE,
  tenant_id       uuid        NOT NULL,
  product_id      uuid        REFERENCES public.com_products(id),
  product_name    text        NOT NULL,
  sku             text,
  product_type    text        DEFAULT 'physical',
  quantity        int         NOT NULL DEFAULT 1,
  unit_price      numeric(12,4) NOT NULL,
  discount_pct    numeric(5,2) DEFAULT 0,
  tax_rate        numeric(5,2) DEFAULT 0,
  tax_amount      numeric(12,4) DEFAULT 0,
  line_total      numeric(12,4) NOT NULL,
  -- Fulfillment
  fulfillment_status text     DEFAULT 'unfulfilled',
  shipped_qty     int         DEFAULT 0,
  -- Digital delivery
  download_url    text,
  license_key_id  uuid        REFERENCES public.com_license_keys(id),
  download_expires_at timestamptz,
  sort_order      int         DEFAULT 0
);

-- ─── COUPONS & PROMOTIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.com_coupons (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code             text        NOT NULL,
  description      text,
  discount_type    text        NOT NULL DEFAULT 'percent', -- percent, fixed
  discount_value   numeric(10,4) NOT NULL,
  min_order_amount numeric(10,4) DEFAULT 0,
  max_uses         int         DEFAULT -1,
  used_count       int         DEFAULT 0,
  applies_to       text        DEFAULT 'all', -- all, category, product
  applicable_ids   uuid[]      DEFAULT '{}',
  valid_from       timestamptz DEFAULT now(),
  valid_until      timestamptz,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- ─── PAYMENT TRANSACTIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.com_payment_transactions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id         uuid        REFERENCES public.com_orders(id),
  invoice_id       uuid        REFERENCES public.fin_invoices(id),
  transaction_type text        NOT NULL DEFAULT 'charge',  -- charge, refund, chargeback, payout
  gateway          text        NOT NULL,
  gateway_txn_id   text,
  gateway_order_id text,
  amount           numeric(15,4) NOT NULL,
  currency         text        NOT NULL DEFAULT 'USD',
  status           text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed','cancelled','refunded')),
  gateway_response jsonb       DEFAULT '{}',
  error_code       text,
  error_message    text,
  processed_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- ─── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_com_products_tenant       ON public.com_products(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_com_products_type         ON public.com_products(product_type);
CREATE INDEX IF NOT EXISTS idx_com_inventory_product     ON public.com_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_com_orders_tenant_status  ON public.com_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_com_orders_sector         ON public.com_orders(sector_code);
CREATE INDEX IF NOT EXISTS idx_com_orders_customer       ON public.com_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_com_txns_order            ON public.com_payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_com_txns_status           ON public.com_payment_transactions(status);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
ALTER TABLE public.com_products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_license_keys          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_warehouses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_inventory             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_inventory_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_payment_transactions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "com_products_all" ON 
DROP POLICY IF EXISTS "com_products_all" ON public.com_products;
DROP POLICY IF EXISTS "com_products_all" ON public.com_products;
CREATE POLICY "com_products_all" ON public.com_products             FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_license_keys_all" ON 
DROP POLICY IF EXISTS "com_license_keys_all" ON public.com_license_keys;
DROP POLICY IF EXISTS "com_license_keys_all" ON public.com_license_keys;
CREATE POLICY "com_license_keys_all" ON public.com_license_keys         FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_warehouses_all" ON 
DROP POLICY IF EXISTS "com_warehouses_all" ON public.com_warehouses;
DROP POLICY IF EXISTS "com_warehouses_all" ON public.com_warehouses;
CREATE POLICY "com_warehouses_all" ON public.com_warehouses           FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_inventory_all" ON 
DROP POLICY IF EXISTS "com_inventory_all" ON public.com_inventory;
DROP POLICY IF EXISTS "com_inventory_all" ON public.com_inventory;
CREATE POLICY "com_inventory_all" ON public.com_inventory            FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_inventory_movements_all" ON 
DROP POLICY IF EXISTS "com_inventory_movements_all" ON public.com_inventory_movements;
DROP POLICY IF EXISTS "com_inventory_movements_all" ON public.com_inventory_movements;
CREATE POLICY "com_inventory_movements_all" ON public.com_inventory_movements  FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_orders_all" ON 
DROP POLICY IF EXISTS "com_orders_all" ON public.com_orders;
DROP POLICY IF EXISTS "com_orders_all" ON public.com_orders;
CREATE POLICY "com_orders_all" ON public.com_orders               FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_order_items_all" ON 
DROP POLICY IF EXISTS "com_order_items_all" ON public.com_order_items;
DROP POLICY IF EXISTS "com_order_items_all" ON public.com_order_items;
CREATE POLICY "com_order_items_all" ON public.com_order_items          FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_coupons_all" ON 
DROP POLICY IF EXISTS "com_coupons_all" ON public.com_coupons;
DROP POLICY IF EXISTS "com_coupons_all" ON public.com_coupons;
CREATE POLICY "com_coupons_all" ON public.com_coupons              FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
DROP POLICY IF EXISTS "com_payment_transactions_all" ON 
DROP POLICY IF EXISTS "com_payment_transactions_all" ON public.com_payment_transactions;
DROP POLICY IF EXISTS "com_payment_transactions_all" ON public.com_payment_transactions;
CREATE POLICY "com_payment_transactions_all" ON public.com_payment_transactions FOR ALL USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ─── FUNCTION: Deduct inventory on order ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_order_deduct_inventory()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.fulfillment_status = 'fulfilled' AND OLD.fulfillment_status <> 'fulfilled' THEN
    UPDATE public.com_inventory
    SET qty_on_hand   = qty_on_hand - NEW.quantity,
        qty_reserved  = GREATEST(0, qty_reserved - NEW.quantity),
        last_updated  = now()
    WHERE product_id = NEW.product_id AND tenant_id = NEW.tenant_id;

    INSERT INTO public.com_inventory_movements
      (tenant_id, product_id, movement_type, qty, source_type, source_id)
    VALUES
      (NEW.tenant_id, NEW.product_id, 'out', NEW.quantity, 'order', NEW.order_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_order_deduct_inventory
  AFTER UPDATE OF fulfillment_status ON public.com_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_order_deduct_inventory();

-- ─── FUNCTION: Auto-deliver digital license on payment ────────────────────
CREATE OR REPLACE FUNCTION public.fn_assign_license_key()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_key_id uuid;
BEGIN
  IF NEW.product_type = 'digital' AND NEW.fulfillment_status = 'unfulfilled' THEN
    SELECT id INTO v_key_id
    FROM public.com_license_keys
    WHERE product_id = NEW.product_id
      AND status = 'available'
    LIMIT 1;

    IF v_key_id IS NOT NULL THEN
      UPDATE public.com_license_keys
      SET status = 'assigned', order_id = NEW.order_id, activated_at = now()
      WHERE id = v_key_id;

      UPDATE public.com_order_items
      SET license_key_id = v_key_id, fulfillment_status = 'fulfilled',
          download_expires_at = now() + interval '7 days'
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_assign_license_key
  AFTER INSERT ON public.com_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_assign_license_key();
