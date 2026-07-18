
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  body text NOT NULL,
  mentions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON public.comments FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "comments_insert" ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_comments_entity ON public.comments(entity_type, entity_id);

CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
