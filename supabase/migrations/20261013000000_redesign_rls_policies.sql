-- ============================================================================
-- RLS 재설계: 헬퍼 함수 기반 정책 전면 재작성
-- ============================================================================
-- 배경:
--   - companies RLS가 비활성화된 상태 (20260724260000) — 익명 포함 전체 노출
--   - user_roles / user_companies 정책이 자기 테이블을 다시 조회하는 무한 재귀 패턴
--   - user_companies "Update own" 정책으로 누구나 자기 status를 active로 변경 가능 (스승인 구멍)
--   - company_documents 관리자 정책 조인 오타 (ur.id = ur.role_id)
--   - user_profiles INSERT / certificates 사용자 INSERT / budgets 관리자 쓰기 정책 누락
--
-- 해법:
--   모든 정책이 SECURITY DEFINER STABLE 헬퍼 함수만 참조하도록 재작성.
--   정책이 테이블을 직접 참조하지 않으므로 순환 참조가 원천 차단됨.
--
-- 적용 전제:
--   - 테이블 소유자가 postgres이고 FORCE ROW LEVEL SECURITY 미사용 (Supabase 기본)
--   - audit_logs는 이 재설계에서 제외 (기존 정책 유지, log_audit() SECURITY DEFINER로 insert)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 스키마 변경
-- ----------------------------------------------------------------------------

-- 회원가입 시 본인이 생성한 기업에만 company_admin self-grant를 허용하기 위한 컬럼
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 알림은 "행동한 사용자"(관리자/CEO)가 수신자 행을 INSERT함.
-- created_by 기본값으로 작성자를 자동 기록 → 앱 코드 변경 없이
-- 작성자의 .select().single() 및 sent_email 갱신이 RLS를 통과함.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

-- ----------------------------------------------------------------------------
-- 2. 데이터 백필 (정책 생성 전에 실행)
-- ----------------------------------------------------------------------------

-- 2a. user_companies.status: 2026-07-24(status 컬럼 추가일) 이전 가입 행은
--     DEFAULT 'pending'으로 채워져 있으므로 active로 백필하지 않으면 기존 계정 잠김
UPDATE public.user_companies
SET status = 'active'
WHERE status = 'pending'
  AND COALESCE(joined_at, created_at) < '2026-07-24';

-- 2b. user_roles.company_id: company 범위 역할(company_admin/company_user)인데
--     company_id가 비어 있는 행을 사용자의 소속 기업으로 채움
UPDATE public.user_roles ur
SET company_id = sub.company_id
FROM (
  SELECT DISTINCT ON (uc.user_id) uc.user_id, uc.company_id
  FROM public.user_companies uc
  WHERE uc.deleted_at IS NULL
  ORDER BY uc.user_id, uc.is_primary DESC NULLS LAST, uc.created_at ASC
) sub
WHERE ur.user_id = sub.user_id
  AND ur.company_id IS NULL
  AND ur.deleted_at IS NULL
  AND ur.role_id IN (
    SELECT id FROM public.roles WHERE code IN ('company_admin', 'company_user')
  );

-- 2c. companies.created_by: 가장 오래된 생존 company_admin을 생성자로 추정 (best-effort)
UPDATE public.companies c
SET created_by = sub.uid
FROM (
  SELECT DISTINCT ON (ur.company_id) ur.company_id, ur.user_id AS uid
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE r.code = 'company_admin'
    AND ur.deleted_at IS NULL
    AND ur.company_id IS NOT NULL
  ORDER BY ur.company_id, ur.assigned_at ASC NULLS LAST
) sub
WHERE c.id = sub.company_id
  AND c.created_by IS NULL;

-- ----------------------------------------------------------------------------
-- 3. 구헬퍼 제거 (2-arg, SECURITY DEFINER 아님 — 신규 1-arg 버전과 충돌 방지)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_company_admin(UUID, UUID);

-- ----------------------------------------------------------------------------
-- 4. 기존 정책 전부 동적 DROP (live DB 드리프트 방어)
-- ----------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'roles','user_roles','user_companies','user_profiles','companies',
        'budgets','budget_items','budget_changes',
        'purchase_requests','proof_documents',
        'refund_applications','refund_proof_documents',
        'programs','program_applications','program_attendances',
        'certificates','guides','faqs','notices','document_templates',
        'chat_conversations','chat_messages','chatbot_knowledge',
        'notification_settings','notifications','email_templates','company_documents'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 5. 헬퍼 함수 (전부 SECURITY DEFINER + STABLE + search_path 잠금)
