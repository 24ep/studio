# HRIS Product, UX/UI, Feature, and Action Master Plan

Status: approved blueprint, implementation in progress  
Audience: product, design, engineering, QA, HR operations, payroll, and security  
Planning principle: common platform patterns first, domain workflows second, advanced capabilities last

Implementation constraint: preserve existing menu labels, menu grouping, routes, permissions, features, and established visual language. Improvements are introduced inside existing screens and shared components; navigation restructuring requires a separate, explicit product decision.

Implemented foundation: shared workspace headers, attention summaries, filters, responsive records and drawers, statuses, timelines, bulk actions, forms, calculation traces, export controls, workspace states, unsaved-change protection, and approval inbox patterns. Adoption now covers employee, team, leave, probation, operations, learning, onboarding, shifts, payroll, expenses, performance, appraisal, and engagement. The normalized workflow-task projection and permission-scoped task/decision APIs are additive; existing destinations and domain workflows remain unchanged.

## Implementation status ledger — 2026-08-01

This blueprint remains in progress. Completed items are recorded here only when code, data contracts, and automated verification exist.

| Priority item | Status | Evidence and remaining boundary |
| --- | --- | --- |
| Shared navigation and accessibility shell | Implemented foundation | Desktop and mobile navigation are permission-aware; Home and My Tasks are pinned when authorized; universal search works on both form factors; company, location, and period context is available globally; role workspaces, offline recovery, skip navigation, locale, keyboard, motion, contrast, link, and text-scale preferences are implemented. Device-based usability and WCAG sign-off remain release validation gates. |
| Active coming-soon destinations | Substantially complete | The employee expense action now opens the implemented expense-claim workflow. Compatibility coming-soon routes remain available but are not used by current HRIS navigation. |
| Backend permission and company scope | In progress | HRIS v1, workflow tasks, payroll, expenses, and financial-dimension APIs enforce server-side permission and company scope. A route-by-route authorization matrix and authenticated cross-company regression suite remain required. |
| Canonical cost center/project master data | Implemented foundation | Company-scoped, effective-dated, versioned cost centers and projects have governed codes, status, ownership, audit metadata, an HR Setup workspace, and canonical ID references. Expense advances, claims, claim items, and travel persist canonical IDs while retaining legacy text codes for rollout compatibility. Attendance, timesheet, and payroll columns are ready for staged selector adoption. |
| Unified tasks and approvals | In progress | Normalized task projection and permission-scoped decision APIs exist. A configurable shared workflow designer, complete delegation administration, and domain migration remain. |
| Employee 360 and lifecycle | Substantially complete | Employee 360, effective-dated assignments, employment events, probation, onboarding, movement foundation, offboarding, assets, cases, and timeline projection exist. Advanced downstream impact previews require broader integration validation. |
| Payroll certification and golden cases | Not signed off | Controlled payroll operations and calculation traces exist. Qualified Thai payroll/legal certification and an approved golden-case suite remain a launch gate. |
| Audit, masking, privacy, retention | Implemented foundation | Canonical immutable audit events, failure recovery, legal holds, dual-approved retention execution, privacy fulfillment receipts, access certification, SoD scans, company-scoped evidence, locked audit periods, continuous controls, and assurance exports are implemented. Environment-backed masking, restore, penetration, and operating-effectiveness sign-off remain release gates. |
| Authenticated critical-journey E2E | Not complete | Smoke and unit coverage exist, but all nine authenticated journeys in section 24 still require environment-backed end-to-end coverage. |
| Integration monitoring and reconciliation | In progress | Webhooks, queues, domain events, payroll/expense reconciliation, and integration mappings exist. A unified failure console, replay workflow, and connector reconciliation coverage remain. |

## 1. Product outcome

The product should operate as one role-aware HRIS rather than a collection of separate admin pages. Every user should quickly understand:

1. What needs my attention?
2. What can I do now?
3. What is the current status?
4. Who owns the next step?
5. What changed, and is it auditable?

