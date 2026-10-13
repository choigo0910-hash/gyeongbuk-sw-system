# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**gyeongbuk-sw-system** is an integrated web application for the Gyeongbuk Software Growth Enterprise Support Program (경북 SW 성장기업육성지원사업).

The system manages:
- Budget management (예산관리)
- Purchase requests (구매요청)
- Refund applications (환급신청)
- Program operations (프로그램 운영)
- Participant registration and certificate issuance (참가 신청 및 확인서 발급)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Email**: Resend
- **Deployment**: Vercel
- **Version Control**: GitHub

## Commands

### Development
```bash
npm run dev    # Start development server on http://localhost:3000
```

### Build & Production
```bash
npm run build  # Build for production
npm start      # Run production server
```

### Code Quality
```bash
npm run lint   # Run ESLint
```

### Supabase (future)
```bash
npx supabase status          # Check Supabase local status
npx supabase db reset        # Reset local database with migrations
npx supabase gen types typescript # Generate TypeScript types
```

## Directory Structure

```
gyeongbuk-sw-system/
├─ src/
│  ├─ app/              # Next.js App Router pages
│  ├─ components/       # React components (UI, feature-specific)
│  ├─ lib/              # Utilities, Supabase client helpers
│  ├─ types/            # TypeScript type definitions
│  └─ styles/           # Global styles
├─ public/              # Static assets
├─ docs/                # Project documentation
├─ supabase/            # Supabase migrations and functions
├─ CLAUDE.md            # This file
├─ README.md            # Project readme
├─ .env.example         # Environment variables template
├─ package.json         # Dependencies and scripts
└─ next.config.ts       # Next.js configuration
```

## Architecture Principles

### Authentication
- Use `@supabase/ssr` for Next.js App Router authentication
- Do NOT use deprecated `@supabase/auth-helpers-nextjs`
- Server-side: `createServerClient` with cookies
- Client-side: `createBrowserClient`
- Middleware: Refresh session and protect routes

### Authorization & RLS
- All business tables MUST have Row Level Security (RLS) enabled
- Company users can only access their own company's data
- Admin users can access data for programs they manage
- Super admins can access all data
- Permissions are enforced at:
  1. Supabase RLS (database level)
  2. Server-side validation (API level)
  3. UI menu hiding (UX level, not sufficient alone)

### State Management
- Status values MUST use codes/enums, NOT display text
- Store Korean display text separately or use i18n
- State transitions MUST be validated against allowed transitions
- Reference `docs/05-status-workflows.md` for state definitions

### Data Integrity
- Monetary values: Use `integer` (won) or `numeric`, NOT `float`
- Datetimes: Store UTC in DB, display as Asia/Seoul in UI
- Soft delete: Use `deleted_at` instead of DELETE for business data
- Audit: Log all admin actions with timestamp and actor

### File Management
- Storage buckets: Default to `private`, use signed URLs for download
- Filenames: Preserve both original and system-generated names
- System filename format: `{세목},{YYMMDD},[성장기업지원]{사용내용},{환급대상자명(기업명)},{구매처}.{확장자}`
- Sanitize unsafe characters in filenames

### Email & Notifications
- Decouple email sending from state changes
- Use separate sending job and history table
- Support retry for failed sends
- Record both success and failure with reason

## Important Rules

### DO
- Use TypeScript for all new code
- Follow the existing code style and conventions
- Check `node_modules/next/dist/docs/` for Next.js 16 API changes
- Use `@/*` import alias for src imports
- Validate permissions on both client and server
- Use soft delete for business data
- Log important admin actions
- Use integer/numeric for monetary values

### DON'T
- Expose `SUPABASE_SERVICE_ROLE_KEY` in browser code
- Hardcode environment variable values
- Skip RLS on business tables
- Use float for money
- Modify production DB directly without migrations
- Overwrite approved budgets or payment data
- Rely solely on UI hiding for security
- Use deprecated `@supabase/auth-helpers-nextjs`

## Next Steps

Before implementing features:
1. Read `docs/01-project-overview.md` for project context
2. Read `docs/02-user-roles-and-permissions.md` for access control
3. Read `docs/06-database-conceptual-design.md` for data model
4. Read `docs/07-security-rules.md` for security requirements
5. Check `docs/12-open-decisions.md` for pending decisions

## Reference Documentation

| Document | Purpose |
|----------|---------|
| `docs/01-project-overview.md` | Project background and scope |
| `docs/02-user-roles-and-permissions.md` | Role definitions and permissions |
| `docs/03-feature-requirements.md` | Detailed feature specifications |
| `docs/04-screen-and-route-map.md` | URL structure and screen mapping |
| `docs/05-status-workflows.md` | Status codes and state transitions |
| `docs/06-database-conceptual-design.md` | Database schema and relationships |
| `docs/07-security-rules.md` | Security principles and RLS |
| `docs/08-email-and-notification-rules.md` | Email policies and templates |
| `docs/09-file-management-rules.md` | File storage and naming rules |
| `docs/10-development-roadmap.md` | Phased implementation plan |
| `docs/11-test-strategy.md` | Testing approach and coverage |
| `docs/12-open-decisions.md` | Pending decisions and trade-offs |
