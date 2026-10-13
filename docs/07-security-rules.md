# 보안 규칙

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-07-11 |
| 최종 수정일 | 2026-07-11 |

## 보안 원칙

1. **최소 권한 원칙:** 사용자는 필요한 최소한의 권한만 가짐
2. **심층 방어:** 다중 계층의 보안 검증
3. **기본 거부:** 명시적으로 허용하지 않은 모든 접근을 거부
4. **감사 추적:** 모든 중요 작업을 기록
5. **최소 권한:** 데이터베이스, API, Storage에 최소 권한만 부여

---

## 1. 인증 및 인가

### 1.1 인증

**Supabase Auth 사용:**
- `@supabase/ssr` 패키지 사용 (Next.js App Router)
- `@supabase/auth-helpers-nextjs` 미사용 (deprecated)

**구현:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**클라이언트:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 1.2 세션 관리

**Middleware:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.delete({ name, ...options })
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

### 1.3 역할 검증

**서버사이드 역할 확인:**
```typescript
async function getUserRole(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('role_code')
    .eq('user_id', userId)
    .single()

  return data?.role_code
}
```

---

## 2. Row Level Security (RLS)

### 2.1 RLS 활성화

모든 업무 테이블에 RLS 활성화:

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
```

### 2.2 RLS 정책 패턴

**기업 사용자 - 자사 데이터만:**
```sql
-- budgets
CREATE POLICY "Company users can view own company budgets"
ON budgets FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company users can insert own company budgets"
ON budgets FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
);
```

**관리자 - 담당 사업 데이터:**
```sql
-- 필요한 경우 admin_programs 테이블로 필터링
CREATE POLICY "Admins can view managed program data"
ON budgets FOR SELECT
USING (
  program_id IN (
    SELECT program_id FROM admin_programs
    WHERE user_id = auth.uid()
  )
);
```

**Super Admin - 전체 접근:**
```sql
CREATE POLICY "Super admins can view all"
ON budgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code = 'super_admin'
  )
);
```

### 2.3 RLS 정책 우선순위

Supabase RLS는 모든 정책이 OR로 평가됨. 주의:

- 더 구체적인 정책이 더 일반적인 정책보다 먼저 평가되지 않음
- 모든 정책이 거부하면 접근 거부
- 최소한 하나의 정책이 허용해야 접근 허용

---

## 3. 데이터 보안

### 3.1 금액 데이터

**원칙:**
- 부동소수점(float, real) 미사용
- 정수(integer, bigint) 또는 numeric 사용
- 화면에서 포맷팅

```typescript
// DB: amount INT (원)
// 화면: ₩1,234,567

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}
```

### 3.2 날짜/시간

**저장:**
- DB에 UTC로 저장
- `TIMESTAMPTZ` 타입 사용

**표시:**
- 화면에서 Asia/Seoul로 변환

```typescript
function toSeoulTime(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
}
```

### 3.3 Soft Delete

업무 데이터는 물리 삭제하지 않음:

```sql
-- deleted_at 컬럼 추가
ALTER TABLE budgets ADD COLUMN deleted_at TIMESTAMPTZ;

-- RLS 정책
CREATE POLICY "Users cannot see deleted budgets"
ON budgets FOR SELECT
USING (deleted_at IS NULL);

-- 삭제 함수
CREATE OR REPLACE FUNCTION soft_delete_budget(budget_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE budgets
  SET deleted_at = NOW()
  WHERE id = budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.4 상태값 관리

**원칙:**
- 상태는 코드(enum)로 저장
- 화면 문구는 별도 관리

```typescript
enum BudgetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  REVISION_REQUESTED = 'revision_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

const labels: Record<BudgetStatus, string> = {
  [BudgetStatus.DRAFT]: '작성 중',
  [BudgetStatus.SUBMITTED]: '제출 완료',
  // ...
}
```

---

## 4. 파일 보안

### 4.1 Storage 보안

**버킷 정책:**
```sql
-- private 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- RLS 정책
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- 소유자만 다운로드
CREATE POLICY "Users can download own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4.2 Signed URL

다운로드는 Signed URL 사용:

```typescript
async function getSignedUrl(filePath: string) {
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60) // 60초 유효

  return data.signedUrl
}
```

### 4.3 파일명 보안

**위험 문자 치환:**
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\:*?"<>|]/g, '') // 위험 문자 제거
    .replace(/\s+/g, '_') // 공백을 언더스코어로
    .substring(0, 255) // 길이 제한
}
```

### 4.4 파일 확장자 검증

```typescript
const ALLOWED_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png',
  '.hwp', '.hwpx', '.xlsx', '.xls'
]

function validateFileExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext)
}
```

---

## 5. API 보안

### 5.1 환경변수

**절대 금지:**
- 환경변수 값을 코드에 직접 작성
- `.env` 파일을 커밋

**필수 변수:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 서비스 롤 키는 절대 브라우저에서 사용 금지
```

### 5.2 Service Role Key 사용

**서버사이드만:**
```typescript
// ✅ 서버에서만 사용
// app/api/admin/something/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ❌ 브라우저에서 절대 사용 금지
```

### 5.3 요청 검증

```typescript
// 입력 검증
import { z } from 'zod'

