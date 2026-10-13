# DB 개념 설계

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-07-11 |
| 최종 수정일 | 2026-07-11 |

## 설계 원칙

1. **RLS 필수:** 모든 업무 테이블에 Row Level Security 적용
2. **감사 추적:** 중요 변경은 이력에 기록
3. **Soft Delete:** 업무 데이터는 deleted_at으로 삭제 표시
4. **UTC 저장:** 시간은 UTC로 저장, 화면에서 로컬 시간으로 변환
5. **금액 타입:** 금액은 정수(원) 또는 numeric 사용
6. **상태 코드:** 상태는 코드로 저장, 화면 문구는 분리

---

## ERD 개요

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   users     │──────│ user_roles  │     │   roles     │
│ (Supabase)  │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
       │
       ├─────────────┐
       │             │
┌─────────────┐ ┌─────────────┐
│  companies  │ │  programs   │
└─────────────┘ └──────┬──────┘
       │               │
       │     ┌─────────┴─────────┐
       │     │                   │
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   budgets   │ │  program_   │ │  program_   │
│             │ │  questions  │ │  applications│
└──────┬──────┘ └─────────────┘ └──────┬──────┘
       │                              │
┌─────────────┐              ┌─────────────┐
│ budget_     │              │ certificates│
│ items      │              └─────────────┘
└─────────────┘
       │
┌─────────────┐
│ budget_     │
│ changes    │
└─────────────┘

┌─────────────┐      ┌─────────────┐
│ purchase_   │      │  refund_    │
│ requests   │      │ applications│
└─────────────┘      └──────┬──────┘
                            │
                     ┌─────────────┐
                     │checklist_   │
                     │results      │
                     └─────────────┘

┌─────────────┐      ┌─────────────┐
│ guidelines  │      │    faqs     │
└─────────────┘      └─────────────┘