--    테이블 소유자(postgres) 권한으로 실행되어 RLS를 우회 → 재귀 없음
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.deleted_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND r.code IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.deleted_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND r.code = 'super_admin'
  );
$$;

-- 호출자가 해당 기업의 대표자(company_admin)인지
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = p_company_id
      AND r.code = 'company_admin'
      AND ur.deleted_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

-- 지정 사용자가 해당 기업의 company_admin인지 (CEO가 자신/타 CEO 보호용)
CREATE OR REPLACE FUNCTION public.target_is_company_admin(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.company_id = p_company_id
      AND r.code = 'company_admin'
      AND ur.deleted_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

-- 호출자가 해당 기업의 승인된(active) 멤버인지
CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies uc
    WHERE uc.user_id = auth.uid()
      AND uc.company_id = p_company_id
      AND uc.status = 'active'
      AND uc.deleted_at IS NULL
  );
$$;

-- 호출자에게 역할이 하나도 없는지 (회원가입 self-grant 조건)
CREATE OR REPLACE FUNCTION public.user_is_roleless() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.deleted_at IS NULL
  );
$$;

-- 해당 기업을 호출자가 직접 생성했는지 (회원가입 self-grant 조건)
CREATE OR REPLACE FUNCTION public.is_company_creator(p_company_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_by = auth.uid()
  );
$$;

-- 정책은 호출자 권한으로 함수를 실행하므로 authenticated에만 EXECUTE 부여
REVOKE ALL ON FUNCTION
  public.is_admin(), public.is_super_admin(), public.is_company_admin(uuid),
  public.target_is_company_admin(uuid, uuid), public.is_company_member(uuid),
  public.user_is_roleless(), public.is_company_creator(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.is_admin(), public.is_super_admin(), public.is_company_admin(uuid),
  public.target_is_company_admin(uuid, uuid), public.is_company_member(uuid),
  public.user_is_roleless(), public.is_company_creator(uuid)
TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. RLS 활성화 (companies 재활성화 포함)
-- ----------------------------------------------------------------------------
ALTER TABLE public.roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_changes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_proof_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_knowledge  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_documents  ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. 정책 재생성
-- ----------------------------------------------------------------------------

-- ===== roles =====
CREATE POLICY "roles_select_authenticated" ON public.roles
FOR SELECT TO authenticated
USING (true);

-- ===== user_roles =====
CREATE POLICY "user_roles_select" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (SELECT public.is_admin())
  OR (company_id IS NOT NULL AND public.is_company_admin(company_id))
);

CREATE POLICY "user_roles_insert" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR (
    -- 회원가입: 역할 없는 신규 사용자가 본인이 생성한 기업에 한해 company_admin self-grant
    user_id = auth.uid()
    AND company_id IS NOT NULL
    AND public.user_is_roleless()
    AND public.is_company_creator(company_id)
    AND EXISTS (SELECT 1 FROM public.roles r WHERE r.id = user_roles.role_id AND r.code = 'company_admin')
  )
  OR (
    -- CEO가 자기 기업 팀원에게 company_user 부여 (승인 시)
    company_id IS NOT NULL
    AND public.is_company_admin(company_id)
    AND EXISTS (SELECT 1 FROM public.roles r WHERE r.id = user_roles.role_id AND r.code = 'company_user')
  )
);

CREATE POLICY "user_roles_delete" ON public.user_roles
FOR DELETE TO authenticated
USING (
  (SELECT public.is_admin())
  OR (
    -- CEO가 자기 기업 팀원의 company_user 회수 (팀원 삭제 시)
    company_id IS NOT NULL
    AND public.is_company_admin(company_id)
    AND EXISTS (SELECT 1 FROM public.roles r WHERE r.id = user_roles.role_id AND r.code = 'company_user')
  )
);
-- UPDATE 정책 없음 (역할 변경은 삭제 후 재생성)

-- ===== user_companies =====
-- SELECT own은 deleted 포함 전 상태: 로그인 게이트(pending 차단) + 복구 플로우에 필요
CREATE POLICY "user_companies_select" ON public.user_companies
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (SELECT public.is_admin())
  OR (company_id IS NOT NULL AND public.is_company_admin(company_id))
);

