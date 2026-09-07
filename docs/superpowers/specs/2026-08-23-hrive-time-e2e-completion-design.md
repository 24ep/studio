# Hrive Time End-to-End Completion Design

## Goal

Make the Hrive Time / Shift & Attendance module production-complete from setup through employee self-service, manager review, roster operations, overtime, timesheets, reporting, notifications, and Payroll ingestion.

## Scope

This change completes existing Time functionality. It does not redesign the module or introduce a new framework. Existing routes, permission IDs, audit conventions, and database tables remain authoritative unless a small additive schema change is required to support a missing lifecycle transition.

## Release blockers addressed

1. Attendance corrections must never erase valid existing attendance values when the employee only changes one field.
2. Every correction type shown in the UI must have a real backend effect, or be removed from the UI. This implementation will support all currently advertised correction types.
3. Shift swap, open-shift, and cover-shift requests must be constructible and approvable using real target assignments/open shifts.
4. Attendance exports marked ready for Payroll must be consumed by Payroll input collection and marked consumed/idempotently linked to a payroll run.
5. Bulk roster publish must notify affected employees instead of displaying a false-success message.

## Architecture

### 1. Attendance correction model

Attendance corrections become explicit patch-style requests. The correction payload carries a `correctionType` and only the fields relevant to that correction. The service loads the current authoritative attendance record and assignment, merges requested changes into existing values, recalculates attendance, regenerates open exceptions, and records a `correction_applied` attendance event.

Supported correction effects:
- `missing_check_in`, `incorrect_check_in`: update only check-in.
- `missing_check_out`, `incorrect_check_out`: update only check-out.
- `missing_break`, `incorrect_break`: update only break minutes.
- `incorrect_attendance_status`: update the requested attendance status after recalculation validation.
- `work_from_home_correction`: update work location/status to remote.
- `off_site_work_correction`: update work location/status to off-site.
- `incorrect_shift_assignment`: replace the linked shift assignment with a selected assignment owned by the same employee/date.

The employee form loads the actual attendance record for the selected date, not only the scheduled shift, and pre-populates existing values. Evidence supports real upload through the existing ESS upload path instead of URL-only evidence.

### 2. Request lifecycle completion

Shift requests and overtime requests gain explicit owner lifecycle actions:
- submit saved draft
- edit draft / returned request
- resubmit returned request
- withdraw pending request
- cancel where business state permits

Returned requests preserve reviewer comments and reopen the existing request instead of creating duplicates.

Attendance corrections use the existing ESS transition service (`submit`, `withdraw`, `cancel`, `resubmit`) and expose those actions in employee self-service.

Timesheets retain the existing returned → edit → resubmit flow, and existing entries gain an Edit action using the already-supported `entryId` update contract.

### 3. Shift request target resolution

The requests data endpoint returns:
- the requesting employee's assignments
- eligible colleague assignments for a selected swap employee
- eligible open shifts

The UI uses dedicated selectors:
- shift swap: own assignment + colleague + colleague assignment
- open shift: open shift target
- cover shift: target assignment/open shift eligible for coverage
- drop shift: own assignment
- shift/work-location/rest-day changes: own assignment

The backend validates ownership and target eligibility again during approval.

### 4. Roster operations

Roster supports:
- create/edit/delete assignment
- copy a previous roster week
- publish roster
- bulk notifications after publish

`copy_roster` copies non-cancelled assignments from a source roster range into a target roster range with conflict checks and draft publication status.

`publish_roster` returns affected employee IDs. The API resolves their users and sends one notification per affected employee with the employee-facing roster destination.

### 5. Time setup and runtime rules

Time settings remain under Admin Center / HR Setup. Workforce Rules become the runtime source for:
- workforce timezone
- late grace minutes
- overtime approval requirement
- overtime rounding minutes
- minimum shift rest hours
- standard weekly hours
- holiday multiplier where used by Time calculations

Branch configuration remains the source for attendance geofences.

The Time service reads these settings through a focused `time-policy-config` helper with stable defaults matching current behavior when settings are unavailable.

Shift definitions, roster periods, work schedules, and open shifts receive user-facing configuration/creation paths within the Time/Roster experience or existing HR Setup surfaces. The implementation will prefer existing tables and APIs over new schema.

### 6. Attendance period to Payroll handoff

`export_payroll` continues to create `hr_payroll_attendance_exports` rows with status `ready`.

Payroll `collect_inputs` additionally materializes ready attendance exports overlapping the payroll period into `hr_payroll_inputs` using stable idempotency keys. It creates separate components for regular attendance/time adjustments and overtime where applicable, scoped to employees in the run company. Successfully materialized export rows are marked consumed/linked to the payroll run if supported by existing columns; otherwise consumption is inferred idempotently from generated payroll inputs and the export remains immutable.

No export may be collected twice for the same payroll run.

### 7. Reports

The existing `reports` server view becomes a user-facing Time view at `/workforce/attendance?view=reports`.

The first production report surface includes:
- date range
- records/present/late/absent/exceptions
- worked hours
- overtime hours
- CSV export of currently loaded daily data

No new analytics backend is introduced.

### 8. Notifications and destinations

Notifications must point users to self-service where appropriate:
- employee timesheet → employee Time/Timesheet destination
- employee overtime → employee overtime destination
- shift request → employee shift-request destination
- roster publish → employee attendance/roster destination

Manager approval notifications point to manager Time review surfaces.

Bulk operations must not depend on a single top-level `employee_id` in the mutation response.

## Error handling

- Preserve optimistic concurrency using `expectedVersion` on updates/transitions.
- Reject invalid lifecycle transitions with `INVALID_TRANSITION`.
- Reject invalid shift targets with `SHIFT_CONFLICT` or `FORBIDDEN`.
- Attendance correction merges are transactional and fail without partially updating attendance/events/exceptions.
- Payroll collection is idempotent and transactional.
- Notification failure never rolls back the authoritative Time mutation, but the mutation response must not claim notifications were queued unless recipients were actually resolved.

## UX rules

- Never advertise an action that has no backend transition.
- Draft and returned items always expose a clear next step.
- Destructive actions require an explicit reason/comment where the current domain already requires one.
- Approval/rejection/return comments remain visible in request history.
- Existing visual language and components are retained; this is completion, not redesign.

## Testing

Add focused unit/regression tests for:
- correction merge semantics and correction-type mapping
- shift request lifecycle transitions and target validation
- overtime draft/returned lifecycle
- roster copy date mapping/conflict handling
- workforce-rule loading/defaults
- Payroll attendance-export materialization/idempotency
- reports view routing
- bulk notification recipient extraction

Add/extend Playwright coverage for these critical journeys:
1. employee check-in → manager attendance view
2. employee attendance correction → manager approve → corrected record retained/updated
3. shift swap submit → colleague accept → manager approve → roster changed
4. overtime draft → submit → return → edit/resubmit → approve → confirm actual
5. timesheet entry edit → submit → return → edit/resubmit → approve
6. attendance period close → Payroll export → payroll collect inputs
7. roster copy → publish → affected-employee notifications

## Non-goals

- No visual redesign of Time.
- No replacement of the existing permission model.
- No external time-clock vendor integration.
- No new BI/reporting platform.
- No payroll calculation-engine rewrite.
