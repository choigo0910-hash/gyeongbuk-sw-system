# TODO - 경북 SW 성장기업육성지원사업 통합 관리 시스템

## 프로젝트 개요

**프로젝트명:** gyeongbuk-sw-system
**시작일:** 2026-07-11
**기술 스택:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase, Resend

---

## 최종 업데이트
**2026-10-13 15:02**
**2026-10-13 14:40**
**2026-10-13 13:25**
**2026-07-25 15:00**
**2026-07-25 14:00**
**2026-07-25 10:30**
**2026-07-25 10:00**

---

## 완료된 작업 ✓

### Phase 0: 프로젝트 설정 ✅
- [x] Next.js, TypeScript, Tailwind CSS, shadcn/ui
- [x] Supabase 클라우드 연결

### Phase 1: 인증 및 권한 ✅ 완료
- [x] DB 스키마 및 RLS 정책
- [x] 인증 시스템 (로그인, 세션, UserProvider)
- [x] 사용자 관리 및 역할 변경
- [x] 로그인 테스트 완료

### Phase 2: 예산관리 ✅ 완료
- [x] budgets, budget_items, budget_changes 테이블
- [x] RLS 정책
- [x] **예산서 작성 (/portal/budgets/new) ✅**
- [x] **예산서 목록 (/portal/budgets) ✅**
- [x] **예산서 상세 (/portal/budgets/[id]) ✅**
- [x] **관리자 검토 (/admin/budgets/[id]/review) ✅**
- [x] **관리자 목록 (/admin/budgets) ✅**

### Phase 3: 결제 및 구매 요청 ✅ 완료
- [x] purchase_requests, proof_documents 테이블
- [x] RLS 정책
- [x] **구매분류별 동적 필드 및 설명 ✅**
- [x] **결제 및 구매 요청 작성 (/portal/purchase-requests/new) ✅**
- [x] **결제 및 구매 요청 목록 (/portal/purchase-requests) ✅**
- [x] **결제 및 구매 요청 상세 및 증빙제출 (/portal/purchase-requests/[id]) ✅**
- [x] **관리자 검토 (/admin/purchase-requests/[id]/review) ✅**
- [x] **관리자 목록 (/admin/purchase-requests) ✅**
- [x] **상세 내용 JSON 파싱 및 카드 형태 표시 ✅**
- [x] **수정/삭제 기능 (목록 페이지) ✅**
- [x] **검토 시작 버튼 및 상태 관리 ✅**
- [x] **반려된 요청 재제출 기능 ✅**

### Phase 4: 환급신청 ✅ 완료
- [x] refund_applications, refund_proof_documents 테이블
- [x] RLS 정책
- [x] **환급신청 작성 (/portal/refunds/new) ✅**
- [x] **환급신청 목록 (/portal/refunds) ✅**
- [x] **환급신청 상세 (/portal/refunds/[id]) ✅**
- [x] **관리자 검토 및 지급 (/admin/refunds/[id]/review) ✅**
- [x] **관리자 목록 (/admin/refunds) ✅**

### Phase 5: 프로그램 운영 ✅ 완료
- [x] programs, program_applications, program_attendances 테이블
- [x] RLS 정책
- [x] **프로그램 목록 (/portal/programs) ✅**
- [x] **프로그램 상세 및 신청 (/portal/programs/[id]) ✅**
- [x] **내 신청 현황 (/portal/my-applications) ✅**
- [x] **프로그램 관리 (/admin/programs) ✅**
- [x] **참가자 관리 (/admin/programs/[id]) ✅**

### Phase 6: 확인서 발급 ✅ 완료
- [x] certificates 테이블
- [x] RLS 정책
- [x] **확인서 목록 (/portal/certificates) ✅**
- [x] **확인서 발급 신청 (/portal/certificates/new) ✅**
- [x] **확인서 상세 및 다운로드 (/portal/certificates/[id]) ✅**
- [x] **관리자 발급 관리 (/admin/certificates) ✅**
- [x] **진위 확인 (/verify/[code]) ✅**

### Phase 7: 가이드라인 및 챗봇 ✅ 완료
- [x] guides, faqs, notices, document_templates 테이블
- [x] RLS 정책
- [x] **가이드라인 목록 (/portal/guidelines) ✅**
- [x] **가이드, FAQ, 공지사항, 서류 양식 탭 ✅**
- [x] **관리자 가이드라인 관리 (/admin/guidelines) ✅**
- [x] **가이드 CRUD ✅**
- [x] **FAQ CRUD ✅**
- [x] **공지사항 CRUD ✅**
- [x] **서류 양식 CRUD ✅**
- [x] chat_conversations, chat_messages, chatbot_knowledge 테이블
- [x] RLS 정책
- [x] **챗봇 위젯 (플로팅 버튼) ✅**
- [x] **실시간 채팅 UI ✅**
- [x] **지식 베이스 기반 응답 ✅**
- [x] **채팅 기록 관리 ✅**
- [x] **관리자 챗봇 관리 (/admin/chatbot) ✅**

### Phase 8: 대시보드 개선 ✅ 완료
- [x] **포털 대시보드 개선 ✅**
  - 실시간 통계 (예산, 구매, 환급, 프로그램)
  - 예산 사용 현황 차트
  - 최근 활동 목록
  - 빠른 링크 및 안내 배너
  - **UI 레이아웃 개선 (2026-07-14 18:00) ✅**
    - 웰컴 배너 추가 (그라데이션, 패턴 효과)
    - 대기 업무 알림 섹션 추가
    - 통계 카드 개선 (애니메이션, 호버 효과)
    - 예산 사용 현황 카드 개선 (그라데이션 프로그레스 바)
    - 최근 활동 & 빠른 링크 개선
    - 도움 배너 개선 (반응형 레이아웃)
- [x] **관리자 대시보드 개선 ✅**
  - 전체 시스템 통계
  - 월별 현황 차트 (예산/구매/환급)
  - 대기 중인 검토 목록
  - 빠른 링크 및 시스템 안내

### Phase 9: 알림 기능 ✅ 완료
- [x] notification_settings, notifications, email_templates 테이블
- [x] RLS 정책
- [x] **알림 라이브러리 (/lib/notifications.ts) ✅**
- [x] **알림 드롭다운 (포털 헤더) ✅**
- [x] **알림 목록 페이지 (/portal/notifications) ✅**
- [x] **알림 설정 페이지 (/portal/settings/notifications) ✅**
- [x] **관리자 알림 관리 (/admin/notifications) ✅**
- [x] **이메일 템플릿 CRUD ✅**
- [x] **전체 알림 발송 기능 ✅**

### Phase 10: 추가 관리자 기능 ✅ 완료 (2026-07-12)
- [x] **프로그램 신청 관리 (/admin/applications) ✅**
  - 전체 프로그램 신청 내역 조회
  - 프로그램별, 상태별 필터링
  - 신청자 정보 표시 (이메일, 기업명)
  - 상태 변경 기능 (승인, 반려 등)
- [x] **챗봇 관리 (/admin/chatbot) ✅**
  - 지식 베이스 CRUD (질문/답변 추가/수정/삭제)
  - 카테고리 및 우선순위 설정
  - 채팅 기록 조회
  - 대화 내용 확인
- [x] **관리자 설정 (/admin/settings) ✅**
  - 사이트 기본 정보 설정
  - 알림 기능 설정 (이메일, SMS, 챗봇)
  - 자동 알림 발송 기준 설정
  - 시스템 정보 확인

### Phase 11: UI/UX 개선 ✅ 완료 (2026-07-12)
- [x] **포털 네비게이션 개선 ✅**
  - "예산 신청 내역" (/portal/applications) 링크 추가
  - "프로그램 신청 내역" (/portal/my-applications) 링크 추가
  - 명확한 메뉴 구분
- [x] **관리자 네비게이션 개선 ✅**
  - "챗봇 관리" 링크 추가
- [x] **TypeScript 타입 오류 수정 ✅**
  - Supabase 쿼리 결과 타입 처리 개선
  - 컴포넌트 props 타입 수정
  - Import 문 수정
  - middleware.ts 쿠키 삭제 메서드 수정
  - lib/auth.ts 서버/클라이언트 클라이언트 구분
  - UserProvider.tsx 타입 수정
  - dialog.tsx 타입 수정
  - status.ts 타입 수정

### Phase 12: 알림 이메일 기능 개선 ✅ 완료 (2026-07-12)
- [x] **알림 설정 업데이트 수정 ✅**
  - `updateNotificationSetting` 함수에 `onConflict` 옵션 추가
  - 에러 로그 개선
- [x] **예산 검토 시 알림 발송 ✅**
  - 승인 시 알림 및 이메일 발송
  - 반려 시 알림 및 이메일 발송
  - 보완 요청 시 알림 및 이메일 발송
- [x] **이메일 API 라우트 생성 ✅**
  - `/api/notifications/send-email` 엔드포인트 생성
  - Resend를 통한 이메일 발송
- [x] **Resend 설정 파일 생성 ✅**
  - `src/lib/resend.ts` 파일 생성

### Phase 13: 알림 기능 버그 수정 ✅ 완료 (2026-07-13)
- [x] **구매 반려/증빙승인/증빙반려 알림 ✅**
  - `/admin/purchase-requests/[id]/review`에 알림 발송 추가
  - `getUserEmail()` 함수로 사용자 이메일 자동 조회
