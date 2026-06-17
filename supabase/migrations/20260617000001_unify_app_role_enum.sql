-- ============================================================
-- Unify app_role enum to match frontend UserRole type
-- Adds: superadmin, manager, staff, provider, partner,
--       vendor, marketing, viewer
-- Keeps: admin, moderator, user
-- ============================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'provider';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- Update has_role policy comment for clarity
COMMENT ON TYPE public.app_role IS 'Unified roles: superadmin, admin, manager, staff, provider, partner, agent, vendor, marketing, viewer, moderator, user';
