CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (id UUID, email TEXT, created_at TIMESTAMPTZ)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT au.id, au.email, au.created_at
  FROM auth.users au
  WHERE EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = au.id
  )
  ORDER BY au.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_with_email() TO authenticated;
