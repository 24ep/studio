# Hrive Learning Production Completion Implementation Plan

> **For coding agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish Hrive Learning as a production-ready learner + manager module, close the audited workflow/security gaps, and retire the remaining `LearningPageClient` monolith without replacing it with another oversized controller.

**Architecture:** Harden the domain first: centralize Learning access/capabilities and version-bound content validation, add least-privilege learner APIs, add atomic/idempotent assignment batches, make initial course creation transactional, and isolate manager review/report/override logic. Then migrate each learner route to a small dedicated controller and build a capability-aware manager workspace. Keep Course Player, Course Studio, Achievements, Career Explorer, Trusted Certificates, and AI generation as existing subsystems, but route their persistence/actions through the new domain services where required.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript 5, PostgreSQL, Prisma 6.11, `pg`, Zod, Vitest, Playwright, Tailwind/Radix UI, existing Hrive permissions/audit/notification utilities.

**Design spec:** `docs/superpowers/specs/2026-08-24-hrive-learning-production-completion-design.md`

**Working branch:** `feat/hrive-learning-production-completion`

**Base:** `dev` at `d3a233d0c9a331f580ba18018c30f88d44d4d360`

---

## Task 1: Centralize Learning access and make progress strictly course-version-bound

**Files:**
- Create: `src/lib/learning/learning-access.ts`
- Create: `src/lib/learning/learning-access.test.ts`
- Create: `src/lib/learning/learning-integrity.ts`
- Create: `src/lib/learning/learning-integrity.test.ts`
- Modify: `src/lib/learning/learning-service.ts`
- Modify: `src/app/api/learning/progress/route.ts`
- Modify: `src/app/api/learning/courses/[id]/route.ts`

**Step 1 — Write failing capability/access tests.**

Cover the approved capability contract:

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

Test at minimum:
- linked employee + no manage permission can self-service but cannot manage;
- `HR_LEARNING_MANAGE` enables management/review/override/reports;
- no linked employee means learner self-service is unavailable;
- admin convention remains authoritative for management.

Run:

```bash
npx vitest run src/lib/learning/learning-access.test.ts
```

Expected RED: module/helper does not exist.

**Step 2 — Implement `learning-access.ts`.**

Move/centralize employee lookup and capability calculation out of the large service. Reuse existing permission helpers (`hasAnyPermission`, admin conventions) rather than duplicating role logic. Export a small actor/context shape that later manager services can use for company scoping.

**Step 3 — Write failing content-integrity tests.**

`learning-integrity.test.ts` must prove the lookup joins:

`hr_learning_enrollments.course_version_id -> hr_learning_course_sections.version_id -> hr_learning_lessons.section_id -> hr_learning_content_blocks.lesson_id`.

Test:
- valid enrollment/lesson passes;
- lesson from another course version fails;
- valid lesson + block passes;
- block from another lesson/version fails;
- completed enrollment still validates read ownership but heartbeat/update policy is enforced by caller.

Run:

```bash
npx vitest run src/lib/learning/learning-integrity.test.ts
```

Expected RED.

**Step 4 — Implement `assertEnrollmentContentAccess`.**

Suggested contract:

```ts
export async function assertEnrollmentContentAccess(input: {
  enrollmentId: string;
  employeeId: string;
  lessonId: string;
  blockId?: string;
}) {
  // one authoritative SQL validation chain
}
```

Return the validated enrollment/version/lesson/block metadata callers need. Throw a domain error on mismatch; never create progress as part of validation.

**Step 5 — Route all learner mutations through the helper.**

Refactor `recordHeartbeat`, `completeBlock`, `submitQuiz`, and `submitAssignment` so no write occurs before version-bound validation. In particular, heartbeat must no longer accept an arbitrary lesson ID merely because the enrollment belongs to the user.

**Step 6 — Keep course detail/start on the centralized access helper.**

Move `employeeForUser` to `learning-access.ts` (or re-export temporarily from `learning-service.ts` while call sites migrate). Avoid broadening draft visibility.

**Step 7 — Run focused verification.**

```bash
npx vitest run src/lib/learning/learning-access.test.ts src/lib/learning/learning-integrity.test.ts
npm run type-check
npx eslint src/lib/learning/learning-access.ts src/lib/learning/learning-integrity.ts src/app/api/learning/progress/route.ts src/app/api/learning/courses/[id]/route.ts --max-warnings=0
```

Expected GREEN.

**Step 8 — Commit.**

