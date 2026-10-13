-- 진단용 임시 테이블: REST에서 정책 정의를 읽기 위한 스냅샷 (확인 후 다음 마이그레이션에서 제거)
DROP TABLE IF EXISTS public._diag_policies;
CREATE TABLE public._diag_policies AS
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('user_companies', 'companies');

DROP TABLE IF EXISTS public._diag_rls;
CREATE TABLE public._diag_rls AS
SELECT c.relname AS tablename, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('user_companies', 'companies', 'user_roles');

GRANT SELECT ON public._diag_policies TO authenticated;
GRANT SELECT ON public._diag_rls TO authenticated;
ALTER TABLE public._diag_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._diag_rls ENABLE ROW LEVEL SECURITY;
CREATE POLICY _diag_read ON public._diag_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY _diag_read2 ON public._diag_rls FOR SELECT TO authenticated USING (true);
