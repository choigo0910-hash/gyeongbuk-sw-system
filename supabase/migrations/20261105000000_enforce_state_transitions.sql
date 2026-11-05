-- ============================================================================
-- 상태 전이 강제 + 예산서/프로그램 신청/확인서 버그 수정 (2026-11-05 E2E 테스트 결과)
-- ============================================================================
-- 기존 RLS는 "누구의 데이터인가"만 검사하고 "어떤 상태로 바꾸는가"는 검사하지 않아
-- API 직접 호출로 다음이 가능했다 (화면에서는 막혀 있음):
--   1) 기업 사용자가 자기 예산서를 approved로 변경 / approved 상태로 생성
--   2) 승인된 예산서·항목 금액을 기업 사용자가 수정
--   3) 신청자가 자기 프로그램 신청을 completed로 변경
--   4) 미이수 신청 건으로 확인서 신청 (+ 문서번호를 SW- 형식으로 위조 가능)
-- 기능 버그:
--   5) generate_document_number(): 변수명과 컬럼명 충돌로 "ambiguous" 에러
--   6) audit_logs INSERT 정책 부재로 예산 승인 감사로그 미기록
--   7) program_applications (program_id, applicant_id) 중복 신청 허용
--   8) 관리자 완료 처리 시 completed_at 미기록
--
-- 원칙: 관리자(is_admin)는 기존과 동일. auth.uid()가 NULL인 경우(service role,
-- 마이그레이션)는 트리거 검사를 건너뛴다.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. budgets: 기업 사용자는 draft / submitted / revision_requested 사이에서만
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update" ON public.budgets;

CREATE POLICY "budgets_insert" ON public.budgets
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR (public.is_company_member(company_id) AND status IN ('draft', 'submitted'))
);

-- 기존 행: 작성 중/보완요청만 수정 가능 (submitted는 검토 대기라 잠금)
-- 새 행: draft 또는 submitted(제출)만 허용
CREATE POLICY "budgets_update" ON public.budgets
FOR UPDATE TO authenticated
USING (
  (SELECT public.is_admin())
  OR (public.is_company_member(company_id) AND status IN ('draft', 'revision_requested'))
)
WITH CHECK (
  (SELECT public.is_admin())
  OR (public.is_company_member(company_id) AND status IN ('draft', 'submitted'))
);

-- 검토/승인 컬럼은 관리자만 기록
CREATE OR REPLACE FUNCTION public.guard_budget_review_columns() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL
       OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
      RAISE EXCEPTION '검토/승인 정보는 관리자만 기록할 수 있습니다' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION '검토/승인 정보는 관리자만 변경할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS budgets_guard_review_columns ON public.budgets;
CREATE TRIGGER budgets_guard_review_columns
BEFORE INSERT OR UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.guard_budget_review_columns();


-- ----------------------------------------------------------------------------
-- 2. budget_items: 기업 사용자는 부모 예산서가 draft / revision_requested일 때만
--    (포털 "바로 제출"은 draft로 생성 → 항목 저장 → submitted 전환으로 앱 수정)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "budget_items_insert" ON public.budget_items;
DROP POLICY IF EXISTS "budget_items_update" ON public.budget_items;

CREATE POLICY "budget_items_insert" ON public.budget_items
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_items.budget_id
      AND public.is_company_member(b.company_id)
      AND b.status IN ('draft', 'revision_requested')
  )
);

CREATE POLICY "budget_items_update" ON public.budget_items
FOR UPDATE TO authenticated
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_items.budget_id
      AND public.is_company_member(b.company_id)
      AND b.status IN ('draft', 'revision_requested')
  )
)
WITH CHECK (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_items.budget_id
      AND public.is_company_member(b.company_id)
      AND b.status IN ('draft', 'revision_requested')
  )
);


-- ----------------------------------------------------------------------------
-- 3. program_applications: 신청자는 draft / submitted만, 심사 컬럼은 관리자만
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "program_applications_insert" ON public.program_applications;
DROP POLICY IF EXISTS "program_applications_update" ON public.program_applications;

CREATE POLICY "program_applications_insert" ON public.program_applications
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR (applicant_id = auth.uid() AND status IN ('draft', 'submitted'))
);

CREATE POLICY "program_applications_update" ON public.program_applications
FOR UPDATE TO authenticated
USING (
  (SELECT public.is_admin())
  OR (applicant_id = auth.uid() AND status IN ('draft', 'submitted'))
)
WITH CHECK (
  (SELECT public.is_admin())
  OR (applicant_id = auth.uid() AND status IN ('draft', 'submitted'))
);

-- 심사 컬럼 보호 + 관리자 상태 변경 시 처리 일시 자동 기록
CREATE OR REPLACE FUNCTION public.handle_program_application_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.program_id IS DISTINCT FROM OLD.program_id
       OR NEW.applicant_id IS DISTINCT FROM OLD.applicant_id THEN
      RAISE EXCEPTION '심사 정보는 관리자만 변경할 수 있습니다' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('approved', 'rejected', 'completed') THEN
      NEW.reviewed_by := COALESCE(auth.uid(), NEW.reviewed_by);
      NEW.reviewed_at := now();
    END IF;
    IF NEW.status = 'approved' THEN
      NEW.approved_by := COALESCE(auth.uid(), NEW.approved_by);
      NEW.approved_at := now();
    END IF;
    IF NEW.status = 'completed' THEN
      NEW.completed_at := COALESCE(NEW.completed_at, now());
    ELSE
      NEW.completed_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS program_applications_review ON public.program_applications;
CREATE TRIGGER program_applications_review
BEFORE UPDATE ON public.program_applications
FOR EACH ROW EXECUTE FUNCTION public.handle_program_application_review();

-- 중복 신청 방지 (현재 운영 데이터 1건, 중복 없음 확인)
ALTER TABLE public.program_applications
  DROP CONSTRAINT IF EXISTS program_applications_program_applicant_key;
ALTER TABLE public.program_applications
  ADD CONSTRAINT program_applications_program_applicant_key UNIQUE (program_id, applicant_id);


-- ----------------------------------------------------------------------------
-- 4. certificates: 이수 완료 신청 건만, 임시 번호(PENDING-)로만 신청
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "certificates_insert_own" ON public.certificates;

CREATE POLICY "certificates_insert_own" ON public.certificates
FOR INSERT TO authenticated
WITH CHECK (
  issued_by = auth.uid()
  AND document_number LIKE 'PENDING-%'
  AND verification_code LIKE 'PENDING-%'
  AND pdf_path IS NULL
  AND EXISTS (
    SELECT 1 FROM public.program_applications pa
    WHERE pa.id = certificates.application_id
      AND pa.applicant_id = auth.uid()
      AND pa.status = 'completed'
  )
);


-- ----------------------------------------------------------------------------
-- 5. generate_document_number(): 변수명 충돌 수정, SW-YYYY-NNNNN 형식만 집계
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_document_number()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_year TEXT := to_char(CURRENT_DATE, 'YYYY');
  v_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(substring(c.document_number FROM 9)::INTEGER), 0) + 1
  INTO v_seq
  FROM public.certificates c
  WHERE c.document_number ~ ('^SW-' || v_year || '-[0-9]{5}$');

  RETURN 'SW-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$;


-- ----------------------------------------------------------------------------
-- 6. audit_logs: 관리자 본인 명의 INSERT 허용 (예산 승인 감사로그)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_insert_admin" ON public.audit_logs;

CREATE POLICY "audit_logs_insert_admin" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()) AND actor_user_id = auth.uid());