```bash
git add src/lib/learning/learning-access* src/lib/learning/learning-integrity* src/lib/learning/learning-service.ts src/app/api/learning/progress/route.ts src/app/api/learning/courses/[id]/route.ts
git commit -m "fix(learning): bind progress actions to enrolled course versions"
```

---

## Task 2: Add least-privilege learner self-service and catalog APIs

**Files:**
- Create: `src/lib/learning/learning-self-service.ts`
- Create: `src/lib/learning/learning-self-service.test.ts`
- Create: `src/app/api/learning/me/route.ts`
- Create: `src/app/api/learning/catalog/route.ts`
- Modify: `src/lib/learning/learning-service.ts`

**Step 1 — Write RED tests for self-service data scope.**

Prove:
- `getLearningSelfServiceContext` returns only the linked employee's enrollments, path-derived state, and employee certificates;
- catalog returns only `is_active=true` + `status='published'` courses to learner requests;
- catalog may decorate rows with the linked employee's own enrollment state but never another employee's;
- no linked employee returns an explicit self-service-unavailable context rather than workforce data;
- draft/inactive courses never leak through learner catalog.

Run:

```bash
npx vitest run src/lib/learning/learning-self-service.test.ts
```

Expected RED.

**Step 2 — Implement learner-safe read models.**

Keep return types explicit (do not use unbounded `Record<string, unknown>` for the API contract). Add only fields needed by Home/Catalog/Paths/Certificates.

**Step 3 — Implement `GET /api/learning/me`.**

Authenticate, resolve linked employee, compute capabilities, and return only the self-service context. Preserve app/module entitlement checks if the existing shell supplies them; do not equate broad `HR_LEARNING_VIEW` with access to other employees.

**Step 4 — Implement `GET /api/learning/catalog`.**

Authenticate, optionally resolve linked employee, return published/active course catalog plus own enrollment state. Manager draft preview remains on Studio/course-detail management APIs, not this endpoint.

**Step 5 — Run focused verification.**

```bash
npx vitest run src/lib/learning/learning-self-service.test.ts
npm run type-check
npx eslint src/lib/learning/learning-self-service.ts src/app/api/learning/me/route.ts src/app/api/learning/catalog/route.ts --max-warnings=0
```

Expected GREEN.

**Step 6 — Commit.**

```bash
git add src/lib/learning/learning-self-service* src/app/api/learning/me src/app/api/learning/catalog src/lib/learning/learning-service.ts
git commit -m "feat(learning): add least-privilege learner APIs"
```

---

