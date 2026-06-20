-- ═══════════════════════════════════════════════════════════════════
--  Create Superadmin user: Mr.ESS
--  Migration: 20260620000007
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_user_id UUID;
  v_existing UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_existing FROM auth.users WHERE email = 'the.one.behind.kemetrise@gmail.com';

  IF v_existing IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      is_super_admin
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'the.one.behind.kemetrise@gmail.com',
      crypt('Dedo@04072018', gen_salt('bf', 10)),
      NOW(),
      '{"full_name": "Mr.ESS", "phone": "+201022886601", "username": "Mr.ESS"}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      'authenticated',
      'authenticated',
      NOW(),
      NOW(),
      '',
      '',
      FALSE
    );

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub',   v_user_id::text,
        'email', 'the.one.behind.kemetrise@gmail.com',
        'email_verified', true
      ),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    -- Insert into user_profiles
    INSERT INTO public.user_profiles (
      id,
      role,
      full_name,
      phone,
      preferred_lang,
      preferred_theme,
      is_verified,
      is_suspended,
      onboarding_done
    ) VALUES (
      v_user_id,
      'superadmin',
      'Mr.ESS',
      '+201022886601',
      'ar',
      'dark',
      TRUE,
      FALSE,
      TRUE
    ) ON CONFLICT (id) DO UPDATE SET role = 'superadmin', is_verified = TRUE;

    RAISE NOTICE 'Superadmin user Mr.ESS created with id: %', v_user_id;
  ELSE
    -- User exists — ensure profile is superadmin
    INSERT INTO public.user_profiles (
      id, role, full_name, phone, preferred_lang, preferred_theme, is_verified, is_suspended, onboarding_done
    ) VALUES (
      v_existing, 'superadmin', 'Mr.ESS', '+201022886601', 'ar', 'dark', TRUE, FALSE, TRUE
    ) ON CONFLICT (id) DO UPDATE SET
      role         = 'superadmin',
      full_name    = EXCLUDED.full_name,
      phone        = EXCLUDED.phone,
      is_verified  = TRUE;

    RAISE NOTICE 'User already exists (id: %), profile updated to superadmin.', v_existing;
  END IF;
END;
$$;
