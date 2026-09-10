# Hrive Learning production completion design

Date: 2026-08-24
Base branch: `dev`
Feature branch: `feat/hrive-learning-production-completion`
Base commit: `d3a233d0c9a331f580ba18018c30f88d44d4d360`

## 1. Goal

Finish Hrive Learning as a production-ready HRIS module while completing the remaining frontend decomposition started in PRs #62–#64.

The work is intentionally broader than a UI refactor. It must close dead-end learner and manager journeys, make management actions truthful to permissions, harden Learning data integrity, make multi-course/path assignment atomic and auditable, expose the existing review/report capabilities through first-class UI, and remove obsolete Learning onboarding code now that `/learning/onboarding` delegates to People Onboarding.

## 2. Product principles

1. **One source of truth per workflow.** People Onboarding owns onboarding. Learning must not retain a second hidden onboarding implementation.
2. **Learner and manager journeys are distinct.** View-only employees should never discover management permissions through avoidable 403 errors.
3. **Self-service data is least-privilege.** Learner pages use APIs that return only published catalog data plus the linked employee's own Learning state; they do not reuse workforce-wide HR CRUD reads.
4. **Atomic business actions.** Creating a course with initial curriculum and assigning a path must succeed or fail as one logical action.
5. **Course progress is version-bound.** A lesson/block mutation is valid only when that content belongs to the employee's enrolled course version.
6. **Auditability over convenience.** Assignment batches, reviews, overrides, and changes-requested decisions must retain actor/source/reason context.
7. **Preserve proven subsystems.** Course Player, Course Studio, AI generation, Career Explorer, Achievements, Trusted Certificates, and existing progress tables are evolved rather than rewritten.
8. **Architecture budgets are constraints, not baselines to raise.** New controllers/components stay under repository default budgets and the remaining `LearningPageClient` monolith is retired.

## 3. Current-state audit

### 3.1 Architecture debt

Recent Learning refactors extracted record utilities, Overview, Legacy Course Catalog, UI primitives, dedicated Achievements/Career Explorer/Trusted Certificates routes, and `LearningJourneyHeader`. The remaining shared `LearningPageClient.tsx` still owns:

- active Course Catalog presentation
- Learning Paths presentation
- Employee Certificates presentation
- course/certificate/path/assignment dialogs
- course category loading
- course creation/removal
- certificate create/verify/update/delete
- learning path create/edit
- learning assignment fan-out
- obsolete Learning Onboarding state/mutations/presentation
- global loading/saving/error orchestration

`/learning/courses`, `/learning/paths`, `/learning/certificates`, and `/learning` still mount this shared controller directly.

### 3.2 Dead-end manager capabilities

The specialized Learning backend already supports:

- assignment submission
- assignment approval / changes requested
- audited completion override
- Learning report summary, enrollments, and assignment submissions

There is no first-class Learning manager workspace that exposes these actions as an operational queue.

### 3.3 Non-atomic path assignment

Current path assignment loops over `courseIds` and POSTs one enrollment at a time. A failure after one or more successful writes leaves a partially assigned path. The UI-only source label is not persisted.

### 3.4 Non-atomic course creation

Current course creation first inserts the course through generic HR CRUD and then calls Course Studio to save curriculum. The explicit failure state is “course created, but curriculum could not be saved,” which leaves incomplete/orphan course records.

### 3.5 Progress ownership gap

Enrollment ownership is checked, but heartbeat / quiz / assignment operations do not consistently prove that the supplied lesson or block belongs to the `course_version_id` attached to that enrollment before writing progress/submissions.

### 3.6 Capability and data-scope mismatch

Generic Learning GET is permission-gated by `HR_LEARNING_VIEW` and returns module-level Learning records, while POST/PATCH/DELETE require `HR_LEARNING_MANAGE`. The current shared controller does not carry a capability model, so learner-facing routes can render management affordances that later fail with 403.

Learner-facing Home/Catalog also should not depend on a workforce-wide generic HR endpoint. They need a dedicated self-service contract that returns only the linked employee's enrollments/progress plus safe published catalog data.

### 3.7 Duplicate onboarding implementation

`/learning/onboarding` now redirects to `/people/onboarding`, but `LearningPageClient` still contains onboarding fetches, state, dialogs, and submit logic. This is dead code and risks future divergence.