## Task 3: Make course/path assignment atomic, idempotent, auditable, and company-scoped

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260824010000_add_learning_assignment_batches/migration.sql`
- Create: `src/lib/learning/learning-assignment-service.ts`
- Create: `src/lib/learning/learning-assignment-service.test.ts`
- Create: `src/app/api/learning/assignments/route.ts`

**Step 1 — Write RED domain tests before the migration/service.**

Cover:
1. one invalid course causes the whole batch to fail with zero enrollments written;
2. repeated idempotency key returns the existing batch and does not duplicate enrollments/events;
3. reassigning a completed employee/course does not reset progress/status/completed time;
4. path source metadata is preserved (`sourceType`, `sourceId`, `sourceLabel`);
5. source course IDs are snapshotted in the batch;
6. target employee outside the actor's company scope is rejected for non-admin management;
7. all course IDs must be active + published before any write.

Run:

```bash
npx vitest run src/lib/learning/learning-assignment-service.test.ts
```

Expected RED.

**Step 2 — Add `LearningAssignmentBatch`.**

Use the approved fields:
- `id`
- `employeeId`
- `courseIds` JSON
- `sourceType`
- `sourceId?`
- `sourceLabel`
- `dueDate?`
- `assignedByUserId`
- unique `idempotencyKey`
- `createdAt`

Map to `hr_learning_assignment_batches`. Add useful indexes on employee/date and source where appropriate. Do not change the existing unique `(employee_id, course_id)` enrollment rule.

**Step 3 — Implement a single transaction.**

`assignLearningBatch()` must:
- validate employee + company scope;
- validate all courses up front;
- create/find batch by idempotency key;
- upsert enrollments without resetting completed work;
- create Learning activity rows containing `assignmentBatchId` in metadata;
- commit or roll back as one unit.

Use SERIALIZABLE or an equivalent conflict-safe transaction if current database conventions support it. Handle unique-idempotency races by returning the authoritative existing batch.

**Step 4 — Notify once after commit.**

Use the application's existing notification mechanism. One assignment batch produces one employee notification; notification failure is logged after commit and does not roll back the assignment.

**Step 5 — Implement `POST /api/learning/assignments`.**

Use Zod. Require non-empty unique `courseIds`, source metadata, and client-generated idempotency key. Require `HR_LEARNING_MANAGE` and pass actor/company context into the service.

**Step 6 — Validate schema and tests.**

```bash
npx prisma validate --schema=prisma/schema.prisma
npx vitest run src/lib/learning/learning-assignment-service.test.ts
npm run type-check
npx eslint src/lib/learning/learning-assignment-service.ts src/app/api/learning/assignments/route.ts --max-warnings=0
```

Expected GREEN.

**Step 7 — Commit.**

```bash
git add prisma/schema.prisma prisma/migrations/20260824010000_add_learning_assignment_batches src/lib/learning/learning-assignment-service* src/app/api/learning/assignments
git commit -m "feat(learning): make learning assignment atomic and idempotent"
```

---

## Task 4: Make initial course creation transactional and reuse it from AI generation

**Files:**
- Create: `src/lib/learning/learning-course-authoring.ts`
- Create: `src/lib/learning/learning-course-authoring.test.ts`
- Create: `src/app/api/learning/studio/courses/route.ts`
- Modify: `src/app/api/learning/studio/courses/[id]/route.ts`
- Modify: `src/app/api/learning/generate/route.ts`
- Modify: `src/lib/learning/learning-service.ts`

**Step 1 — Write RED course-authoring tests.**

Cover:
- metadata + version + sections + lessons + blocks commit together;
- forced curriculum insert failure rolls back the course row;
- publish=true sets current version + published course state in the same transaction;
- publish=false creates a draft with no accidental public exposure;
- revision save keeps existing Course Studio semantics;
- AI-generated single course uses the same persistence primitive.

Run:

```bash
npx vitest run src/lib/learning/learning-course-authoring.test.ts
```

Expected RED.

**Step 2 — Extract `saveCurriculum` primitives from `learning-service.ts`.**

Create focused transaction helpers in `learning-course-authoring.ts`. Avoid nested independent transactions when creating a new course; the caller must own the whole transaction.

**Step 3 — Implement `POST /api/learning/studio/courses`.**

The route accepts metadata, curriculum, rules, and publish intent and requires `HR_LEARNING_MANAGE`. Cover upload may happen before this call; DB state must still be atomic.

**Step 4 — Keep `PUT /api/learning/studio/courses/[id]` for revisions.**

Delegate revision persistence to the authoring service. Do not remove manager draft preview GET behavior.

**Step 5 — Refactor AI generation persistence.**

Replace `createCourseDraft`'s direct course insert + separate `saveCurriculum` with the atomic authoring service. For AI path generation, create every generated course and the path inside one database transaction or one authoring orchestration transaction so a failed course does not leave a partial generated path.

**Step 6 — Run focused verification.**

```bash
npx vitest run src/lib/learning/learning-course-authoring.test.ts
npm run type-check
npx eslint src/lib/learning/learning-course-authoring.ts src/app/api/learning/studio/courses/route.ts src/app/api/learning/studio/courses/[id]/route.ts src/app/api/learning/generate/route.ts --max-warnings=0
```

Expected GREEN.

**Step 7 — Commit.**

```bash
git add src/lib/learning/learning-course-authoring* src/lib/learning/learning-service.ts src/app/api/learning/studio/courses src/app/api/learning/generate/route.ts
git commit -m "fix(learning): make course authoring transactional"
```

---

## Task 5: Harden manager review, completion override, reports, and company scope

**Files:**
- Create: `src/lib/learning/learning-management-service.ts`
- Create: `src/lib/learning/learning-management-service.test.ts`
- Create: `src/app/api/learning/manage/route.ts`
- Modify: `src/app/api/learning/studio/actions/route.ts`
- Modify: `src/app/api/learning/studio/report/route.ts`
- Modify: `src/lib/learning/learning-service.ts`

**Step 1 — Write RED management tests.**

Cover:
- request changes requires non-blank feedback;
- review verifies submission -> block -> lesson -> enrolled course version integrity;
- `expectedUpdatedAt` mismatch returns a stale/conflict result and writes nothing;
- approval can carry optional feedback and completes the approved assignment block through the validated completion engine;
- completion override requires reason and writes durable activity/audit metadata;
- company A manager cannot review/override/report on company B employees;
- report filters employee/course/status/due/completion date range;
- admin bypass follows existing Hrive admin convention only.

Run:

```bash
npx vitest run src/lib/learning/learning-management-service.test.ts
```

Expected RED.

**Step 2 — Implement company-scoped manager context.**

Reuse `learning-access.ts`. If actor company cannot be resolved and actor is not admin, return no global operational scope. Courses remain global; employee/enrollment/submission/report data does not.

**Step 3 — Implement conflict-safe review.**

Use `expectedUpdatedAt` in the SQL `WHERE`. On zero rows because timestamp changed, return/throw a typed conflict that the route maps to HTTP 409.

**Step 4 — Implement override with explicit audit.**

Do not expose generic progress editing as an alternate completion path. Preserve actor + reason in `hr_learning_activity_events` and application audit logging.

**Step 5 — Implement filtered report query.**

Return explicit DTOs for KPI summary, enrollment rows, and submissions. Apply identical scope/filters to data and CSV-producing consumers later.

**Step 6 — Harden routes.**

- `GET /api/learning/manage`: management capabilities + scoped overview.
- `POST /api/learning/studio/actions`: require `expectedUpdatedAt` for review; return 409 on stale; keep required reason for override.
- `GET /api/learning/studio/report`: parse filters, enforce scope.

**Step 7 — Run focused verification and commit.**

```bash
npx vitest run src/lib/learning/learning-management-service.test.ts
npm run type-check
npx eslint src/lib/learning/learning-management-service.ts src/app/api/learning/manage/route.ts src/app/api/learning/studio/actions/route.ts src/app/api/learning/studio/report/route.ts --max-warnings=0