CREATE POLICY "user_companies_insert" ON public.user_companies
FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND status = 'pending' AND deleted_at IS NULL)  -- 회원가입 / 기업 가입 요청
  OR (SELECT public.is_admin())
);

-- own 업데이트는 status를 active로 만들 수 없음 (스승인 차단).
-- 복구 플로우(deleted_at→NULL, status→pending)와 rejected 행 복구는 허용.
CREATE POLICY "user_companies_update_own" ON public.user_companies
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status <> 'active');

-- CEO의 팀원 승인/반려/삭제(soft delete). 자기 자신과 타 CEO 행은 보호.
CREATE POLICY "user_companies_update_ceo" ON public.user_companies
FOR UPDATE TO authenticated
USING (
  company_id IS NOT NULL
  AND public.is_company_admin(company_id)
  AND NOT public.target_is_company_admin(user_companies.user_id, company_id)
)
WITH CHECK (company_id IS NOT NULL AND public.is_company_admin(company_id));

CREATE POLICY "user_companies_update_admin" ON public.user_companies
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));
-- DELETE 정책 없음 (soft delete은 UPDATE로 처리)

-- ===== user_profiles =====
CREATE POLICY "user_profiles_select" ON public.user_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (SELECT public.is_admin())
  -- CEO가 자기 기업 팀원의 프로필 조회 (팀원 목록, 승인 화면, 알림 이메일 조회)
  OR EXISTS (
    SELECT 1
    FROM public.user_companies uc
    WHERE uc.user_id = user_profiles.user_id
      AND uc.deleted_at IS NULL
      AND public.is_company_admin(uc.company_id)
  )
);

CREATE POLICY "user_profiles_insert" ON public.user_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR (SELECT public.is_admin()));

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_super" ON public.user_profiles
FOR UPDATE TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));
-- DELETE 정책 없음

-- ===== companies =====
CREATE POLICY "companies_select_authenticated" ON public.companies
FOR SELECT TO authenticated
USING (
  (SELECT public.is_admin())
  OR deleted_at IS NULL
);

-- 회원가입 전(익명) 기업 검색용: 컬럼 제한 GRANT(8번 섹션)와 함께 동작
CREATE POLICY "companies_select_anon_search" ON public.companies
FOR SELECT TO anon
USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "companies_insert" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
  OR created_by = auth.uid()  -- 회원가입 시 본인 기업 생성
);

CREATE POLICY "companies_update" ON public.companies
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()) OR public.is_company_admin(id))
WITH CHECK ((SELECT public.is_admin()) OR public.is_company_admin(id));
-- DELETE 정책 없음 (soft delete은 UPDATE로 처리)

-- ===== budgets =====
CREATE POLICY "budgets_select" ON public.budgets
FOR SELECT TO authenticated
USING (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "budgets_insert" ON public.budgets
FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "budgets_update" ON public.budgets
FOR UPDATE TO authenticated
USING (public.is_company_member(company_id) OR (SELECT public.is_admin()))
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

-- 엑셀 import 실패 시 관리자의 정리(DELETE)용 (api/admin/budgets/import)
CREATE POLICY "budgets_delete_admin" ON public.budgets
FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

-- ===== budget_items =====
CREATE POLICY "budget_items_select" ON public.budget_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_items.budget_id
      AND (public.is_company_member(b.company_id) OR (SELECT public.is_admin()))
  )
);

CREATE POLICY "budget_items_insert" ON public.budget_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_items.budget_id
      AND (public.is_company_member(b.company_id) OR (SELECT public.is_admin()))
  )
);

CREATE POLICY "budget_items_update" ON public.budget_items
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_items.budget_id
      AND (public.is_company_member(b.company_id) OR (SELECT public.is_admin()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_items.budget_id
      AND (public.is_company_member(b.company_id) OR (SELECT public.is_admin()))
  )
);

-- ===== budget_changes (조회만 — 기존 동작 유지) =====
CREATE POLICY "budget_changes_select" ON public.budget_changes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.id = budget_changes.budget_id
      AND (public.is_company_member(b.company_id) OR (SELECT public.is_admin()))
  )
);

