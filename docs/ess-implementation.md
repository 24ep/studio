# Employee Self-Service implementation

## Current-state assessment

Before this change, ESS already had authenticated routes at `/ess/profile`, `/ess/leave`, `/ess/attendance`, `/ess/documents`, `/ess/performance`, and `/ess/team`. Those routes all rendered one large client component. The supporting APIs were self-scoped, but the available workflows were limited to:

- three profile-change fields;
- basic leave submission and cancellation;
- check-in and check-out;
- employee document upload/download;
- read-only performance records;
- direct-report lists and simple leave approval.

The repository already provided the correct foundations to extend: Next.js App Router, NextAuth sessions, PostgreSQL/Prisma, raw-SQL HR services, MinIO file storage, the platform notification service, audit logging, HR module permissions, Tailwind/Radix UI primitives, and Vitest.

Key gaps were the absence of a shared ESS request model, incomplete leave policy enforcement, no attendance corrections or breaks, no document requests/acknowledgments/version metadata, no employee performance actions, weak manager approval context, and an ESS dashboard that duplicated the Employee Portal.

## Information architecture

ESS retains exactly six employee/manager pages:

1. Employee Profile
2. Leave Request
3. Attendance
4. Document
5. Performance
6. My Team

`/ess` redirects to the existing Employee Portal. Legacy `/ess/payslips`, `/ess/learning`, and `/ess/onboarding` routes remain backward compatible but redirect to Payroll, Learning, and Learning Onboarding respectively.

The Employee Portal now presents profile completion, leave, attendance, document acknowledgment, performance, learning, manager, and payroll signals. Context links continue to use the existing Shift, Payroll, Learning, Broadcast, Expenses, and employee administration modules.

## UX implementation

The redesigned screens use the existing theme tokens and sidebar identity. Shared ESS presentation includes:

- an employee summary header and profile-completion indicator;
- consistent, accessible status badges;
- responsive tabs and mobile-first record cards;
- sticky form actions on long requests;
- skeleton, empty, error, saving, success, and background-refresh states;
- non-color status text and labeled attendance calendar cells;
- touch-sized controls and keyboard-visible focus states;
- approval activity timelines;
- contextual source-module links.

Desktop layouts expose useful side-by-side context. Tablet layouts reflow to two columns. Mobile layouts use single-column forms and cards without hiding primary actions.

## Technical architecture

### Shared request and approval model

`hr_ess_requests`, `hr_ess_approval_steps`, and `hr_ess_request_activities` provide one request lifecycle for profile changes, attendance corrections, document requests, and performance submissions. Supported transitions include draft, submission, manager review, return for revision, resubmission, approval, rejection, withdrawal, cancellation, processing, and completion.

Every mutation checks ownership or approver identity on the server. Version columns provide optimistic concurrency and return HTTP 409 when a viewed record is stale. Manager access is restricted by the employee hierarchy; privileged HR actions continue to use the existing HR permission system and company IDs are checked when both records are company-scoped.

Leave remains in the Leaves domain tables and uses their policies/balances. Attendance remains in the workforce attendance tables. Performance remains in the existing cycle/review/goal tables. Generic ESS requests never become a second employee master.

### Security

- Employee queries are resolved from the authenticated session and restricted to the linked employee record.
- HR-controlled employment fields are read-only in ESS.
- Bank, tax, and government-identification values are masked before leaving the server.
- My Team returns only manager-safe employee fields.
- Document file paths are resolved only after self-record authorization.
- Uploads use the existing file type, MIME, filename, and size validation policy.
- Document access/downloads, approvals, attendance actions, request actions, and uploads are audited.
- Server timestamps are authoritative for attendance actions.
- Duplicate attendance sequences, overlapping leave, insufficient balances, leave blocks, date/policy limits, and concurrent changes are rejected server-side.

### Notifications

ESS uses `NotificationService`, preserving the existing in-app read/unread history and real-time delivery behavior. Notifications include deep links for manager approvals, request decisions, leave decisions, and performance actions. The events are ready for the existing email notification pipeline.

## Database migration

Apply the additive migration:

```powershell
npx prisma migrate deploy
npx prisma generate
```

The migration is backward compatible. It enriches existing employee, profile request, leave, attendance, document, performance, and goal tables, then adds shared request/activity, document version/acknowledgment, and sensitive-access audit tables.

For local demonstration data:

```powershell
npm run seed:hr
npm run seed:ess
```

The ESS seed links matching user/employee emails, creates a manager hierarchy, policies and balances, a schedule, sample attendance, an acknowledgment document, and a live performance review/goal.

MinIO and PostgreSQL must be configured using the repository's existing environment variables. No new external service is required.

## API summary

- `GET /api/ess/me` — self-scoped ESS aggregate
- `GET|POST|PATCH /api/ess/leave` — balances, validated requests, drafts, withdrawal/resubmission/cancellation
- `GET|POST /api/ess/attendance` — authoritative clock and break actions
- `GET|PATCH /api/ess/documents` — library and acknowledgments
- `POST /api/ess/documents/upload` — secure employee upload
- `GET /api/ess/files` — authorized, audited file stream
- `GET|POST|PATCH /api/ess/requests` — shared employee request and manager workflow
- `GET|PATCH /api/ess/performance` — self-assessment, acknowledgment, and goal progress
- `GET|POST /api/ess/team` — hierarchy-scoped manager dashboard and leave decisions

## Validation and tests

ESS-specific tests cover:

- leave duration, weekend, and holiday calculations;
- safe profile fields and server action schemas;
- break/attendance action validation;
- sensitive-value masking;
- request IDs and workflow transitions;
- return/resubmission and invalid transitions;
- attendance correction time ordering;
- performance version and assessment validation;
- profile completion;
- the exact six-item ESS navigation.

Verification commands:

```powershell
npm run type-check
npm run lint
npm run test:run -- src/lib/hr/ess-service.test.ts src/lib/hr/ess-contracts.test.ts src/components/layout/sidebar-hr-links.test.ts
npm run build
```

## Assumptions and deployment dependencies

- An employee is linked to an auth user by `user_id` or matching email, consistent with the pre-existing ESS behavior.
- The employee manager hierarchy is the default first approval step. HR can extend approval-step seeding for department-head, parallel, or policy-specific chains without changing page-level implementations.
- Company isolation is enforced when employee company IDs are populated. Existing records with no company remain compatible until backfilled.
- Email delivery uses the existing notification/email infrastructure; ESS emits email-ready notification events rather than creating a second mailer.
- Geofence radius and approved coordinates remain Shift/attendance administration configuration. ESS records server time and submitted coordinates but does not create shift administration.
- Payroll files, learning certificates, announcements, expense claims, and schedules remain owned by their existing modules.
- The repository currently has Vitest but no browser E2E runner. ESS critical domain and navigation scenarios are covered in Vitest; adding Playwright/Cypress requires a repository-level test-infrastructure decision.

## Primary files

- `prisma/migrations/20260728120000_complete_ess_self_service/migration.sql`
- `prisma/schema.prisma`
- `prisma/seed-ess.ts`
- `src/lib/hr/ess-contracts.ts`
- `src/lib/hr/ess-request-service.ts`
- `src/lib/hr/ess-action-service.ts`
- `src/lib/hr/ess-service.ts`
- `src/app/api/ess/**`
- `src/components/ess/**`
- `src/components/hr/EmployeeSelfServicePage.tsx`
- `src/app/employee-portal/page.tsx`
- `src/components/layout/SidebarNavConfig.ts`

