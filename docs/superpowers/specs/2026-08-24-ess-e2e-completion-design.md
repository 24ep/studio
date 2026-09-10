# ESS End-to-End Completion Design

## Goal
Complete employee self-service journeys so each employee action reaches a durable business outcome and returns a clear status to the employee, while reusing existing HRIS/expense/learning/survey infrastructure instead of creating duplicate systems.

## Scope

### Employee journeys
- Profile change requests
- Leave requests
- Attendance and attendance corrections
- Shift requests
- Overtime
- Timesheets
- Documents and payslips
- Performance
- Learning
- Surveys
- Benefits
- Onboarding
- Expense claims and reimbursement
- Manager self-service approvals for employee-originated requests

## Architecture

### 1. One ESS entry model, not one monolithic API
Existing domain modules remain authoritative. ESS becomes the employee-facing composition layer:
- leave/profile/documents/performance/team continue through `/api/ess/*`
- expenses reuse `/api/expenses/*`
- learning reuses `/api/learning/*`
- surveys reuse `/api/surveys/*`
- onboarding uses `/api/ess/onboarding`
- benefits use `/api/ess/benefits`

This avoids duplicating finance, learning, survey, and HR master data.

### 2. Employee self-service boundaries
Every ESS surface must:
- default to the signed-in employee's records only
- not expose finance/admin/team scopes unless the signed-in user explicitly has those capabilities and enters a manager/admin surface
- show draft, pending, returned, rejected, approved/active, withdrawn/cancelled, and downstream completion states when supported by the domain
- refresh after mutation and use optimistic version checks where the domain supports them
- preserve audit logging for state-changing actions

### 3. Expenses
Expose the existing expense claim engine under `/ess/expenses` in employee-only mode. Employees can create claims, upload receipts, submit, withdraw, revise/resubmit, and track approval, payment processing, paid, and reimbursement states. Finance-only actions remain hidden.

### 4. Onboarding
Replace `/ess/onboarding` redirect to the HR onboarding workspace with a dedicated employee onboarding view. It shows only the employee's onboarding case, progress, tasks, due dates, assigned learning, profile completion, blockers, and completion state. Employee actions only complete employee-owned tasks; HR-only case management remains under `/people/onboarding`.

### 5. Benefits
Extend benefits from apply-only to a lifecycle:
- apply -> pending_approval
- withdraw while pending
- returned_for_revision -> resubmit
- rejected -> reapply
- active -> request termination/end coverage
- manager/authorized approver can approve, reject, or return a pending benefit enrollment

Status changes are version-checked and audited. Employee history remains visible after a plan closes or becomes inactive.

### 6. Payslips
Keep payroll documents as the data source, but provide a first-class `/ess/payslips` page instead of a redirect-only route. The page presents payroll-specific filtering and download/view actions without exposing unrelated document categories.

### 7. Shared approval behavior
Manager self-service uses the existing unified approval inbox. Benefit enrollment approvals are added to that inbox alongside leave and generic ESS requests. Existing shift/attendance/overtime/timesheet request lifecycles continue to use their established request engine; this pass adds regression coverage rather than introducing parallel state machines.

## UX requirements
- ESS pages use employee language: "My …", "Needs your action", "Returned for revision", "Payment processing", "Paid".
- No dead-end success toast: after every mutation the durable new state must be visible on refresh.
- Returned/rejected records show decision comments where available.
- Empty, loading, authorization, missing-employee, conflict, and retry states are explicit.
- Mobile remains fully usable; primary actions have minimum 44px target height.

## Data and security
- Server derives employee identity from the authenticated user; employee IDs are never trusted from client input for self-service writes.
- Cross-employee reads require manager/admin permissions already enforced by the domain service.
- State-changing requests use schema validation.
- Version conflicts return HTTP 409 instead of silently overwriting newer decisions.
- File uploads remain on the existing secure document/receipt upload paths.

## Testing
Add focused tests for:
- ESS route ownership (onboarding and payslips no longer redirect to admin/general surfaces)
- expense workspace employee-only mode
- benefit employee lifecycle transitions
- benefit manager approval transitions
- onboarding employee data isolation and task mutation
- route/render regressions for the new ESS entries

Final verification must include targeted tests, TypeScript/build, and the repository's ESS/HR regression suites where available.