-- ===== purchase_requests =====
CREATE POLICY "purchase_requests_select" ON public.purchase_requests
FOR SELECT TO authenticated
USING (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "purchase_requests_insert" ON public.purchase_requests
FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "purchase_requests_update" ON public.purchase_requests
FOR UPDATE TO authenticated
USING (public.is_company_member(company_id) OR (SELECT public.is_admin()))
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

-- ===== proof_documents =====
CREATE POLICY "proof_documents_select" ON public.proof_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = proof_documents.purchase_request_id
      AND (public.is_company_member(pr.company_id) OR (SELECT public.is_admin()))
  )
);

CREATE POLICY "proof_documents_insert" ON public.proof_documents
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchase_requests pr
    WHERE pr.id = proof_documents.purchase_request_id
      AND (public.is_company_member(pr.company_id) OR (SELECT public.is_admin()))
  )
);

-- ===== refund_applications =====
CREATE POLICY "refund_applications_select" ON public.refund_applications
FOR SELECT TO authenticated
USING (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "refund_applications_insert" ON public.refund_applications
FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "refund_applications_update" ON public.refund_applications
FOR UPDATE TO authenticated
USING (public.is_company_member(company_id) OR (SELECT public.is_admin()))
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

-- ===== refund_proof_documents =====
CREATE POLICY "refund_proof_documents_select" ON public.refund_proof_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.refund_applications ra
    WHERE ra.id = refund_proof_documents.refund_application_id
      AND (public.is_company_member(ra.company_id) OR (SELECT public.is_admin()))
  )
);

CREATE POLICY "refund_proof_documents_insert" ON public.refund_proof_documents
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.refund_applications ra
    WHERE ra.id = refund_proof_documents.refund_application_id
      AND (public.is_company_member(ra.company_id) OR (SELECT public.is_admin()))
  )
);

-- ===== programs =====
CREATE POLICY "programs_select" ON public.programs
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "programs_insert_admin" ON public.programs
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "programs_update_admin" ON public.programs
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "programs_delete_admin" ON public.programs
FOR DELETE TO authenticated
USING ((SELECT public.is_admin()));

-- ===== program_applications =====
CREATE POLICY "program_applications_select" ON public.program_applications
FOR SELECT TO authenticated
USING (
  applicant_id = auth.uid()
  OR (SELECT public.is_admin())
  OR (company_id IS NOT NULL AND public.is_company_member(company_id))
);

CREATE POLICY "program_applications_insert" ON public.program_applications
FOR INSERT TO authenticated
WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "program_applications_update" ON public.program_applications
FOR UPDATE TO authenticated
USING (applicant_id = auth.uid() OR (SELECT public.is_admin()))
WITH CHECK (applicant_id = auth.uid() OR (SELECT public.is_admin()));

-- ===== program_attendances =====
CREATE POLICY "program_attendances_select" ON public.program_attendances
FOR SELECT TO authenticated
USING (attendee_id = auth.uid() OR (SELECT public.is_admin()));

CREATE POLICY "program_attendances_insert_admin" ON public.program_attendances
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "program_attendances_update_admin" ON public.program_attendances
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ===== certificates =====
CREATE POLICY "certificates_select" ON public.certificates
FOR SELECT TO authenticated
USING (
  (SELECT public.is_admin())
  OR EXISTS (
    SELECT 1 FROM public.program_applications pa
    WHERE pa.id = certificates.application_id
      AND (
        pa.applicant_id = auth.uid()
        OR (pa.company_id IS NOT NULL AND public.is_company_member(pa.company_id))
      )
  )
);

-- 포털 확인서 발급 신청 (본인의 완료된 프로그램 신청에 한해)
CREATE POLICY "certificates_insert_own" ON public.certificates
FOR INSERT TO authenticated
WITH CHECK (
  issued_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.program_applications pa
    WHERE pa.id = certificates.application_id
      AND pa.applicant_id = auth.uid()
  )
);

CREATE POLICY "certificates_update_admin" ON public.certificates
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ===== 콘텐츠 테이블 (guides / faqs / notices: is_published) =====
-- 게시된 글은 공개 읽기 (TO 절 없음 = anon + authenticated, 기존 동작 유지)

