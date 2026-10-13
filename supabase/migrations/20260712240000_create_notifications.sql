-- 알림 시스템 테이블 생성
-- 작성일: 2026-07-12

-- ============================================
-- 1. 알림 설정 (notification_settings)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL, -- 'budget_reviewed', 'purchase_approved', 'refund_paid', 'program_approved', etc.
    is_enabled BOOLEAN DEFAULT true,
    notification_type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'in_app'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, setting_key, notification_type)
);

-- 인덱스 생성
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_settings_key ON notification_settings(setting_key);

-- ============================================
-- 2. 알림 히스토리 (notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'budget_reviewed', 'purchase_approved', 'refund_paid', 'program_approved', etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    link TEXT, -- 관련 링크
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    sent_email BOOLEAN DEFAULT false,
    sent_email_at TIMESTAMPTZ,
    sent_sms BOOLEAN DEFAULT false,
    sent_sms_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- 3. 이메일 템플릿 (email_templates)
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL, -- 'budget_reviewed', 'purchase_approved', etc.
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_email_templates_key ON email_templates(template_key);

-- ============================================
-- RLS 정책
-- ============================================

-- notification_settings 테이블 RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "알림설정: 사용자는 자신의 설정만 조회 가능"
ON notification_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "알림설정: 사용자는 자신의 설정만 생성 가능"
ON notification_settings FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "알림설정: 사용자는 자신의 설정만 수정 가능"
ON notification_settings FOR UPDATE
USING (user_id = auth.uid());

-- notifications 테이블 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "알림: 사용자는 자신의 알림만 조회 가능"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "알림: 사용者是自신의 알림만 수정 가능"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- email_templates 테이블 RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "이메일템플릿: 인증된 사용자는 active만 조회 가능"
ON email_templates FOR SELECT
USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "이메일템플릿: 관리자는 모두 조회 가능"
ON email_templates FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    OR deleted_at IS NULL
);

CREATE POLICY "이메일템플릿: 관리자만 생성 가능"
ON email_templates FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "이메일템플릿: 관리자만 수정 가능"
ON email_templates FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "이메일템플릿: 관리자만 soft delete 가능"
ON email_templates FOR UPDATE
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

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 초기 데이터: 기본 알림 설정
-- ============================================

