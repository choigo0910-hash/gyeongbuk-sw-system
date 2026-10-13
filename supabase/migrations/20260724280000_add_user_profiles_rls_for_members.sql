-- Allow company admins to view profiles of users in their company
-- Drop existing policy if exists
DROP POLICY IF EXISTS "Company admins can view company member profiles" ON user_profiles;

-- Create new policy
CREATE POLICY "Company admins can view company member profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  -- Current user must be company_admin of an active company
  EXISTS (
    SELECT 1
    FROM user_companies uc1
    INNER JOIN user_roles ur ON ur.user_id = auth.uid() AND ur.deleted_at IS NULL
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE uc1.user_id = auth.uid()
      AND uc1.status = 'active'
      AND uc1.deleted_at IS NULL
      AND r.code = 'company_admin'
      AND ur.company_id = uc1.company_id
      -- AND target user belongs to the same company
      AND EXISTS (
        SELECT 1
        FROM user_companies uc2
        WHERE uc2.user_id = user_profiles.user_id
          AND uc2.company_id = uc1.company_id
          AND uc2.deleted_at IS NULL
      )
  )
);
