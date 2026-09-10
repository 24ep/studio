# Admin Center configuration gap audit

Date: 2026-08-12

## Captured evidence

### Step 1 — Logs & Monitoring

Health: functional but narrow.

![Current Logs & Monitoring view](E:/GitCloneProject/studio-1/admin-center-audit-current.png)

The current Admin Center exposes application logs, system monitoring, and system status. The log view has useful filters and row details, but no visible retention policy, export schedule, alert routing, or audit evidence controls.

## Existing information architecture

The registered tabs are HR Setup, User Accounts, Roles & Permissions, Branding, Field Management, Communication, AI, Billing, and Logs & Monitoring.

Observed structural gaps:

1. Security, feature flags, and application API routes are redirected into AI instead of having dedicated areas.
2. Billing is present as a tab, but its only item is hidden and marked unavailable.
3. Headcount Approval Paths is registered twice.
4. The overview model duplicates AI and references App API even though App API is not a registered Admin Center tab.

## Implemented settings that are not exposed clearly

1. Employee document templates — a working editor and API exist but the item is absent from the Admin Center item registry.
2. Recruiter assignment sync — a working settings page and API exist but the item is absent from the registry.
3. User teams — APIs exist, while the settings route redirects to Departments and no dedicated Admin Center entry exists.
4. Leave block list — the route exists and redirects to the workforce holiday screen, but no Admin Center entry exposes it.

## Recommended missing configuration areas

### Priority 1

1. Security & Access
   - Login methods, SSO/Azure, MFA/password policy, session duration, domain verification, provisioning, and security logs.
2. Integrations & API
   - API keys/docs, webhooks, calendar/email/SMS connections, recruiter sync, SCIM/SFTP, connection health, and credential rotation.
3. Employee lifecycle
   - Probation policies and review templates, offboarding checklists, contract types/templates, asset types, and document templates.
4. Workforce rules
   - Attendance rules, work schedules, shift templates, overtime rules, holiday calendars, leave blocks, and approval routes.

### Priority 2

5. Payroll & Expenses
   - Pay calendars, currencies/frequencies, earning and deduction codes, benefit plans, tax/bank export, expense categories, mileage/per-diem, and approval rules.
6. Performance & Learning
   - Review cycles, rating scales, appraisal forms, goal rules, learning assignment rules, certificates, and expiry reminders.
7. Users & Organization
   - User teams, default role assignment, provisioning/sync, account lifecycle, delegated administrators, and manager hierarchy rules.
8. Data Governance
   - Retention/deletion policies, audit retention/export, backups, data import/export, timezone/date formats, and data residency.

### Priority 3

9. Notifications
   - Event-to-channel matrix, recipients, digest schedule, escalation rules, quiet hours, and template ownership.
10. Service Desk
    - SLA policies, priority/severity definitions, assignment rules, escalation paths, and knowledge-base publishing controls.

## Suggested tab structure

1. Organization
2. People Lifecycle
3. Workforce
4. Payroll & Expenses
5. Hiring
6. Performance & Learning
7. Users & Permissions
8. Communication
9. Integrations & API
10. Security & Governance
11. Branding & Localization
12. Logs & Monitoring
13. Billing

## Evidence limits

The Logs & Monitoring screen was captured and inspected in the current run. The remaining inventory findings are grounded in the current route, API, and settings registries. The browser became unresponsive while opening the overview, so other Admin Center screens could not be accepted as screenshot evidence in this run. Accessibility compliance and keyboard behavior were not fully tested.
