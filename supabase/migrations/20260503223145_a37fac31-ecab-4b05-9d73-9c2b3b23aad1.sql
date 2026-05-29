
DROP POLICY IF EXISTS fla_insert_any ON public.failed_login_attempts;
CREATE POLICY fla_insert_valid ON public.failed_login_attempts FOR INSERT WITH CHECK (length(email) > 3 AND length(email) < 255);