The target is a responsive web application for employees, managers, recruiters, HR operators, payroll and finance teams, executives, auditors, and system administrators. The initial policy and payroll context is Thailand, while the information architecture must remain ready for additional countries.

## 2. Experience principles

- **Role-first:** navigation, dashboards, actions, and data scope follow the user's responsibilities.
- **Work-first:** overdue actions and exceptions appear before passive statistics.
- **One record, one history:** employee identity and employment timeline connect all modules without duplicating source data.
- **Safe by default:** destructive, financial, confidential, and irreversible actions require explicit confirmation, reason, and permission.
- **Explain every result:** leave units, attendance results, payroll calculations, ratings, and eligibility decisions expose their inputs and rules.
- **Progressive disclosure:** common actions stay simple; advanced controls appear only when required.
- **Status is never color-only:** every state has text, icon, owner, timestamp, and next action where applicable.
- **Mobile means actionable:** mobile layouts support the employee and manager tasks users actually perform, not merely compressed desktop tables.
- **Accessible and localizable:** WCAG 2.2 AA, keyboard navigation, readable focus states, reduced motion, long-text resilience, and locale-aware dates, money, time zones, and names.

## 3. Product-wide information architecture

The existing sidebar remains the user-facing navigation. The eight hubs below are a conceptual capability map for planning, ownership, search, reporting, and future role-based home content; they do not replace or regroup the current menu.

| Hub | Primary content | Typical roles |
| --- | --- | --- |
| Home | My day, tasks, approvals, announcements, deadlines, quick actions | Everyone |
| People | Directory, employee records, org structure, lifecycle, documents, cases, assets | HR, managers |
| Talent | Headcount, recruiting, referrals, offers, onboarding, performance, appraisal, succession | Recruiters, managers, HR |
| Time & Leave | Roster, clocking, attendance, corrections, overtime, timesheets, leave, holidays | Employees, managers, workforce admins |
| Pay & Spend | Payroll, compensation, benefits, payslips, expenses, advances, travel | Employees, payroll, finance |
| Learning & Engagement | Courses, paths, certifications, surveys, recognition, communications | Employees, managers, HR |
| Insights | Dashboards, reports, workforce planning, exports, scheduled reports | HR, finance, executives |
| Admin | Organization setup, policies, permissions, fields, integrations, security, feature flags | Administrators |

### Navigation rules

- Preserve the existing sidebar groups, menu labels, ordering, and URLs.
- Show only existing destinations the user can access.
- Pin `Home`, global search, notifications, and task inbox.
- Support favorites and recently visited destinations without changing authorization.
- Keep employee self-service actions visible in `Home`; do not force employees to understand administrative module boundaries.
- Use breadcrumbs for hierarchy and tabs for views within one workspace.
- Do not put unrelated workflows behind query-string tabs when they require distinct permissions, URLs, or browser history.
- Preserve the existing mobile navigation; additions such as Tasks or Quick action must fit its current structure and require usability validation.

## 4. Role-based home experiences

### Employee home

- Current work status and next shift
- Clock in, break, clock out
- Leave balance and request leave
- Payslip and document shortcuts
- Learning and onboarding due items
- Goals, appraisal, and acknowledgment tasks
- Expense, overtime, attendance correction, and profile-change status
- Announcements and policy acknowledgment

### Manager home

- Unified approval inbox ordered by urgency and SLA
- Team availability, leave, attendance exceptions, and upcoming probation events
- Hiring and onboarding status
- Performance check-ins, goals, appraisal deadlines, and development actions
- Headcount and compensation alerts within permission scope
- Team risk and workload indicators with explainable source data

### HR operations home

- Joiners, movers, leavers, probation, missing documents, open HR cases, asset recovery
- Leave and attendance exceptions
- Workforce data-quality issues
- Policy, visa, contract, certification, and document expiry alerts
- Integration failures and actions awaiting HR
- Workforce movement and headcount summary

### Recruiter home

- Open requisitions and approval bottlenecks
- Candidate pipeline and ageing
- Interviews, feedback due, offers, and acceptance risk
- Source and funnel quality
- Hiring SLA exceptions

