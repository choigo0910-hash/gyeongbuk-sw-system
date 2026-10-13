-- 가이드라인 시스템 테이블 생성
-- 작성일: 2026-07-12

-- ============================================
-- 1. 가이드 문서 (guides)
-- ============================================
CREATE TABLE IF NOT EXISTS guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50), -- 'getting-started', 'budget', 'purchase', 'refund', 'program', 'certificate'
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_guides_category ON guides(category);
CREATE INDEX idx_guides_slug ON guides(slug);
CREATE INDEX idx_guides_is_published ON guides(is_published) WHERE deleted_at IS NULL;

-- ============================================
-- 2. 자주 묻는 질문 (faqs)
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50), -- 'general', 'budget', 'purchase', 'refund', 'program', 'certificate', 'account'
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_is_published ON faqs(is_published) WHERE deleted_at IS NULL;

-- ============================================
-- 3. 공지사항 (notices)
-- ============================================
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- 'general', 'maintenance', 'urgent', 'event'
    is_important BOOLEAN DEFAULT false, -- 상단 고정 여부
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_notices_is_important ON notices(is_important) WHERE deleted_at IS NULL;
CREATE INDEX idx_notices_published_at ON notices(published_at DESC) WHERE is_published = true AND deleted_at IS NULL;

-- ============================================
-- 4. 서류 양식 (document_templates)
-- ============================================
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'budget', 'purchase', 'refund', 'program', 'certificate', 'general'
    file_url TEXT NOT NULL, -- Supabase Storage 경로
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER, -- bytes
    download_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20), -- 양식 버전 (예: v1.0, v2.0)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_is_active ON document_templates(is_active) WHERE deleted_at IS NULL;

-- ============================================
-- RLS 정책
-- ============================================

-- guides 테이블 RLS
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "가이드: 인증된 사용자는 published만 조회 가능"
ON guides FOR SELECT
USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "가이드: 관리자는 모두 조회 가능"
ON guides FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.code IN ('admin', 'super_admin')
    )
    OR deleted_at IS NULL
);

CREATE POLICY "가이드: 관리자만 생성 가능"
ON guides FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "가이드: 관리자만 수정 가능"
ON guides FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "가이드: 관리자만 soft delete 가능"
ON guides FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
)
WITH CHECK (deleted_at IS NOT NULL OR deleted_at IS NULL);

-- faqs 테이블 RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq: 인증된 사용자는 published만 조회 가능"
ON faqs FOR SELECT
USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "faq: 관리자는 모두 조회 가능"
ON faqs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    OR deleted_at IS NULL
);

CREATE POLICY "faq: 관리자만 생성 가능"
ON faqs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "faq: 관리자만 수정 가능"
ON faqs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "faq: 관리자만 soft delete 가능"
ON faqs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
)
WITH CHECK (deleted_at IS NOT NULL OR deleted_at IS NULL);

-- notices 테이블 RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공지사항: 인증된 사용자는 published만 조회 가능"
ON notices FOR SELECT
USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "공지사항: 관리자는 모두 조회 가능"
ON notices FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    OR deleted_at IS NULL
);

CREATE POLICY "공지사항: 관리자만 생성 가능"
ON notices FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "공지사항: 관리자만 수정 가능"
ON notices FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "공지사항: 관리자만 soft delete 가능"
ON notices FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
)
WITH CHECK (deleted_at IS NOT NULL OR deleted_at IS NULL);

-- document_templates 테이블 RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "서류양식: 인증된 사용자는 active만 조회 가능"
ON document_templates FOR SELECT
USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "서류양식: 관리자는 모두 조회 가능"
ON document_templates FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    OR deleted_at IS NULL
);

CREATE POLICY "서류양식: 관리자만 생성 가능"
ON document_templates FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "서류양식: 관리자만 수정 가능"
ON document_templates FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "서류양식: 관리자만 soft delete 가능"
ON document_templates FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
)
WITH CHECK (deleted_at IS NOT NULL OR deleted_at IS NULL);

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guides_updated_at
    BEFORE UPDATE ON guides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
    BEFORE UPDATE ON document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 초기 데이터 (선택 사항)
-- ============================================