┌─────────────┐      ┌─────────────┐
│ status_     │      │  email_     │
│ histories   │      │  logs       │
└─────────────┘      └─────────────┘
```

---

## 테이블 정의

### 1. 사용자 및 역할

#### users (Supabase Auth)
Supabase Auth가 제공하는 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 사용자 ID (PK) |
| email | TEXT | 이메일 |
| ... | ... | Supabase Auth 표준 컬럼 |

#### roles
역할 정의 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| code | TEXT | 역할 코드 | UNIQUE, NOT NULL |
| name | TEXT | 역할명 | NOT NULL |
| description | TEXT | 설명 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |

**역할 코드:** `company_user`, `individual_user`, `admin`, `super_admin`

#### user_roles
사용자-역할 매핑 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| user_id | UUID | 사용자 ID | FK users(id), NOT NULL |
| role_id | UUID | 역할 ID | FK roles(id), NOT NULL |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| UNIQUE(user_id, role_id) | | | |

#### user_companies
기업 사용자 소속 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| user_id | UUID | 사용자 ID | FK users(id), NOT NULL |
| company_id | UUID | 기업 ID | FK companies(id), NOT NULL |
| is_primary | BOOLEAN | 대표 사용자 | DEFAULT false |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| UNIQUE(user_id, company_id) | | | |

---

### 2. 기업

#### companies
기업 정보 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| name | TEXT | 기업명 | NOT NULL |
| registration_number | TEXT | 사업자등록번호 | UNIQUE |
| ceo_name | TEXT | 대표자명 | |
| address | TEXT | 주소 | |
| contact_name | TEXT | 담당자명 | |
| contact_email | TEXT | 담당자 이메일 | |
| contact_phone | TEXT | 담당자 연락처 | |
| deleted_at | TIMESTAMPTZ | 삭제일시 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

---

### 3. 사업/프로그램

#### programs
사업/프로그램 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| name | TEXT | 프로그램명 | NOT NULL |
| description | TEXT | 설명 | |
| status | TEXT | 상태 | NOT NULL |
| application_opens_at | TIMESTAMPTZ | 신청 시작일시 | |
| application_closes_at | TIMESTAMPTZ | 신청 종료일시 | |
| starts_at | TIMESTAMPTZ | 시작일시 | |
| ends_at | TIMESTAMPTZ | 종료일시 | |
| location | TEXT | 장소 | |
| capacity | INTEGER | 정원 | |
| current_applicants | INTEGER | 현재 신청자 | DEFAULT 0 |
| deleted_at | TIMESTAMPTZ | 삭제일시 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

#### program_questions
프로그램 신청서 질문 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| program_id | UUID | 프로그램 ID | FK programs(id), NOT NULL |
| question_text | TEXT | 질문 내용 | NOT NULL |
| question_type | TEXT | 질문 유형 | NOT NULL |
| options | JSONB | 선택지 (단일/복수 선택) | |
| is_required | BOOLEAN | 필수 여부 | DEFAULT true |
| sort_order | INTEGER | 정렬 순서 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

**질문 유형:** `short_text`, `long_text`, `number`, `date`, `single_choice`, `multiple_choice`, `file_upload`

---

### 4. 예산

#### budgets
예산서 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| program_id | UUID | 사업 ID | FK programs(id), NOT NULL |
| company_id | UUID | 기업 ID | FK companies(id), NOT NULL |
| fiscal_year | INTEGER | 회계연도 | NOT NULL |
| status | TEXT | 상태 | NOT NULL |
| submitted_by | UUID | 제출자 | FK users(id) |
| submitted_at | TIMESTAMPTZ | 제출일시 | |
| reviewed_by | UUID | 검토자 | FK users(id) |
| reviewed_at | TIMESTAMPTZ | 검토일시 | |
| approved_by | UUID | 승인자 | FK users(id) |
| approved_at | TIMESTAMPTZ | 승인일시 | |
| total_amount | INTEGER | 총액 (원) | |
| note | TEXT | 비고 | |
| deleted_at | TIMESTAMPTZ | 삭제일시 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

#### budget_items
예산 항목 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| budget_id | UUID | 예산서 ID | FK budgets(id), NOT NULL |
| category | TEXT | 비목 | NOT NULL |
| detail | TEXT | 세목 | NOT NULL |
| item | TEXT | 품목 | |
| description | TEXT | 내용 | |
| quantity | INTEGER | 수량 | |
| unit_price | INTEGER | 단가 (원) | |
| amount | INTEGER | 금액 (원) | NOT NULL |
| sort_order | INTEGER | 정렬 순서 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

#### budget_changes
예산 변경 이력 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| budget_id | UUID | 원본 예산서 ID | FK budgets(id), NOT NULL |
| version | INTEGER | 버전 | NOT NULL |
| change_type | TEXT | 변경 유형 | NOT NULL |
| reason | TEXT | 변경 사유 | NOT NULL |
| total_amount | INTEGER | 총액 (원) | |
| created_by | UUID | 생성자 | FK users(id), NOT NULL |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |

**변경 유형:** `new`, `delete`, `amount_increase`, `amount_decrease`, `category_change`, `content_change`

#### budget_change_items
변경 예산 항목 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| budget_change_id | UUID | 변경 ID | FK budget_changes(id), NOT NULL |
| original_item_id | UUID | 원본 항목 ID | FK budget_items(id) |
| category | TEXT | 비목 | NOT NULL |
| detail | TEXT | 세목 | NOT NULL |
| item | TEXT | 품목 | |
| description | TEXT | 내용 | |
| quantity | INTEGER | 수량 | |
| unit_price | INTEGER | 단가 (원) | |
| amount | INTEGER | 금액 (원) | NOT NULL |
| sort_order | INTEGER | 정렬 순서 | |

---

### 5. 구매요청

#### purchase_requests
구매요청 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| company_id | UUID | 기업 ID | FK companies(id), NOT NULL |
| requester_id | UUID | 요청자 | FK users(id), NOT NULL |
| item_name | TEXT | 품목명 | NOT NULL |
| quantity | INTEGER | 수량 | NOT NULL |
| unit_price | INTEGER | 단가 (원) | |
| requested_amount | INTEGER | 요청 금액 (원) | NOT NULL |
| approved_amount | INTEGER | 승인 금액 (원) | |
| paid_amount | INTEGER | 실제 결제 금액 (원) | |
| vendor | TEXT | 구매처 | NOT NULL |
| category | TEXT | 세목 | NOT NULL |
| purpose | TEXT | 사용 내용 | |
| purchase_date | DATE | 구매 일자 | |
| status | TEXT | 상태 | NOT NULL |
| reviewed_by | UUID | 검토자 | FK users(id) |
| reviewed_at | TIMESTAMPTZ | 검토일시 | |
| approved_by | UUID | 승인자 | FK users(id) |
| approved_at | TIMESTAMPTZ | 승인일시 | |
| rejection_reason | TEXT | 반려 사유 | |
| deleted_at | TIMESTAMPTZ | 삭제일시 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

#### proof_documents
증빙자료 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| purchase_request_id | UUID | 구매요청 ID | FK purchase_requests(id), NOT NULL |
| file_name | TEXT | 원본 파일명 | NOT NULL |
| system_file_name | TEXT | 시스템 파일명 | NOT NULL |
| file_path | TEXT | Storage 경로 | NOT NULL |
| file_size | INTEGER | 파일 크기 (byte) | |
| mime_type | TEXT | MIME 타입 | |
| submitted_by | UUID | 제출자 | FK users(id), NOT NULL |
| submitted_at | TIMESTAMPTZ | 제출일시 | DEFAULT NOW() |
| status | TEXT | 상태 | NOT NULL |
| reviewed_by | UUID | 검토자 | FK users(id) |
| reviewed_at | TIMESTAMPTZ | 검토일시 | |
| rejection_reason | TEXT | 반려 사유 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |

---

### 6. 환급신청

#### refund_applications
환급신청 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| company_id | UUID | 기업 ID | FK companies(id) |
| applicant_id | UUID | 신청자 | FK users(id), NOT NULL |
| refund_recipient_name | TEXT | 환급 대상자명 | NOT NULL |
| refund_recipient_type | TEXT | 대상자 유형 | NOT NULL |
| requested_amount | INTEGER | 요청 금액 (원) | NOT NULL |
| approved_amount | INTEGER | 승인 금액 (원) | |
| paid_amount | INTEGER | 지급 금액 (원) | |
| payment_date | DATE | 결제일 | NOT NULL |
| vendor | TEXT | 구매처 | NOT NULL |
| purpose | TEXT | 사용 내용 | NOT NULL |
| payment_method | TEXT | 결제 수단 | NOT NULL |
| category | TEXT | 세목 | NOT NULL |
| status | TEXT | 상태 | NOT NULL |
| reviewed_by | UUID | 검토자 | FK users(id) |
| reviewed_at | TIMESTAMPTZ | 검토일시 | |
| approved_by | UUID | 승인자 | FK users(id) |
| approved_at | TIMESTAMPTZ | 승인일시 | |
| rejection_reason | TEXT | 반려 사유 | |
| deleted_at | TIMESTAMPTZ | 삭제일시 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

**대상자 유형:** `company`, `individual`

#### checklist_items
체크리스트 항목 정의 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| code | TEXT | 항목 코드 | UNIQUE, NOT NULL |
| name | TEXT | 항목명 | NOT NULL |
| description | TEXT | 설명 | |
| sort_order | INTEGER | 정렬 순서 | |
| is_active | BOOLEAN | 활성화 | DEFAULT true |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

#### checklist_results
체크리스트 결과 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| refund_application_id | UUID | 환급신청 ID | FK refund_applications(id), NOT NULL |
| checklist_item_id | UUID | 항목 ID | FK checklist_items(id), NOT NULL |
| result | TEXT | 결과 | NOT NULL |
| checked_by | UUID | 확인자 | FK users(id), NOT NULL |
| checked_at | TIMESTAMPTZ | 확인일시 | DEFAULT NOW() |
| note | TEXT | 메모 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |
| UNIQUE(refund_application_id, checklist_item_id) | | | |

---

### 7. 프로그램 신청

#### program_applications
프로그램 신청서 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| program_id | UUID | 프로그램 ID | FK programs(id), NOT NULL |
| applicant_id | UUID | 신청자 | FK users(id), NOT NULL |
| status | TEXT | 상태 | NOT NULL |
| application_data | JSONB | 신청서 응답 | |
| reviewed_by | UUID | 검토자 | FK users(id) |
| reviewed_at | TIMESTAMPTZ | 검토일시 | |
| approved_by | UUID | 승인자 | FK users(id) |
| approved_at | TIMESTAMPTZ | 승인일시 | |
| rejection_reason | TEXT | 반려 사유 | |
| completed_at | TIMESTAMPTZ | 완료일시 | |
| deleted_at | TIMESTAMPTZ | 삭제일시 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

---

### 8. 확인서

#### certificates
참가 확인서 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| application_id | UUID | 신청서 ID | FK program_applications(id), NOT NULL |
| document_number | TEXT | 문서번호 | UNIQUE, NOT NULL |
| participant_name | TEXT | 참가자명 | NOT NULL |
| affiliation | TEXT | 소속 | |
| program_name | TEXT | 프로그램명 | NOT NULL |
| program_start_at | TIMESTAMPTZ | 시작일시 | |
| program_end_at | TIMESTAMPTZ | 종료일시 | |
| location | TEXT | 장소 | |
| issued_at | DATE | 발급일 | NOT NULL |
| issued_by | UUID | 발급자 | FK users(id), NOT NULL |
| verification_code | TEXT | 검증 코드 | UNIQUE, NOT NULL |
| pdf_path | TEXT | PDF 경로 | |
| reissue_count | INTEGER | 재발급 횟수 | DEFAULT 0 |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |

---

### 9. 가이드라인

#### guidelines
가이드라인 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| title | TEXT | 제목 | NOT NULL |
| content | TEXT | 내용 | NOT NULL |
| version | TEXT | 버전 | NOT NULL |
| effective_date | DATE | 시행일 | |
| is_published | BOOLEAN | 공개 여부 | DEFAULT false |
| published_by | UUID | 게시자 | FK users(id) |
| published_at | TIMESTAMPTZ | 게시일시 | |
| deleted_at | TIMESTAMPTZ | 삭제일시 | |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

#### faqs
FAQ 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| question | TEXT | 질문 | NOT NULL |
| answer | TEXT | 답변 | NOT NULL |
| category | TEXT | 카테고리 | |
| sort_order | INTEGER | 정렬 순서 | |
| is_published | BOOLEAN | 공개 여부 | DEFAULT false |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

---

### 10. 공통

#### status_histories
상태 변경 이력 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| entity_type | TEXT | 엔티티 유형 | NOT NULL |
| entity_id | UUID | 엔티티 ID | NOT NULL |
| from_status | TEXT | 이전 상태 | |
| to_status | TEXT | 새 상태 | NOT NULL |
| changed_by | UUID | 변경자 | FK users(id) |
| changed_at | TIMESTAMPTZ | 변경일시 | DEFAULT NOW() |
| reason | TEXT | 변경 사유 | |
| metadata | JSONB | 추가 정보 | |

#### email_logs
이메일 발송 로그 테이블

| 컬럼 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | PK | DEFAULT gen_random_uuid() |
| template_id | TEXT | 템플릿 ID | NOT NULL |
| recipient_email | TEXT | 수신자 이메일 | NOT NULL |
| recipient_name | TEXT | 수신자명 | |
| subject | TEXT | 제목 | NOT NULL |
| status | TEXT | 발송 상태 | NOT NULL |
| error_reason | TEXT | 실패 사유 | |
| sent_at | TIMESTAMPTZ | 발송일시 | |
| retry_count | INTEGER | 재시도 횟수 | DEFAULT 0 |
| created_at | TIMESTAMPTZ | 생성일시 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 수정일시 | DEFAULT NOW() |

---

## RLS 정책 예시

### companies 테이블

```sql
-- RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 관리자: 전체 조회
CREATE POLICY "Admins can view all companies"
ON companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code IN ('admin', 'super_admin')
  )
);

-- 기업 사용자: 자사 정보만 조회
CREATE POLICY "Company users can view own company"
ON companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
);

-- Super admin만 생성/수정/삭제
CREATE POLICY "Super admins can manage companies"
ON companies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code = 'super_admin'
  )
);
```

### budgets 테이블

```sql
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 기업 사용자: 자사 예산만 조회
CREATE POLICY "Company users can view own budgets"
ON budgets FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
);

-- 관리자: 담당 사업 예산 조회
CREATE POLICY "Admins can view managed program budgets"
ON budgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.code IN ('admin', 'super_admin')
  )
);
```

---

## 참고 문서

- [02-user-roles-and-permissions.md](./02-user-roles-and-permissions.md) - 권한 정의
- [05-status-workflows.md](./05-status-workflows.md) - 상태 정의
- [07-security-rules.md](./07-security-rules.md) - 보안 규칙