## 4. Target information architecture

### Learner-facing routes

- `/learning` → `LearningHomePageClient`
- `/learning/courses` → `CourseCatalogPageClient`
- `/learning/courses/[id]` → existing `CourseExperience`
- `/learning/courses/[id]/learn` → existing course player
- `/learning/paths` → `LearningPathsPageClient`
- `/learning/achievements` → existing dedicated Achievements controller
- `/learning/career-explorer` → existing dedicated Career Explorer
- `/learning/certificates` → `EmployeeCertificatesPageClient`
- `/learning/trusted-certificates` → existing dedicated Trusted Certificates controller
- `/learning/onboarding` → remains redirect-only to `/people/onboarding`

### Manager-facing routes

Add a Learning Management workspace under Learning navigation:

- `/learning/manage` → management overview / assignments
- `/learning/manage/reviews` → pending assignment review queue
- `/learning/manage/reports` → Learning reports and CSV export

Each manager view has its own direct URL and independent loading/error state. A shared management shell may provide tabs/navigation without collapsing the route boundaries.

## 5. Capability and self-service contract

Introduce a small server-returned Learning capability object used by every Learning controller:

```ts
interface LearningCapabilities {
  canUseLearningSelfService: boolean;
  canViewLearningManagement: boolean;
  canManageLearning: boolean;
  canReviewAssignments: boolean;
  canOverrideCompletion: boolean;
  canViewReports: boolean;
}
```

Rules:

- An authenticated user with a linked employee record can use Learning self-service for published catalog data and their own enrollments/progress.
- Learner self-service does **not** imply access to other employees' enrollments or manager reports.
- `HR_LEARNING_VIEW` / existing module-access conventions can continue to control broad Learning management visibility where used by the application shell.
- `HR_LEARNING_MANAGE` enables course/path/certificate administration, assigning learning, reviewing assignment submissions, audited override completion, and management reports.
- Manager-only UI is not rendered for learner-only users.
- APIs still enforce permissions server-side regardless of UI capability state.
- If the product's existing app-registration/module-entitlement layer intentionally disables Learning for a user, that entitlement remains authoritative; linked-employee self-service bypasses broad HR data permissions, not application entitlement.

## 6. Learner journeys

### 6.1 Learning Home

The home prioritizes actionable learner state rather than admin tooling:

1. Continue learning
2. Required / due soon
3. Assigned learning paths
4. Recommended / available courses
5. Recent achievements
6. Credentials

Empty states point to useful next actions rather than management actions the user cannot perform.

### 6.2 Course discovery

Course Catalog supports:

- search
- category filters
- required / optional filter
- status relevant to current learner: not started / in progress / completed
- course cards with duration, category, requirement, personal state
- learner CTA: View / Start / Continue
- manager CTA only when capability permits: Create, AI Create, Edit in Studio, Assign, Archive

The learner catalog API returns only active/published courses and the linked employee's personal enrollment state. Draft course visibility remains a manager/studio concern.

### 6.3 Course completion

Preserve current CourseExperience/player semantics:

- start / continue enrollment
- sequential lesson unlock
- active-time heartbeats
- required block completion
- video watch threshold
- quiz attempts / passing score
- assignment submission
- automatic enrollment progress/completion

Enhance assignment UX:

- submission shows `pending`, `changes_requested`, or `approved`
- changes-requested feedback is visible in the learner experience
- employee can resubmit the same assignment
- approved assignment marks its block complete through the existing completion engine

### 6.4 Learning Paths

Path details show ordered courses and learner state per course:

- completed
- current / continue
- available next
- assigned / due

A path assignment must be represented as one manager action even though courses remain individual enrollment records.

### 6.5 Achievements and certificates

Keep the dedicated Achievements and Trusted Certificates implementations. Employee Certificates moves to its own controller while preserving:

- employee sees their own credentials through the self-service boundary
- add employee credential when capability permits
- verification workflow
- validity / expiration
- trusted issuer/policy semantics in the existing dedicated workspace

## 7. Manager journeys

### 7.1 Course creation

Replace the current two-request create flow with a specialized transactional service/API.

Input includes:

