# Payroll Code Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce unnecessary complexity in the live Payroll UI without changing payroll API, database, authorization, workflow, or financial behavior.

**Architecture:** Keep the server-side payroll contracts and routes unchanged. First establish reusable client export behavior and a regression test, then migrate the two live export surfaces to it. Treat `PayrollWorkspace.tsx` as legacy migration work: remove only responsibilities that have a proven dedicated replacement, and do not rewrite the active payroll-run workflow without executable coverage.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest, Playwright, GitHub Actions.

**Spec:** This plan implements the August 19, 2026 Payroll/Pay code-quality audit and cleanup request.

## Global Constraints

- Preserve existing Payroll API paths and request/response contracts.
- Preserve authorization and company scoping.
- Preserve server-side audit logging for payroll exports.
- Do not introduce database migrations.
- Do not replace explicit payroll workflow states with client-only state.
- Prefer deletion and focused helpers over new abstraction layers.

---

### Task 1: Consolidate controlled CSV export behavior

**Files:**
- Create: `src/lib/payroll/client-export.ts`
- Create: `src/lib/payroll/client-export.test.ts`
- Modify: `src/components/payroll/PayrollReportsWorkspace.tsx`
- Modify: `src/components/payroll/PayrollRunsWorkspace.tsx`

**Interfaces:**
- Produces: `downloadControlledPayrollExport(url, fallbackFilename): Promise<string>`
- Produces: `payrollExportFilename(contentDisposition, fallbackFilename): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { payrollExportFilename } from "./client-export";

describe("payrollExportFilename", () => {
  it("uses the server-provided attachment filename", () => {
    expect(
      payrollExportFilename(
        'attachment; filename="payroll-register-2026-08.csv"',
        "payroll-register.csv",
      ),
    ).toBe("payroll-register-2026-08.csv");
  });

  it("falls back when Content-Disposition does not contain a filename", () => {
    expect(payrollExportFilename("inline", "payroll-register.csv")).toBe(
      "payroll-register.csv",
    );
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:run -- src/lib/payroll/client-export.test.ts`

Expected: FAIL because `client-export.ts` does not exist yet.

- [ ] **Step 3: Add the minimal shared export helper**

The helper must fetch with `credentials: "include"` and `cache: "no-store"`, surface the API error message when available, create/revoke the object URL exactly once, click a temporary anchor, and return the downloaded filename. It must not own toast/UI state.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test:run -- src/lib/payroll/client-export.test.ts`

Expected: PASS.

- [ ] **Step 5: Replace duplicate export implementations**

Use the helper from both Reports and Runs. Keep each component responsible only for busy state and localized/toast feedback.

- [ ] **Step 6: Run TypeScript, lint, and focused tests**

Run: `npm run type-check && npm run lint && npm run test:run -- src/lib/payroll/client-export.test.ts`

Expected: PASS.

### Task 2: Reduce the Runs compatibility bridge risk

**Files:**
- Modify: `src/components/payroll/PayrollRunsWorkspace.tsx`

**Interfaces:**
- Keeps: `PayrollRunsWorkspace()` public component.
- Keeps: `/api/payroll/v1/reports/register` as the controlled export endpoint.

- [ ] **Step 1: Characterize the compatibility behavior**

Add a focused unit test only if the existing test environment supports a DOM component test without new dependencies. The behavior to preserve is: only the legacy Payroll Runs register export is intercepted; unrelated buttons pass through.

- [ ] **Step 2: Simplify the wrapper**

Remove duplicate download parsing/fetch/blob code after Task 1. Keep the bridge isolated and documented as temporary until `RunsView` can be extracted from `PayrollWorkspace.tsx` with full browser lifecycle coverage.

- [ ] **Step 3: Verify**

Run: `npm run check`.

Expected: PASS.

### Task 3: Establish the safe boundary for the 211 KB legacy workspace

**Files:**
- Audit: `src/components/payroll/PayrollWorkspace.tsx`
- Audit: `src/app/payroll/**/page.tsx`
- Modify only when a branch is provably unused by live routes.

- [ ] **Step 1: Inventory live resource ownership**

Confirm dedicated route ownership for Reports, Benefits, Compensation, Runs, Overview, and Payslips.

- [ ] **Step 2: Delete only dead legacy branches that have dedicated replacements**

Before deletion, prove the branch/component has no import/call site outside `PayrollWorkspace.tsx`. Do not move active Runs/Payslips workflow UI merely to satisfy a line-count target.

- [ ] **Step 3: Verify production behavior**

Run: `npm run check` and `npm run build`.

Expected: PASS.

### Task 4: Final production-quality review

**Files:**
- Review all branch changes.

- [ ] **Step 1: Compare branch with `dev`**

Check for accidental API/schema/permission changes and excessive churn.

- [ ] **Step 2: Run repository quality workflow**

The existing `.github/workflows/quality.yml` must pass application, database-schema, browser-smoke, container-build, and payroll-production-gate lanes on the pull request.

- [ ] **Step 3: Review the PR diff**

Reject the cleanup if it increases behavioral coupling, introduces client-only payroll truth, or hides workflow actions behind implicit behavior.
