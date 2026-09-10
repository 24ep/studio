# System Requirements Specification (SRS)

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Approved
**Classification:** Internal
**Reference:** Based on BRD v1.0

---

## 1. Introduction
This System Requirements Specification (SRS) provides the comprehensive technical breakdown for the HRI Enterprise application. It serves as the single source of truth for engineering, QA, and DevOps teams.

## 2. System Architecture

### 2.1 Technology Stack & Infrastructure
*   **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, ShadCN UI.
*   **Backend API**: Next.js Server Components / API Routes (Node.js runtime).
*   **Database**: PostgreSQL 15, accessed via Prisma ORM.
*   **Object Storage**: MinIO (S3 Compatible) for binary assets (Resumes, Avatar images).
*   **Automation Engine**: N8N workflow automation server (for webhooks/triggers).
*   **AI Service**: Google Generative AI (Genkit) via custom wrapper.
*   **Real-time Layer**: Server-Sent Events (SSE) custom implementation.

### 2.2 Integration Architecture
The system follows a modular monolithic pattern.
*   **Internal Communication**: All modules share the same database and runtime.
*   **External Integration**:
    *   **Inbound**: Azure AD for SSO Authentication.
    *   **Outbound**: Webhooks to N8N for extended workflow automation (e.g., Email Notifications).
    *   **Email**: SMTP via `nodemailer` with dynamic configuration from `SystemSetting` table.

### 2.3 AI Architecture
*   **Provider**: Google Gemini API via `generativelanguage.googleapis.com`.
*   **Model Strategy**: Automated fallback chain: `gemini-2.0` -> `gemini-1.5` -> `gemini-1.0`.
*   **Security**: All model names must be validated against `^[a-zA-Z0-9._-]+$` to prevent injection.

---

## 3. Detailed Functional Modules

### 3.1 Module: Authentication & Identity (AUTH)
* **Objective**: Secure user access and session management.
* **Component Owner**: `src/app/auth/*`
* **Requirements**:
    *   **AUTH-001 (Credential Login)**: System MUST authenticate users via Email/Password credentials validated against bcrypt hashes in the `User` table.
    *   **AUTH-002 (Azure SSO)**: System MUST support OpenID Connect flow via Azure Active Directory. Upon successful callback, a `Account` record must be linked to the `User`.
    *   **AUTH-003 (Mobile Detection)**: On `GET /auth/signin`, the system MUST analyze the User-Agent. If a mobile device is detected, it MUST serve the `MobileSignInView` component (Card layout) instead of the desktop view.
    *   **AUTH-004 (Session Guard)**: Middleware MUST intercept all `/app/*` and `/api/*` routes. Unauthenticated requests MUST be redirected to `/auth/signin`.
    *   **AUTH-005 (Two-Factor Auth)**: System MUST support TOTP generation using `otplib`. When `User.twoFactorEnabled` is true, login flow MUST require a valid token before issuing session cookie.

### 3.2 Module: applicant Management (CAND)
* **Objective**: CRUD operations for applicants/applicants.
* **Component Owner**: `src/components/applicants/*`
* **Requirements**:
    *   **CAND-001 (List View)**: The applicant Table (`applicantTable.tsx`) MUST support server-side pagination (limit=20 default), sorting by `updatedAt`, and filtering by `statusId`.
    *   **CAND-002 (Fit Score Filtering)**: Users MUST be able to filter applicants by a numerical range (0-100) on the `fitScore` field.
    *   **CAND-003 (Resume Parsing)**:
        *   **Input**: PDF/DOCX file via `POST /api/v1/applicants/upload`.
        *   **Process**: File uploaded to MinIO -> Text Extracted -> Sent to GenAI with "Extraction Prompt".
        *   **Output**: Structured JSON (`parsedData`) saved to `applicant` record.
    *   **CAND-004 (Duplicate Check)**: Before creation, system MUST query for existing `email` or `phone`. If found, it MUST return a `409 Conflict` (or warning flag depending on config).
    *   **CAND-005 (Bulk Upload)**: 
        *   **UI**: `BulkUploadCVsModal.tsx` MUST accept ZIP files or multiple selections.
        *   **Backend**: Files MUST be added to `UploadQueue` table with status `PENDING`.
        *   **Processing**: Background worker MUST process queue items sequentially to prevent Rate Limit exhaustion.
    *   **CAND-006 (Kanban Board)**: The `applicantKanban` component MUST use `@dnd-kit/core` for drag-and-drop. Stage changes MUST update `TransitionRecord` and `applicant.statusId` transactionally.

### 3.3 Module: Evaluation & Scoring (EVAL)
* **Objective**: Standardized interviewing process.
* **Component Owner**: `src/app/applicants/[id]/evaluate/*`
* **Requirements**:
    *   **EVAL-001 (Configurable Criteria)**: Scorecards MUST be dynamically generated based on the `Position`'s associated `ExpertiseSkill` and `PersonalityTrait` configurations.
    *   **EVAL-002 (Real-time Sync)**:
        *   **Trigger**: When User A updates a score slider.
        *   **Action**: `POST /api/v1/evaluations` triggers an event to the `evaluation-updates` SSE channel.
        *   **Reaction**: User B's client subscribes to channel and auto-updates the UI state.
    *   **EVAL-003 (Waiting Room)**: The `EvaluationWaitingPage` MUST poll or listen for completion status of all assigned interviewers and display a "2/3 Completed" status indicator.
    *   **EVAL-004 (External Access)**: The middleware MUST whitelist `GET /applicants/*/evaluate` if a valid `?token=` parameter is present, allowing non-authenticated Guest Interviewers to access specific sessions.

