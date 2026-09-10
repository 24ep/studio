# Migration & Data Transition Guide

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

## 1. Database Migrations (Prisma)

HRI uses **Prisma Migrate** to manage the PostgreSQL schema. Migrations are tracked in the `prisma/migrations` directory.

### 1. Local Development
- **Create Migration**: `npx prisma migrate dev --name <description>`
- **Reset Database**: `npx prisma migrate reset` (⚠️ Deletes all data)

### 2. Production/Remote Deployment
On production servers, use the `deploy` command to apply pending migrations without resetting the database:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

---

## 2. File Storage Migration (MinIO)

For synchronizing resume files and avatars between servers or buckets, use the specialized Python migration script.

### 🔄 The Solution (`migrate_minio.py`)
This script performs a differential sync between two MinIO endpoints:
- **Parallel Workers**: Uses a thread pool to accelerate many small file transfers.
- **Integrity**: Verifies file size and ETag to skip unchanged objects (Differential Sync).
- **Metadata**: Preserves `Content-Type` and custom metadata during transfer.

```bash
# Example: Sync staging to production
python scripts/migrate_minio.py \
    --source-endpoint 10.0.10.57:8621 \
    --dest-endpoint prod-server:9000 \
    --source-bucket studio-dev \
    --dest-bucket studio-prod
```

---

## 3. Data Seeding & Initialization

Seeding ensures that the system has necessary configurations (Recruitment Stages, System Settings) to function after a fresh install.

### 🚀 Migration & Seed Script (`run-migrations-and-seed.sh`)
A unified shell script that automates the entire sequence for remote servers:
1.  **Validates** the `DATABASE_URL`.
2.  **Generates** the Prisma Client.
3.  **Applies** all pending migrations.
4.  **Seeds** the database using `prisma/seed.ts`.
5.  **Injects** SQL comments for database documentation.

---

## 4. Migration Checklist

| Task | Command | Tool |
| :--- | :--- | :--- |
| **Schema Sync** | `npm run db:deploy` | Prisma |
| **Data Seed** | `npm run db:seed` | Prisma/tsx |
| **Object Sync** | `python migrate_minio.py` | Python/Boto3 |
| **Comments Sync**| `npm run db:comments` | Custom Script |

---

## 5. Common Pitfalls & Solutions
- **Connection Timeouts**: Remote database migrations may time out. The `run-migrations-and-seed.sh` includes a pre-flight connection check to prevent hang-ups.
- **Migration Drift**: Never modify history files in `prisma/migrations`. Use `prisma migrate resolve` if a migration fails partway through on a remote server.
