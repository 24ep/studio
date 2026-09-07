# Hrive Large Module Refactor Design

Date: 2026-08-23
Branch: `refactor/hrive-large-modules`
Base: `dev`

## Goal

Reduce Hrive architecture debt caused by oversized client components and service modules without changing product behavior, routes, API contracts, permissions, or persisted data formats.

The refactor targets the current production Hrive runtime in `poojaroonwit/studio` and focuses on the modules already identified by the architecture audit.

## Scope

### Priority 1 — Learning

Current hotspot: `src/app/learning/LearningPageClient.tsx` (~6.7k lines).

Split by domain responsibility rather than arbitrary line count:

- `features/learning/overview`
- `features/learning/courses`
- `features/learning/paths`
- `features/learning/onboarding`
- `features/learning/certificates`
- `features/learning/trusted-certificates`
- `features/learning/assignments`
- shared learning hooks/model/api adapters

The route/client entry remains stable and becomes an orchestration shell.

### Priority 2 — Payroll

Current hotspots:

- `src/components/payroll/PayrollWorkspace.tsx` (~5.1k lines)
- `src/lib/payroll/service.ts` (~2.8k lines)
- large Benefits / Compensation workspaces

Split UI into:

- payroll runs
- periods
- approvals
- adjustments
- payslips
- reports

Move parsing, normalization, approval workflow rules, and mapping out of client UI into typed payroll domain modules. Preserve the already-extracted CSV export helper and avoid reintroducing duplicate export logic.

### Priority 3 — Employee Profile

Current hotspot: `src/components/hr/HrEmployeeProfilePage.tsx` (~4.3k lines).

Split into:

- profile query/state hook
- profile header/navigation
- employment section
- account/access section
- profile edit flow
- domain-specific tab sections
- typed employee form/model adapters

The existing `/people/[id]` route remains unchanged.

### Priority 4 — Leave and Shift/Attendance

Leave:

- split `LeaveAllocationGuidedFlow.tsx`
- isolate draft persistence, form state, validation, allocation rules, and UI steps

Shift/Attendance:

- retain the existing small `ShiftAttendanceWorkspace`
- decompose large `TimesheetCommandCenter`, `OvertimeView`, and `RosterView`
- extract reusable request/table/filter/state logic where behavior is duplicated

### Priority 5 — Remaining Architecture Debt

Address remaining large files from `scripts/frontend-line-budget-baseline.json` only where a clean responsibility boundary is available. Do not split files merely to satisfy a line-count target.

## Repository Cleanup

- Remove confirmed temporary source artifacts such as `temp_head.txt` after verifying no build/script reference exists.
- Optimize the oversized `src/app/icon.png` without changing branding.
- Add or extend repository hygiene checks to reject temporary source artifacts (`temp_*`, `*.bak`, `*.old`) in production source/root paths.

## Architecture Rules

1. Route files remain thin.
2. Client components should primarily orchestrate rendering and interaction, not parse domain payloads.
3. Business rules, normalization, schemas, and mappers live in domain/lib modules.
4. Hooks own client-side fetching/state coordination where appropriate.
5. Components should have one clear product responsibility.
6. Public imports should use stable barrel/module boundaries where helpful, but avoid unnecessary index-file indirection.
7. No API contract, URL, permission ID, persisted draft shape, or database behavior changes as part of this refactor.
8. Avoid new abstraction layers unless at least two consumers or a clear domain boundary justify them.

## Quality Gates

The refactor is behavior-preserving. Each extraction must pass existing tests plus targeted regression coverage before the next hotspot is changed.

Required gates:

- `npm run check:architecture`
- `npm run type-check`
- `npm run lint:strict`
- `npm run test:run`
- `npm run build`

CI should be updated to run `lint:strict` instead of the warning-suppressing `lint` command once existing warning debt introduced by touched files is resolved.

For refactored modules, add focused characterization/regression tests around:

- routing/view selection
- parsing and normalization
- permission-dependent actions
- form state and mutation payloads
- payroll approval workflow logic
- learning view/dialog selection
- leave draft restoration/persistence
- shift/attendance filtering and mutation actions

## Incremental Delivery Strategy

Implement in this order:

1. Repository hygiene and quality-gate adjustments that are independent of UI behavior.
2. Learning decomposition.
3. Payroll UI/domain decomposition.
4. Employee Profile decomposition.
5. Leave allocation decomposition.
6. Shift/Attendance subview decomposition.
7. Review remaining architecture-baseline exceptions and shrink/remove obsolete exceptions.

Each stage should be independently reviewable and should leave the application buildable.

## Success Criteria

- No product behavior regressions.
- Oversized orchestration components are reduced to focused shells.
- Extracted domain logic is typed and independently testable.
- Architecture baseline entries are removed or meaningfully reduced for completed modules.
- `lint:strict` is used by CI.
- No temporary copied source files remain in the repository.
- Existing routes, API payloads, permissions, and persisted user data continue to work unchanged.

## Explicit Non-Goals

- No visual redesign.
- No new HRIS features.
- No API redesign.
- No database schema migration.
- No permission-model rewrite.
- No framework migration.
- No broad dependency upgrade unless required to make the refactor compile.
