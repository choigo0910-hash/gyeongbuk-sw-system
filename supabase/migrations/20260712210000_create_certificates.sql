-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES program_applications(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL UNIQUE,
  participant_name TEXT NOT NULL,
  affiliation TEXT,
  program_name TEXT NOT NULL,
  program_start_at TIMESTAMPTZ NOT NULL,
  program_end_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  issued_at TIMESTAMPTZ NOT NULL,
  issued_by UUID NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  pdf_path TEXT,
  reissue_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: certificates
CREATE POLICY "Users can view own certificates"
ON certificates FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM program_applications
    WHERE program_applications.id = certificates.application_id
    AND program_applications.applicant_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM program_applications pa
    JOIN user_companies uc ON uc.company_id = pa.company_id
    WHERE pa.id = certificates.application_id
    AND uc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view certificates by company"
ON certificates FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM program_applications pa
    WHERE pa.id = certificates.application_id
    AND pa.company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can view all certificates"
ON certificates FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage certificates"
ON certificates FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

-- Indexes
CREATE INDEX idx_certificates_application ON certificates(application_id);
CREATE INDEX idx_certificates_document_number ON certificates(document_number);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX idx_certificates_issued_by ON certificates(issued_by);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certificates_updated_at
BEFORE UPDATE ON certificates FOR EACH ROW
EXECUTE FUNCTION update_certificates_updated_at();

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(encode(gen_random_bytes(16), 'hex'), 1, 12));
    SELECT EXISTS(SELECT 1 FROM certificates WHERE verification_code = code) INTO exists;
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  seq_num INTEGER;
  document_number TEXT;
BEGIN
  year := to_char(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(substring(document_number, 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM certificates
  WHERE document_number LIKE 'SW-' || year || '%';

  document_number := 'SW-' || year || '-' || LPAD(seq_num::TEXT, 5, '0');

  RETURN document_number;
END;
$$ LANGUAGE plpgsql;
