-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Purchase requests table
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER,
  requested_amount INTEGER NOT NULL,
  approved_amount INTEGER,
  paid_amount INTEGER,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  purpose TEXT,
  purchase_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proof documents table
CREATE TABLE proof_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: purchase_requests
CREATE POLICY "Company users can view own purchase requests"
ON purchase_requests FOR SELECT TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all purchase requests"
ON purchase_requests FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Company users can insert own purchase requests"
ON purchase_requests FOR INSERT TO authenticated WITH CHECK (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "Company users can update own purchase requests"
ON purchase_requests FOR UPDATE TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- RLS Policies: proof_documents
CREATE POLICY "Users can view proofs for accessible purchase requests"
ON proof_documents FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM purchase_requests
    WHERE purchase_requests.id = proof_documents.purchase_request_id
    AND (
      purchase_requests.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
      )
    )
  )
);

CREATE POLICY "Users can insert proofs for own purchase requests"
ON proof_documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM purchase_requests
    WHERE purchase_requests.id = proof_documents.purchase_request_id
    AND purchase_requests.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
  )
);

-- Indexes
CREATE INDEX idx_purchase_requests_company ON purchase_requests(company_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_requests_requester ON purchase_requests(requester_id);
CREATE INDEX idx_proof_documents_request ON proof_documents(purchase_request_id);

-- Updated at trigger for purchase_requests
CREATE OR REPLACE FUNCTION update_purchase_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_requests_updated_at
BEFORE UPDATE ON purchase_requests FOR EACH ROW
EXECUTE FUNCTION update_purchase_requests_updated_at();
