# 테스트 전략

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-07-11 |
| 최종 수정일 | 2026-07-11 |

## 테스트 원칙

1. **계층별 테스트:** 단위, 통합, E2E 테스트 분리
2. **자동화:** CI/CD 파이프라인에 통합
3. **실제 환경:** Production-like 환경에서 테스트
4. **테스트 커버리지:** 주요 로직 80% 이상 목표
5. **테스트 데이터:** 격리된 테스트 데이터 사용

---

## 1. 테스트 유형

### 1.1 단위 테스트 (Unit Tests)

**대상:**
- 유틸리티 함수
- 비즈니스 로직
- 데이터 변환 함수

**예시:**
```typescript
// lib/utils/date.test.ts
import { formatSeoulDate, parseSeoulDate } from './date'

describe('Date Utils', () => {
  it('should format UTC date to Seoul time', () => {
    const utcDate = new Date('2026-07-11T00:00:00Z')
    const formatted = formatSeoulDate(utcDate)
    expect(formatted).toBe('2026-07-11 09:00:00')
  })

  it('should parse Seoul date string to UTC', () => {
    const seoulString = '2026-07-11 09:00:00'
    const utcDate = parseSeoulDate(seoulString)
    expect(utcDate.toISOString()).toBe('2026-07-11T00:00:00Z')
  })
})
```

### 1.2 통합 테스트 (Integration Tests)

**대상:**
- API 라우트
- Supabase 클라이언트
- 상태 전이 로직

**예시:**
```typescript
// app/api/budgets/[id]/submit.test.ts
import { POST } from './route'
import { createClient } from '@supabase/supabase-js'

describe('Budget Submit API', () => {
  let supabase: SupabaseClient

  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!
    )
  })

  it('should submit budget with valid status transition', async () => {
    // Given: draft 상태인 예산서
    const { data: budget } = await supabase
      .from('budgets')
      .insert({ status: 'draft', /* ... */ })
      .select()
      .single()

    // When: 제출
    const response = await POST(
      new Request(`http://localhost/api/budgets/${budget.id}/submit`, {
        method: 'POST',
      })
    )

    // Then: submitted 상태로 변경
    expect(response.status).toBe(200)

    const { data: updated } = await supabase
      .from('budgets')
      .select('status')
      .eq('id', budget.id)
      .single()

    expect(updated.status).toBe('submitted')
  })

  it('should reject invalid status transition', async () => {
    // Given: 이미 approved 상태인 예산서
    const { data: budget } = await supabase
      .from('budgets')
      .insert({ status: 'approved', /* ... */ })
      .select()
      .single()

    // When: 제출 시도
    const response = await POST(
      new Request(`http://localhost/api/budgets/${budget.id}/submit`, {
        method: 'POST',
      })
    )

    // Then: 400 에러
    expect(response.status).toBe(400)
  })
})
```

### 1.3 E2E 테스트 (End-to-End Tests)

**도구:** Playwright

**대상:**
- 주요 사용자 시나리오
- 페이지 네비게이션
- 폼 제출

**예시:**
```typescript
// e2e/budget.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login')
    await page.fill('[name=email]', 'company@example.com')
    await page.fill('[name=password]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/portal/dashboard')
  })

  test('should create and submit budget', async ({ page }) => {
    // 예산 작성 페이지로 이동
    await page.goto('/portal/budgets/new')

    // 항목 추가
    await page.click('[data-testid="add-item"]')
    await page.fill('[name="items.0.category"]', '운영비')
    await page.fill('[name="items.0.detail"]', '회의비')
    await page.fill('[name="items.0.amount"]', '100000')

    // 저장
    await page.click('[data-testid="save-draft"]')
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()

    // 제출
    await page.click('[data-testid="submit"]')
    await expect(page.locator('[data-testid="status"]')).toHaveText('제출 완료')
  })

  test('should show error for invalid amount', async ({ page }) => {
    await page.goto('/portal/budgets/new')

    await page.fill('[name="items.0.amount"]', '-1000')
    await page.click('[data-testid="submit"]')

    await expect(page.locator('[data-testid="amount-error"]')).toBeVisible()
  })
})
```

---

## 2. RLS 테스트

### 2.1 테스트 시나리오

**기업 사용자 격리:**
```typescript
describe('Budget RLS', () => {
  it('company_user should only see own company budgets', async () => {
    // Given: 두 기업의 예산서
    await supabase.from('budgets').insert([
      { company_id: companyA, amount: 1000000 },
      { company_id: companyB, amount: 2000000 },
    ])

    // When: 기업 A 사용자로 조회
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('company_id', companyA)

    // Then: 기업 A의 예산만 반환
    expect(budgets).toHaveLength(1)
    expect(budgets[0].company_id).toBe(companyA)
  })

  it('admin should see managed program budgets only', async () => {
    // Given: 담당 사업이 다른 관리자
    await supabase.from('admin_programs').insert([
      { user_id: adminA, program_id: program1 },
      { user_id: adminB, program_id: program2 },
    ])

    // When: 관리자 A로 조회
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')

    // Then: program1의 예산만 반환
    expect(budgets.every(b => b.program_id === program1)).toBe(true)
  })
})
```

---

## 3. 권한 테스트

### 3.1 접근 제어 테스트

```typescript
describe('Access Control', () => {
  const roles = ['company_user', 'individual_user', 'admin', 'super_admin']

  roles.forEach(role => {
    it(`${role} should access appropriate pages`, async ({ page }) => {
      // 로그인
      await loginAs(page, role)

      // 각 페이지 접근 시도
      const pages = [
        '/portal/budgets',
        '/portal/purchase-requests',
        '/portal/refunds',
        '/admin/dashboard',
      ]

      for (const pagePath of pages) {
        const response = await page.goto(pagePath)
        const isAllowed = await isAccessAllowed(role, pagePath)

        if (isAllowed) {
          expect(response.status()).toBe(200)
        } else {
          expect(response.status()).toBe(403 || 404)
        }
      }
    })
  })
})
```

---

## 4. 상태 전이 테스트

### 4.1 예산서 상태

```typescript
describe('Budget Status Transitions', () => {
  const validTransitions = [
    { from: 'draft', to: 'submitted' },
    { from: 'submitted', to: 'reviewing' },
    { from: 'reviewing', to: 'approved' },
    { from: 'reviewing', to: 'revision_requested' },
    { from: 'revision_requested', to: 'submitted' },
  ]

  const invalidTransitions = [
    { from: 'draft', to: 'approved' },
    { from: 'approved', to: 'draft' },
    { from: 'rejected', to: 'approved' },
  ]

  validTransitions.forEach(({ from, to }) => {
    it(`should allow transition from ${from} to ${to}`, async () => {
      const result = await transitionBudgetStatus(budgetId, from, to)
      expect(result.success).toBe(true)
    })
  })

  invalidTransitions.forEach(({ from, to }) => {
    it(`should reject transition from ${from} to ${to}`, async () => {
      const result = await transitionBudgetStatus(budgetId, from, to)
      expect(result.success).toBe(false)
    })
  })
})
```

---

## 5. 이메일 발송 테스트

### 5.1 Mock 테스트

```typescript
import { resend } from '@/lib/resend'

