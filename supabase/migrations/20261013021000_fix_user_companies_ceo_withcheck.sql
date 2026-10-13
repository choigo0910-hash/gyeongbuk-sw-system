-- ============================================================================
-- 버그 수정: CEO가 자기 pending 행을 스승인(active)할 수 있던 구멍
-- ============================================================================
-- 원인: PostgreSQL의 permissive RLS 정책은 USING / WITH CHECK가 **각각 OR로
--   독립 평가**된다. 행 가시성은 update_own(본인 행)으로 확보하고, 새 행 검사는
--   update_ceo(WITH CHECK에 CEO 보호 조건이 없음)로 통과하는 조합이 가능했다.
--
--   - update_own          : USING (user_id = auth.uid())
--                           CHECK  (user_id = auth.uid() AND status <> 'active')
--   - update_ceo (기존)   : USING (... is_company_admin AND NOT target_is_company_admin(행))
--                           CHECK  (... is_company_admin)   ← 자기 행이면 통과!
--
--   → CEO가 자기 pending 행을 active로, 또는 자기 행을 soft-delete 가능했다.
--     (member는 update_ceo의 WITH CHECK를 통과할 권한이 없어 차단됨 — 재현 확인)
--
-- 수정: WITH CHECK에도 NOT target_is_company_admin(새 행) 조건을 추가해
--   어떤 정책 조합으로도 자기/타 CEO 행의 상태 변경이 불가능하게 한다.
-- ============================================================================

DROP POLICY IF EXISTS "user_companies_update_ceo" ON public.user_companies;

CREATE POLICY "user_companies_update_ceo"
ON public.user_companies FOR UPDATE TO authenticated
USING (
  company_id IS NOT NULL
  AND public.is_company_admin(company_id)
  AND NOT public.target_is_company_admin(user_companies.user_id, company_id)
)
WITH CHECK (
  company_id IS NOT NULL
  AND public.is_company_admin(company_id)
  AND NOT public.target_is_company_admin(user_id, company_id)  -- 새 행 기준으로도 보호
);

-- ============================================================================
-- 진단용 임시 테이블 제거 (20261013020000_diag_policy_snapshot)
-- ============================================================================
DROP TABLE IF EXISTS public._diag_policies;
DROP TABLE IF EXISTS public._diag_rls;