git add src/lib/learning/learning-management-service* src/lib/learning/learning-service.ts src/app/api/learning/manage src/app/api/learning/studio/actions/route.ts src/app/api/learning/studio/report/route.ts
git commit -m "fix(learning): harden manager review and reporting"
```

---

## Task 6: Close the learner assignment feedback -> changes requested -> resubmit journey

**Files:**
- Modify: `src/lib/learning/learning-service.ts`
- Create: `src/app/learning/courses/[id]/LearningAssignmentBlock.tsx`
- Create: `src/app/learning/courses/[id]/learning-assignment-view-model.ts`
- Create: `src/app/learning/courses/[id]/learning-assignment-view-model.test.ts`
- Modify: `src/app/learning/courses/[id]/CourseExperience.tsx`
- Modify: `src/app/api/learning/courses/[id]/route.ts`

**Step 1 — Write RED view-model tests.**

Cover display/action states:
- no submission -> Submit;
- pending -> Awaiting review, no duplicate submit CTA unless editing is intentionally allowed;
- changes_requested -> show feedback + Resubmit;
- approved -> Approved/completed state;
- stale/unknown status has safe neutral presentation.

Run:

```bash
npx vitest run src/app/learning/courses/[id]/learning-assignment-view-model.test.ts
```

Expected RED.

**Step 2 — Add submissions to course detail.**

For the current enrollment only, query assignment submissions for blocks in the enrolled version and return a map keyed by block ID. Do not expose other employee submissions.

**Step 3 — Extract `LearningAssignmentBlock`.**

Move assignment-specific UI/mutation logic out of the already-large `CourseExperience.tsx`. Show feedback and allow resubmission after changes requested using the existing secure `submit_assignment` endpoint behavior.

**Step 4 — Make state authoritative after mutation.**

After submit/resubmit, reload course detail. Avoid optimistic status claims not confirmed by the server.

**Step 5 — Run focused verification and commit.**

```bash
npx vitest run src/app/learning/courses/[id]/learning-assignment-view-model.test.ts
npm run type-check
npx eslint src/app/learning/courses/[id]/LearningAssignmentBlock.tsx src/app/learning/courses/[id]/learning-assignment-view-model.ts src/app/learning/courses/[id]/CourseExperience.tsx --max-warnings=0

