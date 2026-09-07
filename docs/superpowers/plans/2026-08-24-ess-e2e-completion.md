# ESS End-to-End Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete employee self-service journeys for expenses, onboarding, benefits, payslips, and shared approval/status handling without duplicating existing HRIS domain systems.

**Architecture:** ESS remains a composition layer over existing domain APIs. New employee-facing surfaces constrain access to the authenticated employee, while manager decisions reuse the unified approval inbox and existing request engines. Expense, learning, survey, payroll, and HR master data stay in their current authoritative modules.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Zod, existing HRIS/ESS components and APIs.

**Spec:** `docs/superpowers/specs/2026-08-24-ess-e2e-completion-design.md`

## Global Constraints
- Do not create duplicate expense, learning, survey, payroll, or onboarding persistence models.
- Employee identity for self-service writes must be derived server-side from the authenticated user.
- Returned/rejected/pending/downstream completion states must remain visible after refresh.
- State transitions with a `version` field must reject stale updates with HTTP 409.
- Reuse existing secure upload paths for documents and receipts.
- Keep finance/admin/team scopes out of employee-only ESS pages.

---

### Task 1: ESS route ownership and navigation contracts

**Files:**
- Modify: `src/components/ess/ess-types.ts`
- Modify: `src/components/ess/EssShared.tsx`
- Modify: `src/components/ess/EmployeePortalEssOverview.tsx`
- Create: `src/app/ess/expenses/page.tsx`
- Test: `src/app/ess/ess-routes.test.ts`

**Interfaces:**
- Produces employee route metadata for `expenses`, `benefits`, `onboarding`, `payslips`, `learning`, and `surveys` without forcing them through `EmployeeSelfServicePage`.

- [ ] Write a failing route-contract test asserting `/ess/onboarding` and `/ess/payslips` render employee-owned components and `/ess/expenses` exists.
- [ ] Run the focused route test and verify it fails because the routes are redirect/missing.
- [ ] Add route metadata/navigation entries and the `/ess/expenses` page.
- [ ] Re-run the route test until green.
- [ ] Commit the task.

### Task 2: Employee-only expense claims surface

**Files:**
- Modify: `src/components/expenses/ExpensesWorkspace.tsx`
- Modify: `src/app/ess/expenses/page.tsx`
- Test: `src/components/expenses/ExpensesWorkspace.test.tsx`

**Interfaces:**
- `ExpensesWorkspace({ resource, employeeSelfService?: boolean })`
- When `employeeSelfService=true`, scope is permanently `self`, scope-switch controls and finance/admin affordances are not rendered, while create/receipt/submit/withdraw/resubmit/payment-status tracking remains available.

- [ ] Write a failing test that employee mode never renders team/finance scope controls and still renders create/submit-capable claim UI.
- [ ] Verify the test fails because the component lacks employee mode.
- [ ] Add the `employeeSelfService` prop and constrain scope/actions.
- [ ] Render `<ExpensesWorkspace resource="claims" employeeSelfService />` from `/ess/expenses`.
- [ ] Re-run the focused test until green.
- [ ] Commit the task.

### Task 3: Employee onboarding journey

**Files:**
- Create: `src/components/ess/OnboardingView.tsx`
- Modify: `src/app/ess/onboarding/page.tsx`
- Modify if required: `src/app/api/ess/onboarding/route.ts`
- Test: `src/components/ess/OnboardingView.test.tsx`
- Test: `src/app/api/ess/onboarding/route.test.ts`

**Interfaces:**
- GET `/api/ess/onboarding` returns only the authenticated employee's current onboarding journey, tasks, progress, assigned learning summary, and blockers.
- PATCH `/api/ess/onboarding` accepts `{ taskId, action: 'complete'|'reopen', expectedVersion }` only for employee-owned tasks.

- [ ] Write failing API tests for employee isolation and version-checked task completion.
- [ ] Write a failing UI test that renders progress, tasks, due states, learning, and completion/blocked state without HR case controls.
- [ ] Verify both tests fail for the redirect/admin experience.
- [ ] Extend the existing ESS onboarding API only as needed to satisfy the contract.
- [ ] Build `OnboardingView` and replace the redirect route.
- [ ] Re-run API/UI tests until green.
- [ ] Commit the task.

