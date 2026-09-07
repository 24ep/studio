# Learning Quality Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the live Achievements route from the oversized `LearningPageClient` while preserving its APIs, career-readiness calculations, and visible journey.

**Architecture:** Keep existing Learning and Career Explorer APIs authoritative. Extract the Achievements presentation into a focused component and add a small route controller that loads enrollments, courses, certificates, and career evidence. Switch only `/learning/achievements`; do not rewrite or delete unrelated legacy Learning views in this phase.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest, Playwright, GitHub Actions.

**Spec:** Implements the August 21, 2026 HRIS quality audit follow-up after Learning Phase 1, Headcount bulk hardening, and Leave draft durability.

## Global Constraints

- Preserve all existing Learning API paths and response semantics.
- Preserve existing permissions and server-side validation.
- No database migration.
- Keep the extracted route behavior equivalent to the current `LearningPageClient view="achievements"` journey.
- Keep new frontend files within the default 500-line architecture budget.
- Add route-boundary and browser coverage before integration.
- Do not mass-rewrite `LearningPageClient.tsx` in this phase.

---

### Task 1: Characterize Achievements route ownership

**Files:**
- Modify: `src/app/learning/learning-route-boundaries.test.ts`

**Interfaces:**
- Consumes: existing `/learning/achievements` route source.
- Produces: a regression contract requiring `AchievementsPageClient` and forbidding `LearningPageClient`.

- [ ] **Step 1: Add the failing route-boundary test**

Add a test that reads `src/app/learning/achievements/page.tsx`, asserts it does not contain `LearningPageClient`, and asserts it contains `AchievementsPageClient`.

- [ ] **Step 2: Run CI and verify RED**

Expected: the route-boundary test fails because the current route still imports `LearningPageClient`.

### Task 2: Extract Achievements domain helpers and view

**Files:**
- Create: `src/app/learning/achievement-view-utils.ts`
- Create: `src/app/learning/AchievementJourney.tsx`
- Test: `src/app/learning/achievement-view-utils.test.ts`

**Interfaces:**
- Produces: pure record/text/number/status/date helpers used only by the extracted Achievements view.
- Produces: `AchievementJourney({ courses, enrollments, certificates, career })`.

- [ ] **Step 1: Add focused unit tests for normalization helpers**

Cover camel/snake record lookup, active-course interpretation, numeric parsing, status normalization, and invalid date fallback.

- [ ] **Step 2: Implement minimal pure helpers**

No fetch, DOM, router, toast, or persistence behavior belongs in this utility module.

- [ ] **Step 3: Move the existing Achievements presentation unchanged in behavior**

Preserve readiness calculations, completed-learning evidence matching, career target selection, recommended-course selection, requirement expansion, and recommendation explanation.

### Task 3: Add the dedicated Achievements controller

**Files:**
- Create: `src/app/learning/AchievementsPageClient.tsx`

**Interfaces:**
- GET `/api/hr/learning`
- GET `/api/hr/learning?view=courses`
- GET `/api/hr/learning?view=certifications`
- GET `/api/learning/career-explorer`
- Renders: `AchievementJourney`

- [ ] **Step 1: Load the three Learning resources in parallel**

The primary Learning response remains required. Secondary course/certificate responses degrade to empty collections only if their individual request is unsuccessful, matching the legacy loader behavior.

- [ ] **Step 2: Load career evidence independently**

Career Explorer failure must degrade to `career=null` rather than make Achievements unreachable.

- [ ] **Step 3: Keep explicit loading, error, and retry states**

Use a small route-owned loading/error surface; do not import the giant `LearningPageClient` for shell behavior.

### Task 4: Switch route ownership and add browser coverage

**Files:**
- Modify: `src/app/learning/achievements/page.tsx`
- Modify: `e2e/hris-smoke.spec.ts`

- [ ] **Step 1: Route `/learning/achievements` to `AchievementsPageClient`**

- [ ] **Step 2: Add browser smoke coverage**

Verify `/learning/achievements` returns below 500, renders a visible body, and does not expose a fatal Learning load error when mocked APIs return valid empty data.

### Task 5: Production verification

- [ ] Run architecture check, TypeScript, lint, full Vitest, Next production build, browser smoke, clean database migrations/drift, Docker build, and aggregate production gate on the exact final PR head.
- [ ] Review the PR diff for API/schema/permission churn and unrelated formatting.
- [ ] Merge only the exact green head into `dev`.