- [x] **환급 승인/반려/지급 알림 ✅**
  - `/admin/refunds/[id]/review`에 알림 발송 추가
  - `refund_approved`, `refund_rejected`, `refund_paid` 알림
- [x] **프로그램 알림 통합 ✅**
  - 5개 알림 → 1개 `program_notifications`로 통합
  - DB migration 업데이트 (`purchase_proof_rejected` 추가)
- [x] **프로그램 승인/반려 알림 ✅**
  - `/admin/applications`에 상태 변경 시 알림 추가
  - `/admin/programs/[id]`에 상태 변경 시 알림 추가
- [x] **알림 설정 스위치 클릭 문제 수정 ✅**
  - DB에 없는 설정도 스위치 작동하도록 `handleToggle` 함수 수정
  - 새 설정이 로컬 상태에 추가되도록 수정
- [x] **알림 설정 import 경로 수정 ✅**
  - `NotificationType`을 `@/lib/notifications`에서 import하도록 수정

### Phase 14: 예산서 엑셀 업로드 기능 ✅ 완료 (2026-07-13)
- [x] **xlsx 패키지 설치 ✅**
- [x] **엑셀 유틸리티 라이브러리 생성 ✅**
  - `src/lib/excel.ts` - 템플릿 생성, 파싱, 내보내기 함수
- [x] **템플릿 다운로드 API ✅**
  - `/api/admin/budgets/template` - 엑셀 템플릿 다운로드
- [x] **엑셀 업로드 API ✅**
  - `/api/admin/budgets/import` - 엑셀 파일 파싱 후 DB 저장
  - 기업/프로그램/연도 선택 필수
  - 총액 자동 계산
- [x] **관리자 업로드 UI ✅**
  - `/admin/budgets` 페이지에 업로드 버튼 추가
  - 템플릿 다운로드 버튼
  - 업로드 다이얼로그 (기업/프로그램/연도/파일 선택)

### Phase 15: 기업 서류 제출 기능 ✅ 완료 (2026-07-15 ~ 2026-07-24)
- [x] **company_documents 테이블 생성 ✅**
  - 사업자등록증, 중간/최종 성과 보고서
  - 상태 관리 (draft, submitted, approved, rejected)
  - RLS 정책
- [x] **Storage 버킷 생성 ✅**
  - `company-documents` 버킷 (이미 존재)
- [x] **타입 정의 ✅**
  - `CompanyDocument` 타입 추가 (`src/types/database.ts`)
- [x] **알림 타입 추가 ✅**
  - `DOCUMENT_APPROVED`, `DOCUMENT_REJECTED` 추가
- [x] **포털 페이지 ✅**
  - `/portal/company-documents` - 서류 목록 및 필터링
  - `/portal/company-documents/upload` - 서류 업로드
  - 포털 네비게이션 링크 추가
- [x] **관리자 페이지 ✅**
  - `/admin/company-documents` - 전체 서류 목록 및 필터링
  - `/admin/company-documents/[id]/review` - 검토/승인/반려
  - 관리자 네비게이션 링크 추가
- [x] **버그 수정 ✅**
  - **프로그램 필드 제거 (2026-07-24)**
    - DB 스키마: `program_id` FK 제거
    - 타입 정의: `program_id` 제거
    - 페이지: 프로그램 선택 UI 제거
    - 제목 자동 생성: 서류 종류명만 사용
  - **파일명 한글 문제 수정 (2026-07-24)**
    - 파일명 생성 로직: `Date.now() + "_" + original_name` → `Date.now() + "_" + UUID + "." + extension`
    - 한글 파일명으로 Storage 업로드 실패 문제 해결
  - **RLS 정책 수정 (2026-07-24)**
    - `deleted_at IS NULL` 조건 추가
    - 관리자용 INSERT 정책 추가 (`Admins can insert any documents`)
    - user_companies 조건에 `deleted_at IS NULL` 추가
- [x] **기능**
  - 파일 업로드 (Supabase Storage: company-documents)
  - 파일 형식 제한 (PDF, JPG, JPEG, PNG, 최대 10MB)
  - 상태 관리 (draft → submitted → approved/rejected)
  - 알림 발송 (승인/반려 시)

---

## 생성된 페이지

### 포털 (기업 사용자)
| 경로 | 기능 |
|------|------|
| `/portal/dashboard` | 대시보드 |
| `/portal/budgets` | 예산서 목록 |
| `/portal/budgets/new` | 예산서 작성 |
| `/portal/budgets/[id]` | 예산서 상세 |
| `/portal/applications` | 예산/구매/환급 통합 신청 내역 |
| `/portal/purchase-requests` | 결제 및 구매 요청 목록 |
| `/portal/purchase-requests/new` | 결제 및 구매 요청 작성 |
| `/portal/purchase-requests/[id]` | 결제 및 구매 요청 상세 및 증빙제출 |
| `/portal/refunds` | 환급신청 목록 |
| `/portal/refunds/new` | 환급신청 작성 |
| `/portal/refunds/[id]` | 환급신청 상세 |
| `/portal/programs` | 프로그램 목록 |
| `/portal/programs/[id]` | 프로그램 상세 및 신청 |
| `/portal/my-applications` | 내 프로그램 신청 현황 |
| `/portal/certificates` | 확인서 목록 |
| `/portal/certificates/new` | 확인서 발급 신청 |
| `/portal/certificates/[id]` | 확인서 상세 및 다운로드 |
| `/portal/guidelines` | 가이드라인 (가이드, FAQ, 공지사항, 서류 양식) |
| `/portal/notifications` | 알림 목록 |
| `/portal/settings/notifications` | 알림 설정 |
| `/portal/company-documents` | 기업 서류 목록 |
| `/portal/company-documents/upload` | 기업 서류 업로드 |
| (모든 페이지) | 챗봇 위젯 (우측 하단 플로팅) |
| (헤더) | 알림 드롭다운 |

### 관리자
| 경로 | 기능 |
|------|------|
| `/admin/dashboard` | 관리자 대시보드 |
| `/admin/users` | 사용자 관리 |
| `/admin/companies` | 기업 관리 |
| `/admin/budgets` | 예산 검토 목록 |
| `/admin/budgets/[id]/review` | 예산 검토 (승인/반려 시 알림 발송) |
| `/admin/purchase-requests` | 결제 및 구매 요청 검토 목록 |
| `/admin/purchase-requests/[id]/review` | 결제 및 구매 요청 검토 |
| `/admin/refunds` | 환급신청 검토 목록 |
| `/admin/refunds/[id]/review` | 환급신청 검토 및 지급 |
| `/admin/programs` | 프로그램 관리 |
| `/admin/programs/[id]` | 참가자 관리 |
| `/admin/applications` | 프로그램 신청 관리 |
| `/admin/certificates` | 확인서 발급 관리 |
| `/admin/guidelines` | 가이드라인 관리 (가이드, FAQ, 공지사항, 서류 양식 CRUD) |
| `/admin/chatbot` | 챗봇 관리 (지식 베이스, 채팅 기록 조회) |
| `/admin/notifications` | 알림 관리 (이메일 템플릿, 알림 히스토리, 전체 발송) |
| `/admin/company-documents` | 기업 서류 관리 (전체 목록, 검토/승인/반려) |
| `/admin/settings` | 시스템 설정 |

### API
| 경로 | 기능 |
|------|------|
| `/api/notifications/send-email` | 이메일 발송 (Resend) |
| `/api/admin/budgets/template` | 예산서 엑셀 템플릿 다운로드 |
| `/api/admin/budgets/import` | 예산서 엑셀 업로드 및 DB 저장 |

### 공개
| 경로 | 기능 |
|------|------|
| `/verify/[code]` | 확인서 진위 확인 |

---

## 테스트 상태

### ✅ 완료
- 로그인 (admin@test.com)
- 전체 빌드 성공 (TypeScript 타입 체크 통과)

### ⏸️ 보류 (기업 사용자 필요)
- 예산서 작성/제출
- 예산 검토
- 결제 및 구매 요청 작성/제출
- 증빙서류 제출
- 환급신청 작성/제출
- 프로그램 신청
- 확인서 발급

---

## DB 스키마 상태

### 완성된 테이블
- ✅ roles, user_roles, companies, user_companies
- ✅ user_profiles
- ✅ audit_logs
- ✅ budgets, budget_items, budget_changes
- ✅ purchase_requests, proof_documents
- ✅ refund_applications, refund_proof_documents
- ✅ programs, program_applications, program_attendances
- ✅ certificates
- ✅ guides, faqs, notices, document_templates
- ✅ chat_conversations, chat_messages, chatbot_knowledge
- ✅ notification_settings, notifications, email_templates

---

## 환경 설정 상태

**Supabase:** https://ngpankzsagiofueiloqc.supabase.co
**개발 서버:** http://localhost:3000

---

## 다음 세션에서 할 일

다음 `/clear` 후 새 세션에서 이어서 작업하실 때:
```
이전에 만들던 프로그램 이어서 만들어줘.
TODO.md 읽어보고 상태 알려줘.
```

**다음 작업:** 추가 기능 개발 또는 버그 수정

---

## 최근 수정 내용 (2026-07-15 14:00)

### Phase 15: 기업 서류 제출 기능 ✅ 완료
- **DB 마이그레이션 생성 ✅**
  - `company_documents` 테이블 생성
  - RLS 정책 추가
  - Storage 버킷 생성 안내
