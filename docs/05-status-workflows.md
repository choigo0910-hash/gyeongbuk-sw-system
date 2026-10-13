# 상태 흐름 정의

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-07-11 |
| 최종 수정일 | 2026-07-11 |

## 상태 관리 원칙

1. **코드 기반:** 상태값은 코드/enum으로 관리, 화면 문구와 분리
2. **전이 검증:** 허용된 전이만 수행
3. **이력 보존:** 상태 변경은 이력에 기록
4. **감사 추적:** 변경자, 변경일시, 변경사유 기록

---

## 1. 예산서 상태

### 1.1 상태 정의

| 코드 | 명칭 | 설명 | 표시 색상 |
|------|------|------|----------|
| `draft` | 작성 중 | 임시저장 상태 | 회색 |
| `submitted` | 제출 완료 | 관리자 승인 대기 | 파란색 |
| `reviewing` | 검토 중 | 관리자 검토 중 | 주황색 |
| `revision_requested` | 보완 요청 | 보완 필요 | 주황색 |
| `approved` | 승인 완료 | 최종 승인 | 녹색 |
| `rejected` | 반려 | 승인 거부 | 빨간색 |

### 1.2 상태 전이 다이어그램

```
                    ┌─────────────┐
                    │    draft    │  (작성 중)
                    └──────┬──────┘
                           │ 제출
                           ▼
                    ┌─────────────┐
                    │  submitted  │  (제출 완료)
                    └──────┬──────┘
                           │ 검토 시작
                           ▼
                    ┌─────────────┐
           ┌────────│  reviewing  │──────────┐
           │        └──────┬──────┘          │
           │               │                 │
    보완 요청              │         승인/반려
           │               │                 │
           ▼               ▼                 ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │revision_req │  │  approved   │  │  rejected   │
    │ uested      │  │             │  │             │
    └──────┬──────┘  └─────────────┘  └─────────────┘
           │
         보완 후 재제출
           │
           ▼
    ┌─────────────┐
    │  submitted  │
    └─────────────┘
```

### 1.3 허용된 전이

| 현재 상태 | 다음 상태 | 조건 |
|----------|----------|------|
| `draft` | `submitted` | 작성자가 제출 |
| `submitted` | `reviewing` | 관리자가 검토 시작 |
| `submitted` | `approved` | 관리자가 즉시 승인 |
| `submitted` | `rejected` | 관리자가 반려 |
| `reviewing` | `revision_requested` | 보완 필요 |
| `reviewing` | `approved` | 승인 |
| `reviewing` | `rejected` | 반려 |
| `revision_requested` | `submitted` | 기업이 보완 후 재제출 |
| `approved` | - | 더 이상 변경 불가 (변경 예산으로만 가능) |

---

## 2. 구매요청 상태

### 2.1 상태 정의

| 코드 | 명칭 | 설명 |
|------|------|------|
| `draft` | 작성 중 | 임시저장 |
| `submitted` | 제출 완료 | 관리자 승인 대기 |
| `reviewing` | 검토 중 | 관리자 검토 중 |
| `approved` | 승인 완료 | 구매 승인 |
| `rejected` | 반려 | 승인 거부 |
| `purchase_completed` | 구매 완료 | 구매 완료, 증빙 대기 |
| `proof_submitted` | 증빙 제출 | 증빙자료 제출 완료 |
| `proof_approved` | 증빙 승인 | 증빙 승인 완료 |
| `proof_rejected` | 증빙 반려 | 증빙 보완 필요 |
| `completed` | 집행 완료 | 전체 프로세스 완료 |

### 2.2 상태 전이 다이어그램

```
    ┌─────────┐
    │  draft  │
    └────┬────┘
         │ 제출
         ▼
   ┌─────────┐     승인     ┌─────────┐
   │submitted│─────────────▶│ approved │
   └────┬────┘             └────┬────┘
        │                        │ 구매 완료
        ▼                        ▼
   ┌─────────┐            ┌──────────────┐
   │ rejected│            │purchase_comp  │
   └─────────┘            │    leted      │
                          └───────┬───────┘
                                  │ 증빙 제출
                                  ▼
                          ┌──────────────┐
                          │proof_submitted│
                          └───────┬───────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
         ┌──────────┐      ┌──────────┐      ┌──────────┐
         │ completed│      │proof_    │      │proof_    │
         │          │      │approved  │      │rejected  │
         └──────────┘      └──────────┘      └────┬─────┘
                                                   │ 재제출
                                                   ▼
                                            ┌──────────────┐
                                            │proof_submitted│
                                            └──────────────┘
```

---

## 3. 환급신청 상태

### 3.1 상태 정의

| 코드 | 명칭 | 설명 |
|------|------|------|
| `draft` | 작성 중 | 임시저장 |
| `submitted` | 제출 완료 | 관리자 승인 대기 |
| `reviewing` | 검토 중 | 관리자 검토 중 |
| `revision_requested` | 보완 요청 | 보완 필요 |
| `approved` | 승인 완료 | 환급 승인 |
| `rejected` | 반려 | 승인 거부 |
| `processing` | 지급 처리 | 지급 진행 중 |
| `completed` | 지급 완료 | 지급 완료 |

### 3.2 상태 전이

