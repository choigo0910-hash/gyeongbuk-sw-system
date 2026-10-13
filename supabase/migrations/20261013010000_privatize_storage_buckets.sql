-- ============================================================================
-- Storage 버킷 private 전환 + 접근 정책
-- ============================================================================
-- 배경:
--   - company-documents / proof-documents / refund-documents 버킷이 public으로
--     생성되어 있고, 앱이 getPublicUrl로 절대 URL을 DB에 저장 → URL만 알면
--     인증 없이 모든 증빙서류·기업서류 다운로드 가능
--   - documents 버킷(서류 양식)은 이미 경로 저장 + createSignedUrl 방식이지만
--     버킷 자체 public 여부를 마이그레이션으로 보장하지 않음
--
-- 해법:
--   1. 4개 버킷 전부 private 전환 (없으면 생성)
--   2. DB의 file_url을 절대 URL → "{버킷}/{경로}" 형식으로 정규화
--   3. storage.objects 정책:
--      - INSERT: 인증 사용자 허용 (메타데이터 행 생성 전 파일을 먼저 올리는 앱 흐름)
--        → 메타데이터 없는 고아 파일은 SELECT 정책 때문에 아무도 읽을 수 없음
--      - SELECT: 관리자 또는 소속 기업 멤버 (메타데이터 테이블 file_url 조인으로 스코핑)
--      - UPDATE/DELETE: 관리자만
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 버킷 private 전환 (fresh DB에서는 생성)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('company-documents', 'company-documents', false),
  ('proof-documents',   'proof-documents',   false),
  ('refund-documents',  'refund-documents',  false),
  ('documents',         'documents',         false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ----------------------------------------------------------------------------
-- 2. file_url 정규화: 절대 URL → "{버킷}/{경로}"
--    (이미 경로 형식인 행은 LIKE 조건에 걸리지 않아 그대로 유지)
-- ----------------------------------------------------------------------------
UPDATE public.company_documents
SET file_url = regexp_replace(file_url, '^https?://[^/]+/storage/v1/object/(public|authenticated)/', '')
WHERE file_url LIKE 'http%';

UPDATE public.proof_documents
SET file_url = regexp_replace(file_url, '^https?://[^/]+/storage/v1/object/(public|authenticated)/', '')
WHERE file_url LIKE 'http%';

UPDATE public.refund_proof_documents
SET file_url = regexp_replace(file_url, '^https?://[^/]+/storage/v1/object/(public|authenticated)/', '')
WHERE file_url LIKE 'http%';

UPDATE public.document_templates
SET file_url = regexp_replace(file_url, '^https?://[^/]+/storage/v1/object/(public|authenticated)/', '')
WHERE file_url LIKE 'http%';

-- ----------------------------------------------------------------------------
-- 3. storage.objects 정책
--    (대상 버킷을 참조하는 기존 정책만 제거 — 다른 버킷 정책은 보존)
-- ----------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname LIKE '%company-documents%'
        OR policyname LIKE '%proof-documents%'
        OR policyname LIKE '%refund-documents%'
        OR qual LIKE '%company-documents%' OR with_check LIKE '%company-documents%'
        OR qual LIKE '%proof-documents%'   OR with_check LIKE '%proof-documents%'
        OR qual LIKE '%refund-documents%'  OR with_check LIKE '%refund-documents%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- ===== company-documents (기업 서류) =====
CREATE POLICY "company_documents_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-documents');

CREATE POLICY "company_documents_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-documents'
  AND (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.company_documents cd
      WHERE cd.file_url = storage.objects.bucket_id || '/' || storage.objects.name
        AND public.is_company_member(cd.company_id)
    )
  )
);

CREATE POLICY "company_documents_storage_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-documents' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'company-documents' AND (SELECT public.is_admin()));

CREATE POLICY "company_documents_storage_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-documents' AND (SELECT public.is_admin()));

-- ===== proof-documents (구매 증빙) =====
CREATE POLICY "proof_documents_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'proof-documents');

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
  )
);

CREATE POLICY "proof_documents_storage_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'proof-documents' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'proof-documents' AND (SELECT public.is_admin()));

CREATE POLICY "proof_documents_storage_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'proof-documents' AND (SELECT public.is_admin()));

-- ===== refund-documents (환급 증빙 + 첫 환급 추가 서류) =====
CREATE POLICY "refund_documents_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'refund-documents');

CREATE POLICY "refund_documents_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'refund-documents'
  AND (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.refund_proof_documents rpd
      JOIN public.refund_applications ra ON ra.id = rpd.refund_application_id
      WHERE rpd.file_url = storage.objects.bucket_id || '/' || storage.objects.name
        AND public.is_company_member(ra.company_id)
    )
  )
);

CREATE POLICY "refund_documents_storage_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'refund-documents' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'refund-documents' AND (SELECT public.is_admin()));

CREATE POLICY "refund_documents_storage_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'refund-documents' AND (SELECT public.is_admin()));

-- ===== documents (서류 양식 — 전체 인증 사용자 열람 대상) =====
CREATE POLICY "document_templates_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "document_templates_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.document_templates dt
      WHERE dt.file_url = storage.objects.bucket_id || '/' || storage.objects.name
        AND dt.deleted_at IS NULL
    )
  )
);

CREATE POLICY "document_templates_storage_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'documents' AND (SELECT public.is_admin()));

CREATE POLICY "document_templates_storage_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (SELECT public.is_admin()));