- **타입 정의 ✅**
  - `CompanyDocument` 타입 추가 (`src/types/database.ts`)
- **알림 타입 추가 ✅**
  - `DOCUMENT_APPROVED`, `DOCUMENT_REJECTED` 추가
- **포털 페이지 ✅**
  - `/portal/company-documents` - 서류 목록 및 필터링
  - `/portal/company-documents/upload` - 서류 업로드 (파일 업로드, 프로그램 선택)
  - 포털 네비게이션 링크 추가
- **관리자 페이지 ✅**
  - `/admin/company-documents` - 전체 서류 목록 및 필터링
  - `/admin/company-documents/[id]/review` - 검토/승인/반려
  - 관리자 네비게이션 링크 추가
- **기능**
  - 파일 업로드 (Supabase Storage: company-documents)
  - 파일 형식 제한 (PDF, JPG, JPEG, PNG, 최대 10MB)
  - 상태 관리 (draft → submitted → approved/rejected)
  - 알림 발송 (승인/반려 시)

---

## 최근 수정 내용 (2026-07-15 10:00)

### 버그 수정 ✅
- **빌드 에러 수정 (`src/app/portal/dashboard/page.tsx`)**
  - 문제: JSX 파싱 오류 (Unexpected token `>`)
  - 원인: base64로 인코딩된 SVG 데이터가 잘못된 형식으로 삽입됨
  - 해결: Line 347, 643의 malformed JSX 제거 (`<div></div>,PHN2Zy...` 형태 제거)

- **챗봇 관리 페이지 콘솔 에러 수정 (`src/app/admin/chatbot/page.tsx`)**
  - 문제: "채팅 기록 조회 실패: {}" 에러
  - 원인: `profiles` 테이블 이름이 실제로는 `user_profiles`임에도 불구하고 잘못된 조인 사용
  - 해결: `fetchConversations` 함수 수정
    - `chat_conversations` 조회 후 `user_id`로 `user_profiles` 테이블에서 이메일 별도 조회
    - Promise.all로 메시지 수와 사용자 이메일을 병렬 조회

### 관리자 페이지 디자인 및 이름 수정 ✅
- **헤더 이름 변경**: "경북 SW 지원사업" → "경북SW성장기업육성지원사업"
  - 반응형 줄바꿈 추가 (데스크톱에서 한 줄, 모바일에서 두 줄)

- **대시보드 웰컴 배너 추가 (`src/app/admin/dashboard/page.tsx`)**
  - 그라데이션 배경 (토스 스타일)
  - 실시간 상태 배지 (animated ping)
  - 연도 및 프로그램명 표시
  - 실시간 통계 알약 (기업 수, 예산/구매/환급 대기 건수)
  - 데코레이티브 글로우 효과

- **대기 항목 알림 카드 추가**
  - 검토 대기 중인 요청이 있을 경우 상단에 알림 표시
  - 빠른 처리를 위한 안내 메시지
  - "확인하기" 버튼으로 신청 내역 페이지 바로 이동

### 2026-07-15 디자인 수정 및 UI 개선 ✅
- **빌드 에러 수정**
  - 포털 대시보드 JSX 파싱 오류 수정 (base64 SVG 데이터 제거)
  
- **챗봇 관리 페이지 수정**
  - `profiles` → `user_profiles` 테이블 조회 수정
  - 사용자 이메일 별도 조회 로직 개선

- **프로그램명 변경 및 폰트 크기 조정**
  - 포털/관리자 헤더: "경북 SW 지원사업" → "경북SW성장지원사업" (짧게 줄임)
  - 폰트 크기: 반응형 `text-[9px] sm:text-[10px] md:text-[11px]`
  - 두 줄로 나누기 제거, 한 줄로 표시되도록 수정
  
- **로그인 페이지 타이틀 수정**
  - "경북 SW 성장기업지원사업" → "경북SW성장기업육성지원사업"
  - 폰트 크기: `text-lg`

- **CSS 스타일 수정**
  - 활성 네비게이션 아이템 그라데이션 제거 (`nav-item.active`)
  - 단색 배경 (`bg-primary-50`)으로 변경
  
- **대시보드 웰컴 배너 재디자인**
  - 레드 그라데이션 배경 제거 → 깔끔한 흰색 배경
  - 데코레이티브 글로우 효과 제거
  - "실시간" 배지 제거
  - 아이콘 제거
  - 기업명만 간단하게 표시
  - 최종: 기업명만 표시하는 심플 카드로 완성

---

## 최근 수정 내용 (2026-07-24 20:00)

### 로그인 페이지 개선 ✅
- **Google 로그인 제거**
  - "또는" 구분선 제거
  - Google 로그인 버튼 제거
  - `handleGoogleLogin` 함수 제거

- **입력칸 아이콘 제거**
  - 이메일/비밀번호 입력칸 Mail, Lock 아이콘 제거
  - `Input` 컴포넌트 `px-3` → `pr-3` 수정
  - placeholder와 아이콘 겹침 문제 해결

- **POSTECH 로고 추가**
  - `public/postech-logo.jpg` 추가
  - Sparkles 아이콘 대신 POSTECH 로고 표시
  - 로고 크기: 240×96px

- **제목 색상 변경**
  - "경북SW성장기업육성지원사업" 그라데이션 제거
  - POSTECH 빨간색 단색 (`text-red-700`) 적용

- **회원가입 성공 메시지**
  - `useSearchParams` Suspense boundary 적용
  - sessionStorage를 통한 성공 메시지 표시
  - 초록색 알림 메시지로 표시

### 회원가입 시스템 구현 ✅
- **회원가입 페이지 (/signup) 생성**
  - 사용자 정보: 이름, 이메일, 비밀번호, 연락처
  - 기업 정보: 기업명, 대표자명, 대표자 휴대폰 번호
  - POSTECH 로고와 일관된 UI 디자인

- **회원가입 처리 로직**
  - Supabase Auth로 사용자 생성
  - `companies`, `user_profiles`, `user_companies`, `user_roles` 테이블에 데이터 저장
  - sessionStorage에 플래그 저장 후 로그인 페이지로 리다이렉트

- **하단 브랜딩 위치 수정**
  - `absolute bottom-4` → 일반 컨텐츠 흐름으로 변경
  - 스크롤 시 하단 브랜딩 표시

- **회원가입 폼 필드 수정**
  - 사업자등록번호 필드 삭제
  - 기업 주소 필드 삭제
  - 기업 전화번호 → 대표자 휴대폰 번호로 라벨 변경

- **대표자/팀원 선택 기능 추가**
  - RadioGroup으로 회원 유형 선택 (대표자/팀원)
  - 대표자: 기업 정보 신규 등록, `company_admin` 역할
  - 팀원: 소속 기업 검색 및 선택, `company_user` 역할
  - 기업명/사업자등록번호로 기업 검색
  - 선택된 기업 확인 메시지 표시
  - 역할별 `position`, `is_primary` 설정

---

## 최근 수정 내용 (2026-07-14 18:00)

### 포털 대시보드 UI 레이아웃 개선 ✅
- **웰컴 배너 추가**
  - 기업명과 환영 메시지가 포함된 그라데이션 배너
  - 미세한 패턴 효과와 실시간 표시 (녹색 점 깜빡임)
  - 현대적인 디자인과 부드러운 애니메이션

- **대기 업무 알림 섹션 추가**
  - 검토 대기 중인 요청이 있을 경우 상단에 노란색 알림 카드 표시
  - 빠른 처리를 위한 안내 메시지
  - "확인하기" 버튼으로 신청 내역 페이지 바로 이동

- **통계 카드 개선**
  - 더 현대적인 레이아웃과 호버 효과
  - 순차적 슬라이드 애니메이션 적용 (stagger delays)
  - 아이콘 배경색 및 색상 일관성 개선

- **예산 사용 현황 카드 개선**
  - 더 큰 타이포그래피로 가독성 개선
  - 그라데이션 프로그레스 바 (from-pink-500 to-pink-600)
  - 전체 예산과 사용률을 함께 표시

- **최근 활동 & 빠른 링크 개선**
  - 더 큰 클릭 영역과 부드러운 호버 효과
  - 날짜 표시 간소화 (월.일 형식)
  - 빈 상태일 때 더 친근한 안내 메시지
  - 빠른 링크 아이콘 크기 증가 (h-10 w-10 → h-11 w-11)

- **도움 배너 개선**
  - 패턴 배경 효과 추가
  - 반응형 레이아웃 (모바일에서 버튼이 아래로 이동)
  - 더 큰 아이콘과 개선된 정렬

---

## 최근 수정 내용 (2026-07-14 15:00)

### UI 디자인 시스템 완전 재구성 v2 ✅
- **새로운 디자인 철학: Modern, Clean, Professional**
  - 과도한 그라데이션 제거, 깔끔한 플랫 디자인 + 미세한 그림자
  - 더 나은 색상 대비와 계층 구조
  - 현대적인 여백과 간격 시스템
  - 세련된 타이포그래피

- **전역 스타일 완전 재작성 (globals.css)**
  - Neutral 색상 계층 시스템 (50-950)
  - Semantic 색상 (success, warning, error, info) + light 변종
  - 자연스러운 그림자 시스템 (xs ~ 2xl)
  - 애니메이션 (fade-in, slide-up, slide-in-right, scale-in)
  - 유틸리티 클래스 (glass, surface, text-primary, etc.)
  - 컴포넌트 스타일 (card, button, input, badge, table, status-dot)

