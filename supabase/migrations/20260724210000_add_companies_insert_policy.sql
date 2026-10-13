-- Allow authenticated users to insert companies (for signup)
-- This allows new users to create a company during registration
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies: Authenticated users can insert" ON companies;
CREATE POLICY "Companies: Authenticated users can insert"
ON companies FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow updating own company
DROP POLICY IF EXISTS "Companies: Update own company" ON companies;
CREATE POLICY "Companies: Update own company"
ON companies FOR UPDATE TO authenticated
USING (
  id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
)
WITH CHECK (
  id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);
