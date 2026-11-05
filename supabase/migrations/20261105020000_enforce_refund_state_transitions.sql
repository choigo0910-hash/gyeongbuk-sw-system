-- ============================================================================
-- refund_applications 상태 전이 강제 (20261105000000 예산서 수정과 같은 유형)
-- ============================================================================
-- 기존 refund_applications_update 정책은 기업 멤버 여부만 검사해, API 직접
-- 호출로 기업 사용자가 자기 신청을 approved/completed(지급완료)로 바꾸거나
-- approved_amount/paid_amount를 기록할 수 있었다. (화면에서는 불가)
--
-- 앱 사용 현황: 포털은 신청 생성(draft/submitted)만, 상태 변경·승인·반려·지급은
-- 관리자 검토 화면만 수행한다.
--
-- 원칙: 관리자(is_admin)는 기존과 동일. auth.uid()가 NULL(service role)이면
-- 트리거 검사를 건너뛴다.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. refund_applications: 기업 사용자는 draft / submitted / revision_requested 사이에서만
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "refund_applications_insert" ON public.refund_applications;
DROP POLICY IF EXISTS "refund_applications_update" ON public.refund_applications;

CREATE POLICY "refund_applications_insert" ON public.refund_applications
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR (public.is_company_member(company_id) AND status IN ('draft', 'submitted'))
);

-- 기존 행: 작성 중/수정요청만 수정 가능 (submitted 이후는 검토 대기라 잠금)
-- 새 행: draft 또는 submitted(제출)만 허용
CREATE POLICY "refund_applications_update" ON public.refund_applications
FOR UPDATE TO authenticated
USING (
  (SELECT public.is_admin())
  OR (public.is_company_member(company_id) AND status IN ('draft', 'revision_requested'))
)
WITH CHECK (
  (SELECT public.is_admin())
  OR (public.is_company_member(company_id) AND status IN ('draft', 'submitted'))
);

-- 검토·승인·지급 컬럼은 관리자만 기록
CREATE OR REPLACE FUNCTION public.guard_refund_review_columns() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.approved_amount IS NOT NULL OR NEW.paid_amount IS NOT NULL
       OR NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL
       OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL
       OR NEW.paid_by IS NOT NULL OR NEW.paid_at IS NOT NULL
       OR NEW.rejection_reason IS NOT NULL THEN
      RAISE EXCEPTION '검토/승인/지급 정보는 관리자만 기록할 수 있습니다' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.approved_amount IS DISTINCT FROM OLD.approved_amount
     OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.paid_by IS DISTINCT FROM OLD.paid_by
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.applicant_id IS DISTINCT FROM OLD.applicant_id THEN
    RAISE EXCEPTION '검토/승인/지급 정보는 관리자만 변경할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refund_applications_guard_review_columns ON public.refund_applications;
CREATE TRIGGER refund_applications_guard_review_columns
BEFORE INSERT OR UPDATE ON public.refund_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_refund_review_columns();


-- ----------------------------------------------------------------------------
-- 2. refund_proof_documents: 기업 사용자는 draft / submitted 신청에만 증빙 추가
--    (refund_payments_insert와 동일 조건 — 승인·지급 후 증빙 끼워넣기 차단)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "refund_proof_documents_insert" ON public.refund_proof_documents;

CREATE POLICY "refund_proof_documents_insert" ON public.refund_proof_documents
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.refund_applications ra
    WHERE ra.id = refund_proof_documents.refund_application_id
      AND public.is_company_member(ra.company_id)
      AND ra.status IN ('draft', 'submitted')
  )
);