- course metadata
- uploaded cover URL (upload may happen before transaction)
- curriculum sections/lessons/blocks
- rules
- publish/draft intent

Within one database transaction:

1. insert course
2. insert course version
3. insert sections/lessons/blocks
4. if publish requested, set current version and published status
5. commit

If curriculum insert fails, the course row is rolled back.

If a new cover upload was created specifically for this failed creation attempt, perform best-effort cleanup of the unreferenced object. Storage cleanup failure is logged but does not convert a correctly rolled-back database transaction into a false success.

Existing Course Studio save/publish remains for later revisions.

AI course generation must call the same atomic creation service for persistence after generation.

### 7.2 Atomic learning assignment

Add a `LearningAssignmentBatch` persistence model/table with at least:

- `id`
- `employee_id`
- `course_ids` JSON
- `source_type` (`course`, `path`, `manual`, `development_plan`, future-safe string)
- `source_id` nullable UUID
- `source_label`
- `due_date`
- `assigned_by_user_id`
- `idempotency_key` unique
- `created_at`

Assignment API accepts one employee + one or more course IDs + source metadata + due date + idempotency key.

Inside one transaction:

1. validate target employee and manager company scope
2. validate every course is active/published and assignable
3. create/find the assignment batch by idempotency key
4. upsert every employee/course enrollment without resetting completed progress
5. create assignment activity records linked by batch ID in metadata
6. commit

Any validation/write failure rolls back the whole assignment.

The existing unique `(employee_id, course_id)` enrollment rule remains.

Repeated idempotency key returns the authoritative existing batch/result without duplicating enrollments.

The batch stores a snapshot of the course IDs at assignment time. Later edits to a Learning Path do not retroactively alter historical assignment batches.

### 7.3 Assignment review queue

Manager Review shows submissions from `hr_learning_assignment_submissions` with:

- employee
- course
- assignment/block
- submitted/updated time
- text/file evidence
- current status
- prior feedback

Actions:

- Approve
- Request changes

Request changes requires feedback. Approve may include optional feedback.

Every review mutation carries `expectedUpdatedAt` from the loaded submission. The service updates only when the current `updated_at` matches that expected value; otherwise it returns a conflict and the UI reloads the authoritative submission. No new review-version column is introduced for this change.

### 7.4 Completion override

Manager can mark an enrollment complete only from an explicit action with:

- visible warning
- required reason (minimum existing API constraint)
- confirmation
- audit event with actor and reason

No silent “set progress to 100” editing through generic CRUD.

### 7.5 Reports

Expose existing report data in `/learning/manage/reports` with:

KPIs:

- assigned
- not started
- in progress
- completed
- overdue
- active learning time

Filters:

- employee
- course
- status
- due/completion date range

Views:

- enrollment table
- assignment submission/review table

Export:

- CSV generated from the currently filtered dataset

## 8. Backend integrity and security

### 8.1 Version-bound progress validation

Create a shared validation helper that proves:

- enrollment belongs to actor employee
- enrollment has a `course_version_id`
- lesson belongs to a section for that course version
- block belongs to that lesson

Use it for:

- heartbeat
- complete block
- submit quiz
- submit assignment

No progress row, quiz attempt, submission, or enrollment current lesson may be written for content outside that enrollment version.

### 8.2 Assignment review integrity

Review service must prove the submission belongs to a valid Learning enrollment and content block for that enrollment's course version. A manager review cannot approve an arbitrary cross-course block/submission relation.

### 8.3 Company scope

Courses remain globally reusable because the existing schema has no course company ownership and current product behavior treats the catalog as shared.

Manager operational data is company-scoped through employees:

- assignment targets
- review queue
- enrollment override
- reports

Reuse an existing HR actor/company-scope helper if one already covers this product area. Otherwise resolve manager company scope through the linked employee/company model and preserve existing admin bypass conventions. Do not introduce a second, inconsistent company-scoping rule only for Learning.

### 8.4 Self-service data boundary

Add dedicated learner-safe reads rather than widening generic HR CRUD:

- own enrollments/progress only
- published/active course catalog only
- own path-derived state only
- own certificate state

The learner routes must not call an endpoint that can return arbitrary other employees' Learning enrollment rows.

