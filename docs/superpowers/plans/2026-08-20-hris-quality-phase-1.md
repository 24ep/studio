# HRIS Quality Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce cross-module HRIS frontend complexity safely, starting with Learning route ownership and regression coverage without changing Learning API or database contracts.

**Architecture:** Keep the existing Learning APIs and domain workspaces authoritative. Move routes that already have dedicated domain components away from the 6,735-line `LearningPageClient`, introduce a small Trusted Certificates controller for data/mutations, and add route-boundary/E2E checks before attempting deeper Learning decomposition.

**Tech Stack:** Next.js 15, React 18, TypeScript, Vitest, Playwright, GitHub Actions.

**Spec:** Implements the August 20, 2026 cross-module HRIS code-quality audit, beginning with the highest-priority Learning hotspot.

## Global Constraints

- Preserve existing API paths and payload semantics.
- Preserve authorization and server-side validation.
- No database migration in this phase.
- Do not duplicate domain UI that already has a dedicated component.
- Do not rewrite the 6,735-line Learning workspace in one change.
- Add behavior/architecture coverage before changing live route ownership.

---

### Task 1: Characterize Learning route boundaries

**Files:**
- Create: `src/app/learning/learning-route-boundaries.test.ts`

- [ ] Write a failing test proving Career Explorer and Trusted Certificates routes must not import `LearningPageClient`.
- [ ] Run the repository quality workflow and confirm the test fails before implementation.

### Task 2: Extract Career Explorer route ownership

**Files:**
- Modify: `src/app/learning/career-explorer/page.tsx`

- [ ] Render the existing self-contained `CareerExplorer` directly.
- [ ] Preserve its existing API calls and UI behavior.

### Task 3: Extract Trusted Certificates controller

**Files:**
- Create: `src/app/learning/TrustedCertificatesPageClient.tsx`
- Modify: `src/app/learning/trusted-certificates/page.tsx`

- [ ] Load `/api/hr/learning?view=certifications` directly in the small controller.
- [ ] Preserve trusted certificate create, update, permanent-delete payload semantics.
- [ ] Keep `TrustedCertificatesWorkspace` as the domain UI.
- [ ] Keep busy/error states explicit and reload authoritative server data after mutations.

### Task 4: Add browser smoke coverage

**Files:**
- Modify: `e2e/hris-smoke.spec.ts`

- [ ] Verify `/learning/career-explorer` and `/learning/trusted-certificates` do not return 5xx and render a visible body.

### Task 5: Production verification

- [ ] Run architecture, TypeScript, lint, full Vitest, Next production build, browser smoke, database schema/migrations, Docker image, and the aggregate production gate.
- [ ] Review diff for API/schema/permission churn.
- [ ] Merge only the exact green head into `dev`.
