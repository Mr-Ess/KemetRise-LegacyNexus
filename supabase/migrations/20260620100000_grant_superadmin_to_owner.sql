-- ═══════════════════════════════════════════════════════════════
--  Grant superadmin to: the.one.behind.kemetrise@gmail.com
--  Works regardless of auth provider (email / Google OAuth)
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid UUID;
BEGIN
  -- Find the user (could be email or Google OAuth login)
  SELECT id INTO v_uid
  FROM auth.users
  WHERE email = 'the.one.behind.kemetrise@gmail.com'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE NOTICE 'User not found — they must sign in at least once first.';
    RETURN;
  END IF;

  -- Upsert user_profiles with superadmin role
  INSERT INTO public.user_profiles (
    id,
    role,
    full_name,
    preferred_lang,
    preferred_theme,
    is_verified,
    is_suspended,
    onboarding_done
  ) VALUES (
    v_uid,
    'superadmin',
    'Mr.ESS',
    'ar',
    'dark',
    TRUE,
    FALSE,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    role            = 'superadmin',
    is_verified     = TRUE,
    is_suspended    = FALSE,
    onboarding_done = TRUE;

  RAISE NOTICE 'superadmin granted to user id: %', v_uid;
END;
$$;