CREATE POLICY "guides_select_published" ON public.guides
FOR SELECT
USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY "guides_select_admin" ON public.guides
FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY "guides_insert_admin" ON public.guides
FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "guides_update_admin" ON public.guides
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "faqs_select_published" ON public.faqs
FOR SELECT
USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY "faqs_select_admin" ON public.faqs
FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY "faqs_insert_admin" ON public.faqs
FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "faqs_update_admin" ON public.faqs
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "notices_select_published" ON public.notices
FOR SELECT
USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY "notices_select_admin" ON public.notices
FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY "notices_insert_admin" ON public.notices
FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "notices_update_admin" ON public.notices
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- ===== 콘텐츠 테이블 (document_templates / chatbot_knowledge / email_templates: is_active) =====

CREATE POLICY "document_templates_select_active" ON public.document_templates
FOR SELECT
USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY "document_templates_select_admin" ON public.document_templates
FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY "document_templates_insert_admin" ON public.document_templates
FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "document_templates_update_admin" ON public.document_templates
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "chatbot_knowledge_select_active" ON public.chatbot_knowledge
FOR SELECT
USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY "chatbot_knowledge_select_admin" ON public.chatbot_knowledge
FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY "chatbot_knowledge_insert_admin" ON public.chatbot_knowledge
FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "chatbot_knowledge_update_admin" ON public.chatbot_knowledge
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "email_templates_select_active" ON public.email_templates
FOR SELECT
USING (is_active = true AND deleted_at IS NULL);
CREATE POLICY "email_templates_select_admin" ON public.email_templates
FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
CREATE POLICY "email_templates_insert_admin" ON public.email_templates
FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "email_templates_update_admin" ON public.email_templates
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- ===== chat =====
CREATE POLICY "chat_conversations_select" ON public.chat_conversations
FOR SELECT TO authenticated
USING (
  (user_id = auth.uid() AND deleted_at IS NULL)
  OR (SELECT public.is_admin())
);

CREATE POLICY "chat_conversations_insert" ON public.chat_conversations
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- update_message_count 트리거가 메시지 작성자(소유자) 컨텍스트로 UPDATE하므로 통과함
CREATE POLICY "chat_conversations_update" ON public.chat_conversations
FOR UPDATE TO authenticated
USING (
  (user_id = auth.uid() AND deleted_at IS NULL)
  OR (SELECT public.is_admin())
)
WITH CHECK (
  (user_id = auth.uid() AND deleted_at IS NULL)
  OR (SELECT public.is_admin())
);

CREATE POLICY "chat_messages_select" ON public.chat_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND ((c.user_id = auth.uid() AND c.deleted_at IS NULL) OR (SELECT public.is_admin()))
  )
);

CREATE POLICY "chat_messages_insert" ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
      AND c.deleted_at IS NULL
  )
);

-- ===== notifications =====
-- 작성자(admin/CEO)가 수신자 행을 INSERT하고 sent_email을 갱신하므로
-- user_id(수신자) OR created_by(작성자) 허용
CREATE POLICY "notifications_select" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR created_by = auth.uid())
WITH CHECK (user_id = auth.uid() OR created_by = auth.uid());

-- ===== notification_settings =====
CREATE POLICY "notification_settings_select" ON public.notification_settings
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notification_settings_insert" ON public.notification_settings
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_settings_update" ON public.notification_settings
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ===== company_documents =====
CREATE POLICY "company_documents_select" ON public.company_documents
FOR SELECT TO authenticated
USING (
  (public.is_company_member(company_id) AND deleted_at IS NULL)
  OR (SELECT public.is_admin())
);

CREATE POLICY "company_documents_insert" ON public.company_documents
FOR INSERT TO authenticated
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "company_documents_update_member" ON public.company_documents
FOR UPDATE TO authenticated
USING (
  public.is_company_member(company_id)
  AND status = 'draft'
  AND deleted_at IS NULL
)
WITH CHECK (public.is_company_member(company_id) OR (SELECT public.is_admin()));

CREATE POLICY "company_documents_update_admin" ON public.company_documents
FOR UPDATE TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

-- ----------------------------------------------------------------------------
-- 8. anon 컬럼 제한 GRANT (companies)
--    회원가입 익명 검색이 select하는 컬럼만 공개: id, name, business_number
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.companies FROM anon;
GRANT SELECT (id, name, business_number) ON public.companies TO anon;
