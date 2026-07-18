-- Fix RLS infinite recursion on user_profiles
-- Uses a SECURITY DEFINER function to avoid recursive policy checks

-- Security definer function: checks role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Drop ALL existing policies on user_profiles
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.policyname);
  END LOOP;
END $$;

-- 1. Self access: user can always read/update their own row (no recursion)
CREATE POLICY "up_self_all"
  ON public.user_profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Admin/Superadmin can read ALL profiles (uses security definer - no recursion)
CREATE POLICY "up_admin_select"
  ON public.user_profiles FOR SELECT
  USING (public.get_my_role() IN ('admin', 'superadmin'));

-- 3. Admin/Superadmin can update ANY profile
CREATE POLICY "up_admin_update"
  ON public.user_profiles FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'superadmin'));

-- 4. Admin/Superadmin can insert
CREATE POLICY "up_admin_insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin') OR id = auth.uid());

-- 5. Public can read basic info (name, avatar, role) - needed for portal switcher
CREATE POLICY "up_public_read"
  ON public.user_profiles FOR SELECT
  USING (true);
