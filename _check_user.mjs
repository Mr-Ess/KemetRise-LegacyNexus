/**
 * Check if the owner account exists and what role it has
 * Usage: node _check_user.mjs <ACCESS_TOKEN>
 */

const PROJECT_REF = 'eoxcpubjoaninjyxtfko';
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) { console.error('Usage: node _check_user.mjs <TOKEN>'); process.exit(1); }

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  return res.json();
}

async function run() {
  // 1. Check auth.users
  const authRows = await query(`
    SELECT id, email, raw_app_meta_data->>'provider' AS provider, created_at
    FROM auth.users
    WHERE email = 'the.one.behind.kemetrise@gmail.com'
    ORDER BY created_at ASC;
  `);
  console.log('\n── auth.users ──');
  console.log(JSON.stringify(authRows, null, 2));

  // 2. Check user_profiles
  const profileRows = await query(`
    SELECT id, role, full_name, is_verified, is_suspended
    FROM public.user_profiles
    WHERE id IN (
      SELECT id FROM auth.users WHERE email = 'the.one.behind.kemetrise@gmail.com'
    );
  `);
  console.log('\n── user_profiles ──');
  console.log(JSON.stringify(profileRows, null, 2));
}

run();
