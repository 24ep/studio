# Sustainable Engineering Practices

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

> "Code is read much more often than it is written."

## 1. Guiding Principles

To ensure **HRI** remains maintainable, scalable, and robust over time, we adhere to the following core principles:

1.  **Strict Type Safety**: leverage TypeScript's full power to prevent runtime errors.
2.  **Documentation as Code**: Documentation should be treated with the same care as source code.
3.  **Automated Verification**: If it's not tested, it's broken.
4.  **Modular Architecture**: Components and services should be loosely coupled and highly cohesive.

---

## 2. Code Quality Standards

### 2.1 TypeScript & Linting
- **Strict Mode**: `strict: true` in `tsconfig.json` is non-negotiable.
- **No `any`**: Avoid `any` at all costs. Use `unknown` or generic types if strict types are not possible.
- **Linter**: Run `npm run lint` before every commit. Zero warnings policy.

### 2.2 Component Design
- **Atomic Design**: Build small, reusable components (Atoms -> Molecules -> Organisms).
- **Presentation vs Container**: Separate data fetching (Server Components) from UI logic (Client Components).
- **Props Interface**: Every component must have a clearly defined Props interface.

### 2.3 State Management
- **Server State**: Use React Query or direct Server Component data fetching. Avoid global client state for server data.
- **URL State**: Store filter/pagination state in the URL search params, not `useState`, to ensure shareability.

---

## 3. Documentation Strategy

Documentation is essential for sustainability.

- **`docs/` Directory**: The source of truth for all architectural decisions.
- **Architecture Decision Records (ADR)**: When making significant changes, create a new document in `docs/architecture/` explaining the "Why".
- **Code Comments**:
    - **Good**: Explains *why* a complex piece of logic exists.
    - **Bad**: Explains *what* the code does (the code should speak for itself).
- **Database Comments**: Maintain database descriptions in `prisma/schema.prisma` using `///` comments.

---

## 4. Testing & Reliability

### 4.1 Testing Pyramid
1.  **Static Analysis**: ESLint, TypeScript (Fastest, run on save).
2.  **Unit Tests**: Vitest for utility functions and complex hooks.
3.  **Integration Tests**: Test API routes and DB interactions.
4.  **E2E Tests**: Critical user flows (Login, Application Submission).

### 4.2 CI/CD Pipeline
- Every Pull Request must pass:
    - Linting
    - Type Checking
    - Unit Tests
    - Build Verification

---

## 5. Database Evolution

- **Migrations**: Never modify the database schema manually. Always use `npx prisma migrate dev`.
- **Seeding**: Keep `prisma/seed.ts` updated to generate a fully working local environment from scratch.
- **Backwards Compatibility**: When changing schema, consider how it affects existing data.

---

## 6. Git Workflow

### 6.1 Branching Strategy
- `main` / `master`: Production-ready code.
- `dev`: Active development branch.
- `feat/feature-name`: For new features.
- `fix/bug-issue`: For bug fixes.

### 6.2 Conventional Commits
Used to automate changelogs and versioning.
- `feat: add AI matching logic`
- `fix: resolve login timeout`
- `docs: update deployment guide`
- `refactor: simplify applicant state`

---

## 7. Performance & Optimization

- **Image Optimization**: Always use `next/image`.
- **Bundle Size**: Monitor package imports. Use lazy loading (`import()`) for heavy modules.
- **Database Indexing**: Ensure all foreign keys and frequently queried fields are indexed.

---

## 8. Directory Structure for Sustainability

We organize documentation to separate concerns:

- `docs/architecture/`: Core system design.
- `docs/workflows/`: Business and data flows.
- `docs/infrastructure/`: Deployment and ops.
- `docs/development/`: Developer guides and APIs.
- `docs/requirements/`: Business requirements.

Maintain this structure to keep information discoverable.
