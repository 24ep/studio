# Large-file and code-quality scan

Scanned origin/dev at 4177bd39d on 2026-09-07. Work is isolated on
`codex/large-file-quality` because the original checkout has an interrupted pull.

## Completed refactor

Split `src/lib/payroll/service.ts` from 2,802 lines into a 106-line public
entry point and seven focused implementation modules. Existing callers retain
`getPayrollWorkspace`, `mutatePayroll`, and `PayrollServiceError` imports.

| Module | Responsibility | Lines |
| --- | --- | ---: |
| service.ts | Mutation authorization, dispatch, audit and public exports | 106 |
| workspace-queries.ts | Workspace reads and read authorization | 619 |
| setup-actions.ts | Create runs, periods, groups and assign profiles | 278 |
| run-calculation.ts | Collect inputs and calculate payroll | 542 |
| run-outputs.ts | Generate outputs and reconcile runs | 267 |
| run-actions.ts | Run workflow and transactional state transitions | 660 |
| compensation-actions.ts | Compensation change lifecycle | 155 |
| benefit-actions.ts | Benefit plan and enrollment lifecycle | 200 |

All modules fit the existing 750-line library budget. Removed the old service
budget exemption without adding new exemptions. Architecture debt fell from
28 to 27 grandfathered files and from 28,033 to 25,981 lines above default budgets.
All 21 original function bodies were verified unchanged, ignoring line endings.

## Validation

- Architecture check: passed. One existing ESLint suppression warning remains in
  `HeaderOutbornApplicationLauncher.tsx`.
- Repository-wide quiet ESLint: passed.
- Strict targeted ESLint: passed for the extracted production modules.
- Existing payroll suite: 83 passed, 3 failed in unchanged `file-security.test.ts`.
  The installed `file-type` package does not provide `fileTypeFromBuffer`.
- Seven new service boundary tests passed: view/management/approval permissions,
  company scope, employee identity, concurrent run updates, successful group
  creation and audit events.
- Full TypeScript check: eight errors in unchanged files, involving missing
  `@outborn/account-directory`, consequent typing errors, and the incompatible
  `file-type` export. No errors were reported in the extracted modules.
- No live database or browser end-to-end validation was performed.

The checks used the existing parent checkout's installed dependencies. Resolve
those dependency mismatches before treating the complete repository as green.

## Remaining largest production files

| File | Lines | Suggested next boundary |
| --- | ---: | --- |
| src/components/payroll/PayrollWorkspace.tsx | 4,952 | Overview, run register, payslip views and shared formatting |
| src/components/hr/HrEmployeeProfilePage.tsx | 4,162 | Profile sections, forms and data loading |
| src/components/shift/views/TimesheetCommandCenter.tsx | 1,828 | Filters, timesheet grid and detail actions |
| src/components/shift/views/OvertimeView.tsx | 1,768 | Request form, approval view and history |
| src/lib/hr/shift-attendance-service.ts | 1,738 | Actor resolution, queries and mutations |
| src/components/shift/views/RosterView.tsx | 1,711 | Roster grid, setup and assignment interactions |
| src/components/leaves/LeaveAllocationGuidedFlow.tsx | 1,670 | Flow state and individual steps |
| src/components/company-portal/CompanyPortalEditor.tsx | 1,570 | Editor state and section editors |

These remain existing size debt; this change completes the payroll service split,
not a repository-wide decomposition. Each follow-up should keep public contracts,
transaction boundaries, permissions and user behavior intact.
