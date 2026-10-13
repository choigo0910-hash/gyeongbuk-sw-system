-- Change business_number to service_name (예비 창업 기업 지원)
-- 사업자등록번호를 서비스명으로 변경하여 예비 창업 기업도 등록 가능하도록 함

-- 1. service_name 컬럼 추가 (기존 business_number 값 유지)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_name VARCHAR(100);

-- 2. 기존 business_number 값을 service_name으로 복사
UPDATE companies SET service_name = business_number WHERE service_name IS NULL;

-- 3. business_number 컬럼의 UNIQUE 제약 조건 이름 찾기
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'companies'::regclass
      AND contype = 'u'
      AND conname LIKE '%business_number%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE companies DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- 4. business_number 컬럼을 NULL 허용으로 변경
ALTER TABLE companies ALTER COLUMN business_number DROP NOT NULL;

-- 5. business_number 컬럼 제거 (선택 - 필요하면 주석 해제)
-- ALTER TABLE companies DROP COLUMN IF EXISTS business_number;
