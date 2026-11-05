-- ============================================================================
-- purchase_request_attachments: 구매 요청 신청 단계 첨부파일
-- ============================================================================
-- 신청 폼은 견적서·추가 증빙(업무대행수수료), 학습 계획서(위탁교육비),
-- 제출 서류(용역비)를 입력받지만 저장 코드·테이블이 없어 선택한 파일이
-- 그대로 버려졌다.
--
-- proof_documents는 승인 후 증빙 전용(approved/proof_rejected에서만 추가,
-- 20261105030000)이라 신청 단계 첨부는 별도 테이블에 둔다.
-- 파일은 기존 proof-documents 버킷(private)에 purchase-requests/{요청ID}/ 아래 저장.
-- ============================================================================

CREATE TABLE public.purchase_request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL
    CHECK (attachment_type IN ('quote', 'additional', 'education_plan', 'service_document')),
  file_name TEXT NOT NULL,          -- 원본 파일명
  file_url TEXT NOT NULL,           -- "{버킷}/{경로}" (서명 URL로 조회)
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_purchase_request_attachments_request
  ON public.purchase_request_attachments(purchase_request_id);

ALTER TABLE public.purchase_request_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_request_attachments_select" ON public.purchase_request_attachments
FOR SELECT TO authenticated
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = purchase_request_attachments.purchase_request_id
      AND public.is_company_member(pr.company_id)
  )
);

-- 기업 사용자는 검토 전(draft/submitted/rejected) 요청에만 본인 명의로 첨부
CREATE POLICY "purchase_request_attachments_insert" ON public.purchase_request_attachments
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.purchase_requests pr
      WHERE pr.id = purchase_request_attachments.purchase_request_id
        AND public.is_company_member(pr.company_id)
        AND pr.status IN ('draft', 'submitted', 'rejected')
    )
  )
);

CREATE POLICY "purchase_request_attachments_delete" ON public.purchase_request_attachments
FOR DELETE TO authenticated
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = purchase_request_attachments.purchase_request_id
      AND public.is_company_member(pr.company_id)
      AND pr.status IN ('draft', 'submitted', 'rejected')
  )
);


-- ----------------------------------------------------------------------------
-- proof-documents 버킷 조회: 신청 첨부파일도 같은 기업 멤버가 서명 URL 발급 가능하도록
-- (기존 정책은 proof_documents 행이 있는 파일만 허용)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "proof_documents_storage_select" ON storage.objects;

CREATE POLICY "proof_documents_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'proof-documents'
  AND (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.proof_documents pd
      JOIN public.purchase_requests pr ON pr.id = pd.purchase_request_id
      WHERE pd.file_url = storage.objects.bucket_id || '/' || storage.objects.name
        AND public.is_company_member(pr.company_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.purchase_request_attachments pa
      JOIN public.purchase_requests pr ON pr.id = pa.purchase_request_id
      WHERE pa.file_url = storage.objects.bucket_id || '/' || storage.objects.name
        AND pa.deleted_at IS NULL
        AND public.is_company_member(pr.company_id)
    )
  )
);
