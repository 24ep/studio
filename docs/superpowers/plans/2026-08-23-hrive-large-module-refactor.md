# Hrive Large Module Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Hrive architecture debt by decomposing the identified oversized modules into focused, testable units without changing product behavior, routes, API contracts, permissions, or persisted data formats.

**Architecture:** Refactor incrementally. First harden repository hygiene and CI, then extract pure domain helpers and state coordination from the largest client modules, and finally split view-specific UI into focused components. Existing route entry points remain stable and delegate to the extracted modules.

**Tech Stack:** Next.js, React, TypeScript, Vitest, ESLint, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-23-hrive-large-module-refactor-design.md`

## Global Constraints

- No visual redesign.
- No new HRIS features.
- No API redesign.
- No database schema migration.
- No permission-model rewrite.
- No framework migration.
- No broad dependency upgrade unless required to make the refactor compile.
- Preserve existing routes, API payloads, permissions, and persisted user data.
- Split by product/domain responsibility, not arbitrary line count.
- Every extraction must pass existing tests plus targeted regression coverage before the next hotspot is changed.

---

### Task 1: Repository hygiene and strict CI

**Files:**
- Delete: `temp_head.txt`
- Modify: `scripts/check-frontend-architecture.mjs`
- Modify: `.github/workflows/quality.yml`
- Test: `scripts/frontend-architecture-regression-checks.cjs`

**Interfaces:**
- Consumes: repository root and `src` file tree.
- Produces: architecture failure for forbidden temporary artifacts and CI enforcement via `npm run lint:strict`.

- [ ] **Step 1: Add a failing repository-hygiene regression test**

Create assertions in `scripts/frontend-architecture-regression-checks.cjs` that read `scripts/check-frontend-architecture.mjs` and require explicit detection of `temp_*`, `*.bak`, and `*.old` artifacts in repository root/source paths.

```js
const architectureSource = fs.readFileSync(
  path.join(root, "scripts/check-frontend-architecture.mjs"),
  "utf8",
);
assert(/temp_/.test(architectureSource), "architecture check must reject temp_* artifacts");
assert(/\\.bak/.test(architectureSource), "architecture check must reject *.bak artifacts");
assert(/\\.old/.test(architectureSource), "architecture check must reject *.old artifacts");
```

- [ ] **Step 2: Run the regression check and verify it fails**

Run: `node scripts/frontend-architecture-regression-checks.cjs`

Expected: FAIL because temporary-artifact detection is not present yet.

- [ ] **Step 3: Add repository-artifact detection**

Extend `scripts/check-frontend-architecture.mjs` to inspect the repository root and source tree and add failures for filenames matching:

```js
const forbiddenArtifactPattern = /^(?:temp_.*|.*\.(?:bak|old))$/i;
```

Only regular files are considered; dependency/build directories are not traversed by this check.

- [ ] **Step 4: Delete the confirmed temporary payroll source copy**

Delete `temp_head.txt` after confirming repository search returns no reference.

- [ ] **Step 5: Tighten CI linting**

Change the application quality job in `.github/workflows/quality.yml` from:

```yaml
- run: npm run lint
```

to:

```yaml
- run: npm run lint:strict
```

Do not alter the local `lint` command; `lint:strict` remains the explicit zero-warning gate.

- [ ] **Step 6: Run foundation gates**

Run:

```bash
node scripts/frontend-architecture-regression-checks.cjs
npm run check:architecture
npm run type-check
npm run lint:strict
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-frontend-architecture.mjs scripts/frontend-architecture-regression-checks.cjs .github/workflows/quality.yml temp_head.txt
git commit -m "chore: harden frontend architecture hygiene"
```

---

### Task 2: Learning domain helper extraction

**Files:**
- Create: `src/lib/learning/record-utils.ts`
- Create: `src/lib/learning/record-utils.test.ts`
- Modify: `src/app/learning/LearningPageClient.tsx`

**Interfaces:**
- Consumes: `unknown`, `Record<string, unknown>`, learning API response-like payloads.
- Produces: pure helpers `displayLearningValue`, `learningNumberValue`, `learningBooleanValue`, `learningRecordValue`, `learningStringArrayValue`, `learningRecordsFromResponse`, `normalizeLearningStatus`, `isTrustedLearningCertificate`, `formatLearningDate`, `learningDaysUntil`, `learningCourseColor`, `withoutEmptyLearningValues`.

- [ ] **Step 1: Write failing pure-helper tests**

```ts
import { describe, expect, it, vi } from "vitest";
import {
  learningBooleanValue,
  learningRecordsFromResponse,
  learningStringArrayValue,
  normalizeLearningStatus,
  withoutEmptyLearningValues,
} from "./record-utils";