git add src/lib/learning/learning-service.ts src/app/learning/courses/[id] src/app/api/learning/courses/[id]/route.ts
git commit -m "feat(learning): complete assignment feedback and resubmission"
```

---

## Task 7: Extract the active Course Catalog and give `/learning/courses` its own controller

**Files:**
- Modify: `scripts/learning-component-decomposition-regression-checks.cjs`
- Create: `src/app/learning/CourseCatalogPageClient.tsx`
- Create: `src/app/learning/CourseCatalog.tsx`
- Create: `src/app/learning/CourseCreateDialog.tsx`
- Create: `src/app/learning/LearningAssignmentDialog.tsx`
- Modify: `src/app/learning/courses/page.tsx`
- Modify: `src/app/learning/AiLearningBuilderDialog.tsx`
- Modify: `src/app/learning/LearningPageClient.tsx`
- Reuse: `src/app/learning/LegacyCourseCatalog.tsx`

**Step 1 — Add RED structural assertions first.**

Update the decomposition script so it requires:
- `CourseCatalog.tsx` exists;
- `CourseCatalogPageClient.tsx` exists;
- `src/app/learning/courses/page.tsx` does not import `LearningPageClient`;
- active `CourseCatalog` implementation is not inline in `LearningPageClient`.

Run:

```bash
node scripts/learning-component-decomposition-regression-checks.cjs
```

Expected RED.

**Step 2 — Extract presentation without behavior drift.**

Move the current active catalog card/grid/search/filter logic into `CourseCatalog.tsx`. Preserve `LegacyCourseCatalog` only as the legacy fallback boundary guarded by the existing script.

**Step 3 — Build the dedicated controller.**

`CourseCatalogPageClient` owns:
- `GET /api/learning/catalog`;
- capabilities;
- search/category/required/status filters;
- create dialog state;
- AI dialog state;
- assign dialog state;
- archive/remove only if management capability permits.

Learner cards expose View/Start/Continue based on own enrollment state. Management controls are never rendered when unavailable.

**Step 4 — Wire atomic course creation.**

`CourseCreateDialog` uploads cover first if needed, then calls `POST /api/learning/studio/courses` once for DB persistence. On failure, keep form state and surface the domain error. Do not recreate the old course-then-curriculum two-call flow.

**Step 5 — Wire atomic assignment.**

`LearningAssignmentDialog` calls `POST /api/learning/assignments` once with a client-generated idempotency key; single-course assignment uses `sourceType='course'`, `sourceId=courseId`.

**Step 6 — Keep AI builder as generation UI only.**

The server generation route already persists through Task 4's authoring service. The dialog just reloads authoritative catalog after successful generation.

**Step 7 — Switch route and verify.**

```bash
node scripts/learning-component-decomposition-regression-checks.cjs
npm run type-check
npx eslint src/app/learning/CourseCatalogPageClient.tsx src/app/learning/CourseCatalog.tsx src/app/learning/CourseCreateDialog.tsx src/app/learning/LearningAssignmentDialog.tsx src/app/learning/courses/page.tsx --max-warnings=0
```

Expected GREEN.

**Step 8 — Commit.**

```bash
git add scripts/learning-component-decomposition-regression-checks.cjs src/app/learning
git commit -m "refactor(learning): extract production course catalog"
```

---

## Task 8: Extract Learning Paths and replace partial fan-out assignment

**Files:**
- Modify: `scripts/learning-component-decomposition-regression-checks.cjs`
- Create: `src/app/learning/LearningPathsPageClient.tsx`
- Create: `src/app/learning/LearningPathsView.tsx`
- Create: `src/app/learning/LearningPathDialog.tsx`
- Modify: `src/app/learning/paths/page.tsx`
- Modify: `src/app/learning/LearningPageClient.tsx`
- Modify: `src/app/learning/learning-workspace-model.ts`

**Step 1 — Add RED route-boundary assertion.**

Require `/learning/paths/page.tsx` to stop importing `LearningPageClient` and require extracted files.

**Step 2 — Extract path presentation and create/edit dialog.**

Keep current path CRUD semantics for path definitions. Show ordered course state using self-service context and catalog data.

**Step 3 — Replace assignment loop.**

Path assign calls `POST /api/learning/assignments` once with:

```ts
{
  employeeId,
  courseIds: path.courseIds,
  sourceType: 'path',
  sourceId: path.id,
  sourceLabel: path.title,
  dueDate,
  idempotencyKey,
}
```

Do not `Promise.all` or loop individual enrollment POSTs.

**Step 4 — Run structural + focused checks.**

```bash
node scripts/learning-component-decomposition-regression-checks.cjs
npm run type-check
npx eslint src/app/learning/LearningPathsPageClient.tsx src/app/learning/LearningPathsView.tsx src/app/learning/LearningPathDialog.tsx src/app/learning/paths/page.tsx --max-warnings=0
```

Expected GREEN.

**Step 5 — Commit.**

```bash
git add scripts/learning-component-decomposition-regression-checks.cjs src/app/learning
git commit -m "refactor(learning): extract learning paths and atomic assignment"
```

---

## Task 9: Extract Employee Certificates with self-service vs management separation

**Files:**
- Modify: `scripts/learning-component-decomposition-regression-checks.cjs`
- Create: `src/app/learning/EmployeeCertificatesPageClient.tsx`
- Create: `src/app/learning/EmployeeCertificateDialog.tsx`
- Modify: `src/app/learning/certificates/page.tsx`
- Modify: `src/app/learning/LearningPageClient.tsx`
- Reuse unchanged unless required: `src/app/learning/TrustedCertificatesPageClient.tsx`
- Reuse unchanged unless required: `src/app/learning/TrustedCertificatesWorkspace.tsx`

**Step 1 — Add RED route-boundary assertion.**

Require certificates route to no longer import the shared client.

**Step 2 — Implement employee certificate controller.**

Learner mode loads own certificate data from `/api/learning/me`. Management capability may additionally load/manage the verification work queue through scoped management/generic certification endpoints as appropriate, but the learner response itself never contains another employee's credentials.

**Step 3 — Extract dialog and management actions.**

Preserve add/verify/request-changes semantics. Hide create/verify controls without capability; do not let view-only users discover 403 through visible controls.

**Step 4 — Preserve Trusted Certificates boundary.**

Do not merge Trusted Certificates back into this controller. Keep its existing dedicated route/workspace.

**Step 5 — Verify and commit.**

```bash
node scripts/learning-component-decomposition-regression-checks.cjs
npm run type-check
npx eslint src/app/learning/EmployeeCertificatesPageClient.tsx src/app/learning/EmployeeCertificateDialog.tsx src/app/learning/certificates/page.tsx --max-warnings=0

