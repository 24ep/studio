# Complete HRIS rollout

The migration `20260731160000_complete_hris_foundation` is the additive foundation
for effective-dated employment, offboarding, HR cases, assets, compensation review,
benefits, succession, talent review, internal mobility, workforce planning, privacy,
integrations, feature flags, domain events, and controlled Thailand payroll.

## Deployment sequence

1. Back up PostgreSQL and run `npx prisma migrate deploy`.
2. Confirm every employee has exactly one initial primary assignment.
3. Review company assignments and enable `effective_employment` for a pilot company.
4. Enable downstream features one company at a time from the relevant administration settings.
5. Keep `thai_payroll_v2` disabled until a qualified Thai payroll or legal reviewer
   approves a payroll rule set and its golden calculation cases.
6. Reconcile employee counts, compensation totals, payroll totals, event delivery,
   and cross-company authorization before expanding the pilot.

## Versioned interfaces

- `GET|POST|PATCH /api/hr/v1/[resource]` provides allowlisted, paginated HRIS
  resources with structured errors, permission checks, expected-version updates,
  audit logs, and outbox events.
- `GET /api/hr/v1/employees/[id]/timeline` consolidates employee module history.
- `POST /api/payroll/v1/calculate-preview` provides a deterministic, non-authoritative
  Thailand payroll preview with a complete calculation trace.

## Operational safeguards

- Existing employee fields remain available during rollout.
- Normal workflows never hard-delete historical HR records.
- Locked payroll results must be amended or reversed, not silently recalculated.
- Confidential cases, payroll, talent reviews, and privacy operations require
  narrower manage permissions.
- Anonymous survey segment results below the configured threshold remain suppressed.
