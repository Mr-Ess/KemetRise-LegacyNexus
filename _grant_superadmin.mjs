/**
 * Grant superadmin role to the.one.behind.kemetrise@gmail.com
 * Works for any auth provider (email, Google OAuth, etc.)
 *
 * Usage:
 *   node _grant_superadmin.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Get your personal access token at:
 *   https://supabase.com/dashboard/account/tokens
 */

const PROJECT_REF = 'eoxcpubjoaninjyxtfko';
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error('\n❌  No access token provided.');
  console.error('\nUsage:  node _grant_superadmin.mjs <YOUR_ACCESS_TOKEN>');
  console.error('\nGet your token at:  https://supabase.com/dashboard/account/tokens\n');
  process.exit(1);
}

const sql = `
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE email = 'the.one.behind.kemetrise@gmail.com'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE NOTICE 'User not found in auth.users — they must sign in at least once first.';
    RETURN;
  END IF;

  -- Update / create user_profiles
  INSERT INTO public.user_profiles (
    id, role, full_name, preferred_lang, preferred_theme,
    is_verified, is_suspended, onboarding_done
  ) VALUES (
    v_uid, 'superadmin', 'Mr.ESS', 'ar', 'dark', TRUE, FALSE, TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    role            = 'superadmin',
    is_verified     = TRUE,
    is_suspended    = FALSE,
    onboarding_done = TRUE;

  -- Insert into user_roles (new permissions system)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'superadmin granted to uid: %', v_uid;
END;
$$;
`;

async function run() {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();

  if (!res.ok) {
    console.error(`\n❌  API error ${res.status}:\n${body}\n`);
    process.exit(1);
  }

  console.log('\n✅  Done!\n', body);
}

run();
