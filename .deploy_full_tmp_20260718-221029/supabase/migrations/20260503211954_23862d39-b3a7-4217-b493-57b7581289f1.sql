
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_end timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS grace_until timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS refunded_amount numeric NOT NULL DEFAULT 0;

INSERT INTO public.exchange_rates (base_currency, target_currency, rate)
SELECT 'USD', x.tgt, x.r FROM (VALUES ('EGP', 49.0), ('EUR', 0.92), ('SAR', 3.75), ('USD', 1.0)) AS x(tgt, r)
WHERE NOT EXISTS (SELECT 1 FROM public.exchange_rates WHERE base_currency='USD' AND target_currency=x.tgt);