### Payroll and finance home

- Payroll readiness by period
- Missing or unapproved inputs
- Calculation exceptions and material variances
- Approval, payment, accounting, and reconciliation status
- Expense and advance settlement queues
- Compliance deadlines

### Executive home

- Headcount, hiring, attrition, labor cost, attendance, engagement, and talent indicators
- Trend, target, and variance rather than operational record tables
- Drill-down only to authorized aggregates and records
- Privacy thresholds for small or sensitive segments

## 5. Common UX/UI foundation — implement first

### 5.1 Application shell

- Collapsible role-aware sidebar with hub grouping
- Global search and command palette
- Company, legal entity, location, and period context selector where authorized
- Notification center and unified task inbox
- Help, keyboard shortcuts, profile, locale, theme, and accessibility preferences
- Environment and impersonation indicators that cannot be mistaken for production identity

### 5.2 Standard workspace anatomy

Every operational workspace should use the same order:

1. Breadcrumb and page title
2. Scope and period context
3. Primary action and role-relevant secondary actions
4. Attention summary: overdue, blocked, exceptions, and incomplete setup
5. View tabs
6. Search, filters, saved views, column control, and export
7. Main records as desktop table and mobile cards
8. Record detail drawer or dedicated detail route
9. Activity, comments, attachments, approvals, and audit history

### 5.3 Shared component inventory

| Component | Required behavior |
| --- | --- |
| `WorkspaceHeader` | Title, explanation, scope, period, primary action, contextual help |
| `AttentionStrip` | Urgent count, severity, owner, SLA, direct resolution action |
| `MetricCard` | Label, value, comparison, period, definition, drill-down; never decorative only |
| `FilterBar` | Search, structured filters, active chips, clear all, saved views, URL persistence |
| `DataTable` | Sort, resize, column visibility, selection, density, pagination, empty/error/loading states |
| `MobileRecordCard` | Key identity, status, critical metadata, primary action, overflow menu |
| `RecordDrawer` | Summary, sections, action footer, comments, files, activity, keyboard close, deep link |
| `StatusBadge` | Controlled vocabulary, icon, text, accessible label, optional explanation |
| `ApprovalTimeline` | Current step, completed decisions, pending owner, delegation, SLA, comments |
| `AuditTimeline` | Actor, event, before/after, source, timestamp, correlation ID where useful |
| `BulkActionBar` | Selected count, allowed actions only, reason/confirmation, progress, failure summary |
| `FormSection` | Clear grouping, required/optional labels, inline help, validation summary |
| `CalculationBreakdown` | Inputs, rule version, formula steps, result, warnings, downloadable trace |
| `EmptyState` | Why empty, what the user can do, one relevant action; no generic illustration requirement |
| `ErrorState` | Plain-language error, retained user input, retry, support reference |
| `UnsavedChangesGuard` | Autosave status or explicit save, navigation warning, conflict recovery |
| `ExportDialog` | Format, fields, filters, masking, purpose, expiry, audit notice |

### 5.4 Standard record actions

Actions must use the same placement and language across domains.

- Primary: Create, Submit, Approve, Complete, Publish, Finalize
- Secondary: Save draft, Assign, Request changes, Recalculate, Reopen, Duplicate
- Utility: Comment, Attach, Share link, Print, Export, View history
- Negative: Reject, Cancel, Withdraw, Suspend, Reverse, Archive
- Destructive: Delete only for safe drafts or configuration with no historical use

Rules:

- Display only actions allowed for the current record, stage, actor, and scope.
- Explain disabled actions and how to unblock them.
- Require comments for rejection, override, reopen, reversal, and confidential-data access where policy requires it.
- Preview bulk impact before execution.
- Return a result receipt with succeeded, skipped, and failed records.
- Never silently overwrite a concurrent update.

### 5.5 Universal states

Every route must define:

- First-use empty state
- No-search-results state
- Loading skeleton matching final layout
- Partial-data warning
- Inline validation and submission error
- Permission-denied state
- Offline/reconnecting state where user input could be lost
- Optimistic concurrency conflict
- Archived/read-only record state
- Long-running operation progress and completion notification

