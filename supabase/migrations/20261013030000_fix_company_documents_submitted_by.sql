-- ============================================================================
-- 버그 수정: 관리자 기업서류 화면이 항상 0건/빈 화면이던 문제
-- ============================================================================
-- 원인: admin/company-documents 목록·검토 페이지가 select에서
--   `submitted_by_user:auth.users!company_documents_submitted_by_fkey(email)`
--   임베드를 사용하는데 (1) 그 이름의 FK가 테이블에 존재하지 않고
--   (2) auth.users는 PostgREST 노출 스키마 밖이라 임베드 자체가 불가능하다.
--   → PostgREST 400 (PGRST100) → 페이지가 에러를 삼켜 항상 빈 목록 표시.
--   (admin/notifications도 동일한 auth.users 임베드 — 사용처가 없어 제거만 함)
--
-- 수정: submitted_by를 user_profiles(user_id)로 참조하는 FK를 동일 이름으로
--   생성해 user_profiles 임베드가 가능하게 하고, 기존 제출 행의 제출자를 백필한다.
--   (앱 페이지는 user_profiles 임베드로 수정 — 커밋 참고)
-- ============================================================================

-- 1) FK 생성 (user_profiles.user_id는 UNIQUE → 임베드 가능)
ALTER TABLE public.company_documents
  DROP CONSTRAINT IF EXISTS company_documents_submitted_by_fkey;

ALTER TABLE public.company_documents
  ADD CONSTRAINT company_documents_submitted_by_fkey
  FOREIGN KEY (submitted_by) REFERENCES public.user_profiles(user_id);

-- 2) 기존 제출 행 백필: 제출자 미기재 시 기업 대표(최초 primary 멤버)로 기록
UPDATE public.company_documents cd
SET submitted_by = sub.user_id
FROM (
  SELECT DISTINCT ON (company_id) company_id, user_id
  FROM public.user_companies
  WHERE deleted_at IS NULL AND is_primary = true
  ORDER BY company_id, created_at ASC
) sub
WHERE cd.company_id = sub.company_id
  AND cd.submitted_by IS NULL
  AND cd.status <> 'draft';

-- 3) 제출 시각 백필
UPDATE public.company_documents
SET submitted_at = COALESCE(submitted_at, created_at)
WHERE submitted_at IS NULL AND status <> 'draft';
