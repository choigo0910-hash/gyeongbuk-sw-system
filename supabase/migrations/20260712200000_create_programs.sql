-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  application_opens_at TIMESTAMPTZ,
  application_closes_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location TEXT,
  capacity INTEGER,
  current_applicants INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program applications table
CREATE TABLE program_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  company_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  application_data JSONB,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program attendances table
CREATE TABLE program_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES program_applications(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL,
  date DATE NOT NULL,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, application_id, date)
);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_attendances ENABLE ROW LEVEL SECURITY;

-- RLS Policies: programs (모든 인증된 사용자가 조회 가능, 관리자만 생성/수정/삭제)
CREATE POLICY "All users can view programs"
ON programs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage programs"
ON programs FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

-- RLS Policies: program_applications
CREATE POLICY "Users can view own applications"
ON program_applications FOR SELECT TO authenticated USING (
  applicant_id = auth.uid()
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all applications"
ON program_applications FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can insert own applications"
ON program_applications FOR INSERT TO authenticated WITH CHECK (
  applicant_id = auth.uid()
);

CREATE POLICY "Users can update own applications"
ON program_applications FOR UPDATE TO authenticated USING (
  applicant_id = auth.uid()
  AND status IN ('draft', 'revision_requested')
);

CREATE POLICY "Admins can manage all applications"
ON program_applications FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

-- RLS Policies: program_attendances
CREATE POLICY "Users can view own attendances"
ON program_attendances FOR SELECT TO authenticated USING (
  attendee_id = auth.uid()
);

CREATE POLICY "Admins can view all attendances"
ON program_attendances FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage attendances"
ON program_attendances FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

-- Indexes
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_dates ON programs(starts_at, ends_at);
CREATE INDEX idx_program_applications_program ON program_applications(program_id);
CREATE INDEX idx_program_applications_applicant ON program_applications(applicant_id);
CREATE INDEX idx_program_applications_status ON program_applications(status);
CREATE INDEX idx_program_attendances_program ON program_attendances(program_id);
CREATE INDEX idx_program_attendances_application ON program_attendances(application_id);
CREATE INDEX idx_program_attendances_date ON program_attendances(date);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER programs_updated_at
BEFORE UPDATE ON programs FOR EACH ROW
EXECUTE FUNCTION update_programs_updated_at();

CREATE OR REPLACE FUNCTION update_program_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER program_applications_updated_at
BEFORE UPDATE ON program_applications FOR EACH ROW
EXECUTE FUNCTION update_program_applications_updated_at();

CREATE OR REPLACE FUNCTION update_program_attendances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER program_attendances_updated_at
BEFORE UPDATE ON program_attendances FOR EACH ROW
EXECUTE FUNCTION update_program_attendances_updated_at();
