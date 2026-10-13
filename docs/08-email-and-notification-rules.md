# 이메일 및 알림 규칙

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-07-11 |
| 최종 수정일 | 2026-07-11 |

## 설계 원칙

1. **결합 분리:** 상태 변경과 이메일 발송을 강하게 결합하지 않음
2. **재시도 가능:** 실패 시 재시도 메커니즘
3. **발송 이력:** 모든 발송 시도 기록
4. **템플릿 기반:** 이메일 내용은 템플릿으로 관리
5. **비동기 처리:** 발송은 백그라운드 작업으로 처리

---

## 1. 이메일 템플릿

### 1.1 사용자 대상 템플릿

| 템플릿 ID | 제목 | 변수 | 발생 조건 |
|----------|------|------|----------|
| `application_submitted` | [경북SW성장기업지원] 신청이 완료되었습니다 | `{이름}`, `{신청유형}`, `{신청일}` | 신청 제출 시 |
| `revision_requested` | [경북SW성장기업지원] 보완 요청이 있습니다 | `{이름}`, `{신청유형}`, `{보완사유}` | 보완 요청 시 |
| `application_approved` | [경북SW성장기업지원] 승인이 완료되었습니다 | `{이름}`, `{신청유형}`, `{승인일}` | 승인 완료 시 |
| `application_rejected` | [경북SW성장기업지원] 반려되었습니다 | `{이름}`, `{신청유형}`, `{반려사유}` | 반려 시 |
| `payment_completed` | [경북SW성장기업지원] 집행이 완료되었습니다 | `{이름}`, `{집행금액}`, `{집행일}` | 집행 완료 시 |
| `program_applied` | [경북SW성장기업지원] 프로그램 신청이 완료되었습니다 | `{이름}`, `{프로그램명}`, `{신청일}` | 프로그램 신청 시 |
| `participation_approved` | [경북SW성장기업지원] 참가가 승인되었습니다 | `{이름}`, `{프로그램명}`, `{일시}` | 참가 승인 시 |
| `participation_completed` | [경북SW성장기업지원] 참가를 완료하였습니다 | `{이름}`, `{프로그램명}`, `{완료일}` | 참가 완료 시 |
| `certificate_issued` | [경북SW성장기업지원] 참가 확인서가 발급되었습니다 | `{이름}`, `{프로그램명}`, `{발급일}` | 확인서 발급 시 |

### 1.2 관리자 대상 템플릿

| 템플릿 ID | 제목 | 변수 | 발생 조건 |
|----------|------|------|----------|
| `purchase_request_submitted` | [관리자] 구매요청이 제출되었습니다 | `{기업명}`, `{품목}`, `{금액}` | 구매요청 제출 시 |
| `proof_document_submitted` | [관리자] 증빙자료가 제출되었습니다 | `{기업명}`, `{구매요청번호}` | 증빙 제출 시 |
| `refund_application_submitted` | [관리자] 환급신청이 제출되었습니다 | `{신청자}`, `{금액}`, `{세목}` | 환급신청 제출 시 |
| `revision_resubmitted` | [관리자] 보완자료가 재제출되었습니다 | `{신청자}`, `{신청유형}` | 보완 재제출 시 |
| `budget_submitted` | [관리자] 예산서가 제출되었습니다 | `{기업명}`, `{회계연도}`, `{총액}` | 예산서 제출 시 |
| `budget_change_submitted` | [관리자] 변경 예산서가 제출되었습니다 | `{기업명}`, `{버전}`, `{변경내용}` | 변경 예산 제출 시 |
| `program_application_received` | [관리자] 프로그램 참가 신청이 있습니다 | `{프로그램명}`, `{신청자}`, `{신청일}` | 프로그램 신청 시 |

---

## 2. 이메일 발송 프로세스

### 2.1 발송 흐름

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ 상태 변경    │─────▶│ 발송 대기   │─────▶│ 발송 작업   │
│ (이벤트)     │      │ (email_logs)│      │ (Background)│
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              ▼                    ▼                    ▼
                       ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                       │ 발송 성공   │      │ 발송 실패   │      │ 재시도 대기  │
                       │ (sent)      │      │ (failed)    │      │ (retry)     │
                       └─────────────┘      └─────────────┘      └─────────────┘
```

### 2.2 발송 대기 등록

상태 변경 시 즉시 이메일을 발송하지 않고 발송 대기 테이블에 등록:

```typescript
async function queueEmail(params: EmailParams) {
  await supabase.from('email_logs').insert({
    template_id: params.templateId,
    recipient_email: params.to,
    recipient_name: params.name,
    subject: params.subject,
    metadata: params.variables,
    status: 'pending',
  })
}
```

### 2.3 발송 작업

백그라운드에서 주기적으로 발송 처리:

```typescript
// CRON Job 또는 Vercel Cron
export async function GET() {
  const { data: pending } = await supabase
    .from('email_logs')
    .select('*')
    .eq('status', 'pending')
    .lte('created_at', new Date().toISOString())
    .limit(10)

  for (const email of pending) {
    await sendEmail(email)
  }

  return Response.json({ sent: pending.length })
}
```

---

## 3. 발송 상태

### 3.1 상태 정의

| 상태 코드 | 명칭 | 설명 |
|----------|------|------|
| `pending` | 대기 중 | 발송 대기 |
| `sending` | 발송 중 | 발송 진행 중 |
| `sent` | 발송 완료 | 발송 성공 |
| `failed` | 발송 실패 | 발송 실패 (재시도 필요) |
| `cancelled` | 발송 취소 | 발송 취소됨 |

### 3.2 실패 사유

| 사유 코드 | 설명 | 재시도 |
|----------|------|--------|
| `no_recipient` | 수신자 이메일 없음 | 불가 |
| `invalid_email` | 잘못된 이메일 형식 | 불가 |
| `service_error` | 발송 서비스 오류 | 가능 |
| `rate_limit` | 발송 한도 초과 | 지연 후 가능 |
| `timeout` | 시간 초과 | 가능 |
| `unknown` | 알 수 없는 오류 | 가능 |

---

## 4. 이메일 로그 테이블

### 4.1 테이블 구조

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_reason TEXT,
  error_code TEXT,
  sent_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_email_logs_template ON email_logs(template_id);
```