const budgetSchema = z.object({
  program_id: z.uuid(),
  company_id: z.uuid(),
  fiscal_year: z.number().int().min(2020).max(2100),
  items: z.array(z.object({
    category: z.string().min(1),
    detail: z.string().min(1),
    amount: z.number().int().positive(),
  })),
})
```

---

## 6. 감사 및 로깅

### 6.1 감사 로그

**기록 항목:**
- 누가 (user_id)
- 언제 (timestamp)
- 무엇을 (entity_type, entity_id)
- 어떻게 (action)
- 왜 (reason)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 중요 작업 로깅

**대상 작업:**
- 예산 승인/반려
- 구매요청 승인/반려
- 환급 승인/반려
- 사용자 권한 변경
- 기업 정보 수정
- 대량 삭제

```typescript
async function logAudit(action: string, entity: string, entityId: string, changes: any) {
  await supabase.from('audit_logs').insert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    action,
    entity_type: entity,
    entity_id: entityId,
    new_values: changes,
    ip_address: headers().get('x-forwarded-for'),
    user_agent: headers().get('user-agent'),
  })
}
```

---

## 7. 권한 상승 방지

### 7.1 클라이언트 검증 금지

역할 정보는 클라이언트에서 수정 불가해야 함:

```typescript
// ❌ 좋지 않음: 클라이언트에서 역할 확인
const { role } = await fetch('/api/user/role')
if (role === 'admin') { /* ... */ }

// ✅ 좋음: 서버에서 확인
// app/admin/dashboard/page.tsx
export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: role } = await supabase
    .from('user_roles')
    .select('role_code')
    .eq('user_id', user.id)
    .single()

  if (role?.role_code !== 'admin') {
    redirect('/login')
  }

  // ...
}
```

### 7.2 세션 갱신

역할 변경 시 세션 갱신 필요:

```typescript
// 사용자가 역할이 변경된 경우 로그아웃 유도
if (roleChanged) {
  await supabase.auth.signOut()
  redirect('/login?reason=role_changed')
}
```

---

## 8. 상태 전이 검증

### 8.1 허용된 전이만 허용

```typescript
const allowedTransitions: Record<string, string[]> = {
  'draft': ['submitted', 'rejected'],
  'submitted': ['reviewing', 'approved', 'rejected'],
  'reviewing': ['revision_requested', 'approved', 'rejected'],
  'revision_requested': ['submitted'],
  'approved': [], // 최종 상태
  'rejected': [],
}

function canTransition(from: string, to: string): boolean {
  return allowedTransitions[from]?.includes(to) ?? false
}
```

### 8.2 서버 검증

```typescript
// API 라우트
export async function POST(request: Request) {
  const { budgetId, newStatus } = await request.json()

  const { data: budget } = await supabase
    .from('budgets')
    .select('status')
    .eq('id', budgetId)
    .single()

  if (!canTransition(budget.status, newStatus)) {
    return Response.json(
      { error: 'Invalid status transition' },
      { status: 400 }
    )
  }

  // 상태 변경
}
```

---

## 9. 운영 DB 수정 금지

**원칙:**
- 운영 DB를 직접 수정하지 않음
- 모든 변경은 migration 파일로 관리

**Migration 사용:**
```sql
-- supabase/migrations/001_create_budgets.sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ...
);
```

---

## 10. 이메일 및 파일 생성 중복 방지

### 10.1 이메일 중복 방지

```typescript
async function sendEmailWithLock(applicationId: string) {
  // 이미 발송 대기 중인지 확인
  const { data: existing } = await supabase
    .from('email_logs')
    .select('id')
    .eq('template_id', 'application_submitted')
    .eq('metadata->>applicationId', applicationId)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return // 이미 대기 중
  }

  // 발송 대기 등록
  await supabase.from('email_logs').insert({
    template_id: 'application_submitted',
    recipient_email: email,
    status: 'pending',
    metadata: { applicationId },
  })
}
```

### 10.2 PDF 생성 중복 방지

```typescript
async function generateCertificate(applicationId: string) {
  // 이미 생성된 확인서 확인
  const { data: existing } = await supabase
    .from('certificates')
    .select('id, pdf_path')
    .eq('application_id', applicationId)
    .single()

  if (existing?.pdf_path) {
    return existing.pdf_path // 이미 존재
  }

  // PDF 생성
}
```

---

## 체크리스트

### 개발 시
- [ ] RLS 정책 적용
- [ ] 서버사이드 권한 검증
- [ ] 입력값 검증
- [ ] SQL 인jection 방지 (parameterized query)
- [ ] XSS 방지 (React 기본 제공)

### 배포 전
- [ ] 환경변수 설정 확인
- [ ] Service Role Key 노출 확인
- [ ] RLS 정책 테스트
- [ ] 민감 정보 로그 확인

---

## 참고 문서

- [02-user-roles-and-permissions.md](./02-user-roles-and-permissions.md) - 권한 정의
- [06-database-conceptual-design.md](./06-database-conceptual-design.md) - DB 설계
