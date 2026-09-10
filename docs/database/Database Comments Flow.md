# Database Field Description Flow

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

## 1. Architecture

The system uses a Prisma generator to convert source code comments into SQL `COMMENT ON` statements.

```mermaid
graph LR
    Prisma["schema.prisma (using ///)"] --> Gen["Prisma Generator"]
    Gen --> SQL["prisma/migrations/TIMESTAMP_update_comments/migration.sql"]
    SQL --> Deploy["Prisma migrate deploy"]
    Deploy --> DB["PostgreSQL COMMENT ON"]
```

---

## 2. Writing Descriptions

To document a model or field, use triple-slash (`///`) comments. These are picked up by both the Prisma Client (for Intellisense) and the database generator.

```prisma
/// User - Core identity table
model User {
  /// Unique identifier (UUID)
  id    String @id @db.Uuid
  /// Email used for identity
  email String @unique
}
```

---

## 3. Synchronizing to Database

Database comments are not applied during standard `prisma migrate` runs. They must be synced explicitly using the documentation utility.

### Step 1: Generate SQL
Run the following to refresh the SQL script:
```bash
npx prisma generate
```
When comments change, this creates a timestamped migration directory under
`./prisma/migrations`. When nothing changed, no migration is created.

### Step 2: Apply to Database
Run the utility script to generate and deploy the comment migration:
```bash
npm run db:comments
```

---

## 4. Viewing Descriptions

Once applied, you can view these descriptions in any standard database client:
- **DBeaver/pgAdmin**: Look at the "Description" or "Comment" column in the table/column properties.
- **SQL**: Run `SELECT description FROM pg_description;`

---

## 5. Benefits
1.  **Onboarding**: New developers see field purposes in their IDE and DB client simultaneously.
2.  **Governance**: No undocumented fields allowed in production migrations.
3.  **Audit**: Security-sensitive fields (e.g., `twoFactorSecret`) are clearly flagged at the database level.