---

## 5. Resend 연동

### 5.1 환경 변수

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@gyeongbuk-sw.or.kr
RESEND_FROM_NAME=경북SW성장기업지원사업
```

### 5.2 발송 함수

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail(log: EmailLog) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: log.recipient_email,
      subject: log.subject,
      html: log.body,
    })

    if (error) throw error

    // 성공 업데이트
    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', log.id)

  } catch (error) {
    // 실패 업데이트
    await supabase
      .from('email_logs')
      .update({
        status: 'failed',
        error_reason: error.message,
        error_code: error.code,
        retry_count: log.retry_count + 1,
      })
      .eq('id', log.id)
  }
}
```

---

## 6. 재시도 정책

### 6.1 재시도 규칙

| 재시도 횟수 | 대기 시간 |
|------------|----------|
| 1 | 1분 |
| 2 | 5분 |
| 3 | 15분 |
| 4 | 1시간 |
| 5+ | 6시간 |

### 6.2 최대 재시도

- 최대 10회 재시도
- 그 이후 실패 처리

```typescript
function shouldRetry(log: EmailLog): boolean {
  if (log.retry_count >= 10) return false
  if (log.error_code === 'no_recipient') return false
  if (log.error_code === 'invalid_email') return false
  return true
}
```

---

## 7. 템플릿 관리

### 7.1 템플릿 구조

```
templates/
├─ user/
│  ├─ application_submitted.html
│  ├─ revision_requested.html
│  ├─ application_approved.html
│  ├─ application_rejected.html
│  ├─ payment_completed.html
│  ├─ program_applied.html
│  ├─ participation_approved.html
│  ├─ participation_completed.html
│  └─ certificate_issued.html
└─ admin/
   ├─ purchase_request_submitted.html
   ├─ proof_document_submitted.html
   ├─ refund_application_submitted.html
   ├─ revision_resubmitted.html
   ├─ budget_submitted.html
   ├─ budget_change_submitted.html
   └─ program_application_received.html
```

### 7.2 템플릿 변수 치환

```typescript
function renderTemplate(templateId: string, variables: Record<string, any>): string {
  const template = loadTemplate(templateId)
  let html = template

  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }

  return html
}
```

### 7.3 템플릿 예시

**application_approved.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>승인 완료</title>
</head>
<body>
  <div style="font-family: Arial, sans-serif;">
    <h1>경북 SW 성장기업지원사업</h1>
    <p>{이름}님,</p>
    <p>신청하신 {신청유형}이(가) 승인되었습니다.</p>
    <p>승인일: {승인일}</p>
  </div>
</body>
</html>
```

---

## 8. 일괄 처리

### 8.1 프로그램 게시 알림

프로그램 게시 후 전체 메일 발송:

```typescript
async function notifyProgramPublished(programId: string) {
  // 1. 프로그램 게시
  await supabase
    .from('programs')
    .update({ status: 'published' })
    .eq('id', programId)

  // 2. 발송 대기 등록 (별도 작업)
  const { data: users } = await supabase
    .from('user_roles')
    .select('user_id, users(email)')
    .eq('role_code', 'company_user')

  for (const user of users) {
    await queueEmail({
      templateId: 'program_published',
      to: user.email,
      variables: { programId },
    })
  }
}
```

---

## 9. 알림 설정

### 9.1 사용자별 알림 설정

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email_budget_submitted BOOLEAN DEFAULT true,
  email_budget_approved BOOLEAN DEFAULT true,
  email_budget_rejected BOOLEAN DEFAULT true,
  email_purchase_submitted BOOLEAN DEFAULT true,
  email_purchase_approved BOOLEAN DEFAULT true,
  email_refund_submitted BOOLEAN DEFAULT true,
  email_refund_approved BOOLEAN DEFAULT true,
  email_program_published BOOLEAN DEFAULT true,
  email_program_applied BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. 모니터링

### 10.1 대시보드

관리자가 발송 현황을 모니터링:

- 대기 중 이메일 수
- 발송 실패 수
- 발송 성공률
- 실패 사유별 통계

### 10.2 알림

발송 실패가 일정 수준 이상이면 관리자에게 알림:

```typescript
if (failedCount > 100) {
  await alertAdmin('이메일 발송 실패가 높습니다')
}
```

---

## 참고 문서

- [03-feature-requirements.md](./03-feature-requirements.md) - 기능 요구사항
- [07-security-rules.md](./07-security-rules.md) - 보안 규칙
