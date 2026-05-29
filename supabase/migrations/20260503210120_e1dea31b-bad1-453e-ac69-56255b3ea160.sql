
-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active', -- active, past_due, cancelled, suspended, trialing
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_owner_all" ON public.subscriptions FOR ALL USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID,
  subscription_id UUID,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded, cancelled
  payment_method TEXT,
  payment_reference TEXT,
  receipt_url TEXT,
  coupon_code TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  billing_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_owner_all" ON public.invoices FOR ALL USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_invoices_user ON public.invoices(user_id, created_at DESC);

-- PAYMENT TRANSACTIONS
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_id UUID,
  customer_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL, -- instapay, vodafone_cash, paypal, stripe, ...
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  reference TEXT,
  proof_url TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pt_owner_all" ON public.payment_transactions FOR ALL USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_payments_user ON public.payment_transactions(user_id, created_at DESC);

-- COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- percent, fixed
  discount_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  applies_to_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_owner_all" ON public.coupons FOR ALL USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);

-- COUPON REDEMPTIONS
CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coupon_id UUID NOT NULL,
  invoice_id UUID,
  customer_id UUID,
  discount_applied NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_owner_all" ON public.coupon_redemptions FOR ALL USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);

-- REFUND REQUESTS
CREATE TABLE public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  customer_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, processed
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr_owner_all" ON public.refund_requests FOR ALL USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_rr_updated BEFORE UPDATE ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AFFILIATE COMMISSIONS
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  affiliate_id UUID NOT NULL,
  invoice_id UUID,
  customer_id UUID,
  base_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ac_owner_all" ON public.affiliate_commissions FOR ALL USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id);

-- EXCHANGE RATES (shared lookup)
CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "er_read_all" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "er_admin_write" ON public.exchange_rates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed default exchange rates
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
  ('USD','USD',1), ('USD','EUR',0.92), ('USD','EGP',49.5), ('USD','SAR',3.75), ('USD','AED',3.67), ('USD','GBP',0.79)
ON CONFLICT DO NOTHING;
