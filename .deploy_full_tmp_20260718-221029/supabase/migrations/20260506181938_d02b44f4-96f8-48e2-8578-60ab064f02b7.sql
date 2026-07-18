
-- Add missing columns to employees (AI agent metadata)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS agent_code varchar,
  ADD COLUMN IF NOT EXISTS agent_version varchar,
  ADD COLUMN IF NOT EXISTS system_prompt text,
  ADD COLUMN IF NOT EXISTS team_category varchar,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS is_aggregator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add missing columns to tasks (sub-tasks + agent linkage)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS agent_code text,
  ADD COLUMN IF NOT EXISTS is_aggregator boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_code ON public.tasks(agent_code);
CREATE INDEX IF NOT EXISTS idx_employees_agent_code ON public.employees(agent_code);

-- agent_logs: AI/Human agent activity log
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_code text NOT NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  action_taken text NOT NULL,
  log_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_logs_owner_all" ON public.agent_logs
  FOR ALL USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON public.agent_logs(agent_code);
CREATE INDEX IF NOT EXISTS idx_agent_logs_task ON public.agent_logs(task_id);

-- workflow_map: agent-to-agent dependency graph
CREATE TABLE IF NOT EXISTS public.workflow_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_agent_code varchar NOT NULL,
  to_agent_code varchar NOT NULL,
  dependency_type varchar NOT NULL DEFAULT 'sequential',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_map_owner_all" ON public.workflow_map
  FOR ALL USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id);
