-- RPC to fetch all agent_logs bypassing RLS (SECURITY DEFINER runs as postgres)
CREATE OR REPLACE FUNCTION public.get_all_agent_logs(p_limit int DEFAULT 500)
RETURNS SETOF public.agent_logs
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.agent_logs
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_agent_logs(int) TO authenticated;
