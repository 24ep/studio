# Hrive Time End-to-End Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every audited Time / Shift & Attendance user journey from setup and employee self-service through manager review, reporting, notifications, and Payroll ingestion.

**Architecture:** Preserve the current route/service structure while adding focused domain helpers for correction merging, lifecycle transitions, Time policy loading, roster-copy mapping, notification recipients, and Payroll attendance-export collection. UI changes expose only transitions supported by the backend and reuse the existing Time/ESS components.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Prisma/PostgreSQL raw SQL, Vitest, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-23-hrive-time-e2e-completion-design.md`

## Global Constraints

- Preserve existing routes, permission IDs, audit conventions, and authoritative Time tables.
- No Time visual redesign.
- Every mutation remains authorization-checked and concurrency-safe.
- Attendance correction approval must be transactional and patch-safe.
- Payroll attendance input collection must be idempotent.
- Notifications may fail independently, but UI copy must not falsely claim recipient delivery.

---

### Task 1: Attendance correction integrity and correction-type semantics

**Files:**
- Create: `src/lib/hr/attendance-correction.ts`
- Create: `src/lib/hr/attendance-correction.test.ts`
- Modify: `src/lib/hr/ess-contracts.ts`
- Modify: `src/lib/hr/ess-request-service.ts`

**Interfaces:**
- Produces `mergeAttendanceCorrection(current, request)` returning merged clock/break/location/status/assignment values without erasing untouched fields.
- Produces `attendanceCorrectionRequestedValuesSchema` consumed by ESS request validation.

- [ ] **Step 1: Write failing unit tests** covering missing checkout preserving check-in, break-only correction preserving clocks, WFH/off-site status/location mapping, and shift-assignment replacement validation.
- [ ] **Step 2: Run** `npx vitest run src/lib/hr/attendance-correction.test.ts` and verify RED.
- [ ] **Step 3: Implement the helper and extend the attendance-correction request schema** with `correctionType`, optional `attendanceRecordId`, optional `assignmentId`, optional clocks, optional break minutes, optional work location, optional requested status.
- [ ] **Step 4: Update `applyApprovedRequest()`** to load the current attendance record/assignment, merge through the helper, upsert only merged values, recalculate, rebuild exceptions, and append the correction event transactionally.
- [ ] **Step 5: Run focused tests + `npm run type-check`** and commit.

### Task 2: Employee attendance correction form and ESS lifecycle actions

**Files:**
- Modify: `src/components/shift/views/RequestsView.tsx`
- Modify: `src/components/shift/views/AttendanceRequestsReview.tsx`
- Modify: `src/components/ess/use-ess-data.ts`
- Test: `src/lib/hr/ess-contracts.test.ts`

**Interfaces:**
- Consumes ESS `PATCH /api/ess/requests` actions `submit|withdraw|cancel|resubmit`.
- Correction form submits the exact patch-style shape from Task 1.

- [ ] **Step 1: Add failing regression tests** proving all supported correction types map to fields accepted by the schema and lifecycle actions are valid for draft/returned/pending states.
- [ ] **Step 2: Make correction form prefill from actual attendance data for selected date** and select a valid replacement assignment for incorrect-shift corrections.
- [ ] **Step 3: Replace URL-only evidence with the existing ESS upload function** and pass uploaded document metadata in `supportingDocuments`.
- [ ] **Step 4: Add employee actions**: submit draft, edit/resubmit returned, withdraw pending, cancel approved/processing where allowed.
- [ ] **Step 5: Run focused tests/type-check/lint** and commit.

### Task 3: Shift request target data and complete lifecycle

**Files:**
- Create: `src/lib/hr/shift-request-workflow.ts`
- Create: `src/lib/hr/shift-request-workflow.test.ts`
- Modify: `src/lib/hr/shift-attendance-contracts.ts`
- Modify: `src/lib/hr/shift-attendance-service.ts`
- Modify: `src/components/shift/views/RequestsView.tsx`

**Interfaces:**
- New mutations: `update_shift_request`, `submit_shift_request`, `withdraw_shift_request`, `cancel_shift_request`, `resubmit_shift_request`.
- Requests payload returns `ownAssignments`, `eligibleSwapAssignments`, and `openShifts`.

- [ ] **Step 1: Write failing transition tests** for draft→pending, returned→pending, pending→withdrawn, allowed cancellation, and forbidden invalid transitions.
- [ ] **Step 2: Add target-validation tests** for swap colleague assignment, open-shift target, cover target, drop-shift ownership.
- [ ] **Step 3: Implement service actions transactionally with `expectedVersion`** and preserve reviewer comments/history.
- [ ] **Step 4: Update request data query** to expose colleague assignment/open-shift choices scoped to company and employee eligibility.
- [ ] **Step 5: Update Shift Request form/history UI** with type-specific selectors and edit/resubmit/withdraw/cancel actions.
- [ ] **Step 6: Run focused tests/type-check/lint** and commit.

### Task 4: Overtime lifecycle completion

**Files:**
- Create: `src/lib/hr/overtime-request-workflow.ts`
- Create: `src/lib/hr/overtime-request-workflow.test.ts`
- Modify: `src/lib/hr/shift-attendance-contracts.ts`
- Modify: `src/lib/hr/shift-attendance-service.ts`
- Modify: `src/components/shift/views/OvertimeView.tsx`

**Interfaces:**
- New owner mutations: `update_overtime`, `submit_overtime`, `withdraw_overtime`, `cancel_overtime`, `resubmit_overtime`.

- [ ] **Step 1: Write RED transition tests** for draft/returned/pending/approved states.
- [ ] **Step 2: Implement owner lifecycle mutations** with overlap revalidation and optimistic concurrency.
- [ ] **Step 3: Reopen the existing request in the form for draft/returned states** and expose withdraw/cancel where valid.
- [ ] **Step 4: Keep approve→confirm-actual behavior unchanged** and run tests/type-check/lint.
- [ ] **Step 5: Commit.**

### Task 5: Timesheet entry editing

**Files:**
- Modify: `src/components/shift/views/TimesheetCommandCenter.tsx`
- Test: `src/components/shift/views/timesheet-command-center-utils.test.ts`

- [ ] **Step 1: Add a failing UI/model regression test** requiring existing draft/returned entries to expose Edit as well as Delete.
- [ ] **Step 2: Add selected-entry state and prefill `EntryPanel`**; pass `entryId` to the already-supported save mutation.
- [ ] **Step 3: Verify returned timesheet edit→resubmit remains valid.**
- [ ] **Step 4: Run tests/type-check/lint and commit.**

### Task 6: Roster copy and truthful bulk publish notifications

**Files:**
- Create: `src/lib/hr/roster-copy.ts`
- Create: `src/lib/hr/roster-copy.test.ts`
- Create: `src/lib/hr/shift-notification-recipients.ts`
- Create: `src/lib/hr/shift-notification-recipients.test.ts`
- Modify: `src/lib/hr/shift-attendance-contracts.ts`
- Modify: `src/lib/hr/shift-attendance-service.ts`
- Modify: `src/app/api/hr/shift-attendance/route.ts`
- Modify: `src/components/shift/views/RosterView.tsx`

**Interfaces:**
- New mutation `copy_roster` with `sourceStart`, `targetStart`, `reason`.
- `publish_roster` returns affected `employeeIds` alongside period/assignments.

- [ ] **Step 1: Write RED tests** for seven-day date offset mapping, conflict rejection, and unique recipient extraction from bulk mutation results.
- [ ] **Step 2: Implement `copy_roster` transaction** cloning non-cancelled assignments into target period as draft and rejecting conflicts.
- [ ] **Step 3: Add Copy previous week UI** using the new mutation.
- [ ] **Step 4: Make publish return affected employee IDs and send per-user notifications**; change success copy to claim notifications only after recipients are resolved.
- [ ] **Step 5: Run tests/type-check/lint and commit.**

### Task 7: Runtime Time policy configuration

**Files:**
- Create: `src/lib/hr/time-policy-config.ts`
- Create: `src/lib/hr/time-policy-config.test.ts`
- Modify: `src/lib/hr/shift-attendance-service.ts`
- Modify: `src/lib/hr/ess-service.ts`

**Interfaces:**
- Produces `getTimePolicyConfig()` with timezone, standardWeeklyHours, lateGraceMinutes, overtimeApprovalRequired, overtimeRoundingMinutes, minimumShiftRestHours, holidayWorkMultiplier.

- [ ] **Step 1: Write RED tests** for defaults and persisted `workforceRulesConfiguration` overrides.
- [ ] **Step 2: Implement safe setting loader** with current behavior as fallback.
- [ ] **Step 3: Replace hard-coded Time runtime values** where applicable: timezone, late grace fallback, overtime rounding, weekly limit, minimum rest validation.
- [ ] **Step 4: Run focused tests/type-check/lint and commit.**

### Task 8: Time reports route/UI

**Files:**
- Create: `src/components/shift/views/ReportsView.tsx`
- Modify: `src/components/shift/ShiftAttendanceWorkspace.tsx`
- Modify: `src/app/workforce/attendance/page.tsx`
- Modify: `src/components/shift/shift-types.ts`

- [ ] **Step 1: Add RED routing regression** requiring `reports` to be accepted by workspace/page routing.
- [ ] **Step 2: Implement ReportsView** using `useShiftAttendance('reports', query)` with date range, daily metrics table, totals, and CSV export.
- [ ] **Step 3: Route `?view=reports` to the new view.**
- [ ] **Step 4: Run type-check/lint and commit.**

### Task 9: Attendance export ingestion into Payroll

**Files:**
- Create: `src/lib/payroll/attendance-inputs.ts`
- Create: `src/lib/payroll/attendance-inputs.test.ts`
- Modify: `src/lib/payroll/collect-inputs.ts`
- Modify: `src/lib/payroll/service.ts` only if workspace metadata needs consumption status.

**Interfaces:**
- Produces `collectAttendanceExportInputs(client, { runId, companyId, start, end, actorId })`.
- Generates deterministic idempotency keys `attendance-export:<exportId>:<attendanceRecordId>:<component>:<runId>`.

- [ ] **Step 1: Write RED tests** for ready-export selection, regular/overtime materialization, company/date scope, and repeat collection idempotency.
- [ ] **Step 2: Implement export materialization into `hr_payroll_inputs`** before the generic ready-input attachment step.
- [ ] **Step 3: Ensure a second `collect_inputs` call does not duplicate inputs.**
- [ ] **Step 4: Surface ready/consumed state consistently in Payroll overview.**
- [ ] **Step 5: Run payroll tests and commit.**

### Task 10: End-to-end regression gates and CI

**Files:**
- Create/Modify focused tests under `e2e/` for Time journeys.
- Modify: `.github/workflows/quality.yml` only to add focused Time regression commands if not already covered by the full suite.

- [ ] **Step 1: Add browser/API journeys** for correction preservation, shift swap, OT return/resubmit, timesheet edit, roster copy/publish, reports routing, and attendance→Payroll collection.
- [ ] **Step 2: Run** `npm run type-check`, `npm run lint`, `npm run test:run`, `npm run build`, `npm run test:e2e -- --project=chromium`.
- [ ] **Step 3: Run existing schema/migration/drift and production container gates.**
- [ ] **Step 4: Update PR description with exact completed flows and any intentionally deferred non-goals.**
- [ ] **Step 5: Remove any temporary codemod/workflow tooling and commit the clean final head.**
