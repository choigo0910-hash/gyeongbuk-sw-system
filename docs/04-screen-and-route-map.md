# 화면 목록 및 URL 구조

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-07-11 |
| 최종 수정일 | 2026-07-11 |

## URL 구조 설계 원칙

1. **사용자 포털** (`/portal/*`) - 기업 사용자, 개인 참가자
2. **관리자 포털** (`/admin/*`) - 관리자, 최고 관리자
3. **인증** (`/login`) - 로그인 페이지
4. **공개** - 로그인 없이 접근 가능

---

## 1. 인증

### 1.1 로그인

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/login` | 로그인 페이지 | 모두 (공개) |
| `/auth/callback` | Supabase Auth 콜백 | 모두 (공개) |

---

## 2. 사용자 포털

### 2.1 대시보드

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal` | 사용자 포털 홈 | company_user, individual_user |
| `/portal/dashboard` | 대시보드 | company_user, individual_user |

### 2.2 예산관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal/budgets` | 예산서 목록 | company_user |
| `/portal/budgets/new` | 예산서 작성 | company_user |
| `/portal/budgets/[id]` | 예산서 상세 | company_user |
| `/portal/budgets/[id]/edit` | 예산서 수정 | company_user (기간 중) |
| `/portal/budgets/[id]/history` | 변경 이력 | company_user |

### 2.3 구매요청

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal/purchase-requests` | 구매요청 목록 | company_user |
| `/portal/purchase-requests/new` | 구매요청 작성 | company_user |
| `/portal/purchase-requests/[id]` | 구매요청 상세 | company_user |
| `/portal/purchase-requests/[id]/edit` | 구매요청 수정 | company_user |
| `/portal/purchase-requests/[id]/proof` | 증빙자료 제출 | company_user |

### 2.4 환급신청

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal/refunds` | 환급신청 목록 | company_user, individual_user |
| `/portal/refunds/new` | 환급신청 작성 | company_user, individual_user |
| `/portal/refunds/[id]` | 환급신청 상세 | company_user, individual_user |
| `/portal/refunds/[id]/edit` | 환급신청 수정 | company_user, individual_user (보완 시) |

### 2.5 프로그램

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal/programs` | 프로그램 목록 | company_user, individual_user |
| `/portal/programs/[id]` | 프로그램 상세 | company_user, individual_user |
| `/portal/programs/[id]/apply` | 참가 신청 | company_user, individual_user |

### 2.6 내 신청서

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal/applications` | 신청서 목록 | company_user, individual_user |
| `/portal/applications/[id]` | 신청서 상세 | company_user, individual_user |
| `/portal/applications/[id]/cancel` | 신청 취소 | company_user, individual_user |

### 2.7 확인서

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal/certificates` | 확인서 목록 | company_user, individual_user |
| `/portal/certificates/[id]` | 확인서 상세 | company_user, individual_user |
| `/portal/certificates/[id]/pdf` | PDF 다운로드 | company_user, individual_user |
| `/portal/certificates/[id]/verify` | 검증 (공개) | 모두 |

### 2.8 가이드라인

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/portal/guidelines` | 가이드라인 목록 | company_user, individual_user |
| `/portal/guidelines/[id]` | 가이드라인 상세 | company_user, individual_user |
| `/portal/guidelines/chat` | 챗봇 | company_user, individual_user |
| `/portal/faq` | FAQ 목록 | company_user, individual_user |

---

## 3. 관리자 포털

### 3.1 대시보드

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin` | 관리자 포털 홈 | admin, super_admin |
| `/admin/dashboard` | 대시보드 | admin, super_admin |

### 3.2 기업 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/companies` | 기업 목록 | super_admin |
| `/admin/companies/new` | 기업 등록 | super_admin |
| `/admin/companies/[id]` | 기업 상세 | super_admin |
| `/admin/companies/[id]/edit` | 기업 수정 | super_admin |
| `/admin/companies/[id]/users` | 기업 사용자 관리 | super_admin |

### 3.3 사용자 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/users` | 사용자 목록 | super_admin |
| `/admin/users/new` | 사용자 생성 | super_admin |
| `/admin/users/[id]` | 사용자 상세 | super_admin |
| `/admin/users/[id]/edit` | 사용자 수정 | super_admin |
| `/admin/admins` | 관리자 목록 | super_admin |
| `/admin/admins/new` | 관리자 권한 부여 | super_admin |

### 3.4 예산 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/budgets` | 예산서 목록 | admin, super_admin |
| `/admin/budgets/[id]` | 예산서 상세 | admin, super_admin |
| `/admin/budgets/[id]/review` | 예산서 검토 | admin, super_admin |
| `/admin/budgets/[id]/approve` | 예산서 승인 | admin, super_admin |
| `/admin/budgets/[id]/request-revision` | 보완 요청 | admin, super_admin |
| `/admin/budgets/[id]/reject` | 예산서 반려 | admin, super_admin |
| `/admin/budgets/[id]/compare` | 예산 비교 | admin, super_admin |

### 3.5 구매요청 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/purchase-requests` | 구매요청 목록 | admin, super_admin |
| `/admin/purchase-requests/[id]` | 구매요청 상세 | admin, super_admin |
| `/admin/purchase-requests/[id]/approve` | 구매요청 승인 | admin, super_admin |
| `/admin/purchase-requests/[id]/reject` | 구매요청 반려 | admin, super_admin |
| `/admin/purchase-requests/[id]/proof` | 증빙자료 검토 | admin, super_admin |