```
    ┌─────────┐
    │  draft  │
    └────┬────┘
         │ 제출
         ▼
   ┌─────────┐
   │submitted│
   └────┬────┘
        │
        ▼
   ┌─────────┐     보완 요청      ┌─────────────────┐
   │reviewing│───────────────────▶│revision_requested│
   └────┬────┘                   └────────┬────────┘
        │                                  │재제출
        │                                  │
        ▼                                  ▼
   ┌─────────┐                     ┌─────────┐
   │ approved│                     │submitted│
   └────┬────┘                     └─────────┘
        │
        ▼
   ┌───────────┐
   │processing │
   └─────┬─────┘
         │
         ▼
   ┌───────────┐
   │ completed │
   └───────────┘
```

---

## 4. 프로그램 신청 상태

### 4.1 상태 정의

| 코드 | 명칭 | 설명 |
|------|------|------|
| `draft` | 작성 중 | 임시저장 |
| `submitted` | 신청 완료 | 제출 완료 |
| `reviewing` | 검토 중 | 관리자 검토 중 |
| `approved` | 참가 승인 | 참가 승인 |
| `waitlisted` | 대기 | 대기자 |
| `rejected` | 반려 | 신청 반려 |
| `cancelled` | 취소 | 신청 취소 |
| `completed` | 참가 완료 | 프로그램 참가 완료 |
| `no_show` | 불참 | 불참 |

### 4.2 상태 전이 다이어그램

```
                    ┌─────────┐
                    │  draft  │
                    └────┬────┘
                         │ 신청
                         ▼
                  ┌─────────┐
                  │submitted│
                  └────┬────┘
                       │
                       ▼
              ┌────────────┐
              │  reviewing  │
              └──────┬──────┘
                     │
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ approved │    │waitlisted│    │ rejected │
└─────┬────┘    └──────────┘    └──────────┘
      │                                ▲
      │                                │ 취소
      │                                │
      ▼                           ┌─────────┐
┌──────────┐                      │cancelled│
│ completed│                      └─────────┘
└──────────┘
      │
      │ 불찐 처리
      ▼
┌──────────┐
│ no_show  │
└──────────┘
```

### 4.3 상태별 가능한 작업

| 상태 | 가능한 작업 |
|------|-------------|
| `draft` | 작성, 제출, 취소 |
| `submitted` | 취소 (관리자 검토 전만) |
| `reviewing` | - |
| `approved` | - |
| `waitlisted` | - |
| `rejected` | - |
| `cancelled` | - |
| `completed` | - |
| `no_show` | - |

---

## 5. 프로그램 게시 상태

### 5.1 상태 정의

| 코드 | 명칭 | 설명 |
|------|------|------|
| `draft` | 임시저장 | 작성 중 |
| `published` | 게시됨 | 공개 게시 |
| `unpublished` | 비공개 | 비공개 상태 |
| `archived` | 보관 | 종료 후 보관 |

---

## 6. 이메일 발송 상태

### 6.1 상태 정의

| 코드 | 명칭 | 설명 |
|------|------|------|
| `pending` | 대기 중 | 발송 대기 |
| `sent` | 발송 완료 | 발송 성공 |
| `failed` | 발송 실패 | 발송 실패 (재시도 필요) |

### 6.2 실패 사유

| 코드 | 설명 |
|------|------|
| `no_recipient` | 수신자 이메일 없음 |
| `service_error` | 발송 서비스 오류 |
| `rate_limit` | 발송 한도 초과 |
| `invalid_email` | 잘못된 이메일 형식 |
| `unknown` | 알 수 없는 오류 |

---

## 7. 상태 변경 이력

### 7.1 기록 항목

모든 상태 변경은 다음을 기록해야 합니다:

| 항목 | 설명 |
|------|------|
| `id` | 이력 ID |
| `entity_type` | 엔티티 유형 (budget, purchase_request 등) |
| `entity_id` | 엔티티 ID |
| `from_status` | 이전 상태 |
| `to_status` | 새 상태 |
| `changed_by` | 변경자 사용자 ID |
| `changed_at` | 변경 일시 |
| `reason` | 변경 사유 |
| `metadata` | 추가 정보 (JSON) |

### 7.2 상태 이력 테이블 구조

```sql
CREATE TABLE status_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    metadata JSONB
);

-- 인덱스
CREATE INDEX idx_status_histories_entity ON status_histories(entity_type, entity_id);
CREATE INDEX idx_status_histories_changed_at ON status_histories(changed_at DESC);
```

---

## 8. TypeScript 상태 정의

### 8.1 예산서 상태

```typescript
export enum BudgetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  REVISION_REQUESTED = 'revision_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export const budgetStatusLabels: Record<BudgetStatus, string> = {
  [BudgetStatus.DRAFT]: '작성 중',
  [BudgetStatus.SUBMITTED]: '제출 완료',
  [BudgetStatus.REVIEWING]: '검토 중',
  [BudgetStatus.REVISION_REQUESTED]: '보완 요청',
  [BudgetStatus.APPROVED]: '승인 완료',
  [BudgetStatus.REJECTED]: '반려'
};

export const budgetStatusColors: Record<BudgetStatus, string> = {
  [BudgetStatus.DRAFT]: 'gray',
  [BudgetStatus.SUBMITTED]: 'blue',
  [BudgetStatus.REVIEWING]: 'orange',
  [BudgetStatus.REVISION_REQUESTED]: 'orange',
  [BudgetStatus.APPROVED]: 'green',
  [BudgetStatus.REJECTED]: 'red'
};
```

---

## 참고 문서

- [03-feature-requirements.md](./03-feature-requirements.md) - 기능 요구사항
- [06-database-conceptual-design.md](./06-database-conceptual-design.md) - DB 설계