-- 가이드 문서 초기 데이터
INSERT INTO guides (title, slug, content, category, sort_order, is_published) VALUES
('시작하기', 'getting-started', '경북 SW 성장기업육성지원사업 통합 관리 시스템에 오신 것을 환영합니다.\n\n## 시스템 소개\n본 시스템은 예산관리, 구매요청, 환급신청, 프로그램 신청, 확인서 발급 등의 업무를 온라인으로 처리할 수 있는 통합 플랫폼입니다.\n\n## 첫 접속 시\n1. 로그인 후 비밀번호를 변경하세요.\n2. 기업 정보를 등록하세요.\n3. 각 메뉴를 통해 필요한 업무를 진행하세요.', 'getting-started', 1, true),
('예산관리 가이드', 'budget-guide', '## 예산서 작성 방법\n\n1. **예산서 작성** 메뉴로 이동\n2. 연도, 사업비, 예산 항목 입력\n3. 저장 후 제출\n\n## 주의사항\n- 예산 항목은 세목 단위로 작성해야 합니다.\n- 제출 후 수정이 불가능하니 신중히 작성하세요.', 'budget', 2, true),
('구매요청 가이드', 'purchase-guide', '## 결제 및 구매 요청 방법\n\n1. **구매요청 작성** 메뉴로 이동\n2. 구매 분류를 선택합니다.\n3. 해당 분류에 맞는 정보를 입력합니다.\n4. 증빙서류를 제출합니다.\n\n## 구매 분류 안내\n- 집행품: 물품 구매 시\n- 운영비: 운영 비용 지출 시\n- 회비: 회비 납부 시\n- 인건비: 인건비 지급 시\n- 기타: 기타 지출 시', 'purchase', 3, true),
('환급신청 가이드', 'refund-guide', '## 환급신청 방법\n\n1. **환급신청** 메뉴로 이동\n2. 환급 항목을 선택합니다.\n3. 금액과 입금 정보를 입력합니다.\n4. 증빙서류를 제출합니다.\n\n## 환급 기간\n- 신청 후 검토까지 3~5 영업일 소요\n- 승인 후 입금까지 2~3 영업일 소요', 'refund', 4, true);

-- FAQ 초기 데이터
INSERT INTO faqs (question, answer, category, sort_order, is_published) VALUES
('시스템 이용 시간은 언제인가요?', '본 시스템은 연중무휴 24시간 이용 가능합니다. 단, 정기 점검 시간은 이용이 제한될 수 있습니다.', 'general', 1, true),
('비밀번호를 잊어버렸습니다.', '로그인 화면에서 [비밀번호 찾기]를 클릭하여 이메일로 비밀번호를 재설정할 수 있습니다.', 'account', 2, true),
('예산서를 수정하려면 어떻게 하나요?', '제출 전에는 언제든 수정 가능합니다. 제출 후에는 관리자 승인 전에만 수정 요청이 가능합니다.', 'budget', 3, true),
('환급 신청 후 언제 입금되나요?', '승인 후 2~3 영업일 이내에 지정된 계좌로 입금됩니다.', 'refund', 4, true),
('증빙서류는 어떤 형식으로 제출해야 하나요?', 'PDF, JPG, PNG 형식의 파일로 제출해야 하며, 파일 크기는 5MB 이하여야 합니다.', 'general', 5, true);

-- 공지사항 초기 데이터
INSERT INTO notices (title, content, category, is_important, is_published, published_at) VALUES
('[공지] 시스템 오픈 안내', '경북 SW 성장기업육성지원사업 통합 관리 시스템이 오픈되었습니다.\n\n각종 신청 및 조회 업무를 온라인으로 편리하게 이용하실 수 있습니다.', 'general', true, true, NOW()),
('[안내] 서류 양식 다운로드', '필요한 서류 양식은 [서류 양식] 메뉴에서 다운로드하여 사용하시기 바랍니다.', 'general', false, true, NOW());

COMMENT ON TABLE guides IS '가이드 문서 테이블';
COMMENT ON TABLE faqs IS '자주 묻는 질문 테이블';
COMMENT ON TABLE notices IS '공지사항 테이블';
COMMENT ON TABLE document_templates IS '서류 양식 테이블';
