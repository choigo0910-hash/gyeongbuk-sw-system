-- Fix infinite recursion in companies RLS policies
-- Drop all existing policies and recreate without recursion

-- Drop existing policies
DROP POLICY IF EXISTS "Companies: Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Companies: Admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Companies: Company admins can view own company" ON companies;
DROP POLICY IF EXISTS "Companies: Company users can view their company" ON companies;
DROP POLICY IF EXISTS "Companies: Users can view their company" ON companies;
DROP POLICY IF EXISTS "Companies: Company admins can update own company" ON companies;
DROP POLICY IF EXISTS "Companies: Super admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Companies: Admins can insert companies" ON companies;

-- Recreate policies without recursion
CREATE POLICY "Companies: Super admins can view all companies"
ON companies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code IN ('super_admin', 'admin')
      AND ur.deleted_at IS NULL
  )
);

CREATE POLICY "Companies: Admins can view all companies"
ON companies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code = 'admin'
      AND ur.deleted_at IS NULL
  )
);

CREATE POLICY "Companies: Company users can view their company"
ON companies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = auth.uid()
      AND uc.company_id = companies.id
      AND uc.deleted_at IS NULL
  )
);

CREATE POLICY "Companies: Company admins can update own company"
ON companies FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code = 'company_admin'
      AND ur.company_id = companies.id
      AND ur.deleted_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code = 'company_admin'
      AND ur.company_id = companies.id
      AND ur.deleted_at IS NULL
  )
);

CREATE POLICY "Companies: Super admins can insert companies"
ON companies FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code IN ('super_admin', 'admin')
      AND ur.deleted_at IS NULL
  )
);
