-- ============================================================================
-- purchase_requests 상태 전이 강제 + proof_documents 삭제 정책
-- (20261105000000 예산서, 20261105020000 환급과 같은 유형)
-- ============================================================================
-- 기존 purchase_requests_update는 기업 멤버 여부만 검사해, API 직접 호출로
-- 기업 사용자가 자기 요청을 approved/completed로 변경, 승인 금액 위조,
-- 승인 없이 proof_submitted로 건너뛰기, 검토중·승인 요청 수정/삭제가 가능했다.
-- 또한 proof_documents에 DELETE 정책이 없어 포털 "증빙 삭제"가 0행 삭제로
-- 조용히 실패했다.
--
-- 포털이 허용하는 흐름 (앱 코드 기준):
--   생성            → submitted
--   수정·재제출     draft/submitted/rejected → submitted (반려 사유·검토자 NULL 초기화)
--   삭제(soft)      draft/submitted/rejected 에서 deleted_at 기록
--   증빙 업로드·삭제 approved/proof_rejected 에서, 업로드 후 → proof_submitted
-- 그 외 상태 변경(reviewing/approved/rejected/proof_approved/completed 등)은 관리자.
--
-- 원칙: 관리자(is_admin)는 기존과 동일. auth.uid()가 NULL(service role)이면
-- 트리거 검사를 건너뛴다.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. purchase_requests RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "purchase_requests_insert" ON public.purchase_requests;
DROP POLICY IF EXISTS "purchase_requests_update" ON public.purchase_requests;

CREATE POLICY "purchase_requests_insert" ON public.purchase_requests
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR (public.is_company_member(company_id) AND status IN ('draft', 'submitted'))
);

-- 세부 전이 규칙은 트리거에서 검사 (정책은 대상 행·결과 상태의 범위만 제한)
CREATE POLICY "purchase_requests_update" ON public.purchase_requests
FOR UPDATE TO authenticated
USING (
  (SELECT public.is_admin())
  OR (
    public.is_company_member(company_id)
    AND status IN ('draft', 'submitted', 'rejected', 'approved', 'proof_rejected')
  )
)
WITH CHECK (
  (SELECT public.is_admin())
  OR (
    public.is_company_member(company_id)
    AND status IN ('draft', 'submitted', 'rejected', 'proof_submitted')
  )
);


-- ----------------------------------------------------------------------------
-- 2. 기업 사용자 상태 전이·컬럼 보호 트리거
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_purchase_request_changes() RETURNS trigger
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
       OR NEW.rejection_reason IS NOT NULL THEN
      RAISE EXCEPTION '검토/승인 정보는 관리자만 기록할 수 있습니다' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- 관리자 전용 컬럼: 변경 불가
  IF NEW.approved_amount IS DISTINCT FROM OLD.approved_amount
     OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.requester_id IS DISTINCT FROM OLD.requester_id THEN
    RAISE EXCEPTION '승인 정보는 관리자만 변경할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  -- 검토 컬럼: 재제출 시 NULL 초기화만 허용
  IF (NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by AND NEW.reviewed_by IS NOT NULL)
     OR (NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at AND NEW.reviewed_at IS NOT NULL)
     OR (NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason AND NEW.rejection_reason IS NOT NULL) THEN
    RAISE EXCEPTION '검토 정보는 관리자만 기록할 수 있습니다' USING ERRCODE = '42501';
  END IF;

  IF OLD.status IN ('draft', 'submitted', 'rejected') THEN
    -- 수정·재제출·삭제: 결과는 draft/submitted, 또는 상태 유지(삭제)
    IF NEW.status NOT IN ('draft', 'submitted') AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION '허용되지 않은 상태 변경입니다 (% → %)', OLD.status, NEW.status USING ERRCODE = '42501';
    END IF;
  ELSIF OLD.status IN ('approved', 'proof_rejected') THEN
    -- 증빙 제출: 상태만 proof_submitted로, 다른 내용은 변경 불가
    IF NEW.status IS DISTINCT FROM 'proof_submitted'
       OR (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at') THEN
      RAISE EXCEPTION '승인된 요청은 증빙 제출 외에 변경할 수 없습니다' USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION '검토 중이거나 처리된 요청은 변경할 수 없습니다' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS purchase_requests_guard_changes ON public.purchase_requests;
CREATE TRIGGER purchase_requests_guard_changes
BEFORE INSERT OR UPDATE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_purchase_request_changes();


-- ----------------------------------------------------------------------------
-- 3. proof_documents: 기업 사용자는 approved / proof_rejected 요청에만 추가·삭제
--    (포털 canSubmitProof 조건과 동일. 삭제 정책은 이전에 없었음)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "proof_documents_insert" ON public.proof_documents;
DROP POLICY IF EXISTS "proof_documents_delete" ON public.proof_documents;

CREATE POLICY "proof_documents_insert" ON public.proof_documents
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = proof_documents.purchase_request_id
      AND public.is_company_member(pr.company_id)
      AND pr.status IN ('approved', 'proof_rejected')
  )
);

CREATE POLICY "proof_documents_delete" ON public.proof_documents
FOR DELETE TO authenticated
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = proof_documents.purchase_request_id
      AND public.is_company_member(pr.company_id)
      AND pr.status IN ('approved', 'proof_rejected')
  )
);