### 3.4 Module: Position Management (POS)
* **Objective**: Requisition tracking.
* **Component Owner**: `src/components/positions/*`
* **Requirements**:
    *   **POS-001 (Headcount Tracking)**: The `Headcount` table MUST track individual slots. The system MUST NOT allow hiring a applicant if valid `vacant` slots are 0 (unless override authorized).
    *   **POS-002 (SLA Monitoring)**: System MUST compare `createdAt` vs `filledAt` against the defined `Grade.slaDays` to calculate "Time to Fill" performance.

### 3.5 Module: System Configuration (SYS)
* **Objective**: Admin capabilities.
* **Component Owner**: `src/components/settings/*`
* **Requirements**:
    *   **SYS-001 (Custom Fields)**: System MUST support schema-less extension via `CustomFieldDefinition` table. These fields MUST be rendered dynamically on applicant/Position forms.
    *   **SYS-002 (Audit Logging)**: All write operations (POST/PUT/DELETE) on core entities (applicant, Position) MUST write a record to `AuditLog` table with `userId`, `timestamp`, `actionType`, and `diff`.
    *   **SYS-003 (Webhook Resilience)**: The `WebhookDispatcher` MUST implement exponential backoff for failed requests. Timeouts MUST be configurable via `WEBHOOK_CONNECTION_TIMEOUT`.
    *   **SYS-004 (Data Export)**: `GET /api/v1/export/*` endpoints MUST stream Excel files using `exceljs` to avoid high memory consumption.

### 3.6 Module: Infrastructure & Operations (INFRA)
* **Objective**: Reliability and Deployment.
* **Requirements**:
    *   **INFRA-001 (Database Pooling)**: Application MUST use a connection pool (max 30 connections) with 5s idle timeout to prevent connection leaks.
    *   **INFRA-002 (PWA)**: The application app MUST include a valid `manifest.json` and service worker configuration (`next-pwa`) to support "Add to Home Screen".
    *   **INFRA-003 (Rate Limiting)**: API routes MUST be protected by a standard Token Bucket or Window rate limiter. Middleware MUST inject `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
    *   **INFRA-004 (File Security)**: Public access to MinIO buckets MUST be disabled. All file access MUST be mediated via Presigned URLs generated by the API/SDK.
    *   **INFRA-005 (Security Headers)**: All responses MUST include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strictly scoped `Permissions-Policy`.
    *   **INFRA-006 (Content Security Policy)**: The server MUST enforce a strict CSP preventing `unsafe-inline` scripts (except where necessary for Next.js) and restricting `img-src` to whitelisted domains (`localhost`, `placehold.co`).
    *   **INFRA-007 (Build Artifacts)**: The system MUST compile to a `standalone` output mode to minimize Docker image size and runtime dependencies.

---

## 4. Interface Requirements

### 4.1 UI Design Guidelines
*   **Responsive Breakpoints**:
    *   Mobile: < 640px (Tailwind `sm`)
    *   Tablet: 640px - 1024px (Tailwind `md/lg`)
    *   Desktop: > 1024px (Tailwind `xl`)
*   **Mobile Navigation**:
    *   Implementation: `MobileBottomNav.tsx`.
    *   Constraint: Fixed to viewport bottom (`bottom: 0`, `fixed`).
    *   Constraint: All main content views MUST have `padding-bottom: 160px` (`pb-40`) on mobile to prevent content overlap.

### 4.2 Data Interfaces
*   **Database Schema**: Defined in `prisma/schema.prisma`.
*   **API Standard**: REST Level 2.
    *   Success: HTTP 200/201 with `{ success: true, data: ... }`
    *   Error: HTTP 4xx/5xx with `{ success: false, error: "Message", code: "ERR_CODE" }`

---

## 5. Security & Compliance Requirements

### 5.1 Access Control (RBAC)
*   **Super Admin**: Full access to all modules and settings.
*   **Recruiter**: Read/Write on applicants/Positions. No access to System Settings.
    *   *Constraint*: Can only edit applicants they "Own" (assigned to) unless `applicantS_EDIT_..._ALL` permission is granted.
*   **Hiring Manager**: Read-Only on applicants (unless assigned), Read/Write on assigned Positions.
*   **Interviewer**: Write access ONLY to specific Evaluation sessions assigned to them.

### 5.2 Data Protection
*   **Password Hashing**: Bcrypt with minimum cost factor 10.
*   **Session Management**: Secure HttpOnly cookies.
*   **Data Retention**: Soft-delete policy implementation (`deletedAt` or `isActive` flags) for auditability.