### 5.6 Unified task and approval inbox

All actionable domains publish a normalized task record containing type, subject, requester, assignee, due date, priority, company, status, deep link, and allowed decisions.

Views:

- Assigned to me
- My submissions
- Delegated
- Completed
- Team queue
- Overdue and SLA risk

Actions:

- Open context
- Approve/reject/request changes
- Reassign or delegate when permitted
- Add comment or attachment
- Bulk approve only for low-risk homogeneous items
- Subscribe, remind, and escalate

## 6. Employee master record

### Screens

- People directory
- Employee 360 profile
- Employment timeline
- Job and assignment history
- Personal and contact information
- Compensation and benefits summary with restricted visibility
- Documents and acknowledgments
- Time, leave, performance, learning, expenses, assets, cases, and audit tabs

### Core actions

- Add employee or convert accepted candidate
- Start onboarding
- Edit current information through effective-dated change
- Change manager, position, department, location, company, schedule, or employment status
- Start promotion, transfer, secondment, or compensation change
- Record probation decision
- Start offboarding or cancel a planned exit
- Request or upload document
- Assign asset, policy, benefit, training, or checklist
- Open HR case

### UX safeguards

- Separate identity, employment, assignment, and user-account status.
- Preview downstream effects before a transfer or termination.
- Show effective date, previous value, new value, reason, and approver.
- Mask bank, tax, health, and confidential-case data by default.
- Preserve historical values; do not edit the past in place.

## 7. Organization and workforce planning

### Features

- Companies and legal entities
- Business units, divisions, departments, teams, locations, and cost centers
- Positions, grades, levels, job families, and reporting relationships
- Org chart and position chart
- Headcount plan, vacancies, requisitions, budget, and scenarios
- Reorganization preview and effective-dated publish
- Span of control, vacancy, contingent workforce, and labor-cost analysis

### Actions

- Create/revise organizational unit
- Create/freeze/close position
- Assign manager and cost center
- Request and approve headcount
- Model future organization
- Compare plan vs actual
- Publish approved scenario
- Export authorized organization snapshot

## 8. Recruitment and hiring

### Journey

Headcount request → position/requisition → sourcing → application → screening → interview → decision → offer → preboarding → employee conversion.

### Screens and actions

- Headcount requests: create, approve, return, reject, cancel, convert to opening
- Openings: define hiring team, competencies, stages, SLA, locations, budget, publish/unpublish
- Candidates: add/import, merge duplicates, consent, tag, source, assign, comment, attach, archive
- Pipeline: drag with confirmation, bulk move, reject with reason, schedule next action
- Interviews: availability, panel, scorecard, reminders, conflict detection, feedback lock
- Offers: compensation package, approval, document generation, send, revise, withdraw, accept/decline
- Talent pools: save, segment, nurture, consent expiry, rediscovery
- Reporting: funnel conversion, stage ageing, time-to-fill, source quality, diversity where lawful

### Candidate experience

- Mobile application with saved progress
- Clear consent and privacy notice
- Application status and communication preferences
- Interview schedule and reschedule flow
- Accessible offer review and e-signature integration boundary

## 9. Onboarding, probation, movement, and offboarding

### Onboarding

- Template by company, location, employment type, role, and department
- Employee, manager, HR, IT, facilities, payroll, and buddy tasks
- Dependencies, due dates, reminders, evidence, completion, and blockers
- Account, equipment, documents, training, introductions, and first-week schedule

### Probation

- Configurable duration and checkpoints
- Manager/employee evaluation
- Confirmation, extension, or unsuccessful decision with approvals and documents
- Alerts before statutory or policy deadlines

### Movement

- Promotion, transfer, manager change, location change, secondment, and employment-type change
- Effective-dated preview across access, payroll, benefits, leave, schedule, equipment, and reporting

### Offboarding