vi.mock('@/lib/resend', () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}))

describe('Email Sending', () => {
  it('should queue email on budget submission', async () => {
    // Given
    resend.emails.send.mockResolvedValue({ data: { id: '123' } })

    // When
    await submitBudget(budgetId)

    // Then
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('*')
      .eq('template_id', 'budget_submitted')
      .single()

    expect(emailLog).toBeDefined()
    expect(emailLog.status).toBe('pending')
  })

  it('should retry failed emails', async () => {
    // Given: 실패한 이메일
    resend.emails.send.mockRejectedValue(new Error('Service error'))

    // When: 재시도 작업 실행
    await processPendingEmails()

    // Then: 재시도 횟수 증가
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('retry_count')
      .eq('id', emailId)
      .single()

    expect(emailLog.retry_count).toBeGreaterThan(0)
  })
})
```

---

## 6. 테스트 커버리지

### 6.1 목표

| 모듈 | 커버리지 목표 |
|------|--------------|
| 인증/권한 | 90% |
| 상태 전이 | 100% |
| RLS 정책 | 90% |
| API 라우트 | 80% |
| 유틸리티 | 100% |
| UI 컴포넌트 | 60% |

### 6.2 측정

```bash
# 커버리지 리포트
npm run test:coverage
```

---

## 7. CI/CD 통합

### 7.1 GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_TEST_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_TEST_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_SERVICE_ROLE_KEY }}

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 8. 테스트 데이터 관리

### 8.1 픽스처

```typescript
// fixtures/budgets.ts
export const budgetFixtures = {
  draft: {
    status: 'draft',
    fiscal_year: 2026,
    total_amount: 1000000,
  },
  submitted: {
    status: 'submitted',
    fiscal_year: 2026,
    total_amount: 2000000,
    submitted_at: new Date().toISOString(),
  },
  approved: {
    status: 'approved',
    fiscal_year: 2026,
    total_amount: 3000000,
    approved_at: new Date().toISOString(),
  },
}
```

### 8.2 테스트 DB

```bash
# 로컬 Supabase 테스트 DB
npx supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres"

# 테스트용 migration 실행
npx supabase migration up --db-url "postgresql://..."
```

---

## 9. 성능 테스트

### 9.1 부하 테스트

```typescript
// k6 script
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
}

export default function () {
  const response = http.get('http://localhost:3000/api/budgets')

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })

  sleep(1)
}
```

---

## 10. 보안 테스트

### 10.1 권한 상승 테스트

```typescript
describe('Security Tests', () => {
  it('should prevent privilege escalation', async () => {
    // Given: 일반 사용자로 로그인
    const token = await login('company@example.com', 'password')

    // When: 관리자 API 호출 시도
    const response = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Then: 403 Forbidden
    expect(response.status).toBe(403)
  })

  it('should prevent cross-company data access', async () => {
    // Given: 기업 A 사용자로 로그인
    const token = await login('companyA@example.com', 'password')

    // When: 기업 B의 예산 조회 시도
    const response = await fetch(`/api/budgets/${companyBBudgetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Then: 403 Forbidden 또는 404 Not Found
    expect([403, 404]).toContain(response.status)
  })
})
```

---

## 테스트 실행

```bash
# 전체 테스트
npm test

# 단위 테스트만
npm run test:unit

# 통합 테스트만
npm run test:integration

# E2E 테스트만
npm run test:e2e

# 커버리지
npm run test:coverage
```

---

## 참고 문서

- [06-database-conceptual-design.md](./06-database-conceptual-design.md) - DB 설계
- [07-security-rules.md](./07-security-rules.md) - 보안 규칙
