# Leaves Module

## Current-state assessment

Before this implementation, the repository had a real employee self-service leave workflow at `/ess/leave` and a manager approval queue at `/ess/team`. The existing PostgreSQL records covered leave policies, yearly balances, requests, holidays, and leave blocks. Server-side submission already validated dates, backdating, overlaps, leave blocks, holidays, weekends, balance availability, half-day/hourly eligibility, notice, and consecutive-day limits. Submission reserved pending balance inside a transaction; approval moved pending units to used units; cancellation and withdrawal restored them. Existing notifications deep-linked managers and employees, and API actions wrote to the shared audit log.

The Workforce route `/workforce/leave` and the other four Leaves navigation entries were placeholders. Policy administration and balances were available only through the generic HR CRUD registry. There was no effective-dated assignment model, immutable balance ledger, encashment workflow, idempotent allocation run, period closure control, operational exception queue, or payroll handoff record.

The repository already provides:

- Next.js 15, React 18, TypeScript, Tailwind, Radix-based UI components, Vitest, Prisma, and PostgreSQL.
- Shared authentication, backend permissions (`HR_WORKFORCE_VIEW` and `HR_WORKFORCE_MANAGE`), notifications, and audit logging.
- Employee, department, company, manager, work schedule, shift, attendance, holiday, Payroll, ESS, and Employee Portal records.
- A responsive application shell and established light/dark design tokens.

## Gap analysis

| Capability | Before | Implemented |
| --- | --- | --- |
| Employee request | Real ESS workflow | Preserved and extended to account for accrued and encashment-reserved units |
| Manager approval | Direct-manager scoped ESS action | Preserved; added HR operational decision endpoint with optimistic concurrency |
| Authoritative calculation | Weekday/holiday calculation in ESS service | Reusable deterministic engine with half-day, hourly, roster, rest day, and overnight shift coverage |
| Policy assignment | Implied by balance records | Effective-dated, prioritized, previewable assignments with duplicate-period protection |
| Allocation/accrual | Direct balance CRUD | Previewable and idempotent runs with per-employee ledger records |
| Balance traceability | Aggregate balance only | Immutable before/after ledger with source, actor, reason, and idempotency key |
| Encashment | Placeholder | Eligibility validation, reservation, HR decision, Payroll handoff status, payment completion, release/reversal |
| Control panel | Placeholder | Real operational metrics, approval ageing, exceptions, and guarded period closure/reopening |
| Integration status | Implicit | Request-level attendance and Payroll synchronization statuses plus export domain model |
| Responsive Leaves UI | Placeholder/generic ESS tabs | Five production routes, compact desktop tables, mobile record cards, loading/error/empty states |

## Final information architecture

The existing five-item Leaves navigation is preserved:

1. **Leave Request** — balances, request activity, approval actions, upcoming absence, and downstream status. Employee submission remains available through ESS and is linked directly.
2. **Leave Encashment** — eligible balances, protected minimums, unit reservation, HR review, Payroll handoff, and completion.
3. **Leave Control Panel** — operational metrics, exception resolution, approval ageing, and period control. It does not duplicate employee self-service.
4. **Leave Policy Assignment** — policy/rule selection, population preview, conflict visibility, effective dates, and assignment history. Policy definitions remain owned by Admin/HR configuration.
5. **Leave Allocation** — balances, run preview/execution, manual adjustment, run history, and immutable ledger.

## Backend and data design

Migration `20260729210000_complete_leave_management` extends the existing tables without replacing historical rows. It adds:

- Versioned policy settings and policy snapshots.
- Effective-dated policy assignments.
- Balance ledger transactions.
- Shared leave approval steps.
- Encashment requests and balance reservations.
- Allocation/accrual run history.
- Leave periods, operational exceptions, and Payroll exports.
- Accrued and reserved units plus optimistic-concurrency versions on balances.
- Request policy version, validation snapshot, attendance sync, and Payroll sync fields.

The migration backfills policy version 1, explicit employee assignments from existing balances, and an opening ledger record for every existing balance. It is idempotent where safe and retains all existing IDs and routes.

The Leaves workspace API is `/api/hr/leaves`. Read operations require `HR_WORKFORCE_VIEW` or `HR_WORKFORCE_MANAGE`. Administrative actions require `HR_WORKFORCE_MANAGE`; self encashment is additionally constrained to the authenticated employee record. Every action validates on the server. Mutating operations use database transactions, row locks, optimistic versions, and idempotency keys where retries are possible.

## Calculation and balance rules

`src/lib/hr/leave-domain.ts` is the reusable calculation boundary. It supports:

- Working weekdays, published roster shifts, holidays, and explicit rest dates.
- Full-day, half-day, and hourly units.
- Overnight shifts.
- Minimum/maximum duration and negative-balance validation.
- Explainable included and excluded dates.
- Accrued, pending, and encashment-reserved balance handling.
- New-hire proration to half-unit precision.

The existing ESS submission path remains authoritative for employee requests. It now subtracts `accrued` and `reserved` correctly and writes request reservation/release/restoration transactions to the balance ledger.

## Setup and migration

```powershell
npx prisma migrate deploy
npx prisma generate
npm run seed:leaves
npm run check
npm run build
```

`seed:leaves` is idempotent and uses existing active employees. Run the base HR/ESS seeds first in a new database.

## Assumptions and remaining dependencies

- Payroll owns monetary calculation and payment. Leaves stores and exports approved units and Payroll statuses only.
- Attendance remains the source of truth for worked time. Approved requests are marked `queued` for the existing integration processor; the external delivery worker must consume this status.
- Email-ready events continue through the shared notification service. Channel delivery preferences remain owned by that service.
- Policy definitions continue to be configured through the existing HR/Admin policy resource; assignment does not duplicate policy definition.
- The current permission catalog exposes Workforce view/manage permissions. The new API enforces those permissions and employee ownership. If the organization needs distinct Leave Administrator, Payroll Reviewer, and Auditor permissions, add them to the central platform permission catalog and map them to the provided action boundaries.
- Creating new leave periods and generating a physical Payroll export file are modeled but still depend on the organization’s period calendar and Payroll connector configuration.

## Test coverage

The calculation unit tests cover weekend/holiday exclusion, half-day leave, hourly leave, overnight shifts, insufficient balance, reserved/accrued balance math, and new-hire proration. Existing ESS tests continue to cover request validation and manager scoping. The production checks should be run after applying the Prisma migration so generated client types include the new models.