### 8.5 Generic CRUD boundary

Generic HR CRUD can remain the backing primitive for simple catalog/certificate/path records where safe, but critical state transitions move to specialized Learning services:

- atomic course creation
- assignment batch
- review assignment
- override completion
- learner progress

Direct generic mutation must not become an alternate bypass for these workflow-critical transitions.

## 9. Frontend decomposition

### 9.1 Replace shared controller

Extract and own state per route:

- `LearningHomePageClient.tsx`
- `CourseCatalogPageClient.tsx`
- `CourseCatalog.tsx`
- `LearningPathsPageClient.tsx`
- `LearningPathsView.tsx`
- `EmployeeCertificatesPageClient.tsx`
- `LearningManagementPageClient.tsx`
- `LearningReviewQueue.tsx`
- `LearningReportsView.tsx`

Dialogs become focused components:

- `CourseCreateDialog.tsx`
- `LearningPathDialog.tsx`
- `LearningAssignmentDialog.tsx`
- `EmployeeCertificateDialog.tsx`

Shared state/data helpers live in `src/lib/learning` or small hooks, not in a new mega-controller.

### 9.2 Delete obsolete code

Remove from Learning:

- onboarding state
- onboarding fetches
- onboarding forms/dialogs/workspace presentation
- onboarding mutation helpers

`/learning/onboarding` remains only the redirect.

### 9.3 Architecture target

No new frontend file should require a grandfathered architecture budget. The end state should remove `LearningPageClient.tsx` from active route imports; delete it entirely if all references are migrated.

Existing large `CourseExperience.tsx` is in scope for production-quality audit and targeted extraction only where needed to keep new behavior maintainable; avoid a gratuitous rewrite of the working player.

## 10. API design

The following paths are the implementation contract for this change.

### `GET /api/learning/me`

Learner-safe context:

- capabilities
- linked employee identity needed by Learning UI
- own enrollments/progress summary
- own due/required/continue state
- own path-derived state as needed by Home/Paths
- own employee certificate state needed by Learning Home/Certificates

Must not return arbitrary workforce Learning rows.

### `GET /api/learning/catalog`

Published/active course catalog plus current learner enrollment state when a linked employee exists. It never returns draft/inactive courses to learner requests.

### `POST /api/learning/studio/courses`

Atomic course + initial curriculum creation.

### `POST /api/learning/assignments`

Atomic course/path assignment batch.

### `GET /api/learning/manage`

Returns capabilities plus manager assignment overview as needed by management shell; company-scoped through employees.

### `GET /api/learning/studio/report`

Keep the existing endpoint and add supported query filters plus company scope.

### `POST /api/learning/studio/actions`

Keep specialized actions and harden the contract:

- `review_assignment` with `submissionId`, `approved`, optional/required feedback per decision, and `expectedUpdatedAt`
- `override_completion` with `enrollmentId` and required reason

Request-changes feedback is mandatory when `approved=false`.

### Learner progress endpoints

Keep `/api/learning/progress`, but all actions route through version-bound validation.

## 11. Notifications and audit

Assignment batches should notify the assigned employee after transaction commit, not once per course. Notification failure must not roll back a committed assignment; it should be logged for operational follow-up.

Review actions should notify the employee when:

- changes are requested
- assignment is approved

Completion override must create a durable Learning activity/audit record containing the reason and actor.

Existing application audit logging should also be used at API boundaries where consistent with the rest of Hrive.

## 12. Error handling and UX rules

- Never claim a path was assigned if only part of it succeeded.
- Never leave a newly created course without its requested initial curriculum because a second persistence call failed.
- Surface actionable domain errors (invalid course, archived course, content/version mismatch, stale review, no linked employee).
- Keep dialog state when a mutation fails so users can correct input.
- Reload authoritative server state after successful mutations.
- Disable duplicate submits while saving and use idempotency for assignment creation.
- Destructive archive/delete actions require confirmation.
- If an employee is authenticated but has no linked employee record, Learning self-service shows a clear account-linking error rather than an empty catalog/progress shell.

## 13. Data migration

Expected schema change:

- add `LearningAssignmentBatch` / `hr_learning_assignment_batches`

No destructive migration is required.

