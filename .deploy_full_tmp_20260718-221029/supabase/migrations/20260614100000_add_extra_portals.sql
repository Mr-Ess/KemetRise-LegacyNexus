-- ═══════════════════════════════════════════════════════════════
-- KemetRise — Add extra_portals column to user_profiles
-- Also expand role CHECK to include all portal roles
-- ═══════════════════════════════════════════════════════════════

-- Add extra_portals column (text[] for additional portal IDs)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS extra_portals TEXT[] NOT NULL DEFAULT '{}';

-- Expand role CHECK constraint to include all roles
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('superadmin','admin','partner','agent','vendor','provider','marketing','user'));

-- Update admin policy to also cover superadmin
DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;
CREATE POLICY "user_profiles_admin_all" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin','superadmin')
    )
  );

-- Allow admins/superadmins to update any user's role and extra_portals
DROP POLICY IF EXISTS "user_profiles_admin_update" ON user_profiles;
CREATE POLICY "user_profiles_admin_update" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin','superadmin')
    )
  );
