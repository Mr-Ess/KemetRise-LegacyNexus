-- Notifications table for in-app task assignment alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_ref  text,               -- name or identifier of assignee
  task_id       uuid,               -- reference to tasks table
  brand_id      uuid,
  title         text NOT NULL,
  message       text,
  type          text DEFAULT 'task_assigned',
  is_read       boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications (matched by user_id or assignee_ref)
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR assignee_ref = (SELECT email FROM auth.users WHERE id = auth.uid()) OR assignee_ref = (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()));

-- Authenticated users can insert notifications
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid() OR assignee_ref = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_notifications_assignee ON public.notifications(assignee_ref);
CREATE INDEX IF NOT EXISTS idx_notifications_task ON public.notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read) WHERE is_read = false;