Existing enrollments remain valid. Historical enrollments without assignment-batch metadata are treated as legacy/manual assignments.

If implementation discovers an existing suitable assignment/audit table that already provides all required idempotency/source semantics, prefer reusing it and document the deviation rather than adding a duplicate model.

No course-company migration or assignment-review version-column migration is part of this change.

## 14. TDD and regression strategy

### Domain/unit tests

Add RED→GREEN coverage for:

1. version-bound content validation rejects lesson from another course version
2. version-bound validation rejects block from another lesson/course version
3. heartbeat cannot write foreign lesson progress
4. quiz cannot submit a foreign block
5. assignment cannot submit a foreign block
6. assignment batch is atomic when one course is invalid
7. repeated assignment idempotency key does not duplicate work
8. completed enrollments are not reset by re-assignment
9. request-changes review requires feedback
10. stale assignment review using `expectedUpdatedAt` is rejected
11. completion override requires reason and records audit context
12. company-scoped report/review excludes out-of-scope employee data
13. atomic course creation rolls back course when curriculum persistence fails
14. learner self-service endpoint never returns another employee's enrollment
15. catalog endpoint excludes draft/inactive courses for learner use

### Structural regressions

Extend permanent Learning decomposition checks to assert:

- courses route no longer imports `LearningPageClient`
- paths route no longer imports `LearningPageClient`
- certificates route no longer imports `LearningPageClient`
- Learning home no longer imports `LearningPageClient`
- no obsolete onboarding implementation remains in Learning controller/components
- manager review/report routes exist
- extracted active Course Catalog remains outside the old controller
- `LearningPageClient` is deleted or has no active route imports
- learner routes use the self-service/catalog boundary instead of workforce-wide generic Learning reads

### Browser journeys

Add Playwright coverage for representative flows that can run with the existing test harness:

- learner opens Learning/Courses and reaches a course
- learner starts/continues course
- manager can reach Learning management/review/report routes
- routes do not dead-end when datasets are empty

Where authenticated seeded user roles are available, cover learner vs manager affordance differences.

## 15. Production gates

The final merge candidate must run on the exact head and require:

- `npm run check:architecture`
- frontend architecture regression checks
- Learning decomposition regression checks
- Learning production/end-to-end regression checks
- TypeScript type-check
- repository lint
- strict zero-warning lint on all Learning files changed by this work
- full Vitest suite
- Next.js production build
- Prisma validate
- migration deploy on clean PostgreSQL
- migration status
- Prisma-managed schema drift check
- Chromium Playwright smoke/E2E
- production Docker build
- aggregate production gate

A CI infrastructure stall may only be treated as an exception if it is clearly non-failing, repeated checks show no product error, and every other exact-head production lane is green; document the exception in the PR before merge.

## 16. Non-goals

- Rewriting Career Explorer, Achievements, Trusted Certificates, or the Course Player from scratch.
- Replacing People Onboarding with Learning Onboarding.
- Inventing a new LMS content format when the current version/section/lesson/block model is already adequate.
- Introducing course-level company ownership in this change; courses remain shared unless a separate multi-tenant catalog requirement is approved later.
- Removing legacy data solely to make the UI cleaner.
- Broadening generic HR CRUD so ordinary learner self-service can read workforce-wide Learning data.

## 17. Acceptance criteria

The project is complete when:

1. learner routes have truthful learner-first UX and no inaccessible management CTAs
2. learner Home/Catalog use least-privilege self-service APIs and cannot read other employees' enrollments
3. Courses, Paths, Certificates, and Learning Home have dedicated controllers
4. `LearningPageClient` is no longer an active route dependency and preferably deleted
5. Learning onboarding duplicate code is removed
6. course + initial curriculum creation is atomic
7. path/multi-course assignment is atomic, idempotent, and auditable
8. learner progress mutations are bound to the enrollment's course version
9. assignment changes-requested → resubmit → approve is usable end-to-end
10. manager completion override is explicit, reasoned, audited, and scoped
11. Learning Management exposes assignment review and reports
12. manager operational data respects employee company scope
13. published learner catalog excludes drafts/inactive courses
14. stale assignment reviews are conflict-safe through `expectedUpdatedAt`
15. all permanent Learning regression and normal production gates pass on the exact merge head
