# Headcount Bulk Action Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace client-side N-request headcount bulk approvals/rejections with one validated server batch contract and explicit batch result handling.

**Architecture:** Add a focused bulk input parser and `/api/hiring/headcount-requests/bulk-action` endpoint. The endpoint validates the entire requested batch before writing, applies database transitions in one transaction, then runs existing post-approval position effects. The Headcount UI performs one request and reloads authoritative server state.

**Tech Stack:** Next.js 15 route handlers, React 18, TypeScript, Prisma, Vitest, Playwright.

## Global Constraints

- Preserve existing single-request POST/PATCH behavior.
- Use the same permissions, transition rules, capacity checks, and audit-field merge helpers as single actions.
- Do not partially mutate the requested batch when input/state validation fails.
- Reject duplicate/empty IDs and cap a batch at 100 requests.
- Rejection reason is mandatory for bulk reject.
- No database migration.

### Task 1: Define batch input contract
- Create `src/app/api/hiring/headcount-requests/headcount-bulk-utils.test.ts` first and observe RED.
- Create `headcount-bulk-utils.ts` with normalization/validation.

### Task 2: Add atomic bulk endpoint
- Create `src/app/api/hiring/headcount-requests/bulk-action/route.ts`.
- Authenticate and authorize with the same position-edit permissions.
- Load all requested rows and reject the whole batch if any ID is missing or any transition is invalid.
- Apply capacity checks and updates inside one Prisma transaction.
- Run existing approval side effects for unique approved positions after commit.

### Task 3: Switch UI to one batch request
- Replace `Promise.allSettled` N-PATCH behavior in `HeadcountRequestsClient.tsx`.
- Keep failed validation selections intact; clear selections only after a successful batch.
- Reload `/api/hiring/headcount-requests` after success.

### Task 4: Verification
- Add unauthenticated API smoke coverage for the new endpoint.
- Require architecture, TypeScript, lint, full Vitest, production build, browser smoke, schema/migrations, Docker, and aggregate production gate before merge.