git add scripts/learning-component-decomposition-regression-checks.cjs src/app/learning
git commit -m "refactor(learning): extract employee certificates"
```

---

## Task 10: Build the learner Home, remove duplicate onboarding code, and retire `LearningPageClient`

**Files:**
- Modify: `scripts/learning-component-decomposition-regression-checks.cjs`
- Create: `src/app/learning/LearningHomePageClient.tsx`
- Modify: `src/app/learning/LearningOverview.tsx`
- Modify: `src/app/learning/page.tsx`
- Modify: `src/app/learning/learning-workspace-model.ts`
- Verify redirect only: `src/app/learning/onboarding/page.tsx`
- Delete: `src/app/learning/LearningPageClient.tsx` after references are removed

**Step 1 — Add final RED decomposition assertions.**

Change the script from assuming the old client exists to asserting:
- Home/Courses/Paths/Certificates route files do not reference `LearningPageClient`;
- `LearningPageClient.tsx` is deleted, or if an unavoidable temporary compatibility shell remains, no active route imports it;
- Learning-owned onboarding state/dialog/function names are absent;
- `/learning/onboarding/page.tsx` still redirects to `/people/onboarding`.

This step will intentionally break the current script's `readFileSync` assumption; update it safely to support the desired deleted-file end state.

**Step 2 — Build `LearningHomePageClient`.**

Use `/api/learning/me` + `/api/learning/catalog`. Prioritize:
1. Continue learning
2. Required / due soon
3. Assigned/path-derived learning
4. Available courses
5. Recent achievements entry point
6. Credentials entry point

Pass explicit props into `LearningOverview`; do not reintroduce broad fetch/mutation orchestration there.

**Step 3 — Remove obsolete onboarding model/UI.**

Delete `OnboardingForm`, `onboardingFormDefault`, and Learning-only onboarding dialog/workspace code. People Onboarding remains the owner.

**Step 4 — Delete the shared controller.**

Search first:

```bash
rg "LearningPageClient" src scripts
```

Expected before deletion: only the file itself and structural checks, then zero active route references. Delete it and update strict-lint CI later in Task 12.

**Step 5 — Verify.**

```bash
node scripts/learning-component-decomposition-regression-checks.cjs
node scripts/learning-legacy-catalog-reference-check.cjs
npm run check:architecture
npm run type-check
npx eslint src/app/learning/LearningHomePageClient.tsx src/app/learning/LearningOverview.tsx src/app/learning/page.tsx src/app/learning/learning-workspace-model.ts --max-warnings=0
```

Expected GREEN.

**Step 6 — Commit.**

```bash
git add -A src/app/learning scripts/learning-component-decomposition-regression-checks.cjs
git commit -m "refactor(learning): retire shared learning controller"
```

---

## Task 11: Add first-class Learning Management review/report/override UX and navigation

**Files:**
- Create: `src/app/learning/LearningManagementPageClient.tsx`
- Create: `src/app/learning/LearningReviewQueue.tsx`
- Create: `src/app/learning/LearningReportsView.tsx`
- Create: `src/app/learning/manage/page.tsx`
- Create: `src/app/learning/manage/reviews/page.tsx`
- Create: `src/app/learning/manage/reports/page.tsx`
- Modify: `src/components/layout/SidebarNavConfig.ts`
- Modify: `src/components/layout/sidebar-hr-links.test.ts`
- Optionally create: `src/app/learning/learning-management-view-model.ts`
- Optionally create: `src/app/learning/learning-management-view-model.test.ts`

**Step 1 — Write navigation RED test.**

Extend `sidebar-hr-links.test.ts` to require capability/permission-gated management destinations in the Learning group, for example:
- `Learning Management` -> `/learning/manage`
- `Assignment Reviews` -> `/learning/manage/reviews`
- `Learning Reports` -> `/learning/manage/reports`

These entries require `HR_LEARNING_MANAGE` (or the narrowest existing permission supported by the sidebar model); My Learning remains self-service without requiring broad workforce Learning permission.

Run:

```bash
npx vitest run src/components/layout/sidebar-hr-links.test.ts
```

Expected RED because routes/config entries do not exist yet.

**Step 2 — Build management shell.**

`LearningManagementPageClient` calls `/api/learning/manage`, verifies capabilities, and provides direct navigation to assignments/reviews/reports. A user lacking management capability receives a truthful forbidden/return-to-Learning state, not controls that later 403.

**Step 3 — Build review queue.**

Show employee/course/block/submitted time/evidence/status/prior feedback. Approve and Request changes call `POST /api/learning/studio/actions` with `expectedUpdatedAt`. Request changes requires feedback client-side and server-side. On 409, show stale-state message and reload.

**Step 4 — Build completion override action.**

Expose only from a deliberate enrollment management action. Require visible warning, typed/entered reason, confirmation, and authoritative reload after success.

**Step 5 — Build reports.**

Use `/api/learning/studio/report` with query parameters for employee/course/status/due/completion date filters. Render KPI summary + enrollment table + submission table. CSV export must serialize the currently filtered authoritative result, not a hidden unfiltered dataset.

**Step 6 — Update sidebar navigation and test.**

Modify `SidebarNavConfig.ts` in the existing Learning group and keep route existence test green.

**Step 7 — Verify.**

```bash
npx vitest run src/components/layout/sidebar-hr-links.test.ts
npm run type-check
npx eslint src/app/learning/LearningManagementPageClient.tsx src/app/learning/LearningReviewQueue.tsx src/app/learning/LearningReportsView.tsx src/app/learning/manage src/components/layout/SidebarNavConfig.ts --max-warnings=0
```

Expected GREEN.

**Step 8 — Commit.**

```bash
git add src/app/learning src/components/layout/SidebarNavConfig.ts src/components/layout/sidebar-hr-links.test.ts
git commit -m "feat(learning): add management reviews and reports"
```

---

## Task 12: Add permanent Learning production regression coverage and pass every release gate

**Files:**
- Create: `scripts/learning-e2e-regression-checks.cjs`
- Modify: `scripts/learning-component-decomposition-regression-checks.cjs`
- Keep/modify as needed: `scripts/learning-legacy-catalog-reference-check.cjs`
- Create: `e2e/learning-production.spec.ts`
- Modify: `e2e/hris-smoke.spec.ts` only if existing route smoke is the better home for lightweight route checks
- Modify: `.github/workflows/quality.yml`

**Step 1 — Write permanent static regression checks.**

`learning-e2e-regression-checks.cjs` should fail unless all of these are wired:
- `/api/learning/me`
- `/api/learning/catalog`
- `/api/learning/assignments`
- `/api/learning/manage`
- atomic course create route
- version-bound progress helper is referenced by all mutation paths
- management actions include `expectedUpdatedAt`
- manager report route uses scoped management service
- manager pages/routes exist
- Home/Courses/Paths/Certificates no longer import `LearningPageClient`
- onboarding remains redirect-only
- assignment dialog uses batch assignment endpoint, not per-course generic POST fan-out.

Run RED before adding missing assertions/wiring, then GREEN after final fixes.

**Step 2 — Add browser journeys.**

Create `e2e/learning-production.spec.ts`. Follow existing CI pattern (mock/route only where database is intentionally unavailable in browser smoke). Cover at least:
- Learning home route renders/does not crash for unauthenticated redirect/auth shell behavior;
- course catalog route exists independently of old client;
- management/review/report routes are directly addressable and capability-protected;
- onboarding route resolves to People Onboarding behavior;
- no dead link in the Learning sidebar group.

If the e2e harness has authenticated fixtures available, add learner Start/Continue and manager Review flows; otherwise keep domain behavior in Vitest and browser coverage focused on route/UI boundaries.

**Step 3 — Update Quality gates.**

In `.github/workflows/quality.yml`:
- add `node scripts/learning-e2e-regression-checks.cjs` after existing Learning regressions;
- remove deleted `src/app/learning/LearningPageClient.tsx` from strict lint;
- add all new/refactored Learning files to strict zero-warning lint without making the command unmaintainably enormous (use focused globs only if shell expansion is stable in GitHub Actions).

Do not weaken or remove existing architecture, Time, database, browser, container, or aggregate gates.

**Step 4 — Run the complete local/application gate.**

```bash
npm run check:architecture
node scripts/frontend-architecture-regression-checks.cjs
node scripts/learning-component-decomposition-regression-checks.cjs
node scripts/learning-legacy-catalog-reference-check.cjs
node scripts/learning-e2e-regression-checks.cjs
npm run type-check
npm run lint
npm run test:run
npm run build
```

Expected: every command exits 0.

**Step 5 — Run database verification.**

With a clean PostgreSQL test database matching CI:

```bash
npx prisma validate --schema=prisma/schema.prisma
npx prisma db execute --schema=prisma/schema.prisma --file=scripts/ensure-postgresql-extensions.sql
npx prisma migrate deploy --schema=prisma/schema.prisma
npx prisma migrate status --schema=prisma/schema.prisma
node scripts/check-prisma-schema-drift.cjs
```

Expected: schema valid, migrations applied, no pending migration, no drift.

**Step 6 — Run browser smoke.**

```bash
npm run test:e2e -- --project=chromium
```

Expected: 0 failing Playwright tests.

**Step 7 — Build production container.**

```bash
docker build --tag studio-learning-ci:local .
```

Expected: Docker build exits 0. If local Docker is unavailable, the PR's standard `container-build` job remains mandatory evidence; do not claim it passed locally.

**Step 8 — Commit the release gates.**

```bash
git add scripts/learning-e2e-regression-checks.cjs scripts/learning-component-decomposition-regression-checks.cjs scripts/learning-legacy-catalog-reference-check.cjs e2e .github/workflows/quality.yml
git commit -m "test(learning): add production completion gates"
```

**Step 9 — Open the PR against `dev` and verify the exact head.**

The PR body must summarize:
- learner self-service data boundary;
- version-bound progress hardening;
- atomic course creation;
- atomic/idempotent assignment batches;
- review/override/report company scope;
- decomposed route controllers;
- retired duplicate onboarding/shared controller;
- exact test/gate evidence.

Before any merge, confirm branch is not behind `dev`, pin the exact head SHA, and require the normal repository production lanes:
- application
- database-schema + drift
- browser-smoke
- container-build
- aggregate production gate

Follow the repository's normal finishing-development-branch workflow for integration; do not bypass a real code/test failure.

---

## Implementation guardrails

- Do not raise architecture budgets to make the refactor pass.
- Do not replace `LearningPageClient` with another all-routes controller.
- Do not use generic HR CRUD as a bypass for assignment, progress completion, review, or override workflows.
- Do not let learner APIs return arbitrary workforce enrollment/certificate data.
- Do not reset completed enrollment state during reassignment.
- Do not create a course row before curriculum in a separate DB transaction.
- Do not send one notification per course for a single path assignment.
- Do not add a review `version` column unless `expectedUpdatedAt` demonstrably cannot provide the approved stale-write protection.
- Do not move People Onboarding behavior back into Learning.
- Prefer existing Hrive audit, notification, permission, and company-scope conventions over Learning-only duplicates.

## Completion definition

Learning is complete for this plan only when:
- learner Home/Catalog/Paths/Certificates are least-privilege and independently routed;
- Course Player validates every mutation against the enrolled version;
- assignment feedback/resubmit/approve has no dead end;
- path/course assignment is one atomic idempotent action;
- initial course + curriculum creation is atomic, including AI persistence;
- manager review/override/report workflows are directly usable and company-scoped;
- Learning management navigation is direct and capability-aware;
- duplicate onboarding implementation is removed;
- `LearningPageClient` is retired from active routes, preferably deleted;
- permanent Learning structural + E2E regressions are in Quality gates;
- TypeScript, lint, full Vitest, Next production build, Prisma migration/drift, Chromium E2E, Docker build, and aggregate production gate are green on the exact final head.
