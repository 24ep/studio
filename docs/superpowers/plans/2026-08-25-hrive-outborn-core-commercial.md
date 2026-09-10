# Hrive ↔ Outborn Core Commercial Integration Plan

1. Add Core billing-preference contract tests for defaults, synchronization and audit.
2. Implement Core billing preference DTO, controller routes and service methods without a schema migration.
3. Add Hrive auth regression coverage proving the Account OAuth access token stays server-only.
4. Extend Hrive Auth.js JWT handling to retain the Account access token and expiry.
5. Add a reusable server-only Outborn Account/Core client that resolves organization membership from Account identity and forwards bearer credentials to Core.
6. Add Hrive BFF routes for commercial overview, billing preference updates and billing portal creation.
7. Replace Hrive's generic local billing configuration entry with a dedicated Core-backed Billing workspace.
8. Present Core subscription/plan, entitlements, usage, invoices and billing details with resilient empty/error states.
9. Remove the billing definition from the generic policy-configuration model so Hrive has no second billing source of truth.
10. Run repository verification, inspect CI on exact heads, perform code review, and open coordinated PRs against Core `main` and Hrive `dev`.