- **레이아웃 개선**
  - 더 깔끔한 헤더 (높이 3.5rem, glassmorphism)
  - 간결한 사이드바 (16rem width)
  - Nav Item 균일한 간격, 액티브 상태 배경색
  - 모바일 메뉴 슬라이드 애니메이션
  - 햄버거 메뉴 아이콘

- **UI 컴포넌트 간소화**
  - Card: 깔끔한 보더 + 미세한 그림자
  - CardStat: 통계 전용 컴포넌트 (label, value, icon, trend)
  - Button: 플랫 디자인, 미세한 그림자, 호버 효과
  - Input: 깔끔한 보더, 포커스 링 효과

- **대시보드 재디자인**
  - 간결한 통계 카드 (값, 라벨, 옵션 아이콘)
  - 깔끔한 월별 차트 (단색 바, 최소 높이 보장)
  - 간소화된 최근 활동 리스트
  - 빠른 링크 카드 일관된 스타일
  - 시스템 안내 카드 (그라데이션 배경)

### UI 디자인 시스템 대폭 개선 (이전) ✅

### 디자인 시스템 업데이트 (이전)
- **Primary 색상 변경: Pantone 215C (#A61955)**
  - CSS 변수 및 @theme 블록에 primary 색상 적용
  - 포털/관리자 레이아웃에 primary 색상 적용
  - 대시보드 페이지 컴포넌트에 primary 색상 적용
- **h1 폰트 크기 조정**
  - 모바일: 1.5rem (24px)
  - 데스크톱: 1.75rem (28px)
  - letter-spacing: -0.01em
- **Google Fonts 로드 방식 변경**
  - CSS @import 제거
  - layout.tsx의 <link> 태그로 로드 방식 변경
  - 메타데이터 업데이트 (타이틀, 설명)

---

## 최근 수정 내용 (2026-07-13)

### 알림 기능 버그 수정
- 구매 반려/증빙승인/증빙반려 이메일 알림 추가
- 환급 승인/반려/지급 이메일 알림 추가
- 프로그램 알림 5개 → 1개로 통합 (`program_notifications`)
- 프로그램 승인/반려 알림 추가
- 알림 설정 스위치 클릭 문제 수정 (DB에 없는 설정도 작동)

### 예산서 엑셀 업로드 기능 추가
- xlsx 패키지 설치 및 엑셀 유틸리티 생성
- 템플릿 다운로드 API (`/api/admin/budgets/template`)
- 엑셀 업로드 API (`/api/admin/budgets/import`)
- 관리자 페이지에 업로드 UI 및 다이얼로그 추가

---

## DB Migration 적용 안내

⚠️ **중요:** 가이드라인 및 챗봇 기능을 사용하려면 Supabase에 DB migration을 적용해야 합니다.

### 적용 방법

**방법 1: Supabase Dashboard**
1. [Supabase Dashboard](https://ngpankzsagiofueiloqc.supabase.co) 접속
2. SQL Editor > New Query 클릭
3. 각 migration 파일 내용 복사하여 실행:
   - `20260712220000_create_guidelines.sql`
   - `20260712230000_create_chatbot.sql`
   - `20260712240000_create_notifications.sql`

**방법 2: 터미널**
```bash
cd gyeongbuk-sw-system
npx supabase db push
```

---

## 프로젝트 완료 상태

### ✅ 완료된 주요 기능
1. **인증 및 권한 관리** - 로그인, 역할 기반 접근 제어
2. **예산 관리** - 예산서 작성, 검토, 승인, **엑셀 업로드**
3. **구매 요청** - 결제 요청, 증빙 서류 제출
4. **환급 신청** - 환급 요청, 검토, 지급
5. **프로그램 운영** - 프로그램 관리, 신청, 참가자 관리
6. **확인서 발급** - 확인서 발급, 진위 확인
7. **가이드라인** - 가이드, FAQ, 공지사항, 서류 양식
8. **챗봇** - 지식 베이스 기반 채팅, 기록 관리
9. **알림** - 이메일/시스템 알림, 템플릿 관리, **모든 알림 발송 완료**
10. **관리자 기능** - 사용자, 기업, 프로그램 신청, 시스템 설정 관리
11. **디자인 시스템** - Pantone 215C Primary 색상, **깔끔한 모던 디자인 완성**
12. **기업 서류 제출** - 사업자등록증, 중간/최종 성과 보고서 제출 및 검토

### 🎉 프로젝트 상태
- **모든 주요 기능 구현 완료**
- **빌드 성공 (TypeScript 타입 체크 통과)**
- **웹 사이트 실행 가능**
- **알림 및 이메일 기능 완료**

---

### Phase 18: 관리자 페이지 대표자 정보 수정 기능 개선 ✅ 완료 (2026-07-24)

- [x] **사용자 관리 페이지(`/admin/users`) 개선**
  - 기업 목록 섹션 추가 (상단)
  - 기업 카드 클릭 시 바로 수정 모달 오픈
  - 사용자 카드에 소속 기업 표시 (클릭하여 수정)
  - 기업 수정 모달에서 대표자 정보 수정 가능
  - 해당 기업 소속 사용자 목록 표시
  - UI 개선 (아이콘 추가, 카드 형태)

- [x] **기업 수정 모달 기능**
  - 대표명 수정 (`ceo_name`)
  - 대표자 연락처 수정 (`phone`)
  - 기업명, 사업자등록번호 수정
  - 산업, 주소, 이메일 수정
  - 상태(활성/비활성/정지) 수정
  - 소속 사용자 목록 표시

- [x] **기업 등록 기능 추가**
  - "기업 추가" 버튼 추가 (기업 목록 헤더)
  - 기업 생성 모달 (수정 모달과 통합)
  - 필수 항목: 기업명, 대표명, 대표자 연락처
  - 생성/수정 모드에 따른 동적 UI (제목, 버튼 텍스트)

- [x] **데이터베이스 컬럼명 매핑 수정**
  - `service_name` → `registration_number` (사업자등록번호)
  - `representative_name` → `ceo_name` (대표명)
  - `/admin/companies` 페이지 컬럼명 수정
  - `/admin/users` 페이지 컬럼명 수정

### Phase 18: 관리자 페이지 대표자 정보 수정 기능 개선 ✅ 완료 (2026-07-24)

- [x] **사용자 관리 페이지(`/admin/users`) 개선**
  - 기업 목록 섹션 추가 (상단)
  - 기업 카드 클릭 시 바로 수정 모달 오픈
  - 사용자 카드에 소속 기업 표시 (클릭하여 수정)
  - 기업 수정 모달에서 대표자 정보 수정 가능
  - 해당 기업 소속 사용자 목록 표시
  - UI 개선 (아이콘 추가, 카드 형태)

- [x] **기업 수정 모달 기능**
  - 대표명 수정 (`ceo_name`)
  - 대표자 연락처 수정 (`phone`)
  - 기업명, 사업자등록번호 수정
  - 산업, 주소, 이메일 수정
  - 상태(활성/비활성/정지) 수정
  - 소속 사용자 목록 표시

- [x] **기업 등록 기능 추가**
  - "기업 추가" 버튼 추가 (기업 목록 헤더)
  - 기업 생성 모달 (수정 모달과 통합)
  - 필수 항목: 기업명, 대표명, 대표자 연락처
  - 생성/수정 모드에 따른 동적 UI (제목, 버튼 텍스트)

- [x] **데이터베이스 컬럼명 매핑 수정**
  - `service_name` → `registration_number` (사업자등록번호)
  - `representative_name` → `ceo_name` (대표명)
  - `/admin/companies` 페이지 컬럼명 수정
  - `/admin/users` 페이지 컬럼명 수정

- [x] **RLS 정책 무한 재귀 문제 해결**
  - 문제: `user_companies` 조인 시 무한 재귀 발생
  - 해결: companies 테이블 RLS 비활성화 (임시)
  - 마이그레이션: `20260724260000_reset_companies_rls.sql`
  - **⚠️ 추후:** 적절한 RLS 정책 재설정 필요

### Phase 17: 인증 에러 메시지 한국어 번역 강화 ✅ 완료 (2026-07-24)

- [x] **에러 메시지 매핑 추가**
  - `/src/app/signup/page.tsx` 에러 메시지 추가
  - `/src/app/login/page.tsx` 에러 메시지 추가
  - 추가된 메시지:
    - "Password is too weak": "비밀번호가 너무 약습니다. 더 강력한 비밀번호를 사용해주세요."
    - "Password should contain characters": "비밀번호에 영문, 숫자, 특수문자가 포함되어야 합니다."
    - "Only allowed to sign up": "이미 가입된 이메일입니다. 로그인을 시도해주세요."
    - "Signups not allowed": "현재 회원가입이 허용되지 않습니다."
    - "Phone rate limit exceeded": "문자 메시지 전송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."
    - "OTP rate limit exceeded": "인증 코드 전송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."
    - "Invalid OTP": "인증 코드가 올바르지 않습니다."
    - "OTP expired": "인증 코드가 만료되었습니다. 다시 요청해주세요."
    - "A user with this email has already been registered": "이미 가입된 이메일입니다."
    - "User already belongs to this organization": "이미 이 기업에 소속된 사용자입니다."

### Phase 16: 로그인/회원가입 개선 ✅ 완료 (2026-07-24)

### 로그인 페이지 개선 ✅
- [x] **Google 로그인 제거**
  - "또는" 구분선 제거
  - Google 로그인 버튼 제거
  - `handleGoogleLogin` 함수 제거

- [x] **입력칸 아이콘 제거**
  - 이메일/비밀번호 입력칸 Mail, Lock 아이콘 제거
  - `Input` 컴포넌트 `px-3` → `pr-3` 수정
  - placeholder와 아이콘 겹침 문제 해결

- [x] **POSTECH 로고 추가**
  - `public/postech-logo.jpg` 추가
  - Sparkles 아이콘 대신 POSTECH 로고 표시
  - 로고 크기: 240×96px

- [x] **제목 색상 변경**
  - "경북SW성장기업육성지원사업" 그라데이션 제거
  - POSTECH 빨간색 단색 (`text-red-700`) 적용

- [x] **회원가입 성공 메시지**
  - `useSearchParams` Suspense boundary 적용
  - sessionStorage를 통한 성공 메시지 표시
  - 초록색 알림 메시지로 표시

### 회원가입 시스템 구현 ✅
- [x] **회원가입 페이지 (/signup) 생성**
  - 사용자 정보: 이름, 이메일, 비밀번호, 연락처
  - 기업 정보: 기업명, 대표자명, 대표자 휴대폰 번호
  - POSTECH 로고와 일관된 UI 디자인

- [x] **회원가입 처리 로직**
  1. Supabase Auth로 사용자 생성
  2. `companies` 테이블에 기업 정보 저장
  3. `user_profiles` 테이블에 프로필 정보 저장
  4. `user_companies` 테이블에 사용자-기업 매핑
  5. `user_roles` 테이블에 기본 역할(`company_user`) 할당
  6. sessionStorage에 플래그 저장 후 로그인 페이지로 리다이렉트

- [x] **하단 브랜딩 위치 수정**
  - `absolute bottom-4` → 일반 컨텐츠 흐름으로 변경
  - 페이지 구조: `flex flex-col`, Card `mt-8 mb-auto`
  - 스크롤 시 하단 브랜딩 표시

- [x] **회원가입 폼 필드 수정**
  - 사업자등록번호 필드 삭제
  - 기업 주소 필드 삭제
  - 기업 전화번호 → 대표자 휴대폰 번호로 라벨 변경
  - placeholder: 010-1234-5678

- [x] **대표자/팀원 선택 기능 추가**
  - RadioGroup으로 회원 유형 선택 (대표자/팀원)
  - 대표자: 기업 정보 신규 등록 (company_admin 역할)
  - 팀원: 소속 기업 검색 및 선택 (company_user 역할)
  - 기업명/사업자등록번호로 기업 검색 기능
  - 선택된 기업 확인 메시지 표시
  - 역할별 position 설정 (대표자/팀원)
  - 대표자는 is_primary=true, 팀원은 is_primary=false

---

### Phase 19: 관리자 사용자-기업 매칭 기능 ✅ 완료 (2026-07-24)

- [x] **기업 매칭 모달 기능**
  - 사용자 카드에 "기업 매칭" 버튼 추가
  - 기업 선택 드롭다운 (전체 기업 목록)
  - 직책 입력 필드 (position)
  - 대표자 설정 Switch (is_primary)
  - 매칭 시 중복 체크 (이미 소속된 기업인지 확인)

- [x] **대표자 변경 기능**
  - 기업 수정 모달에서 소속 사용자 목록 표시
  - 각 사용자의 대표자 여부 표시 (빨간색 배지)
  - "대표자 지정" 버튼으로 대표자 변경
  - 변경 시 기존 대표자 자동 해제

- [x] **기업 매칭 제거 기능**
  - 사용자 카드에서 소속 기업별 × 버튼
  - 클릭 시 매칭 제거 확인 (soft delete)

- [x] **UI 개선**
  - 사용자 카드에 소속 기업 표시 개선
  - 대표자 배지 "(대표)" 표시
  - 직책 표시 (position)
  - 기업 매칭 모달에 Switch 컴포넌트 사용

- [x] **타입 정의**
  - `CompanyUser` 인터페이스 추가
  - `UserWithRoles` 타입에 position, status 추가

---

### Phase 20: 새로고침 시 로그아웃 버그 수정 ✅ 완료 (2026-07-24)

- [x] **UserProvider 개선**
  - 초기 세션 로직 강화 (`getSession()` 호출)
  - mounted 플래그 추가로 메모리 누수 방지
  - 에러 처리 개선 (sessionError, userError)
  - 콘솔 로그 추가로 디버깅 용이

- [x] **미들웨어 개선**
  - `getSession()` 먼저 호출하여 세션 확인
  - 세션 에러 및 사용자 에러 분리 처리
  - 에러 발생 시 명확한 리다이렉트

- [x] **auth.client.ts 개선**
  - `getUser()` → `getSession()`으로 변경
  - 세션 확인 후 사용자 데이터 조회

---

### Phase 21: RLS 순환 참조 문제 해결 ✅ 완료 (2026-07-24)

- [x] **문제 발견**
  - 사용자 DB에는 유저가 있는데 관리자 페이지(`/admin/users`)에 보이지 않음
  - 로그인 후 항상 포털로 이동 (관리자 역할 확인 실패)

- [x] **원인 분석**
  - `user_profiles` RLS 정책이 관리자 확인을 위해 `user_roles` 조회
  - `user_roles` RLS 정책이 자신의 역할만 조회 가능
  - **순환 참조 문제** 발생 → 관리자가 다른 사용자 정보를 볼 수 없음

- [x] **승인 대기 목록 문제**
  - `/admin/approvals` 페이지에서 `user_companies` 조회 시 무한 재귀 에러
  - `companies` 테이블 RLS가 `user_companies`를 참조하여 순환 발생
  - `/portal/team-approvals` 페이지에서도 동일한 문제 발생

- [x] **해결 방안**
  - `user_roles` RLS 정책 수정 (관리자용 조회 가능)
  - `user_profiles` INSERT 정책 추가 (회원가입 시 데이터 생성 가능)
  - `user_companies` RLS **비활성화** (무한 재귀 방지)
  - `companies` RLS **비활성화** (무한 재귀 방지)

- [x] **로그인 로직 개선**
  - 승인 대기 중인 사용자 로그인 시 "관리자 승인 대기 중입니다" 메시지 표시
  - 반려된 사용자 로그인 시 "가입 신청이 반려되었습니다" 메시지 표시
  - 승인 대기/반려 상태인 경우 로그인 차단

- [x] **쿼리 단순화**
  - `/admin/approvals` 페이지: `!inner` 조인 제거, 단계별 조회로 변경
  - `/portal/team-approvals` 페이지: 동일하게 단계별 조회로 변경

- [x] **마이그레이션**
  - `20260724270000_fix_user_roles_rls.sql`

- [x] **추후 작업** → **Phase 32에서 완료 (2026-10-13)**
  - ~~적절한 RLS 정책 재설계 필요 (순환 참조 방지)~~
  - ~~현재는 보안을 위해 RLS 비활성화 상태로 운영~~ → 전체 RLS 재설계로 해결

---

### Phase 22: 기업 관리 페이지 개선 ✅ 완료 (2026-07-24)

- [x] **권한 체크 버그 수정**
  - `/portal/company-settings` 페이지 역할 확인 쿼리 수정
  - `.eq("user_roles.roles.code", "company_admin")` → `.eq("roles.code", "company_admin")`
  - `.single()` → `.maybeSingle()` (역할 없을 때 에러 방지)

- [x] **휴대폰 번호 자동 포맷 기능**
  - 숫자만 입력해도 `010-1234-5678` 형식으로 자동 변환
  - `formatPhoneNumber` 함수 추가
  - 입력 필드 `maxLength={13}` 적용

- [x] **페이지 병합**
  - `/portal/company-settings` + `/portal/team-approvals` → `/portal/company-settings` 하나로 통합
  - 기업 정보 수정 + 팀원 승인 기능을 한 페이지에서 관리

- [x] **탭 UI 구성**
  - shadcn/ui `Tabs` 컴포넌트 사용
  - "기업" 탭: 기업 정보 수정 (Building2 아이콘)
  - "팀원" 탭: 팀원 승인 대기 목록 (Users 아이콘)

- [x] **네비게이션 수정**
  - `/portal/team-approvals` 페이지 삭제
  - "팀원 승인" 메뉴 항목 제거
  - "기업 설정" → "기업 및 팀원 관리" 이름 변경

- [x] **역할 부족 문제 해결**
  - test@test.com 계정에 `company_admin` 역할 수동 부여
  - user_profiles INSERT 정책 추가로 향후 문제 방지

---

### Phase 23: 변경사항 저장 경고 기능 ✅ 완료 (2026-07-24)

- [x] **useUnsavedChanges 훅 생성 (`/src/hooks/useUnsavedChanges.ts`)**
  - 브라우저 닫기/새로고침 방지 (beforeunload 이벤트)
  - 전역 상태 관리 (window 객체 사용)
  - `checkUnsavedChanges()`, `resetUnsavedChanges()` 유틸리티 함수

- [x] **포털 네비게이션 클릭 시 경고 (`/src/app/portal/layout.tsx`)**
  - 전역 click 이벤트 리스너로 링크 클릭 감지
  - 변경사항 있을 경우 확인 메시지 표시
  - 확인 후 라우트 변경, 취소 시 현재 페이지 유지

- [x] **기업 설정 페이지 변경사항 추적 (`/src/app/portal/company-settings/page.tsx`)**
  - 초기값 저장 (initialDataRef)
  - 현재값과 초기값 비교로 변경사항 감지
  - 탭 변경 시 확인 메시지
  - 저장 완료 후 초기값 업데이트
  - 시각적 경고 배너 (노란색, AlertCircle 아이콘)

- [x] **경고 메시지 변경**
  - "정말 떠나시겠습니까?" → "정말 나가시겠습니까?"

---

### Phase 24: 회원가입 개선 및 팀원 승인 시스템 ✅ 완료 (2026-07-24)

- [x] **회원가입 전화번호 자동 포맷 (`/src/app/signup/page.tsx`)**
  - 사용자 연락처: `010-1234-5678` 형식 자동 변환
  - 대표자 휴대폰 번호: `010-1234-5678` 형식 자동 변환
  - `formatPhoneNumber` 함수 추가
  - `maxLength={13}` 적용

- [x] **회원가입 시 역할 부여 로직 수정**
  - 대표자: 회원가입 시 즉시 `company_admin` 역할 부여
  - 팀원: 회원가입 시 역할 없이 `pending` 상태로 생성
  - 팀원 승인 후 역할 부여되도록 변경

- [x] **팀원 승인 시 역할 자동 부여 (`/src/app/portal/company-settings/page.tsx`)**
  - 대표자 승인 시 `company_user` 역할 자동 부여
  - 승인 전 user_company 데이터 조회로 user_id 확인
  - roles 테이블에서 role_id 조회 후 user_roles INSERT

- [x] **팀원 삭제 시 역할 제거**
  - user_companies soft delete (deleted_at 설정)
  - user_roles에서 company_user 역할 삭제

- [x] **RLS 정책 추가**
  - `20260724280000_add_user_profiles_rls_for_members.sql`
  - 대표자가 같은 기업 팀원의 프로필(이름, 이메일, 연락처) 조회 가능

- [x] **user_roles SELECT 문법 수정 (`/src/app/admin/users/page.tsx`)**
  - `.select("roles(code)")` → `.select("role_id, roles!inner(code)")`
  - `.is("deleted_at", null)` 조건 추가

- [x] **admin dashboard API 수정 (`/src/app/admin/dashboard/page.tsx`)**
  - `supabase.auth.admin.listUsers()` → `user_profiles` 테이블 count 사용
  - 401 Unauthorized 에러 해결

---

### Phase 25: 기업 미배정 사용자 처리 ✅ 완료 (2026-07-24)

- [x] **NoCompanyAssigned 컴포넌트 (`/src/app/portal/dashboard/page.tsx`)**
  - 기업이 배정되지 않은 사용자를 위한 전용 페이지
  - "기업이 배정되지 않았습니다" 메시지 표시
  - 기업 검색 기능 (기업명 또는 사업자등록번호)
  - 기업 선택 UI (카드 형태, 클릭 시 선택)
  - 기업 가입 요청 버튼

- [x] **기업 가입 요청 로직**
  - user_companies에 INSERT (status: pending)
  - deleted_at 있는 레코드 복구 기능
  - 중복 가입 요청 방지
  - 성공 메시지: "기업 대표자의 승인을 기다려주세요. 영업일 기준 1~2일 소요될 수 있습니다."

- [x] **RLS INSERT 정책 추가**
  - `20260724290000_add_user_companies_insert_policy.sql`
  - 사용자가 자신의 기업 가입 요청 생성 가능
  - 사용자가 자신의 기업 소속 정보 업데이트 가능

- [x] **에러 메시지 상세 표시**
  - joinError.message 표시로 원인 파악 용이

---

### Phase 26: 팀원 대시보드 활성화 버그 수정 ✅ 완료 (2026-07-25)

- [x] **문제 원인**
  - 기업에 배정받은 팀원이 대시보드에서 "기업이 배정되지 않았습니다" 메시지 표시
  - `getPrimaryCompany()` 함수가 `is_primary: true`인 기업만 찾음
  - 팀원은 `is_primary: false`로 설정되어 기업을 찾지 못함

- [x] **해결 방안**
  - `getPrimaryCompany()` 함수 수정
  - 먼저 `is_primary: true`인 기업을 찾음 (대표자)
  - 없으면 첫 번째 `status: active`인 기업을 찾음 (팀원)
  - 팀원도 대시보드를 정상적으로 볼 수 있게 됨

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

### Phase 27: 헤더 사용자 정보 표시 개선 ✅ 완료 (2026-07-25)

- [x] **포털 레이아웃 수정 (`/src/app/portal/layout.tsx`)**
  - `user_profiles` 테이블에서 사용자 이름 가져오기
  - `user_companies` + `companies` 테이블에서 소속 기업명 가져오기
  - 우상단에 이름과 소속 기업명 표시
  - 소속 기업이 없을 경우 "소속 기업 없음(신청필요)" 표시

- [x] **관리자 레이아웃 수정 (`/src/app/admin/layout.tsx`)**
  - 동일하게 이름과 소속 기업명 표시
  - 관리자는 "관리자" 텍스트 표시

- [x] **UI 개선**
  - 이메일 대신 이름 표시
  - 두 줄로 구성 (상단: 이름, 하단: 소속 기업)
  - `px-3 py-1 rounded-lg` 스타일 적용

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

### Phase 28: 헤더 타이틀 텍스트 변경 ✅ 완료 (2026-07-25)

- [x] **포털 레이아웃 헤더 텍스트 수정**
  - "경북SW성장지원사업" → "경북SW성장기업육성지원사업"

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

### Phase 30: 헤더 POSTECH 로고 변경 ✅ 완료 (2026-07-25)

- [x] **포털 레이아웃 로고 수정**
  - Sparkles 아이콘 → POSTECH 로고 이미지 (`/postech-logo.jpg`)
  - 배경색 제거, 로고 이미지 크기 `h-10 w-auto` 적용

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

### Phase 31: 헤더 높이와 로고 사이즈 축소 ✅ 완료 (2026-07-25)

- [x] **포털 레이아웃 사이즈 수정**
  - 헤더 높이: `h-16` → `h-12`
  - 헤더 padding: `px-4 lg:px-6` → `px-3 lg:px-4`
  - 헤더 gap: `gap-4` → `gap-3`
  - 로고 크기: `h-10` → `h-7`
  - 로고 gap: `gap-3` → `gap-2`
  - 사이드바 높이: `h-[calc(100vh-4rem)]` → `h-[calc(100vh-3rem)]`
  - 사이드바 sticky: `top-16` → `top-12`
  - 메인 컨텐츠 높이: `min-h-[calc(100vh-4rem)]` → `min-h-[calc(100vh-3rem)]`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

### Phase 32: RLS 전면 재설계 (무한 재귀 해결 + 보안 강화) ✅ 완료 (2026-10-13)

#### 문제 상황 (재설계 전)
- `companies` RLS **완전 비활성화** 상태 (2026-07-24부터) — 익명 사용자까지 전체 열람 가능
- `user_roles`, `user_companies` 정책이 자기 자신 테이블을 다시 조회하는 **무한 재귀** 패턴 잔존
- **권한 상승 구멍**: `user_companies "Update own"` 정책으로 누구나 자기 status를 `active`로 변경 가능 (스승인)
- `company_documents` 관리자 검토 정책의 조인 오타 (`ur.id = ur.role_id`)로 관리자 검토 불가
- `is_company_admin()` 헬퍼가 SECURITY DEFINER가 아니라 RLS 우회 불가 (무의미)
- 누락 정책: `user_profiles` INSERT (회원가입), `certificates` 사용자 INSERT (발급하기), `budgets` 관리자 쓰기 (엑셀 import), `notifications` INSERT

#### 해결 방법: SECURITY DEFINER 헬퍼 함수 기반 정책 전면 재작성
- 모든 정책이 헬퍼 함수만 참조 → 정책이 테이블을 직접 참조하지 않아 **순환 참조 원천 차단**
- 신규 마이그레이션: `supabase/migrations/20261013000000_redesign_rls_policies.sql`
  - 27개 테이블의 기존 정책 전부 동적 DROP 후 재생성 (live DB 드리프트 방어)
  - `audit_logs`는 제외 (기존 정책 유지)

**헬퍼 함수 7개 (전부 SECURITY DEFINER + STABLE + search_path 잠금)**
- `is_admin()` — admin/super_admin 여부
- `is_super_admin()`
- `is_company_admin(company_id)` — 해당 기업의 대표자(company_admin)인지
- `target_is_company_admin(user_id, company_id)` — CEO가 자신/타 CEO 행 보호용
- `is_company_member(company_id)` — 승인된(active) 멤버인지
- `user_is_roleless()` — 역할 0개 (회원가입 self-grant 조건)
- `is_company_creator(company_id)` — 본인이 생성한 기업인지

**테이블별 주요 정책**
- `user_roles`: SELECT own/관리자/CEO · INSERT는 관리자 또는 (역할 없는 신규 사용자가 본인 생성 기업에 company_admin) 또는 (CEO가 팀원에게 company_user) · DELETE 동일 범위
- `user_companies`: SELECT own은 **전 상태 포함** (로그인 게이트 pending 차단 + 복구 플로우 유지) · INSERT는 own+pending 또는 관리자 · UPDATE own은 **status<>active 강제 (스승인 차단)** · CEO 승인/반려/삭제 · DELETE 없음 (soft delete)
- `user_profiles`: own + 관리자 + 같은 기업 CEO가 팀원 프로필 조회
- `companies`: 관리자 전체 / 사용자는 삭제 안 된 기업 / **anon은 id·name·business_number 컬럼만** (회원가입 익명 검색)
- 비즈니스 테이블 (budgets, purchase_requests, refund_applications, company_documents 등): `is_company_member(company_id) OR is_admin()` 패턴 통일
- `certificates`: **사용자 INSERT 정책 신규 추가** (본인 완료 신청에 한해, 포털 "발급하기" 복구)
- `notifications`: **created_by 컬럼 추가 (DEFAULT auth.uid())** — 작성자가 수신자 행 INSERT 가능, 앱 수정 불필요

**데이터 백필**
- 2026-07-24 이전 가입 행 `user_companies.status` pending → active (기존 계정 잠김 방지)
- `user_roles.company_id` NULL → 소속 기업으로 채움 (company 범위 역할만)
- `companies.created_by` ← 가장 오래된 생존 company_admin 추정

#### 앱 코드 수정
- `src/app/signup/page.tsx` — companies INSERT에 `created_by: userId` 추가 (신규 대표자 company_admin 부여에 필수)
- `src/app/portal/dashboard/page.tsx` — 기업 검색 컬럼 `registration_number`(존재하지 않아 조용히 실패하던 버그) → `business_number` 수정
- `src/app/portal/company-settings/page.tsx` — 팀원 role DELETE에 `.eq("company_id", ...)` 추가 (RLS 이중 안전장치)

#### 라이브 DB 검증 완료 (2026-10-13)
- anon: 컬럼 제한 검색 200 / 전체 컬럼 SELECT 42501 permission denied / identity 테이블 빈 배열
- 백필 확인: 미처리 pending 0건, companies.created_by 채워짐
- 임시 계정 JWT 스모크 테스트 8개 테이블: 전부 200, **무한 재귀 에러 없음**, 권한 밖 데이터 미노출
- 임시 테스트 계정은 검증 후 삭제 완료

#### 남은 후속 작업 (별도)
- ~~`company-documents` Storage 버킷이 public (getPublicUrl 사용) → private화 + storage.objects 정책 + signed URL 전환 권장~~ → **Phase 33에서 완료 (2026-10-13)**
- 다중 소속 사용자의 `.single()`/`.maybeSingle()` PGRST116 이슈 (기존 문제, RLS와 무관)
- 실제 계정 수동 테스트: admin@test.com (관리자 페이지 전체, 엑셀 import), test@test.com (팀원 승인), 신규 가입 플로우

#### 빌드 확인
- `npm run build` 성공 확인

---

### Phase 33: Storage 버킷 private화 (서명 URL 전환) ✅ 완료 (2026-10-13)

#### 문제 상황 (전환 전)
- `company-documents`, `proof-documents`, `refund-documents` 버킷이 **public**으로 생성되어 있었음
- 앱이 `getPublicUrl()`로 절대 URL을 DB에 저장 → **URL만 알면 인증 없이 모든 증빙서류·기업서류 다운로드 가능** (사업자등록증, 신분증, 통장사본 포함)
- `documents` 버킷(서류 양식)은 이미 경로 저장 + `createSignedUrl` 방식이었으나 버킷 자체가 public

#### 해결 방법

**마이그레이션: `supabase/migrations/20261013010000_privatize_storage_buckets.sql`** (라이브 적용 완료)
- 4개 버킷 전부 private 전환 (fresh DB에서는 생성): `company-documents`, `proof-documents`, `refund-documents`, `documents`
- `file_url` 정규화: 절대 URL → `{버킷}/{경로}` 형식 (company_documents, proof_documents, refund_proof_documents, document_templates)
  - 현재 테이블이 비어 있어 실제 변환 대상은 없었으나, fresh DB 복원 흐름 방어용으로 유지
- **storage.objects 정책 16개** (4개 버킷 × 4종):
  - INSERT: 인증 사용자 허용 — 앱이 메타데이터 행 생성 **전에** 파일을 먼저 업로드하는 흐름 때문
  - SELECT: `(SELECT is_admin())` OR 메타데이터 테이블 조인 스코핑
    - company-documents ← `company_documents.file_url = bucket_id || '/' || name` + `is_company_member(company_id)`
    - proof-documents ← proof_documents ⋈ purchase_requests로 company_id 확인
    - refund-documents ← refund_proof_documents ⋈ refund_applications로 company_id 확인
    - documents ← document_templates 존재 + `deleted_at IS NULL` (전체 인증 사용자 열람 대상)
  - UPDATE/DELETE: 관리자만
  - → **메타데이터 없는 고아 파일은 아무도 읽을 수 없음**
  - 기존 정책은 대상 버킷을 참조하는 것만 동적 DROP (다른 버킷 정책 보존)

**앱 코드**
- 신규 헬퍼 `src/lib/storage.ts` — `getSignedFileUrl(supabase, fileUrl, expiresIn=3600)`: `{버킷}/{경로}` (또는 과거 절대 URL)을 파싱해 서명 URL 생성
- 업로드 3곳이 publicUrl 대신 경로 저장:
  - `src/app/portal/company-documents/upload/page.tsx`
  - `src/app/portal/purchase-requests/[id]/page.tsx`
  - `src/app/portal/refunds/new/page.tsx` (증빙 + 첫 환급 추가 서류)
- 표시 7곳이 조회 시점에 서명 URL 생성 (생성 전까지 "보기" 버튼 비활성):
  - `src/app/portal/company-documents/page.tsx`
  - `src/app/admin/company-documents/page.tsx`
  - `src/app/admin/company-documents/[id]/review/page.tsx`
  - `src/app/portal/purchase-requests/[id]/page.tsx`
  - `src/app/admin/purchase-requests/[id]/review/page.tsx`
  - `src/app/portal/refunds/[id]/page.tsx`
  - `src/app/admin/refunds/[id]/review/page.tsx`
- 서류 양식(`documents` 버킷, `portal/guidelines/page.tsx`)은 기존 서명 방식 그대라 앱 변경 없음
- `getPublicUrl` 사용처 전부 제거 확인

#### 행동 검증 완료 (2026-10-13, 일회용 계정 사용 후 전부 정리)
- 버킷 4개 모두 `public: false` 확인
- 공개 URL 접근 → 400 차단 ("Bucket not found")
- 서비스 롤 서명 URL → 200 정상
- 인증 사용자 서명 시도:
  - 메타데이터 없는 객체 → 거부 (Object not found)
  - 메타데이터 있으나 타 기업 멤버 → 거부
  - 소속 기업 서류 → 서명 URL 생성 + GET 200 + 내용 확인
- 테스트용 메타데이터/멤버십/객체/계정 전부 삭제 확인

#### 빌드 확인
- `npm run build` 성공, lint 에러는 전부 기존 패턴 (건드리지 않은 파일에서 동일 에러 확인)

---

### Phase 34: Git 저장소 초기 커밋 및 GitHub 연동 ✅ 완료 (2026-10-13)

- [x] **초기 커밋** (`ff374f3`, 155개 파일, 47,083줄)
  - 커밋 전 시크릿 스캔: 하드코딩된 키 없음 확인 (`.env*`는 .gitignore로 제외)
  - `supabase/.temp/` (CLI 세션 토큰 포함)을 .gitignore에 추가 후 제외
- [x] **.bak 백업 파일 정리** (`972ba10`)
  - `src/app/portal/dashboard/page.tsx.bak`, `.bak3` 삭제 (7월 14일자 구버전 백업, 현재 798줄 vs 백업 668줄)
  - `.gitignore`에 `*.bak*` 패턴 추가
- [x] **GitHub 푸시 및 기본 브랜치 main 전환**
  - 원격: `https://github.com/choigo0910-hash/gyeongbuk-sw-system.git`
  - 로컬 `master` → `main` 변경, origin 푸시, GitHub 기본 브랜치를 `main`으로 설정, 원격 구 `master` 삭제
  - 업스트림 추적 설정 완료 (`git push`만으로 동작)

---

### Phase 48: 관리자 대시보드 카드 삭제 ✅ 완료 (2026-07-25)

- [x] **"전체 기업", "전체 사용자" 카드 삭제**
  - CardStat 컴포넌트 완전 제거

- [x] **그리드 레이아웃 조정**
  - `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` → `sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **"전체 기업", "전체 사용자" 카드 클릭 기능 제거**
  - `Link` 컴포넌트 제거
  - `cursor-pointer hover:shadow-md transition-shadow` 클래스 제거

- [x] **나머지 카드는 클릭 기능 유지**
  - 예산 검토 대기, 구매요청 대기, 환급승인 대기, 프로그램 검토, 확인서 발급

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **배너 디자인 간소화**
  - 빨간색 그라데이션 제거 → 깔끔한 흰색 배경
  - `rounded-3xl` → `rounded-2xl`
  - `shadow-primary-lg` → `shadow-sm`
  - `bg-gradient-to-br from-primary via-primary to-primary-800` → `bg-white border border-gray-200`
  - 데코레이티브 글로우 효과 제거
  - "실시간" 배지 제거

- [x] **내부 디자인 개선**
  - 아이콘 배경: `bg-white/20` → `bg-primary-50`
  - 아이콘 색상: `text-white` → `text-primary-600`
  - 텍스트 색상: `text-white` → `text-gray-900/600/700`
  - Quick stats pills: `bg-white/10` → `bg-gray-100`
  - 간격 및 패딩 조정

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **POSTECH 로고 축소**
  - `h-10` → `h-7`

- [x] **텍스트 폰트 17px로 조절**
  - "경북SW성장기업육성지원사업" 폰트: `style={{ fontSize: "17px", lineHeight: "1.2" }}`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **헤더 디자인 개선 (`/src/app/admin/layout.tsx`)**
  - 그라데이션 배경 제거, 깔끔한 흰색 배경 적용
  - Shield 아이콘 → POSTECH 로고 이미지로 변경
  - 배경: `header-primary` → `bg-white border-b border-gray-200`
  - 사용자 정보 박스: 그라데이션 제거, `bg-primary-50` 적용
  - 버튼 스타일 단순화

- [x] **사이드바 및 네비게이션 개선 (`/src/app/globals.css`)**
  - 네비게이션 활성 상태 색상: `primary-50` → 황색 톤 (`#fef3c7`)
  - 활성 텍스트 색상: `primary` → 갈색 (`#92400e`)
  - 사이드바 배경 투명도 개선: `0.95` → `0.98`
  - 테두리 색상 구체화: `var(--border)` → `#e5e7eb`

- [x] **전체 배경색 개선**
  - `bg-surface-variant` → `bg-gray-50`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **관리자 대시보드 (`/src/app/admin/dashboard/page.tsx`)**
  - "전체 기업" → `/admin/companies`
  - "전체 사용자" → `/admin/users`
  - "예산 검토 대기" → `/admin/budgets`
  - "구매요청 대기" → `/admin/purchase-requests`
  - "환급승인 대기" → `/admin/refunds`
  - "프로그램 검토" → `/admin/programs`
  - "확인서 발급" → `/admin/certificates`

- [x] **포털 대시보드 (`/src/app/portal/dashboard/page.tsx`)**
  - "승인된 예산" → `/portal/budgets`
  - "진행 중 구매" → `/portal/purchase-requests`
  - "환급받은 금액" → `/portal/refunds`
  - "참가 프로그램" → `/portal/programs`

- [x] **UI 개선**
  - `Link` 컴포넌트로 감싸 클릭 가능
  - `cursor-pointer hover:shadow-md transition-shadow` 클래스 추가

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **문제 원인**
  - `profiles` 테이블 참조 (실제 테이블명: `user_profiles`)
  - `full_name` 컬럼 참조 (실제 컬럼명: `name`)

- [x] **해결 방안**
  - `profiles!inner(email, full_name)` → `user_profiles!inner(email, name)`
  - 데이터 매핑 부분도 수정

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **문제 원인**
  - DB에는 `company_admin` 역할이 있지만 TypeScript Role enum에는 없음
  - 대표자가 `COMPANY_ADMIN` 역할을 가지고 있지만 코드에서 인식하지 못함
  - 대표자와 팀원 모두 대시보드 접근 불가

- [x] **해결 방안**
  - `src/types/roles.ts` Role enum에 `COMPANY_ADMIN`, `STAFF` 추가
  - `roleLabels`에 라벨 추가
  - 대시보드에서 `Role.COMPANY_USER` 또는 `Role.COMPANY_ADMIN` 확인

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **텍스트 폰트 2px 더 증가**
  - "경북SW성장기업육성지원사업" 폰트: `15px` → `17px`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **텍스트 폰트 2px 증가**
  - "경북SW성장기업육성지원사업" 폰트: `13px` → `15px`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **텍스트 폰트 더 증가**
  - "경북SW성장기업육성지원사업" 폰트: `12px` → `13px`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **텍스트 폰트 증가**
  - "경북SW성장기업육성지원사업" 폰트: `11px` → `12px`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **사이즈 조정**
  - 텍스트 폰트: `10px` → `11px`
  - 로고 크기: `h-9` → `h-7`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **폰트/로고 사이즈 조금 증가**
  - 텍스트 폰트: `8px` → `10px`
  - 로고 크기: `h-8` → `h-9`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **인라인 스타일로 폰트 사이즈 직접 적용**
  - "경북SW성장기업육성지원사업" 폰트: `style={{ fontSize: "8px", lineHeight: "1.2" }}`
  - Tailwind 클래스 대신 인라인 스타일 사용으로 캐시 문제 회피

- [x] **로고 사이즈 축소**
  - 로고 크기: `h-10` → `h-8`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **텍스트 폰트 사이즈 축소**
  - "경북SW성장기업육성지원사업" 폰트: `text-[7px] sm:text-[8px] md:text-[9px]` → `text-[6px] sm:text-[7px] md:text-[8px]`

- [x] **헤더 높이 복원**
  - 헤더 높이: `h-12` → `h-16` (원래대로)
  - CSS `height: 2.5rem` 제거
  - 헤더 padding/gap 복원
  - 로고 크기 복원: `h-5` → `h-10`
  - 우측 요소들 복원
  - 사이드바/메인 높이 복원: `min-h-[calc(100vh-3rem)]` → `min-h-[calc(100vh-4rem)]`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **CSS 헤더 높이 고정**
  - `.header` 클래스에 `height: 2.5rem` 직접 적용

- [x] **로고 및 요소 사이즈 더 축소**
  - 로고 크기: `h-7` → `h-5`
  - 로고 gap: `gap-2` → `gap-1.5`
  - 우측 요소 gap: `gap-3` → `gap-2`
  - 구분선: `h-6 w-px` → `h-4 w-px`
  - 사용자 정보 박스: `px-3 py-1 rounded-lg` → `px-2 py-0.5 rounded`
  - 이름 폰트: `text-xs` → `text-[10px]`
  - 기업명 폰트: `text-[10px]` → `text-[8px]`
  - 로그아웃 버튼: `h-4 w-4` → `h-7 w-7`, 아이콘 `h-4 w-4` → `h-3 w-3`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

- [x] **포털 레이아웃 헤더 폰트 사이즈 수정**
  - `text-[9px] sm:text-[10px] md:text-[11px]` → `text-[7px] sm:text-[8px] md:text-[9px]`

- [x] **빌드 확인**
  - `npm run build` 성공 확인

---

### Phase 29: 결제 및 구매 요청 기능 개선 ✅ 완료 (2026-07-25)

- [x] **상세 내용 JSON 파싱 및 보기 좋게 표시**
  - 관리자 포털 `/admin/purchase-requests/[id]/review` JSON → 카드 형태
  - 포털 상세 `/portal/purchase-requests/[id]` JSON → 카드 형태
  - 품목 정보, 배송 정보, 구매 사유 분리 표시

- [x] **제출됨 상태 수정/삭제 가능**
  - 목록 페이지에서 각 항목별 수정/삭제 버튼 추가
  - 수정 페이지 `/portal/purchase-requests/[id]/edit`
  - 상태별 동작:
    - draft (임시저장): 수정/삭제 가능
    - submitted (제출됨): 수정/삭제 가능
    - rejected (반려): 수정 후 재제출 가능
    - reviewing (검토중): 클릭 시 팝업 메시지

- [x] **관리자 "검토 시작" 버튼 추가**
  - `/admin/purchase-requests/[id]/review` 페이지
  - 제출됨/반려 상태일 때 "검토 시작" 버튼 표시
  - 클릭 시 상태 → `reviewing`
  - 알림 `PURCHASE_REVIEWING` 발송

- [x] **검토중 상태 수정/삭제 제한**
  - 수정/삭제 버튼 클릭 시 팝업:
    > "이미 검토중입니다. 수정/삭제는 관리자에게 메일 및 유선전화 요망"

- [x] **반려된 요청 재제출 기능**
  - 반려 상태일 때 수정 버튼 표시
  - 수정 페이지에서 재제출 버튼 클릭 시:
    - 상태: `rejected` → `submitted`
    - 반려 사유 초기화
    - 검토자 정보 초기화
  - 관리자도 반려된 요청 재검토 가능

- [x] **목록 페이지 수정/삭제 버튼**
  - `/portal/purchase-requests` 목록
  - 각 항목마다 [상세][✏️][🗑️] 버튼
  - 아이콘 버튼으로 공간 절약

- [x] **상세 내용 UI 디자인 개선 (2026-07-25 15:00)**
  - 카드 디자인 고급화 (rounded-xl, 그라데이션 헤더)
  - 품목 정보: 수량/옵션 배지 형태, 호버 효과
  - 배송 정보: 아이콘 박스, 반응형 그리드
  - 구매 사유: 별도 카드, 가독성 향상
  - 배지 텍스트: [수량], [옵션] 전체 텍스트 표시

---

## TODO.md 작성 규칙

### 자동 기록 요청
- Claude에게 요청: "지금까지 내용을 TODO.md에 저장해주세요"
- 대화 1개 진행 시마다 기록 요청 필요

### 기록 항목
1. **최종 업데이트**: 날짜 및 시간 추가
2. **Phase 내용**: 새로운 기능은 Phase로 추가, 기존 Phase는 업데이트
3. **기술 스택**: 사용한 라이브러리/도구 기록
4. **파일 경로**: 수정/생성한 파일 경로 기록
5. **빌드 확인**: `npm run build` 성공 여부 기록

---
