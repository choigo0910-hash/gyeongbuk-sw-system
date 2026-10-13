-- 완전히 새로운 RLS 정책으로 재설정
-- 기존 정책 모두 제거 후 간단한 정책만 적용

-- 1. 기존 정책 모두 제거
DROP POLICY IF EXISTS "Companies: Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Companies: Admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Companies: Company admins can view own company" ON companies;
DROP POLICY IF EXISTS "Companies: Company users can view their company" ON companies;
DROP POLICY IF EXISTS "Companies: Users can view their company" ON companies;
DROP POLICY IF EXISTS "Companies: Company admins can update own company" ON companies;
DROP POLICY IF EXISTS "Companies: Super admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Companies: Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Companies: Service role can manage companies" ON companies;

-- 2. RLS 비활성화 (임시)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 또는 간단한 정책만 적용 (아래 주석 해제 후 사용)
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Enable all for companies" ON companies FOR ALL USING (true);
