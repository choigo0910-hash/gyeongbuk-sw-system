-- Fix companies UPDATE policy for company admins

-- Remove old policy
DROP POLICY IF EXISTS "Companies: Update own company" ON companies;

-- Create new policy: Only company admins can update their company
CREATE POLICY "Companies: Company admins can update own company"
ON companies FOR UPDATE TO authenticated
USING (
  id IN (
    SELECT uc.company_id
    FROM user_companies uc
    JOIN user_roles ur ON ur.user_id = uc.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE uc.user_id = auth.uid()
      AND uc.status = 'active'
      AND r.code = 'company_admin'
  )
)
WITH CHECK (
  id IN (
    SELECT uc.company_id
    FROM user_companies uc
    JOIN user_roles ur ON ur.user_id = uc.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE uc.user_id = auth.uid()
      AND uc.status = 'active'
      AND r.code = 'company_admin'
  )
);
