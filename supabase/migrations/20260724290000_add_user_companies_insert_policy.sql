-- Allow users to insert their own company join requests
CREATE POLICY "User companies: Insert own requests"
ON user_companies FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

-- Allow users to update their own company membership status (for soft delete)
CREATE POLICY "User companies: Update own"
ON user_companies FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
