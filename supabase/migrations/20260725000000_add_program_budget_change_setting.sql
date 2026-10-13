-- programs 테이블에 allow_budget_change 컬럼 추가
-- 프로그램별 예산 변경 신청 허용 여부를 관리하기 위한 설정

ALTER TABLE programs
ADD COLUMN allow_budget_change BOOLEAN DEFAULT false;

-- 인덱스 추가
CREATE INDEX idx_programs_allow_budget_change ON programs(allow_budget_change);

-- 코멘트 추가
COMMENT ON COLUMN programs.allow_budget_change IS '프로그램별 예산 변경 신청 허용 여부 (기본값: false)';