- Resignation/involuntary/retirement/end-of-contract flows
- Notice, last working day, approvals, final pay, leave handling, knowledge transfer, access removal, asset return, documents, exit interview, alumni consent
- Rehire eligibility and reason restricted to authorized HR roles
- Completion certificate and immutable exit timeline

## 10. Time, attendance, scheduling, and timesheets

### Roster

- Calendar/list views, staffing demand, open shifts, conflicts, coverage, draft/publish/lock
- Copy period, bulk assign, swap, publish subset, notify, compare changes, audit history

### Employee clock

- Current shift, clear next valid action, break state, timeline, offline warning
- Optional configured geofence, network, device, photo, or kiosk evidence
- Server time and idempotent submission

### Attendance operations

- Daily and period review
- Late, early, absent, missing event, overtime, location, and schedule exceptions
- Recalculate with explanation, resolve, correct, approve, close/reopen, payroll export

### Shift and overtime requests

- Change, swap, open-shift claim, availability, rest day, work location, overtime request
- Employee acceptance where required, manager decision, roster application, attendance/payroll status

### Timesheets

- Week view, project/cost center/task allocation, copy prior week, save draft, submit, return, approve, lock
- Validation against attendance without forcing equality

## 11. Leave and holidays

### Employee experience

- Balances with available/pending/accrued/reserved explanation
- Team calendar visibility appropriate to privacy policy
- Duration calculator with included/excluded dates
- Request, draft, submit, edit before approval, withdraw, cancel, attachment, status timeline

### Manager and HR experience

- Coverage context, conflicts, balance, policy checks, decision history
- Approve, reject, request changes, delegate, bulk low-risk approval
- Policy definition/versioning, employee assignment, allocation runs, ledger adjustment, encashment, exceptions, period close, payroll handoff

### UX safeguards

- Explain why a date is excluded or request is invalid.
- Show the exact balance impact before submission and approval.
- Never modify balance totals without a ledger entry.

## 12. Payroll, compensation, and benefits

### Payroll command center

- Current period, readiness checklist, population, inputs, exceptions, variance, approvals, finalization, payments, journals, reconciliation
- Clear country/rule-set version and certification status

### Payroll run flow

Setup → collect inputs → calculate → review exceptions → compare variance → approve → finalize → release payslips → create payments → post accounting → reconcile → close.

Actions:

- Create regular/off-cycle/final/reversal run
- Sync approved attendance, leave, expenses, benefits, and adjustments
- Add controlled input or correction
- Calculate/recalculate before lock
- Resolve or waive exception with reason
- Approve using four-eyes control
- Finalize and lock
- Generate/release payslips
- Generate provider-neutral payment and journal outputs
- Reconcile, amend, reverse, or close

### Compensation

- Salary history, allowances, bonuses, equity metadata, total compensation, ranges, compa-ratio
- Change request, promotion impact, review cycle, budget, proposal, calibration, approval, letter
- Separate manager visibility from payroll-confidential fields

### Benefits

- Plans, eligibility, enrollment windows, dependents, employee/employer contribution, evidence, life events, waiver, termination, payroll deductions
- Provider integration status and reconciliation

### Required launch gate

No payroll rule set may be marked production-authoritative without qualified legal/payroll review, approved golden cases, effective dates, version history, rollback procedure, and parallel-run reconciliation.

## 13. Expenses, advances, and travel

### Expense claims

- Draft claim, mobile receipt capture/upload, itemization, category, tax, currency, exchange rate, cost center/project, attendees, policy check
- Submit, return, approve, audit, reimburse, export, reconcile
- Duplicate receipt and policy-exception detection with human review

### Advances

- Request, approve, pay, link expenses, calculate outstanding amount, recover, settle, write off with authorization

### Travel

- Trip request, itinerary, estimate, policy, risk information, approval, booking integration boundary, advance, expense conversion

### Finance operations

- Payment batches, accounting mapping, journal preview, export, reconciliation, locked period, correction workflow

## 14. Performance, appraisal, succession, and mobility

### Continuous performance

- Goals and key results
- Check-ins with shared and private notes
- Feedback request/give, recognition, competency evidence
- Development plans and actions linked to learning
- Team overview and due actions

