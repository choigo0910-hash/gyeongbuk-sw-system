-- RBAC and Companies System
-- This migration MUST be applied first before any other feature migrations

-- ============================================
-- 1. Roles (역할)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'super_admin', 'admin', 'staff', 'company_admin', 'company_user'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0, -- Higher level = more permissions (super_admin: 100, admin: 50, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. User Roles (사용자 역할 매핑)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    company_id UUID, -- Optional: for company-specific roles
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id, role_id, company_id)
);

-- ============================================
-- 3. Companies (기업 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_number VARCHAR(50) UNIQUE NOT NULL, -- 사업자등록번호
    representative_name VARCHAR(100),
    industry VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    founded_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. User Companies (사용자-기업 매핑)
-- ============================================
CREATE TABLE IF NOT EXISTS user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position VARCHAR(100), -- 직책
    is_primary BOOLEAN DEFAULT false, -- 대표 기업 여부
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id, company_id)
);

-- ============================================
-- 5. Programs (프로그램 - 기본)
-- ============================================
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    manager_id UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Add missing columns if they don't exist (for existing tables)
-- This handles cases where tables were manually created with different schemas
-- ============================================
DO $$
DECLARE
    col_name TEXT;
    col_type TEXT;
BEGIN
    -- Check and add columns to roles
    FOR col_name, col_type IN VALUES
        ('level', 'INTEGER'),
        ('updated_at', 'TIMESTAMPTZ')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'roles' AND column_name = col_name
        ) THEN
            EXECUTE format('ALTER TABLE roles ADD COLUMN IF NOT EXISTS %I %s', col_name, col_type);
            IF col_name = 'level' THEN
                EXECUTE 'ALTER TABLE roles ALTER COLUMN level SET DEFAULT 0';
            END IF;
            IF col_name = 'updated_at' THEN
                EXECUTE 'ALTER TABLE roles ALTER COLUMN updated_at SET DEFAULT NOW()';
            END IF;
        END IF;
    END LOOP;

    -- Check and add columns to user_roles
    FOR col_name, col_type IN VALUES
        ('company_id', 'UUID'),
        ('assigned_at', 'TIMESTAMPTZ'),
        ('assigned_by', 'UUID'),
        ('expires_at', 'TIMESTAMPTZ'),
        ('deleted_at', 'TIMESTAMPTZ')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_roles' AND column_name = col_name
        ) THEN
            EXECUTE format('ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS %I %s', col_name, col_type);
            IF col_name = 'assigned_at' THEN
                EXECUTE 'ALTER TABLE user_roles ALTER COLUMN assigned_at SET DEFAULT NOW()';
            END IF;
        END IF;
    END LOOP;

    -- Check and add columns to companies
    FOR col_name, col_type IN VALUES
        ('business_number', 'VARCHAR(50)'),
        ('representative_name', 'VARCHAR(100)'),
        ('industry', 'VARCHAR(100)'),
        ('address', 'TEXT'),
        ('phone', 'VARCHAR(50)'),
        ('email', 'VARCHAR(255)'),
        ('founded_date', 'DATE'),
        ('status', 'VARCHAR(20)'),
        ('deleted_at', 'TIMESTAMPTZ'),
        ('created_at', 'TIMESTAMPTZ'),
        ('updated_at', 'TIMESTAMPTZ')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'companies' AND column_name = col_name
        ) THEN
            EXECUTE format('ALTER TABLE companies ADD COLUMN IF NOT EXISTS %I %s', col_name, col_type);
            IF col_name = 'status' THEN
                EXECUTE 'ALTER TABLE companies ALTER COLUMN status SET DEFAULT ''active''';
            END IF;
            IF col_name = 'created_at' OR col_name = 'updated_at' THEN
                EXECUTE format('ALTER TABLE companies ALTER COLUMN %I SET DEFAULT NOW()', col_name);
            END IF;
        END IF;
    END LOOP;

    -- Check and add columns to user_companies
    FOR col_name, col_type IN VALUES
        ('position', 'VARCHAR(100)'),
        ('is_primary', 'BOOLEAN'),
        ('joined_at', 'TIMESTAMPTZ'),
        ('deleted_at', 'TIMESTAMPTZ')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_companies' AND column_name = col_name
        ) THEN
            EXECUTE format('ALTER TABLE user_companies ADD COLUMN IF NOT EXISTS %I %s', col_name, col_type);
            IF col_name = 'is_primary' THEN
                EXECUTE 'ALTER TABLE user_companies ALTER COLUMN is_primary SET DEFAULT false';
            END IF;
            IF col_name = 'joined_at' THEN
                EXECUTE 'ALTER TABLE user_companies ALTER COLUMN joined_at SET DEFAULT NOW()';
            END IF;
        END IF;
    END LOOP;

    -- Check and add columns to programs
    FOR col_name, col_type IN VALUES
        ('code', 'VARCHAR(50)'),
        ('start_date', 'DATE'),
        ('end_date', 'DATE'),
        ('status', 'VARCHAR(20)'),
        ('manager_id', 'UUID'),
        ('deleted_at', 'TIMESTAMPTZ'),
        ('created_at', 'TIMESTAMPTZ'),
        ('updated_at', 'TIMESTAMPTZ')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'programs' AND column_name = col_name
        ) THEN
            EXECUTE format('ALTER TABLE programs ADD COLUMN IF NOT EXISTS %I %s', col_name, col_type);
            IF col_name = 'status' THEN
                EXECUTE 'ALTER TABLE programs ALTER COLUMN status SET DEFAULT ''active''';
            END IF;
            IF col_name = 'created_at' OR col_name = 'updated_at' THEN
                EXECUTE format('ALTER TABLE programs ALTER COLUMN %I SET DEFAULT NOW()', col_name);
            END IF;
        END IF;
    END LOOP;

    -- Add unique constraint to companies.business_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'companies' AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE companies ADD CONSTRAINT companies_business_number_key UNIQUE (business_number);
    END IF;
