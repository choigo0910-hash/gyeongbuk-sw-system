-- Company Documents (기업 서류 제출)
-- 사업자등록증, 중간 성과 보고서, 최종 성과 보고서

-- ============================================
-- 1. Company Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 문서 정보
  document_type VARCHAR(50) NOT NULL, -- 'business_registration', 'interim_report', 'final_report'
  title TEXT NOT NULL,                 -- 문서 제목 (사용자 입력 또는 자동 생성)
  description TEXT,                    -- 설명

  -- 파일 정보
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,

  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,

  -- 검토 정보
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- 감사 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- 2. Storage Bucket
-- ============================================
-- Supabase Storage에 'company-documents' 버킷 생성 필요
-- 수동 생성 또는 다음 SQL 실행:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('company-documents', 'company-documents', false);
--
-- Public URL을 위한 정책:
-- INSERT INTO storage.policies (name, bucket_id, definition)
-- VALUES (
--   'Company Documents Public Read',
--   'company-documents',
--   '{"SELECT": true}'::jsonb
-- );

-- ============================================
-- 3. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_company_documents_company ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_type ON company_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_company_documents_status ON company_documents(status);
CREATE INDEX IF NOT EXISTS idx_company_documents_submitted ON company_documents(submitted_at DESC);

-- ============================================
-- 4. RLS Policies
-- ============================================
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

-- 기업 사용자: 자사 문서만 조회 가능
CREATE POLICY "Company users can view own documents"
ON company_documents FOR SELECT TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND deleted_at IS NULL)
  AND deleted_at IS NULL
);

-- 관리자: 전체 문서 조회 가능
CREATE POLICY "Admins can view all documents"
ON company_documents FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

-- 기업 사용자: 자사 문서만 생성 가능
CREATE POLICY "Company users can insert own documents"
ON company_documents FOR INSERT TO authenticated WITH CHECK (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND deleted_at IS NULL)
);

-- 관리자: 모든 문서 생성 가능
CREATE POLICY "Admins can insert any documents"
ON company_documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

-- 기업 사용자: 자사 문서만 수정 가능 (draft 상태만)
CREATE POLICY "Company users can update own draft documents"
ON company_documents FOR UPDATE TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND deleted_at IS NULL)
  AND status = 'draft'
  AND deleted_at IS NULL
);

-- 기업 사용자: 제출 가능 (draft → submitted)
CREATE POLICY "Company users can submit own documents"
ON company_documents FOR UPDATE TO authenticated USING (
  company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND deleted_at IS NULL)
  AND status = 'draft'
  AND deleted_at IS NULL
);

-- 관리자: 검토/승인 가능
CREATE POLICY "Admins can review documents"
ON company_documents FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.id = ur.role_id
    WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
  )
);

-- ============================================
-- 5. Updated At Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_company_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'company_documents_updated_at'
  ) THEN
    CREATE TRIGGER company_documents_updated_at
    BEFORE UPDATE ON company_documents FOR EACH ROW
    EXECUTE FUNCTION update_company_documents_updated_at();
  END IF;
END $$;

-- ============================================
-- 6. Comments
-- ============================================
COMMENT ON TABLE company_documents IS '기업 서류 (사업자등록증, 성과 보고서)';
COMMENT ON COLUMN company_documents.document_type IS '문서 유형: business_registration(사업자등록증), interim_report(중간 성과 보고서), final_report(최종 성과 보고서)';
COMMENT ON COLUMN company_documents.status IS '상태: draft(작성중), submitted(제출완료), approved(승인), rejected(반려)';