### Formal appraisal

- Cycle, template version, population, self-review, multi-rater feedback, manager assessment, calculation, calibration, approval, release, acknowledgment, appeal
- Keep calculated, proposed, calibrated, overridden, and final ratings distinct

### Talent management

- Talent review sessions, potential/performance assessment, succession slate, readiness, retention risk with source and confidence
- Critical role coverage and development actions
- Internal opportunities, eligibility, interest, application, manager/HR review, transfer conversion
- Sensitive talent data requires narrow permissions and audit access logging

## 15. Learning and certification

- Personalized assignments, catalog, search, paths, course experience, progress, quizzes, assignments, completions
- Course studio with draft, review, publish, version, archive
- Certification issue/verification, expiry, renewal, evidence, trusted issuer
- Compliance matrix by role/location and overdue escalation
- Manager assign/recommend and team progress
- Learning reports and export
- Content provider and virtual-session integration boundaries

## 16. Engagement, communication, policies, and service desk

### Engagement

- Survey template, version, audience preview/snapshot, schedule, invitation, reminder, response, release, action plan
- Anonymous threshold suppression and comment redaction controls
- Results by authorized segment with trend and response-rate context

### Communication

- Audience builder, channel selection, preview, approval, scheduling, send, retry, delivery, read/acknowledgment analytics
- Email, SMS, banner, popup, portal announcement, and emergency communication
- Localized content and opt-out rules where applicable

### Policies and documents

- Draft, review, approve, publish, supersede, archive
- Audience, effective date, version comparison, acknowledgment, reminders, evidence, export

### Service desk and HR cases

- Employee request intake, category, confidentiality, assignment, SLA, conversation, attachment, resolution, satisfaction
- Restricted case type, watchers, escalation, linked employee/event, immutable access history

## 17. Data, analytics, integrations, security, and administration

### Global search

- Search employees, candidates, positions, documents, tasks, cases, courses, and policies
- Permission-filter results before display
- Recent searches, filters, keyboard navigation, and deep links
- Never expose sensitive snippets from inaccessible records

### Reporting

- Certified metric catalog with definition, owner, source, refresh time, filters, and access policy
- Saved reports, scheduled delivery, export expiry, masking, and audit
- Drill from aggregate to authorized records
- Workforce, recruitment, time, leave, payroll, expense, performance, learning, and engagement packs

### Data operations

- Import template, mapping, validation preview, duplicate handling, dry run, execution, row-level result, rollback strategy
- Export purpose, authorization, masking, expiration, download log
- Data-quality center for missing, invalid, conflicting, stale, or orphaned records

### Integrations

- Connector catalog and status
- Credentials stored outside UI-readable records
- Field mapping, direction, schedule/webhook, test connection, dry run, retry, dead-letter queue, reconciliation, run history
- Domain-event subscriptions and versioned API contracts

### Security and privacy

- SSO, MFA, session/device management, password policy, service accounts, API keys
- Role, permission, scope, delegation, segregation of duties, access review
- Audit search and immutable event detail
- Data-subject request, consent, retention, legal hold, anonymization, deletion approval
- Break-glass access with reason, expiry, notification, and review
- Configurable feature flags by company and rollout cohort

## 18. Permission and visibility model

Authorization is the intersection of:

`role permission × company scope × organization scope × relationship × record ownership × workflow stage × field sensitivity`

Minimum actor classes:

- Employee self
- Manager/direct manager
- Matrix/project manager where explicitly assigned
- Recruiter/hiring team/interviewer
- HR operator
- Workforce administrator
- Learning administrator
- Payroll processor/approver
- Finance processor/approver
- Executive aggregate viewer
- Auditor/read-only investigator
- System administrator
- Integration service account

The API is authoritative. UI hiding is only a usability measure. Field-level restrictions must apply to responses, exports, notifications, logs, search results, and analytics—not only forms.

## 19. Visual language

Build on the existing Tailwind/Radix application and light/dark tokens.

