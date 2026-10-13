-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Refund applications table
CREATE TABLE refund_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  refund_recipient_name TEXT NOT NULL,
  refund_recipient_type TEXT NOT NULL DEFAULT 'company',
  requested_amount INTEGER NOT NULL,
  approved_amount INTEGER,
  paid_amount INTEGER,
  payment_date TIMESTAMPTZ NOT NULL,
  vendor TEXT NOT NULL,
  purpose TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  category TEXT NOT NULL,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_by UUID,
  paid_at TIMESTAMPTZ,
  rejection_reason TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund proof documents table
CREATE TABLE refund_proof_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_application_id UUID NOT NULL REFERENCES refund_applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE refund_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_proof_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: refund_applications
CREATE POLICY "Company users can view own refund applications"
ON refund_applications FOR SELECT TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all refund applications"
ON refund_applications FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Company users can insert own refund applications"
ON refund_applications FOR INSERT TO authenticated WITH CHECK (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "Company users can update own refund applications"
ON refund_applications FOR UPDATE TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- RLS Policies: refund_proof_documents
CREATE POLICY "Users can view proofs for accessible refund applications"
ON refund_proof_documents FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM refund_applications
    WHERE refund_applications.id = refund_proof_documents.refund_application_id
    AND (
      refund_applications.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
      )
    )
  )
);

CREATE POLICY "Users can insert proofs for own refund applications"
ON refund_proof_documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM refund_applications
    WHERE refund_applications.id = refund_proof_documents.refund_application_id
    AND refund_applications.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
  )
);

-- Indexes
CREATE INDEX idx_refund_applications_company ON refund_applications(company_id);
CREATE INDEX idx_refund_applications_status ON refund_applications(status);
CREATE INDEX idx_refund_applications_applicant ON refund_applications(applicant_id);
CREATE INDEX idx_refund_applications_payment_date ON refund_applications(payment_date);
CREATE INDEX idx_refund_proof_documents_application ON refund_proof_documents(refund_application_id);

-- Updated at trigger for refund_applications
CREATE OR REPLACE FUNCTION update_refund_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refund_applications_updated_at
BEFORE UPDATE ON refund_applications FOR EACH ROW
EXECUTE FUNCTION update_refund_applications_updated_at();
