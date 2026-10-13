-- Fix infinite recursion in RLS policies
-- Create a helper function to check if user is company admin

CREATE OR REPLACE FUNCTION is_company_admin(user_id uuid, company_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = is_company_admin.user_id
      AND r.code = 'company_admin'
      AND ur.company_id = is_company_admin.company_id
      AND (ur.deleted_at IS NULL OR ur.deleted_at IS NULL)
  );
$$ LANGUAGE sql STABLE;

-- Drop old policy
DROP POLICY IF EXISTS "Companies: Company admins can update own company" ON companies;

-- Create new policy using the function
CREATE POLICY "Companies: Company admins can update own company"
ON companies FOR UPDATE TO authenticated
USING (
  is_company_admin(auth.uid(), id)
)
WITH CHECK (
  is_company_admin(auth.uid(), id)
);
