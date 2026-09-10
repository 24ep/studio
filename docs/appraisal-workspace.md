# Appraisal workspace

## Current-state assessment

Before this implementation, the Employee sidebar linked Appraisal to a generic coming-soon page. Formal review data was partly stored in `hr_performance_cycles` and `hr_performance_reviews`, while the ESS Performance page exposed one free-text self-assessment. The existing model supported one manager reviewer, one numeric rating, and a small set of review fields.

The application already provided reusable infrastructure for:

- employee identity, manager hierarchy, departments, positions, companies, and user links;
- Goal records in `hr_performance_goals`;
- continuous Performance check-ins, feedback, recognition, competency evidence, and development plans;
- Learning courses and learning paths;
- authentication, module permissions, notification delivery, and audit logging;
- responsive layout, accessible controls, drawers, status UI, and API validation;
- Prisma migrations, PostgreSQL transactions, Vitest, ESLint, and TypeScript checks.

## Gap analysis

The previous implementation did not provide:

- a dedicated role-aware Appraisal route or information architecture;
- cycle deadlines, types, population rules, safe generation, or stage control;
- versioned templates or configurable rating models;
- multiple reviewer assignments or anonymous peer review protection;
- structured Goal and competency evaluations;
- separate calculated, proposed, calibrated, overridden, and final ratings;
- calibration decisions, approval history, controlled release, or acknowledgment semantics;
- appeal records preserving the originally released result;
- appraisal-specific immutable lifecycle events, reports, or realistic seed records.

## Ownership boundaries

Appraisal owns the formal review lifecycle. It reuses the existing `hr_performance_cycles` and `hr_performance_reviews` tables so released review data remains available to Performance without a second synchronization layer.

- Goal remains the source of truth for Goal title, progress, status, key results, and evidence. Appraisal stores a review-time snapshot and evaluator response; it never updates Goal progress.
- Performance owns continuous check-ins, feedback, recognition, trends, alerts, competency evidence, and development-plan tracking. Appraisal consumes those sources but does not recreate them.
- Learning owns courses, assignments, paths, and completion. Appraisal stores development recommendations that can be converted into existing Performance development actions referencing Learning.
- Employee and Organizational Chart remain the source of truth for identity, company, department, position, and reporting hierarchy.

## Information architecture

Appraisal remains one Employee sidebar item at `/workforce/appraisal`.

Role-aware sections:

- Overview: priority action, workflow pulse, current stage, and recent immutable activity.
- My appraisals: current formal review, structured self-assessment, source Goal results, released result, acknowledgment, and appeal.
- Feedback requests: peer, upward, project, matrix, or other explicitly assigned review work.
- Team appraisals: manager/HR work queue with search, stage filter, responsive records, calculation, approval, release, and reviewer assignment.
- Calibration: rating comparison and traceable adjustment decisions.
- Cycles: cycle creation, safe population generation, stage control, and completion.
- Templates & ratings: published template versions and configured rating scales.
- Reports: completion, overdue work, rating distribution, and department progress using persisted records only.
- Audit history: immutable appraisal lifecycle events.

## Domain design

The migration extends `hr_performance_cycles` and `hr_performance_reviews` backward-compatibly. Existing Performance queries continue to work.

New entities:

- `AppraisalTemplate` and `AppraisalTemplateVersion`
- `AppraisalRatingModel` and `AppraisalRatingLevel`
- `AppraisalReviewer`
- `AppraisalGoalEvaluation` and `AppraisalCompetencyEvaluation`
- `AppraisalRatingAdjustment`
- `AppraisalCalibrationSession` and `AppraisalCalibrationDecision`
- `AppraisalApproval`
- `AppraisalAppeal`
- `AppraisalEvent`

Historical review rows reference the exact template version and rating model assigned at generation. Rating progression uses separate columns; later decisions never overwrite the calculated or manager-proposed value.

## API and authorization

`GET /api/appraisal` returns a role- and scope-aware workspace. `POST /api/appraisal` accepts a discriminated, validated action contract.

Implemented actions:

- create cycle and publish template;
- preview and idempotently generate population;
- change cycle stage;
- save and submit self-assessment;
- save and submit manager assessment;
- assign and submit reviewer feedback;
- calculate and override a rating;
- calibrate and approve a result;
- release a result;
- acknowledge receipt or request discussion;
- submit an appeal preserving the original result.

Backend access checks combine module permission, linked employee, manager hierarchy, explicit reviewer assignment, explicit approver assignment, company scope, record ownership, and release stage. Anonymous reviewer identity is not returned to an employee result view. Final ratings are removed from employee API responses until release.

## UX direction

The workspace follows the existing business-oriented light-first product, with a formal editorial dossier character: warm paper neutrals, navy actions, restrained amber accents, square data surfaces, and strong typographic hierarchy. It avoids a disconnected dashboard aesthetic and uses progressive disclosure for complex actions.

Responsive behavior:

- tab navigation remains horizontally scrollable and keyboard accessible;
- dense manager tables become touch-friendly record cards below desktop width;
- action drawers become full-width on mobile;
- forms become single-column and retain all critical actions;
- self-assessment drafts autosave to the server after a short idle period, advance the optimistic version, warn on concurrent conflicts, and refresh persisted data when the editor closes;
- touch targets use a minimum height of 44px;
- final rating visibility, status, errors, offline state, and empty state use text in addition to color.

## Setup

```bash
npx prisma migrate deploy
npx prisma generate
npm run seed:appraisal
npm run type-check
npm run lint
npm run test:run
npm run build
```

The seed expects employee hierarchy records to exist (normally from `seed:hr`). It creates a realistic five-level rating model, a balanced contribution template, active and historical annual cycles, review records, manager and anonymous peer assignments, approvals, released results, acknowledgments, and lifecycle events.

## Workflow invariants

- population generation uses the existing `(cycle_id, employee_id)` unique key and never creates duplicate appraisal records;
- employees can edit only their own appraisal at configured editable stages;
- managers can assess only direct reports or explicitly assigned records;
- reviewers can submit only their own assignment and cannot retrieve other reviewer responses;
- final ratings remain hidden from the employee until `released_at` exists;
- override and calibration actions append immutable records with reason, actor, old value, and new value;
- release is rejected without a final rating, manager comments, and an allowed workflow stage;
- acknowledgment explicitly confirms receipt, not agreement;
- an appeal stores a JSON snapshot of the originally released result before status changes.

## Assumptions and remaining dependencies

- The existing `HR_PERFORMANCE_VIEW` and `HR_PERFORMANCE_MANAGE` permissions are reused for Appraisal read/admin access to remain backward compatible. Organizations that need separate Appraisal permission IDs can add them to the shared platform-module registry and map existing roles in a later permission migration.
- Department/company scope uses the employee record currently linked to the authenticated user. More complex business-unit or custom-group population builders can extend `population_config` without changing generated review history.
- The existing application has no general-purpose approval workflow entity shared across every HR domain. Appraisal uses a workflow-compatible approval ledger with sequence, role, delegation fields, decision, comment, and transition history; it can be adapted to a future shared engine.
- Evidence upload uses URL arrays in the API contract. Connecting the existing storage uploader to the appraisal drawer is a remaining integration dependency.
- Email delivery is represented by the existing email-ready notification record and deep link. Scheduled reminders require the application’s job scheduler to invoke reminder actions.
- PDF generation and bulk spreadsheet export are not introduced as parallel systems; they should be added through the application’s existing document/export infrastructure.
- The implementation does not create or edit Goal, Learning course, employee, competency-framework, or continuous Performance records.
