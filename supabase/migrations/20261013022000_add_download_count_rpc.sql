-- ============================================================================
-- 서류 양식 다운로드 카운트 증가 RPC
-- ============================================================================
-- document_templates의 UPDATE 정책은 관리자 전용이라 일반 사용자의
-- download_count 갱신(포털 다운로드 시)이 RLS에 막혀 카운트가 증가하지 않음.
-- 컬럼 단위 우회는 permissive 정책 조합 구멍을 만들 수 있어 SECURITY DEFINER
-- RPC로 "삭제되지 않은 양식의 카운트만 +1" 하는 좁은 동작만 허용한다.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_document_template_download(p_template_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.document_templates
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = p_template_id
    AND deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.increment_document_template_download(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_document_template_download(uuid) TO authenticated;
