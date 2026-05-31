-- Add ai_count column to branches table
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS ai_count INTEGER NOT NULL DEFAULT 0;
