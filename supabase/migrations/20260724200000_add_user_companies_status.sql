-- Add status column to user_companies for approval workflow
-- pending: 승인 대기 중
-- active: 승인 완료
-- rejected: 승인 반려

ALTER TABLE user_companies
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_companies_status ON user_companies(status);

-- Update RLS policies to handle status

-- Users can view their own company memberships regardless of status
DROP POLICY IF EXISTS "User companies: View own" ON user_companies;
CREATE POLICY "User companies: View own"
ON user_companies FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all pending company memberships
CREATE POLICY "User companies: Admins view pending"
ON user_companies FOR SELECT
TO authenticated
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code IN ('admin', 'super_admin')
  )
);

-- Company admins can view pending members for their companies
CREATE POLICY "User companies: Company admins view pending"
ON user_companies FOR SELECT
TO authenticated
USING (
  status = 'pending' AND
  company_id IN (
    SELECT uc.company_id
    FROM user_companies uc
    JOIN user_roles ur ON ur.user_id = uc.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE uc.user_id = auth.uid()
    AND r.code = 'company_admin'
    AND uc.status = 'active'
  )
);

-- Users can update status (approvals) based on their role
CREATE POLICY "User companies: Update status"
ON user_companies FOR UPDATE
TO authenticated
USING (
  -- Admins can approve representative registrations
  (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code IN ('admin', 'super_admin')
  ) AND EXISTS (
    -- Check if target user is applying for company_admin role
    SELECT 1 FROM user_roles ur2
    JOIN roles r2 ON r2.id = ur2.role_id
    WHERE ur2.user_id = user_companies.user_id
    AND r2.code = 'company_admin'
  )) OR
  -- Company admins can approve team member registrations
  (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code = 'company_admin'
  ) AND company_id IN (
    SELECT company_id
    FROM user_companies
    WHERE user_id = auth.uid()
    AND status = 'active'
  ) AND EXISTS (
    -- Check if target user is applying for company_user role
    SELECT 1 FROM user_roles ur2
    JOIN roles r2 ON r2.id = ur2.role_id
    WHERE ur2.user_id = user_companies.user_id
    AND r2.code = 'company_user'
  ))
)
WITH CHECK (
  -- Only allow changing status to 'active' or 'rejected'
  status IN ('active', 'rejected')
);
