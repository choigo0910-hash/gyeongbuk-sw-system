# gyeongbuk-sw-system

경북 SW 성장기업육성지원사업 통합 관리 시스템

## 개요

이 시스템은 경북 SW 성장기업육성지원사업의 다음 기능을 통합 관리하는 웹 애플리케이션입니다:

- **예산관리** - 예산서 작성, 변경, 승인 워크플로우
- **구매요청** - 포스텍 직접 결제를 위한 구매요청 및 증빙제출
- **환급신청** - 기업/참여자 선결제 비용 환급 처리
- **프로그램 운영** - 프로그램 게시, 참가 신청, 확인서 발급
- **참가 신청 및 확인서 발급** - 프로그램 참여 관리

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Email**: Resend
- **Deployment**: Vercel
- **Version Control**: GitHub

## 시작하기

###前提条件

- Node.js 18+
- npm

### 설치

```bash
# 의존성 설치
npm install
```

### 환경 변수 설정

`.env.example`을 참고하여 `.env.local`을 생성하고 환경 변수를 설정하세요:

```bash
cp .env.example .env.local
```

필요한 환경 변수:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (future)
RESEND_API_KEY=your-resend-api-key
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

### 빌드

```bash
npm run build
npm start
```

### 코드 품질

```bash
npm run lint
```

## 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | Claude Code 작업 가이드 |
| [docs/01-project-overview.md](./docs/01-project-overview.md) | 프로젝트 개요 |
| [docs/02-user-roles-and-permissions.md](./docs/02-user-roles-and-permissions.md) | 사용자 역할 및 권한 |
| [docs/03-feature-requirements.md](./docs/03-feature-requirements.md) | 기능 요구사항 |
| [docs/04-screen-and-route-map.md](./docs/04-screen-and-route-map.md) | 화면 및 URL 구조 |
| [docs/05-status-workflows.md](./docs/05-status-workflows.md) | 상태 흐름 정의 |
| [docs/06-database-conceptual-design.md](./docs/06-database-conceptual-design.md) | DB 개념 설계 |
| [docs/07-security-rules.md](./docs/07-security-rules.md) | 보안 규칙 |
| [docs/08-email-and-notification-rules.md](./docs/08-email-and-notification-rules.md) | 이메일 및 알림 |
| [docs/09-file-management-rules.md](./docs/09-file-management-rules.md) | 파일 관리 규칙 |
| [docs/10-development-roadmap.md](./docs/10-development-roadmap.md) | 개발 로드맵 |
| [docs/11-test-strategy.md](./docs/11-test-strategy.md) | 테스트 전략 |
| [docs/12-open-decisions.md](./docs/12-open-decisions.md) | 미결정 사항 |

## 프로젝트 구조

```
gyeongbuk-sw-system/
├─ src/
│  ├─ app/              # Next.js App Router pages
│  ├─ components/       # React components
│  ├─ lib/              # Utilities, Supabase helpers
│  ├─ types/            # TypeScript definitions
│  └─ styles/           # Global styles
├─ public/              # Static assets
├─ docs/                # Documentation
├─ supabase/            # Supabase migrations
├─ CLAUDE.md            # Claude Code guide
├─ README.md            # This file
└─ .env.example         # Environment variables template
```

## 보안 원칙

- 모든 업무 테이블에 Row Level Security (RLS) 적용
- 기업 사용자는 자신 기업의 데이터만 접근 가능
- 금액은 정수 타입만 사용 (부동소수점 금지)
- 중요 데이터는 soft delete 사용
- 관리자 작업은 audit log에 기록

## 라이선스

Copyright © 2026 Gyeongbuk Software Growth Enterprise Support Program