-- 기본 알림 타입 정의 함수
CREATE OR REPLACE FUNCTION create_default_notification_settings(user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notification_settings (user_id, setting_key, is_enabled, notification_type)
    VALUES
        -- 예산 관련
        (user_id, 'budget_submitted', true, 'in_app'),
        (user_id, 'budget_reviewed', true, 'email'),
        (user_id, 'budget_approved', true, 'email'),
        (user_id, 'budget_rejected', true, 'email'),
        -- 구매 요청 관련
        (user_id, 'purchase_submitted', true, 'in_app'),
        (user_id, 'purchase_approved', true, 'email'),
        (user_id, 'purchase_rejected', true, 'email'),
        (user_id, 'purchase_proof_approved', true, 'email'),
        (user_id, 'purchase_proof_rejected', true, 'email'),
        -- 환급 관련
        (user_id, 'refund_submitted', true, 'in_app'),
        (user_id, 'refund_approved', true, 'email'),
        (user_id, 'refund_paid', true, 'email'),
        (user_id, 'refund_rejected', true, 'email'),
        -- 프로그램 관련 (통합)
        (user_id, 'program_notifications', true, 'email'),
        -- 확인서 관련
        (user_id, 'certificate_issued', true, 'email'),
        -- 시스템 관련
        (user_id, 'system_notice', true, 'in_app')
    ON CONFLICT (user_id, setting_key, notification_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 초기 데이터: 이메일 템플릿
-- ============================================

INSERT INTO email_templates (template_key, subject, body, description) VALUES
-- 예산 관련
('budget_reviewed', '예산서 검토 완료 안내', '<h2>예산서 검토 결과</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>제출하신 예산서에 대한 검토가 완료되었습니다.</p>

<p><strong>검토 결과:</strong> {{result}}</p>
<p><strong>검토 의견:</strong> {{review_comment}}</p>

<p>{{#if approved}}
<a href="{{budget_link}}">예산서 상세보기</a>에서 확인하실 수 있습니다.
{{/if}}</p>

<p>감사합니다.</p>', '예산서 검토 완료 시'),

('budget_approved', '예산서 승인 안내', '<h2>예산서 승인 완료</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>제출하신 예산서가 승인되었습니다.</p>

<ul>
    <li>연도: {{fiscal_year}}</li>
    <li>승인 금액: {{approved_amount}}원</li>
    <li>승인 일자: {{approved_at}}</li>
</ul>

<p><a href="{{budget_link}}">예산서 상세보기</a></p>

<p>감사합니다.</p>', '예산서 승인 시'),

('budget_rejected', '예산서 반려 안내', '<h2>예산서 반려 안내</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>제출하신 예산서가 반려되었습니다.</p>

<p><strong>반려 사유:</strong> {{rejection_reason}}</p>

<p>사유를 확인하신 후 수정하여 다시 제출해주시기 바랍니다.</p>

<p><a href="{{budget_link}}">예산서 수정하기</a></p>

<p>감사합니다.</p>', '예산서 반려 시'),

-- 구매 요청 관련
('purchase_approved', '구매요청 승인 안내', '<h2>구매요청 승인 완료</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>구매요청이 승인되었습니다.</p>

<ul>
    <li>품목: {{item_name}}</li>
    <li>승인 금액: {{approved_amount}}원</li>
</ul>

<p>증빙서류를 제출해주시기 바랍니다.</p>

<p><a href="{{purchase_link}}">증빙서류 제출하기</a></p>

<p>감사합니다.</p>', '구매요청 승인 시'),

('purchase_rejected', '구매요청 반려 안내', '<h2>구매요청 반려 안내</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>구매요청이 반려되었습니다.</p>

<p><strong>반려 사유:</strong> {{rejection_reason}}</p>

<p><a href="{{purchase_link}}">상세보기</a></p>

<p>감사합니다.</p>', '구매요청 반려 시'),

-- 환급 관련
('refund_approved', '환급신청 승인 안내', '<h2>환급신청 승인 완료</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>환급신청이 승인되었습니다.</p>

<ul>
    <li>환급 금액: {{approved_amount}}원</li>
    <li>입금 계좌: {{bank_name}} {{account_number}}</li>
    <li>예상 입금일: 2~3 영업일 내</li>
</ul>

<p><a href="{{refund_link}}">상세보기</a></p>

<p>감사합니다.</p>', '환급신청 승인 시'),

('refund_paid', '환급금 지급 완료', '<h2>환급금 지급 완료</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>환급금이 지급되었습니다.</p>

<ul>
    <li>지급 금액: {{paid_amount}}원</li>
    <li>지급 일자: {{paid_at}}</li>
</ul>

<p><a href="{{refund_link}}">상세보기</a></p>

<p>감사합니다.</p>', '환급금 지급 시'),

-- 프로그램 관련
('program_published', '새로운 프로그램 안내', '<h2>새로운 프로그램 오픈</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>새로운 프로그램이 오픈되었습니다.</p>

<h3>{{program_name}}</h3>

<p>{{program_description}}</p>

<ul>
    <li>신청 기간: {{application_period}}</li>
    <li>프로그램 기간: {{program_period}}</li>
    <li>장소: {{location}}</li>
</ul>

<p><a href="{{program_link}}">신청하기</a></p>

<p>감사합니다.</p>', '새로운 프로그램 오픈 시'),

('program_application_approved', '프로그램 참가 신청 승인', '<h2>프로그램 참가 신청 승인</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>프로그램 참가 신청이 승인되었습니다.</p>

<h3>{{program_name}}</h3>

<ul>
    <li>프로그램 기간: {{program_period}}</li>
    <li>장소: {{location}}</li>
</ul>

<p>참가해주셔서 감사합니다.</p>

<p><a href="{{application_link}}">상세보기</a></p>', '프로그램 참가 신청 승인 시'),

-- 확인서 관련
('certificate_issued', '확인서 발급 완료', '<h2>확인서 발급 완료</h2>

<p>안녕하세요, {{user_name}}님.</p>

<p>확인서가 발급되었습니다.</p>

<ul>
    <li>프로그램: {{program_name}}</li>
    <li>참가 기간: {{program_period}}</li>
    <li>발급 번호: {{certificate_number}}</li>
</ul>

<p><a href="{{certificate_link}}">확인서 다운로드</a></p>

<p>감사합니다.</p>', '확인서 발급 시'),

-- 시스템 관련
('system_notice', '중요 공지사항', '<h2>{{notice_title}}</h2>

<p>{{notice_content}}</p>

<p><a href="{{notice_link}}">자세히 보기</a></p>

<p>감사합니다.</p>', '시스템 공지사항');

COMMENT ON TABLE notification_settings IS '알림 설정 테이블';
COMMENT ON TABLE notifications IS '알림 히스토리 테이블';
COMMENT ON TABLE email_templates IS '이메일 템플릿 테이블';
