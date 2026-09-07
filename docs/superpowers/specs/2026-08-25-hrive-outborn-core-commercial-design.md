# Hrive ↔ Outborn Core Commercial Integration Design

## Goal
Make Outborn Core the source of truth for Hrive commercial state while Hrive remains the source of truth for HR-domain data and authorization.

## Ownership
- Outborn Account: human identity, organizations, memberships, invitations, organization roles.
- Outborn Core: product catalog/access, plans/prices, billing accounts, Stripe customer/subscription/invoices, billing preferences, entitlements, usage and commercial audit.
- AppKit: technical application registration, service identity and reusable platform infrastructure.
- Hrive: employees, recruitment, time, leave, payroll, compensation, performance, learning, ESS and Hrive fine-grained permissions.

## Core changes
Add typed organization billing preferences at `GET/PATCH /v1/organizations/:organizationId/billing/preferences`. Canonical billing email/currency stay synchronized with `OrganizationProfile` and `BillingAccount`; additional finance/PO/tax/delivery/renewal fields live in `OrganizationProfile.metadata.billingPreferences` to avoid a schema migration. Mutations require `BillingAdminGuard` and write an audit event.

Existing Core billing snapshot, subscription, portal, entitlement and usage APIs remain authoritative and unchanged.

## Hrive authentication boundary
Hrive's Outborn Account OIDC login retains the Account access token only inside Auth.js's encrypted server JWT. The public Session shape must never expose it. Server BFF routes resolve Account identity and organization membership from the token and forward the token to Core.

The BFF never trusts a browser-supplied organization ID. It resolves the organization from Account membership context. If Account returns exactly one organization it is selected automatically; otherwise an explicit server-side organization context can be added later without weakening the boundary.

## Hrive commercial BFF
Add server-only helpers for Account/Core URLs, token extraction, identity resolution and Core fetches. Add same-origin routes for:
- commercial overview (billing snapshot + preferences + entitlements + usage),
- billing preference updates,
- billing portal session creation.

Missing billing account is represented as an empty commercial state rather than a dead-end error.

## Hrive Billing workspace
Replace the generic Billing Preferences policy form with `/settings/billing`. The workspace presents Overview, Plan, Usage, Invoices and Billing details from Core and links billing administration to the Core-created Stripe portal. No Stripe secret is added to Hrive.

## Entitlements and usage
The Billing workspace consumes Core entitlements and usage immediately. The reusable server client becomes the platform boundary for later Hrive feature gates and metering; no new Hrive commercial database is introduced.

## Error handling
- 401: require a valid Outborn Account session.
- 403: honor Core organization/billing-admin authorization.
- 404 billing account: return an empty state; do not fabricate subscription data.
- Core/Account unavailable: return a stable 502/503-style BFF error and keep retry possible.
- Billing portal unavailable: surface the Core error without exposing provider secrets.

## Testing
Core: unit coverage for preference defaults, persistence/synchronization and audit behavior; DTO/controller compile coverage through normal checks.

Hrive: auth callback test proving Account token retention in JWT only, server helper tests for organization resolution/Core forwarding, billing view-model tests, and existing architecture/type/lint/test/build gates.

## Non-goals
No Hrive HR data moves into Core. No direct browser-to-Core credential flow. No Stripe secret in Hrive. No duplicate organization-membership store. No new standalone billing service.