### 3.6 환급 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/refunds` | 환급신청 목록 | admin, super_admin |
| `/admin/refunds/[id]` | 환급신청 상세 | admin, super_admin |
| `/admin/refunds/[id]/checklist` | 체크리스트 관리 | admin, super_admin |
| `/admin/refunds/[id]/approve` | 환급 승인 | admin, super_admin |
| `/admin/refunds/[id]/reject` | 환급 반려 | admin, super_admin |

### 3.7 프로그램 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/programs` | 프로그램 목록 | admin, super_admin |
| `/admin/programs/new` | 프로그램 작성 | admin, super_admin |
| `/admin/programs/[id]` | 프로그램 상세 | admin, super_admin |
| `/admin/programs/[id]/edit` | 프로그램 수정 | admin, super_admin |
| `/admin/programs/[id]/publish` | 프로그램 게시 | admin, super_admin |
| `/admin/programs/[id]/notify` | 전체 메일 발송 | admin, super_admin |
| `/admin/programs/[id]/applications` | 신청서 목록 | admin, super_admin |

### 3.8 신청서 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/applications` | 신청서 목록 (전체) | admin, super_admin |
| `/admin/applications/[id]` | 신청서 상세 | admin, super_admin |
| `/admin/applications/[id]/approve` | 참가 승인 | admin, super_admin |
| `/admin/applications/[id]/waitlist` | 대기 처리 | admin, super_admin |
| `/admin/applications/[id]/reject` | 신청 반려 | admin, super_admin |
| `/admin/applications/[id]/complete` | 참가 완료 처리 | admin, super_admin |
| `/admin/applications/[id]/no-show` | 불찐 처리 | admin, super_admin |

### 3.9 확인서 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/certificates` | 확인서 목록 | admin, super_admin |
| `/admin/certificates/[id]` | 확인서 상세 | admin, super_admin |
| `/admin/certificates/[id]/issue` | 확인서 발급 | admin, super_admin |
| `/admin/certificates/[id]/reissue` | 재발급 | admin, super_admin |

### 3.10 가이드라인 관리

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/guidelines` | 가이드라인 목록 | super_admin |
| `/admin/guidelines/new` | 가이드라인 작성 | super_admin |
| `/admin/guidelines/[id]` | 가이드라인 상세 | super_admin |
| `/admin/guidelines/[id]/edit` | 가이드라인 수정 | super_admin |
| `/admin/guidelines/[id]/publish` | 공개/비공개 | super_admin |
| `/admin/faq` | FAQ 관리 | super_admin |
| `/admin/faq/new` | FAQ 등록 | super_admin |

### 3.11 설정

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/admin/settings` | 시스템 설정 | super_admin |
| `/admin/settings/budget-period` | 예산 기간 설정 | super_admin |
| `/admin/settings/emails` | 이메일 템플릿 | super_admin |
| `/admin/settings/audit-log` | 감사 로그 | super_admin |

---

## 4. 공개 페이지

| 경로 | 설명 | 접근 권한 |
|------|------|----------|
| `/` | 홈 페이지 | 모두 |
| `/about` | 사업 소개 | 모두 |
| `/certificates/[code]/verify` | 확인서 검증 | 모두 |
| `/api/*` | API 엔드포인트 | 인증 필요 |

---

## URL 구조 다이어그램

```
gyeongbuk-sw-system/
│
├─ /login (로그인)
│
├─ /portal/ (사용자 포털)
│  ├─ /dashboard
│  ├─ /budgets/*
│  ├─ /purchase-requests/*
│  ├─ /refunds/*
│  ├─ /programs/*
│  ├─ /applications/*
│  ├─ /certificates/*
│  └─ /guidelines/*
│
├─ /admin/ (관리자 포털)
│  ├─ /dashboard
│  ├─ /companies/*
│  ├─ /users/*
│  ├─ /admins/*
│  ├─ /budgets/*
│  ├─ /purchase-requests/*
│  ├─ /refunds/*
│  ├─ /programs/*
│  ├─ /applications/*
│  ├─ /certificates/*
│  ├─ /guidelines/*
│  └─ /settings/*
│
└─ / (공개)
   ├─ /
   ├─ /about
   └─ /certificates/[code]/verify
```

---

## 네비게이션 구조

### 사용자 포털 네비게이션

```
사용자 포털
├─ 대시보드
├─ 예산관리
├─ 구매요청
├─ 환급신청
├─ 프로그램
├─ 내 신청서
├─ 확인서
├─ 가이드라인
└─ 로그아웃
```

### 관리자 포털 네비게이션

```
관리자 포털
├─ 대시보드
├─ 기업 관리 (super_admin만)
├─ 사용자 관리 (super_admin만)
├─ 예산 관리
├─ 구매요청 관리
├─ 환급 관리
├─ 프로그램 관리
├─ 신청서 관리
├─ 확인서 관리
├─ 가이드라인 관리 (super_admin만)
├─ 설정 (super_admin만)
└─ 로그아웃
```

---

## 레이아웃 구조

### 1. 공개 레이아웃
- 헤더 (로고, 로그인 버튼)
- 메인 컨텐츠
- 푸터

### 2. 포털 레이아웃 (사용자/관리자)
- 사이드바 (네비게이션)
- 상단바 (사용자 정보, 알림)
- 메인 컨텐츠
- 푸터

### 3. 모바일 레이아웃
- 햄버거 메뉴
- 하단 탭 네비게이션 (주요 기능)

---

## 참고 문서

- [02-user-roles-and-permissions.md](./02-user-roles-and-permissions.md) - 권한 정의
- [03-feature-requirements.md](./03-feature-requirements.md) - 기능 요구사항
- [05-status-workflows.md](./05-status-workflows.md) - 상태 흐름