END $$;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_business_number ON companies(business_number);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- ============================================
-- RLS Policies
-- ============================================

-- Roles: Public read for authenticated users
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles: Authenticated users can view"
ON roles FOR SELECT TO authenticated USING (true);

-- User Roles: Users can view their own roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User roles: View own roles"
ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR deleted_at IS NULL);

-- Companies: Users in company can view
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies: View own companies"
ON companies FOR SELECT TO authenticated USING (
    id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- Admins can view all companies
CREATE POLICY "Companies: Admins view all"
ON companies FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
    )
);

-- User Companies: Users can view their own memberships
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User companies: View own"
ON user_companies FOR SELECT TO authenticated USING (user_id = auth.uid() OR deleted_at IS NULL);

-- Programs: Public read for active programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs: View active programs"
ON programs FOR SELECT TO authenticated USING (status = 'active' OR deleted_at IS NULL);

-- ============================================
-- Initial Data: Roles
-- ============================================
INSERT INTO roles (code, name, description, level) VALUES
('super_admin', '최고 관리자', '시스템 전체 관리 권한', 100),
('admin', '관리자', '일반 관리자 권한', 50),
('staff', '스태프', '업무 처리 권한', 30),
('company_admin', '기업 관리자', '기업 내 관리자 권한', 20),
('company_user', '기업 사용자', '일반 기업 사용자', 10)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Updated at triggers (idempotent)
-- ============================================
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers only if they don't exist
DO $$
BEGIN
    -- roles_updated_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'roles_updated_at'
    ) THEN
        CREATE TRIGGER roles_updated_at
        BEFORE UPDATE ON roles FOR EACH ROW
        EXECUTE FUNCTION update_roles_updated_at();
    END IF;

    -- companies_updated_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'companies_updated_at'
    ) THEN
        CREATE TRIGGER companies_updated_at
        BEFORE UPDATE ON companies FOR EACH ROW
        EXECUTE FUNCTION update_companies_updated_at();
    END IF;

    -- programs_updated_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'programs_updated_at'
    ) THEN
        CREATE TRIGGER programs_updated_at
        BEFORE UPDATE ON programs FOR EACH ROW
        EXECUTE FUNCTION update_programs_updated_at();
    END IF;
END $$;
