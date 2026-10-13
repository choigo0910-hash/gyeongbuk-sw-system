-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (code, name, description) VALUES
  ('company_user', '기업 사용자', '성장기업으로 선정된 기업 소속 사용자'),
  ('individual_user', '개인 참가자', '기업에 소속되지 않은 외부 개인 참가자'),
  ('admin', '운영 관리자', '사업 운영을 담당하는 관리자'),
  ('super_admin', '최고 관리자', '시스템 전체를 관리하는 최고 권한자');

-- User roles junction table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users(id)
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  ceo_name TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User companies junction table (for company users)
CREATE TABLE user_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users(id)
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies: roles (all authenticated users can read)
CREATE POLICY "All authenticated users can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- RLS Policies: user_roles
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users cannot modify own roles directly"
ON user_roles FOR ALL
TO authenticated
USING (false); -- Roles managed by admin only

-- RLS Policies: companies
CREATE POLICY "Super admins can view all companies"
ON companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code = 'super_admin'
  )
);

CREATE POLICY "Company users can view own company"
ON companies FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies: user_companies
CREATE POLICY "Users can view own company associations"
ON user_companies FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = has_role.user_id
    AND r.code = has_role.role_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's company IDs
CREATE OR REPLACE FUNCTION get_user_company_ids(user_id UUID)
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT company_id FROM user_companies
    WHERE user_id = get_user_company_ids.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's roles
CREATE OR REPLACE FUNCTION get_user_roles(user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT r.code FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = get_user_roles.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