- Business-oriented, calm, and information-dense without looking like a spreadsheet dump
- Neutral page background, white/elevated work surfaces, navy or brand primary actions
- Reserved semantic colors: blue information, green success, amber warning, red destructive/critical, violet sensitive/automation where useful
- 8px spacing rhythm, 44px minimum touch target, predictable density options
- Clear typographic hierarchy: page title, section title, body, supporting metadata, table label
- Moderate radii and restrained shadow; hierarchy should rely on spacing and border before decoration
- Motion limited to state continuity, drawer transitions, progress, confirmation, and reordering; honor reduced motion
- Use the existing icon library; pair unfamiliar icons with labels

## 20. Responsive behavior

### Desktop

- Persistent sidebar, contextual header, dense table, resizable detail drawer
- Multi-column forms only when scanning remains natural
- Sticky filters and action footer for long operational tasks

### Tablet

- Collapsible sidebar, reduced columns, drawer or split view depending on width
- Preserve bulk actions and approvals

### Mobile

- Bottom navigation and global quick action
- Tables become purposeful cards, not horizontally clipped tables by default
- Full-screen sheets for complex create/edit actions
- Sticky single primary action with overflow for secondary actions
- Camera/file workflows for receipts and documents
- Offline-safe draft for clock, expense, and long text when feasible

## 21. Accessibility and content standards

- WCAG 2.2 AA target
- Full keyboard operation and visible focus
- Logical heading order, landmarks, labels, descriptions, and error summary
- Status and chart meaning available without color or hover
- Screen-reader announcement for async results and validation
- Touch target minimum 44×44 CSS pixels
- Date, time, number, and currency format follow locale while stored values remain unambiguous
- Use verbs for actions and plain nouns for destinations
- Replace vague actions such as `Process`, `Update`, or `Confirm` with the actual result
- Confirmation copy states impact, affected records, reversibility, and next owner

## 22. Common-first delivery plan

### Phase 0 — governance and inventory

Deliverables:

- Confirm target countries, legal entities, user roles, and sensitive fields
- Route-to-feature inventory and current-state screenshots
- Permission and data-ownership map
- Canonical status/action vocabulary
- Analytics metric catalog and source owners
- Country compliance and integration register

Exit criteria: every existing route has an owner, role, data source, maturity status, and disposition.

### Phase 1 — shared experience foundation

Deliverables:

- Existing navigation preserved with role-aware visibility
- Standard workspace header, filter bar, table/cards, record drawer, statuses, forms, empty/error/loading states
- Unified task and approval inbox
- Global search foundation
- Shared comments, attachments, activity, audit, export, and bulk-action patterns
- Responsive and accessibility baseline

Exit criteria: People, Leave, and one approval flow use the shared patterns successfully on desktop and mobile.

### Phase 2 — core employee lifecycle

Deliverables:

- Employee 360 and employment timeline
- Org and position master data, including canonical cost center and project references
- Onboarding, probation, movement, offboarding, documents, assets, and HR cases
- Employee and manager home experiences

Exit criteria: a hire can become an employee, move roles, and leave with complete history and downstream tasks.

### Phase 3 — time, leave, and employee service

Deliverables:

- Roster, attendance, clock, corrections, shift requests, overtime, timesheets
- Leave request, manager approval, policies, assignment, allocation, encashment, close, payroll handoff
- ESS quick actions and team approval experience

Exit criteria: one complete attendance/leave period closes and exports with reconciled exceptions.

### Phase 4 — pay, benefits, and spend

Deliverables:

- Payroll guided run, exceptions, variance, four-eyes approval, finalization, payslip, payment, accounting, reconciliation
- Compensation changes and review cycle
- Benefits enrollment and payroll deduction lifecycle
- Expenses, advances, travel, finance accounting workflow

Exit criteria: parallel payroll passes approved golden cases and reconciles to source inputs and finance outputs.

### Phase 5 — talent, learning, and engagement

Deliverables:

- Recruiting through offer and onboarding conversion
- Continuous performance and appraisal
- Succession, talent review, internal mobility
- Learning and certification
- Engagement, policies, broadcast, and service desk

