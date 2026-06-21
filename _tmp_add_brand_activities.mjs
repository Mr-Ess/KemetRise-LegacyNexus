const PROJECT_REF = 'eoxcpubjoaninjyxtfko';
const TOKEN = 'sbp_dd552996b883ac9842c15bce6d6c657a197b57b8';
const SQL = `
ALTER TABLE public.website_agents
  ADD COLUMN IF NOT EXISTS brand_activities JSONB DEFAULT '[]'::jsonb;
SELECT 'brand_activities column added' AS result;
`;
const res = await fetch('https://api.supabase.com/v1/projects/'+PROJECT_REF+'/database/query',{
  method:'POST',
  headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},
  body:JSON.stringify({query:SQL})
});
console.log(await res.text());
