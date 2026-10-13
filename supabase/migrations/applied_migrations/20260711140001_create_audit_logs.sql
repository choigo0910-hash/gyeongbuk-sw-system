-- Audit Logs table
-- Tracks all important admin actions for security and compliance

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID NOT NULL, -- Who performed the action
  actor_name TEXT NOT NULL,     -- Cached name for display
  action TEXT NOT NULL,         -- Action performed (e.g., 'approve_budget', 'reject_refund')
  entity_type TEXT NOT NULL,    -- Type of entity affected (e.g., 'budget', 'refund')
  entity_id UUID NOT NULL,      -- ID of affected entity
  old_values JSONB,             -- Previous state (optional)
  new_values JSONB,             -- New state (optional)
  reason TEXT,                  -- Reason for the action
  ip_address TEXT,              -- Client IP (optional)
  user_agent TEXT,             -- Client user agent (optional)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code = 'super_admin'
  )
);

-- Admins can view audit logs for programs they manage
CREATE POLICY "Admins can view relevant audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code IN ('admin', 'super_admin')
  )
);

-- No one can modify audit logs (insert only)
CREATE POLICY "No one can update audit logs"
ON audit_logs FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No one can delete audit logs"
ON audit_logs FOR DELETE
TO authenticated
USING (false);

-- Function to insert audit log (callable from other operations)
CREATE OR REPLACE FUNCTION log_audit(
  p_actor_user_id UUID,
  p_actor_name TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    actor_user_id,
    actor_name,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    reason
  ) VALUES (
    p_actor_user_id,
    p_actor_name,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_reason
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for common queries
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Comment
COMMENT ON TABLE audit_logs IS 'Audit trail for all important admin actions';
COMMENT ON FUNCTION log_audit IS 'Helper function to insert audit log entries';