Exit criteria: cross-module talent journeys work without duplicate employee, goal, course, or organizational records.

### Phase 6 — enterprise controls and ecosystem

Deliverables:

- Data-quality center, certified analytics, scheduled reporting
- Connector management, retries, reconciliation, operational monitoring
- Privacy lifecycle, retention, legal hold, access review, segregation of duties
- Multi-country configuration and certified country packs
- Load, resilience, disaster recovery, penetration, and accessibility testing

Exit criteria: production readiness is signed off by HR, payroll/legal, security, finance, operations, and accessibility owners.

## 23. Priority backlog

### P0 — required before broad production use

- Remove or replace remaining coming-soon routes in active navigation
- Standardize backend-enforced permissions and company scope
- Canonical cost center/project master data
- Unified tasks and approvals
- Employee 360 and effective-dated lifecycle actions
- Payroll certification and golden-case suite
- Audit, export masking, privacy, and retention controls
- Full authenticated end-to-end tests for critical journeys
- Integration failure monitoring and reconciliation

### P1 — required for a strong complete HRIS

- Role-based homes and global search
- Compensation review and deeper benefits lifecycle
- Workforce planning scenarios
- Succession and internal mobility UX
- Mobile-first receipts, clocking, and manager approvals
- Certified reporting catalog and scheduled reports
- Configurable approval workflow and delegation

### P2 — differentiation

- Skills graph and role-gap insights
- Explainable HR assistant with permission-safe retrieval and human approval
- Predictive indicators with bias review, confidence, and opt-out governance
- Workforce scenario comparison
- Advanced scheduling optimization
- Personalized employee journeys and recommendations

## 24. QA and acceptance framework

Every feature is complete only when it has:

- Happy path, empty, error, permission, conflict, archived, and mobile states
- Backend authorization and field masking tests
- Audit event and notification behavior
- Optimistic concurrency or idempotency where appropriate
- Keyboard and screen-reader coverage for critical actions
- Responsive verification at phone, tablet, laptop, and wide desktop widths
- Realistic data volume and pagination test
- Locale, time-zone, overnight-shift, and effective-date boundary tests
- Export and integration reconciliation tests
- Clear product analytics events without sensitive payloads
- User-facing help for complex rules

Critical end-to-end journeys:

1. Headcount request to accepted offer and employee onboarding
2. Employee transfer with permission, payroll, benefit, leave, and reporting impact
3. Shift publication to attendance close and payroll export
4. Leave request to approval, balance ledger, attendance sync, and payroll handoff
5. Expense submission to reimbursement and accounting reconciliation
6. Appraisal cycle to released result, acknowledgment, and appeal
7. Payroll inputs to locked results, payslip, payment, journal, and reconciliation
8. Resignation to final pay, asset return, access removal, and completed offboarding
9. Privacy request from intake through verified fulfillment and immutable audit

## 25. Product decisions to validate

The plan uses these defaults until stakeholders decide otherwise:

- Primary market: Thailand; architecture supports future country packs.
- Product surface: responsive web/PWA, not separate native mobile apps.
- One employee may hold multiple effective-dated assignments, with one primary assignment per applicable period.
- PostgreSQL employee records remain the identity and organizational source of truth.
- Payroll, attendance, leave, performance, learning, and recruiting own their domain records and reference—not duplicate—the employee master.
- Complex approvals should converge on a shared workflow contract, while each domain retains its validation rules.
- Employee data is retained historically; corrections append events or effective-dated changes rather than silently rewriting history.

## 26. Recommended first implementation slice

Start with a vertical slice that proves the common system:

1. New role-aware Home and unified task inbox
2. Shared workspace components and status vocabulary
3. Employee 360 detail with timeline
4. Leave request and manager decision migrated to the common patterns
5. Audit, comments, attachments, notifications, and responsive states

This slice touches employee, manager, and HR roles; exercises permissions, workflow, history, calculations, notifications, and mobile UX; and establishes reusable components for every later module.