describe("learning record utils", () => {
  it("normalizes booleans from API-compatible values", () => {
    expect(learningBooleanValue("true")).toBe(true);
    expect(learningBooleanValue(1)).toBe(true);
    expect(learningBooleanValue(false)).toBe(false);
  });

  it("reads records from resource or root payload", () => {
    expect(learningRecordsFromResponse({ resource: { records: [{ id: "a" }] } })).toEqual([{ id: "a" }]);
    expect(learningRecordsFromResponse({ records: [{ id: "b" }] })).toEqual([{ id: "b" }]);
  });

  it("parses string arrays defensively", () => {
    expect(learningStringArrayValue('["a","b"]')).toEqual(["a", "b"]);
    expect(learningStringArrayValue("invalid")).toEqual([]);
  });

  it("normalizes empty status to active", () => {
    expect(normalizeLearningStatus(undefined)).toBe("active");
  });

  it("removes only empty-string form values", () => {
    expect(withoutEmptyLearningValues({ name: "A", note: "", active: false })).toEqual({ name: "A", active: false });
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run src/lib/learning/record-utils.test.ts`

Expected: FAIL because `record-utils.ts` does not exist.

- [ ] **Step 3: Implement pure helpers without React or route imports**

`src/lib/learning/record-utils.ts` must depend only on standard JavaScript APIs and types declared within the module. It must not import from `@/app/**`.

- [ ] **Step 4: Replace local helper implementations in `LearningPageClient.tsx` with imports**

Preserve behavior exactly. Keep `LearningView`, route-facing props, and network calls unchanged in this step.

- [ ] **Step 5: Run focused tests and type checking**

Run:

```bash
npx vitest run src/lib/learning/record-utils.test.ts
npm run type-check
npm run check:architecture
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/learning/record-utils.ts src/lib/learning/record-utils.test.ts src/app/learning/LearningPageClient.tsx
git commit -m "refactor: extract learning record helpers"
```

---

### Task 3: Learning workspace decomposition

**Files:**
- Create: `src/app/learning/components/LearningOverviewView.tsx`
- Create: `src/app/learning/components/LearningCoursesView.tsx`
- Create: `src/app/learning/components/LearningPathsView.tsx`
- Create: `src/app/learning/components/LearningAchievementsView.tsx`
- Create: `src/app/learning/components/LearningCertificatesView.tsx`
- Create: `src/app/learning/components/LearningOnboardingView.tsx`
- Create: `src/app/learning/hooks/useLearningWorkspace.ts`
- Create: `src/app/learning/hooks/useLearningWorkspace.test.ts`
- Modify: `src/app/learning/LearningPageClient.tsx`
- Modify: `scripts/frontend-line-budget-baseline.json`

**Interfaces:**
- Consumes: existing `LearningView` and existing learning endpoints.
- Produces: `useLearningWorkspace(view)` state/actions contract and view components receiving typed props from the workspace shell.

- [ ] **Step 1: Add characterization tests for view-specific loading**

Mock `global.fetch` and verify:

```ts
expect(fetch).toHaveBeenCalledWith("/api/hr/learning?view=certifications", expect.any(Object));
```

for certificate views, and verify onboarding loads `/api/hr/onboarding`, `?view=templates`, and `?view=tasks`.

- [ ] **Step 2: Verify the tests fail before the hook exists**

Run: `npx vitest run src/app/learning/hooks/useLearningWorkspace.test.ts`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Move fetch/state orchestration into `useLearningWorkspace`**

The hook owns current loading/error/save state and existing API mutation callbacks. Preserve request URLs, credentials, cache options, payload shapes, and error copy.

- [ ] **Step 4: Extract view components one responsibility at a time**

Move existing JSX without redesign. The shell chooses a component by `view`; each extracted component receives data/actions rather than performing duplicate fetches.

- [ ] **Step 5: Keep existing specialized components intact**

Continue using `AiLearningBuilderDialog`, `CareerExplorer`, and `TrustedCertificatesWorkspace`; do not duplicate them.

- [ ] **Step 6: Reduce/remove Learning architecture baseline exception**

After the shell falls below the default 500-line component budget, remove its entry from `scripts/frontend-line-budget-baseline.json`. If an extracted view still exceeds 500 lines, split it by a real domain boundary before adding a new exception.

- [ ] **Step 7: Run learning and full frontend gates**

```bash
npx vitest run src/app/learning/hooks/useLearningWorkspace.test.ts src/lib/learning/record-utils.test.ts
npm run check:architecture
npm run type-check
npm run lint:strict
npm run test:run
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/learning src/lib/learning scripts/frontend-line-budget-baseline.json
git commit -m "refactor: decompose learning workspace"
```

---

### Task 4: Payroll domain and workspace decomposition

**Files:**
- Create: `src/lib/payroll/workspace-model.ts`
- Create: `src/lib/payroll/workspace-model.test.ts`
- Create: `src/components/payroll/workspace/PayrollRunsView.tsx`
- Create: `src/components/payroll/workspace/PayrollApprovalsView.tsx`
- Create: `src/components/payroll/workspace/PayrollPeriodsView.tsx`
- Create: `src/components/payroll/workspace/PayrollAdjustmentsView.tsx`
- Create: `src/components/payroll/workspace/PayrollReportsView.tsx`
- Modify: `src/components/payroll/PayrollWorkspace.tsx`
- Modify: `src/lib/payroll/service.ts`
- Modify: `scripts/frontend-line-budget-baseline.json`

**Interfaces:**
- Consumes: existing payroll period/run/approval payloads.
- Produces: typed `PayrollApprovalStep`, `parsePayrollApprovalSteps(raw)`, `payrollPeriodIsRunnable(period)`, and focused payroll view components.

- [ ] **Step 1: Write tests around existing payroll workflow rules**

Cover JSON approval-step parsing, invalid JSON fallback, runnable-period states, and approval status normalization.

```ts
expect(parsePayrollApprovalSteps('[{"id":"hr","status":"pending"}]')).toEqual([
  expect.objectContaining({ id: "hr", status: "pending" }),
]);
expect(parsePayrollApprovalSteps("not-json")).toEqual([]);
```

- [ ] **Step 2: Verify focused tests fail before extraction**

Run: `npx vitest run src/lib/payroll/workspace-model.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Move pure parsing/workflow rules out of `PayrollWorkspace.tsx`**

Do not change CSV export behavior; continue using `src/lib/payroll/client-export.ts`.

- [ ] **Step 4: Split workspace rendering by payroll responsibility**

`PayrollWorkspace.tsx` retains shared state/orchestration and renders focused views for runs, approvals, periods, adjustments, and reports.

- [ ] **Step 5: Split `src/lib/payroll/service.ts` only at stable domain boundaries**

Move reporting/mapping/query helpers into sibling `src/lib/payroll/*` modules while keeping the existing service exports stable through re-exports where required by consumers.

- [ ] **Step 6: Shrink baseline exceptions**

Remove `PayrollWorkspace.tsx` and `service.ts` exceptions when they satisfy 500/750-line defaults. Do not introduce replacement exceptions for newly split files.

- [ ] **Step 7: Run payroll regression gates**

```bash
npx vitest run src/lib/payroll/workspace-model.test.ts
npm run test:billing
npm run check:architecture
npm run type-check
npm run lint:strict
npm run test:run
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/payroll src/lib/payroll scripts/frontend-line-budget-baseline.json
git commit -m "refactor: decompose payroll workspace"
```

---

### Task 5: Employee Profile decomposition

**Files:**
- Create: `src/components/hr/employee-profile/employee-profile-model.ts`
- Create: `src/components/hr/employee-profile/employee-profile-model.test.ts`
- Create: `src/components/hr/employee-profile/useEmployeeProfile.ts`
- Create: `src/components/hr/employee-profile/EmployeeProfileHeader.tsx`
- Create: `src/components/hr/employee-profile/EmployeeProfileNavigation.tsx`
- Create: `src/components/hr/employee-profile/EmployeeEmploymentSection.tsx`
- Create: `src/components/hr/employee-profile/EmployeeAccountSection.tsx`
- Create: `src/components/hr/employee-profile/EmployeeEditDialog.tsx`
- Modify: `src/components/hr/HrEmployeeProfilePage.tsx`
- Modify: `scripts/frontend-line-budget-baseline.json`

**Interfaces:**
- Consumes: existing `/api/hr/employees?id=...` response and current session permissions.
- Produces: `useEmployeeProfile(employeeId)` plus pure employee form/value adapters.

- [ ] **Step 1: Characterize employee value/form mapping**

Tests cover null/boolean/date display, safe URL normalization, JSON-backed form fields, and edit payload mapping using the current field names.

- [ ] **Step 2: Verify tests fail before extraction**

Run: `npx vitest run src/components/hr/employee-profile/employee-profile-model.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Extract pure model helpers**

No React, fetch, session, or route dependencies are allowed in `employee-profile-model.ts`.

- [ ] **Step 4: Extract fetch/state coordination to `useEmployeeProfile`**

Preserve AbortController cleanup, credentials, current error handling, and refetch behavior.

- [ ] **Step 5: Split presentation by profile responsibility**

Move existing JSX without visual changes into header/navigation/employment/account/edit components. Keep `/people/[id]` unchanged.

- [ ] **Step 6: Remove the old architecture exception after shell reduction**

The shell should orchestrate state, permissions, tabs, and extracted components rather than contain full section implementations.

- [ ] **Step 7: Run profile/full gates**

```bash
npx vitest run src/components/hr/employee-profile/employee-profile-model.test.ts
npm run check:architecture
npm run type-check
npm run lint:strict
npm run test:run
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/hr/HrEmployeeProfilePage.tsx src/components/hr/employee-profile scripts/frontend-line-budget-baseline.json
git commit -m "refactor: decompose employee profile"
```

---

### Task 6: Leave Allocation decomposition

**Files:**
- Create: `src/components/leaves/allocation/leave-allocation-draft.ts`
- Create: `src/components/leaves/allocation/leave-allocation-draft.test.ts`
- Create: `src/components/leaves/allocation/useLeaveAllocationFlow.ts`
- Create: `src/components/leaves/allocation/AllocationScopeStep.tsx`
- Create: `src/components/leaves/allocation/AllocationRulesStep.tsx`
- Create: `src/components/leaves/allocation/AllocationReviewStep.tsx`
- Modify: `src/components/leaves/LeaveAllocationGuidedFlow.tsx`
- Modify: `scripts/frontend-line-budget-baseline.json`

**Interfaces:**
- Consumes: current persisted draft shape and existing leave allocation mutation endpoints.
- Produces: draft serializer/parser helpers and a flow hook preserving current state transitions.

- [ ] **Step 1: Add persisted-draft characterization tests**

Cover valid draft restore, malformed JSON fallback, version/shape tolerance currently supported, and empty storage behavior.

- [ ] **Step 2: Verify tests fail before extraction**

Run: `npx vitest run src/components/leaves/allocation/leave-allocation-draft.test.ts`

Expected: FAIL because the draft module does not exist.

- [ ] **Step 3: Move storage serialization/parsing into the draft module**

Keep the same storage key and persisted field names.

- [ ] **Step 4: Move wizard state/actions into `useLeaveAllocationFlow`**

The hook coordinates step changes, validation, draft sync, and existing mutation actions.

- [ ] **Step 5: Split wizard JSX into scope/rules/review steps**

No UX redesign; labels, defaults, validation copy, and action order stay unchanged.

- [ ] **Step 6: Remove/reduce baseline exception and run gates**

```bash
npx vitest run src/components/leaves/allocation/leave-allocation-draft.test.ts
npm run check:architecture
npm run type-check
npm run lint:strict
npm run test:run
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/leaves scripts/frontend-line-budget-baseline.json
git commit -m "refactor: decompose leave allocation flow"
```

---

### Task 7: Shift and Attendance large-view decomposition

**Files:**
- Create: `src/components/shift/timesheet/timesheet-model.ts`
- Create: `src/components/shift/timesheet/timesheet-model.test.ts`
- Create: `src/components/shift/overtime/overtime-model.ts`
- Create: `src/components/shift/overtime/overtime-model.test.ts`
- Create: `src/components/shift/roster/roster-model.ts`
- Create: `src/components/shift/roster/roster-model.test.ts`
- Create focused subcomponents under the same three directories.
- Modify: `src/components/shift/views/TimesheetCommandCenter.tsx`
- Modify: `src/components/shift/views/OvertimeView.tsx`
- Modify: `src/components/shift/views/RosterView.tsx`
- Modify: `scripts/frontend-line-budget-baseline.json`

**Interfaces:**
- Consumes: existing shift/attendance service contracts and view props.
- Produces: pure filter/sort/status/view-model helpers plus smaller view shells.

- [ ] **Step 1: Characterize current filtering/sorting/status behavior**

Add pure tests using representative shift/timesheet/overtime records and assert current visible-row ordering and status classification.

- [ ] **Step 2: Verify tests fail before model extraction**

Run:

```bash
npx vitest run src/components/shift/timesheet/timesheet-model.test.ts src/components/shift/overtime/overtime-model.test.ts src/components/shift/roster/roster-model.test.ts
```

Expected: FAIL because the model files do not exist.

- [ ] **Step 3: Extract pure view models**

Model files must not import React or route modules.

- [ ] **Step 4: Split each large view by visible responsibility**

Examples of valid boundaries are summary/header, filters, table/list, request/review drawer, and mutation dialog when those sections already exist in the source. Reuse current primitives instead of creating a second design system.

- [ ] **Step 5: Keep `ShiftAttendanceWorkspace` as the existing thin outer shell**

Do not move view-specific behavior back into the workspace.

- [ ] **Step 6: Remove/reduce baseline exceptions and run gates**

```bash
npx vitest run src/components/shift/timesheet/timesheet-model.test.ts src/components/shift/overtime/overtime-model.test.ts src/components/shift/roster/roster-model.test.ts
npm run check:architecture
npm run type-check
npm run lint:strict
npm run test:run
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/shift scripts/frontend-line-budget-baseline.json
git commit -m "refactor: decompose shift attendance views"
```

---

### Task 8: Baseline reconciliation and complete verification

**Files:**
- Modify: `scripts/frontend-line-budget-baseline.json`
- Modify only if needed: remaining touched oversized files identified during Tasks 2-7.

**Interfaces:**
- Consumes: final refactored tree.
- Produces: an architecture baseline containing only genuinely remaining grandfathered debt.

- [ ] **Step 1: Run architecture check and record remaining grandfathered files**

Run: `npm run check:architecture`

Expected: PASS, with fewer grandfathered files and fewer excess lines than the original baseline.

- [ ] **Step 2: Remove stale baseline entries**

Any refactored file now below its default budget must have its grandfathered entry removed. The checker already fails entries pointing to deleted files.

- [ ] **Step 3: Run complete production gates**

```bash
npm run check:architecture
npm run type-check
npm run lint:strict
npm run test:run
npm run build
```

Expected: all PASS.

- [ ] **Step 4: Review the branch diff for accidental behavior changes**

Confirm no route URLs, API endpoint strings, permission IDs, storage keys, database schemas, or product copy were intentionally changed outside extraction needs.

- [ ] **Step 5: Commit final baseline reconciliation**

```bash
git add scripts/frontend-line-budget-baseline.json
git commit -m "chore: reconcile frontend architecture baseline"
```
