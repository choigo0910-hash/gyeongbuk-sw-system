-- 챗봇 시스템 테이블 생성
-- 작성일: 2026-07-12

-- ============================================
-- 1. 채팅 세션 (chat_conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255), -- 채팅 요약 (자동 생성)
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'deleted'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX idx_chat_conversations_started_at ON chat_conversations(started_at DESC);

-- ============================================
-- 2. 채팅 메시지 (chat_messages)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- 추가 정보 (tokens, model, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at ASC);

-- ============================================
-- 3. 챗봇 지식 베이스 (chatbot_knowledge) - 선택적
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'general', 'budget', 'purchase', 'refund', 'program', 'certificate'
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[], -- 검색 키워드
    priority INTEGER DEFAULT 0, -- 우선순위
    is_active BOOLEAN DEFAULT true,
    hit_count INTEGER DEFAULT 0, -- 조회 횟수
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_chatbot_knowledge_category ON chatbot_knowledge(category);
CREATE INDEX idx_chatbot_knowledge_is_active ON chatbot_knowledge(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_chatbot_knowledge_keywords ON chatbot_knowledge USING GIN(keywords);

-- ============================================
-- RLS 정책
-- ============================================

-- chat_conversations 테이블 RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "채팅세션: 사용자는 자신의 세션만 조회 가능"
ON chat_conversations FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    AND deleted_at IS NULL
);

CREATE POLICY "채팅세션: 사용자는 자신의 세션만 생성 가능"
ON chat_conversations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "채팅세션: 사용자는 자신의 세션만 수정 가능"
ON chat_conversations FOR UPDATE
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    AND deleted_at IS NULL
);

CREATE POLICY "채팅세션: 관리자만 soft delete 가능"
ON chat_conversations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    AND deleted_at IS NULL
)
WITH CHECK (deleted_at IS NOT NULL OR deleted_at IS NULL);

-- chat_messages 테이블 RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "채팅메시지: 사용자는 자신의 세션 메시지만 조회 가능"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND (chat_conversations.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
                AND r.code IN ('admin', 'super_admin')
            ))
        AND chat_conversations.deleted_at IS NULL
    )
);

CREATE POLICY "채팅메시지: 사용자는 자신의 세션에 메시지 생성 가능"
ON chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = conversation_id
        AND chat_conversations.user_id = auth.uid()
        AND chat_conversations.deleted_at IS NULL
    )
);

-- chatbot_knowledge 테이블 RLS
ALTER TABLE chatbot_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "지식베이스: 인증된 사용자는 active만 조회 가능"
ON chatbot_knowledge FOR SELECT
USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "지식베이스: 관리자는 모두 조회 가능"
ON chatbot_knowledge FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
    OR deleted_at IS NULL
);

CREATE POLICY "지식베이스: 관리자만 생성 가능"
ON chatbot_knowledge FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "지식베이스: 관리자만 수정 가능"
ON chatbot_knowledge FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('admin', 'super_admin')
    )
);

CREATE POLICY "지식베이스: 관리자만 soft delete 가능"
ON chatbot_knowledge FOR UPDATE
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

CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_knowledge_updated_at
    BEFORE UPDATE ON chatbot_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 함수: message_count 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_conversations
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_message_count
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_count();

-- ============================================
-- 초기 데이터: 지식 베이스
-- ============================================

INSERT INTO chatbot_knowledge (category, question, answer, keywords, priority) VALUES
('general', '시스템 이용 시간은?', '본 시스템은 연중무휴 24시간 이용 가능합니다. 단, 정기 점검 시간에는 이용이 제한될 수 있습니다.', ARRAY['이용시간', '운영시간', '24시간', '점검'], 1),
('general', '비밀번호를 잊어버렸습니다.', '로그인 화면에서 [비밀번호 찾기]를 클릭하여 이메일로 비밀번호를 재설정할 수 있습니다.', ARRAY['비밀번호', '재설정', '찾기'], 2),
('general', '로그인이 안 돼요.', '1. 이메일과 비밀번호가 정확한지 확인하세요. 2. 브라우저 캐시를 삭제하고 다시 시도하세요. 3. 문제가 지속되면 관리자에게 문의하세요.', ARRAY['로그인', '접속', '오류'], 3),

('budget', '예산서를 수정하려면?', '제출 전에는 언제든 수정 가능합니다. 제출 후에는 관리자 승인 전에만 수정 요청이 가능합니다.', ARRAY['예산서', '수정', '변경'], 10),
('budget', '예산서 작성 방법은?', '1. [예산관리] > [예산서 작성] 메뉴로 이동 2. 연도, 사업비, 예산 항목 입력 3. 저장 후 제출', ARRAY['예산서', '작성', '방법'], 11),
('budget', '예산 승인까지 얼마나 걸려요?', '일반적으로 제출 후 3~5 영업일 내에 검토가 완료됩니다. 내용이 복잡할 경우 더 소요될 수 있습니다.', ARRAY['예산', '승인', '기간'], 12),

('purchase', '구매요청 작성 방법은?', '1. [구매요청] > [구매요청 작성] 메뉴로 이동 2. 구매 분류 선택 3. 해당 분류에 맞는 정보 입력 4. 증빙서류 제출', ARRAY['구매요청', '작성', '방법'], 20),
('purchase', '증빙서류는 어떤 형식?', 'PDF, JPG, PNG 형식의 파일로 제출해야 하며, 파일 크기는 5MB 이하여야 합니다.', ARRAY['증빙', '서류', '형식', '파일'], 21),
('purchase', '구매 승인까지 얼마나 걸려요?', '일반적으로 제출 후 2~3 영업일 내에 검토가 완료됩니다.', ARRAY['구매', '승인', '기간'], 22),

('refund', '환급신청 방법은?', '1. [환급신청] > [환급신청 작성] 메뉴로 이동 2. 환급 항목 선택 3. 금액과 입금 정보 입력 4. 증빙서류 제출', ARRAY['환급', '신청', '방법'], 30),
('refund', '환급 금액 입금까지 얼마나 걸려요?', '승인 후 2~3 영업일 이내에 지정된 계좌로 입금됩니다.', ARRAY['환급', '입금', '기간'], 31),
('refund', '환급 신청 취소 가능한가요?', '검토 전에는 취소 가능하며, 검토 시작 후에는 관리자 승인이 필요합니다.', ARRAY['환급', '취소'], 32),

('program', '프로그램 신청 방법은?', '1. [프로그램] 메뉴에서 신청 가능한 프로그램 선택 2. [신청하기] 클릭 3. 필요 정보 입력 후 제출', ARRAY['프로그램', '신청', '방법'], 40),
('program', '프로그램 참가 취소 가능한가요?', '프로그램 시작 3일 전까지 취소 가능합니다. 이후 취소는 불가능하거나 불이익이 있을 수 있습니다.', ARRAY['프로그램', '취소', '참가'], 41),

('certificate', '확인서 발급 방법은?', '1. [확인서] > [확인서 발급 신청] 메뉴로 이동 2. 프로그램 선택 3. 참가 정보 확인 후 발급 신청', ARRAY['확인서', '발급', '방법'], 50),
('certificate', '확인서 재발급 가능한가요?', '네, 가능합니다. 확인서 목록에서 해당 확인서를 선택하여 재발급 신청을 하시면 됩니다.', ARRAY['확인서', '재발급'], 51);

COMMENT ON TABLE chat_conversations IS '채팅 세션 테이블';
COMMENT ON TABLE chat_messages IS '채팅 메시지 테이블';
COMMENT ON TABLE chatbot_knowledge IS '챗봇 지식 베이스 테이블';
