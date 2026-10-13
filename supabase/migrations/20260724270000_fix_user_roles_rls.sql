-- Fix user_profiles visibility for admins
-- Issue: user_profiles RLS checks user_roles for admin permission,
-- but user_roles RLS only allows users to see their own roles.
-- This creates a circular dependency that prevents admins from viewing user profiles.

-- Solution: Add a policy to user_roles that allows admins to view all roles

-- Drop existing policy on user_roles
DROP POLICY IF EXISTS "User roles: View own roles" ON user_roles;

-- Create new policy: Users can view their own roles
CREATE POLICY "User roles: View own roles"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Create new policy: Admins can view all roles
CREATE POLICY "User roles: Admins can view all roles"
ON user_roles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id IN (
      SELECT role_id FROM user_roles WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND r.code IN ('admin', 'super_admin')
  )
);

-- Similar fix for user_companies if needed
DROP POLICY IF EXISTS "User companies: View own" ON user_companies;

CREATE POLICY "User companies: View own"
ON user_companies FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "User companies: Admins can view all"
ON user_companies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id IN (
      SELECT role_id FROM user_roles WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
    AND r.code IN ('admin', 'super_admin')
  )
);