### Task 4: Benefits employee lifecycle

**Files:**
- Modify: `src/app/api/ess/benefits/route.ts`
- Modify: `src/components/ess/BenefitsPage.tsx`
- Test: `src/app/api/ess/benefits/route.test.ts`

**Interfaces:**
- PATCH `/api/ess/benefits` body `{ id, action, expectedVersion }` where action is `withdraw | resubmit | request_termination`.
- Valid transitions: `pending_approval -> withdrawn`, `returned_for_revision|withdrawn -> pending_approval`, `active -> pending_termination`.

- [ ] Write failing lifecycle tests for valid transitions, stale version 409, ownership protection, and invalid transition 409.
- [ ] Verify the tests fail because PATCH does not exist.
- [ ] Implement the PATCH state machine with audit logging.
- [ ] Add employee actions and decision-comment/status presentation to `BenefitsPage`.
- [ ] Re-run lifecycle tests until green.
- [ ] Commit the task.

### Task 5: Benefits manager approval integration

**Files:**
- Modify: `src/app/api/ess/team/route.ts`
- Modify: `src/components/ess/MyTeamView.tsx`
- Test: `src/app/api/ess/team/route.test.ts`

**Interfaces:**
- Team GET includes benefit enrollments requiring the current manager's decision as unified approval tasks.
- Team POST accepts benefit actions `approve_benefit | reject_benefit | return_benefit` with `{ id, comment, expectedVersion }`.
- Transitions: pending approval -> active/rejected/returned_for_revision; pending termination -> ended/returned_for_revision.

- [ ] Write failing manager tests for authorized approval, unauthorized approval, comments, and stale version conflict.
- [ ] Verify failures are due to missing benefit integration.
- [ ] Add benefit records to team approvals and implement version-checked manager transitions with audit logging.
- [ ] Teach `MyTeamView` to route benefit approval tasks to the benefit action names.
- [ ] Re-run manager tests until green.
- [ ] Commit the task.

### Task 6: First-class payslip self-service

**Files:**
- Create: `src/components/ess/PayslipsView.tsx`
- Modify: `src/app/ess/payslips/page.tsx`
- Test: `src/components/ess/PayslipsView.test.tsx`

**Interfaces:**
- Payslips use the existing authenticated ESS dashboard/payroll file data and secure file/download endpoints; no new payroll storage is introduced.

- [ ] Write a failing test for payroll-period list, empty state, status, and secure view/download action.
- [ ] Verify it fails because the route redirects to Documents.
- [ ] Build the focused payslip view and replace the redirect.
- [ ] Re-run the test until green.
- [ ] Commit the task.

### Task 7: Regression coverage for existing request lifecycles

**Files:**
- Test existing ESS request route/service tests for leave, attendance correction, shift requests, overtime, timesheet, profile requests, documents, performance, learning, and surveys.
- Modify production files only where a regression test proves a missing returned/resubmit/final-state transition.

**Interfaces:**
- Existing domain state machines remain authoritative.

- [ ] Add/extend tests that cover employee create/submit, returned-for-revision, resubmit/withdraw where supported, manager decision, and employee-visible final state.
- [ ] Run the focused suites and identify actual gaps rather than duplicating working behavior.
- [ ] Make the minimal production fixes required by failing tests.
- [ ] Re-run until green.
- [ ] Commit the task.

### Task 8: Verification and integration review

**Files:**
- No feature files unless verification exposes a defect.

- [ ] Run targeted ESS/expense/benefit/onboarding tests.
- [ ] Run TypeScript/build.
- [ ] Run repository ESS/HR regression suites available in `package.json`.
- [ ] Compare `feat/ess-e2e-completion` against `dev` and inspect every changed file for employee-data leakage or admin-scope regressions.
- [ ] Fix any verification failures and re-run.
- [ ] Open a PR to `dev` with test evidence and remaining non-blocking follow-ups, if any.
