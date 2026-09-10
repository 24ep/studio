# Shift & Attendance

## Current-state assessment

Before this implementation, the Shift navigation already exposed the required seven destinations, but ownership and implementation were incomplete:

| Destination | Previous state | Existing foundation retained |
| --- | --- | --- |
| Roster | Thin `ShiftAssignment` CRUD view | Employee master data, work schedules, Leave conflicts |
| Employee Attendance Tool | Client-derived summary table with synthetic team labels | Attendance records and workforce permissions |
| Employee Check-in | Functional self-service clock, break, and checkout actions | Self-access, server timestamps, optimistic versioning |
| Shift Request | Coming-soon page under Leave | Employee/manager hierarchy and notification service |
| Attendance Request | Coming-soon page | Generic ESS request, approval step, activity, and authoritative correction application |
| Overtime | Coming-soon page | Attendance evidence and Payroll boundary |
| Timesheet | Coming-soon page | Employee hierarchy and approval conventions |

Employee, Department, company isolation, Leave, Holiday, Payroll, ESS request, Notification, and Audit systems already existed and remain authoritative. The application uses Next.js App Router, PostgreSQL, Prisma migrations with raw SQL services, Zod contracts, module permissions, Tailwind design tokens, Vitest, ESLint, and TypeScript.

The previous attendance administration page derived employee teams from ID characters, calculated exception labels in the browser, and exported data without a dedicated export audit entity. Those synthetic derivations were removed from the active route. The previous employee clock did not persist an immutable event timeline or idempotency key.

## Gap analysis addressed

- Added versioned shift definitions and expanded work-schedule patterns.
- Added roster periods, open shifts, publication state, conflict checks, and immutable assignment history.
- Added immutable attendance events with per-employee idempotency keys.
- Added a deterministic, versioned server calculation engine with input/output snapshots and explanations.
- Added attendance exceptions, record review state, close/reopen periods, and Payroll staging exports.
- Added shift requests and swaps that do not mutate the roster before acceptance and approval.
- Reused ESS attendance-correction approval and authoritative record application.
- Added overtime requested/approved/actual/confirmed tracking without final salary calculation.
- Added weekly timesheets and entries that remain separate from attendance.
- Added responsive desktop tables/calendars and mobile cards/agendas.
- Added company, manager, self, module, action, record, period, and Payroll-export authorization checks.
- Added realistic workforce seed data and calculation tests.

## Information architecture and ownership

The existing sidebar is unchanged:

1. **Roster** — planning, validation, coverage, assignment, publication, and change history.
2. **Employee Attendance Tool** — daily operational review, exceptions, recalculation, period control, and authorized export.
3. **Employee Check-in** — one employee’s current shift, next valid clock action, work status, and timeline.
4. **Shift Request** — shift changes, swaps, open shifts, availability, rest days, and work-location changes.
5. **Attendance Request** — missing/incorrect event regularization and approval.
6. **Overtime** — request, approval, actual comparison, confirmation, and downstream approved minutes.
7. **Timesheet** — project/task allocation and approval, separate from presence.

Leave remains authoritative for leave policies, requests, balances, holidays, and approval. Payroll remains authoritative for salary, deductions, rates, and payment. Employee remains authoritative for identity and organizational assignment. ESS surfaces summaries and deep-links to Shift detail.

## Statuses

- Roster: `draft`, `ready_for_review`, `published`, `partially_published`, `changed`, `locked`, `archived`
- Attendance: `not_scheduled`, `scheduled`, `present`, `late`, `absent`, `on_leave`, `working_remotely`, `off_site`, `on_break`, `checked_out`, `missing_record`, `exception`
- Request: `draft`, `submitted`, `pending_approval`, `awaiting_employee`, `returned_for_revision`, `approved`, `rejected`, `withdrawn`, `cancelled`, `applied`
- Timesheet: `draft`, `submitted`, `pending_approval`, `returned`, `approved`, `rejected`, `locked`
- Attendance period: `open`, `under_review`, `exceptions_pending`, `ready_to_close`, `closed`, `exported_to_payroll`, `reopened`

All UI status indicators include text and an icon; color is not the only signal.

## Authorization model

The backend enforces:

- `HR_WORKFORCE_VIEW` for operational roster, attendance, and reporting access.
- `HR_WORKFORCE_MANAGE` for roster mutation, attendance review/recalculation, and period control.
- `HR_PAYROLL_MANAGE` in addition to workforce management for Payroll staging export.
- Self-only creation and draft modification for employee shift, overtime, and timesheet records.
- Manager access only to direct reports unless broader workforce permission is granted.
- Company isolation for non-admin workforce users.
- Optimistic version checks for decisions, period transitions, review actions, and draft deletion.
- Closed/locked status checks before mutation.

The existing permission catalog remains backward-compatible. Roster-planner, attendance-administrator, HR, project-manager, and timesheet-approver roles should be configured by assigning the appropriate existing module permissions and manager relationships. More granular permission IDs can be introduced later without weakening current backend enforcement.

## Attendance calculation

`calculateAttendance` is a pure, deterministic server function. It accepts absolute scheduled and recorded timestamps, logical date, Leave/Holiday state, tolerances, breaks, approved overtime, and location context. It emits minutes, status, exception codes, explanations, and a calculation version.

Each controlled recalculation:

1. Loads the published shift, attendance events/record, approved Leave, Holiday, and approved overtime.
2. Calculates on the server.
3. Marks the previous calculation snapshot non-current.
4. Persists the new input and output snapshots.
5. Replaces open system exceptions.
6. Updates the authoritative attendance record in one transaction.

Overnight shifts are resolved by treating an end time at or before the start time as the following calendar day while preserving the logical shift date. Authoritative timestamps are stored as timezone-aware PostgreSQL timestamps. The initial default policy timezone is `Asia/Bangkok`.

## API

`GET /api/hr/shift-attendance?view=<view>` returns real data and server-derived capabilities. Supported views are `roster`, `attendance`, `requests`, `overtime`, `timesheet`, and `reports`.

`POST /api/hr/shift-attendance` accepts a Zod-discriminated action contract for:

- assignment creation and roster publication;
- attendance recalculation/review and attendance-period transitions;
- shift request creation/decision;
- overtime creation/approval/actual confirmation;
- timesheet entry save/delete, submission, and decision.

`POST /api/ess/attendance` remains the employee clock endpoint. It uses server time, self-record resolution, an idempotency key, state validation, immutable event creation, and optimistic record updates.

`POST/PATCH /api/ess/requests` remains the shared attendance-correction workflow. Approval updates the authoritative attendance record rather than a disconnected request copy.

## Setup and migration

1. Back up the database using the project’s normal deployment procedure.
2. Apply migrations:

   ```powershell
   npm run migrate:force
   ```

3. Generate the Prisma client if the deployment does not do so automatically:

   ```powershell
   npx prisma generate
   ```

4. Seed the existing HR foundation, then Shift data:

   ```powershell
   npm run seed:hr
   npm run seed:shift
   ```

5. Verify:

   ```powershell
   npm run type-check
   npm run lint
   npm run test:run
   npm run build
   ```

The migration is additive and backfills absolute start/end timestamps for existing assignments. It does not rewrite historical shift definitions or Attendance records retroactively.

## Assumptions

- PostgreSQL and `gen_random_uuid()` are available, matching existing migrations.
- `Asia/Bangkok` is the initial company policy timezone; existing schedule timezone values remain available for future per-location conversion.
- Existing module permissions are the backward-compatible authorization surface for this release.
- Existing employee manager and company fields are populated for manager/company scoping.
- Notification email delivery continues to consume the existing email-ready notification events.
- Project and cost-center values are stored as controlled text in this schema because no canonical Project/CostCenter models exist in the current repository.

## Remaining external dependencies

- Configure geofence centers/radii, approved networks, and trusted device enrollment per work location before enforcing location rejection.
- Connect email delivery/reminder scheduling for Shift notification event types.
- Map Payroll staging exports to the target Payroll provider’s contract.
- Map Project and Cost Center text values to canonical IDs when those master-data modules are introduced.
- Configure role-to-permission assignments for roster planners, attendance administrators, project managers, and timesheet approvers.
- Add browser end-to-end coverage to the deployment environment after its authenticated test-user and database fixtures are available.
