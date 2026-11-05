-- ============================================================================
-- refund_payments: 환급신청 결제 내역 (여러 건)
-- ============================================================================
-- 신청 폼은 결제 내역을 여러 건 입력받지만 테이블이 없어 두 번째 건부터
-- 저장이 실패(앱은 console.error만)했다. requested_amount는 합계로 저장되는데
-- 상세 내역은 첫 건만 남던 문제.
--
-- 모든 결제 건(첫 건 포함)을 sort_order 순으로 저장한다.
-- refund_applications의 payment_date/vendor/purpose/category/payment_method는
-- 기존 화면 호환을 위해 첫 건 값으로 계속 기록한다.
-- ============================================================================

CREATE TABLE public.refund_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_application_id UUID NOT NULL REFERENCES public.refund_applications(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL,
  vendor TEXT NOT NULL,
  purpose TEXT NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refund_payments_application ON public.refund_payments(refund_application_id);

ALTER TABLE public.refund_payments ENABLE ROW LEVEL SECURITY;

-- refund_proof_documents와 동일: 신청 기업 멤버 또는 관리자
CREATE POLICY "refund_payments_select" ON public.refund_payments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.refund_applications ra
    WHERE ra.id = refund_payments.refund_application_id
      AND (public.is_company_member(ra.company_id) OR (SELECT public.is_admin()))
  )
);

-- 기업 사용자는 작성 중/제출 직후(submitted) 신청에만 추가 — 승인·지급 후 추가 차단
CREATE POLICY "refund_payments_insert" ON public.refund_payments
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.refund_applications ra
    WHERE ra.id = refund_payments.refund_application_id
      AND public.is_company_member(ra.company_id)
      AND ra.status IN ('draft', 'submitted')
  )
);

-- 수정·삭제는 관리자만
CREATE POLICY "refund_payments_update_admin" ON public.refund_payments
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "refund_payments_delete_admin" ON public.refund_payments
FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

CREATE OR REPLACE FUNCTION public.update_refund_payments_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER refund_payments_updated_at
BEFORE UPDATE ON public.refund_payments
FOR EACH ROW EXECUTE FUNCTION public.update_refund_payments_updated_at();
