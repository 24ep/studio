# Development Guide

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

---

## 1. Local Development Setup

### 1.1 Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL 15+ (or use Docker)
- Git

### 1.2 Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd studio-1

# Install dependencies
npm install

# Set up environment
cp env.local.template .env.local

# Edit .env.local with your configuration
# At minimum, configure:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - MINIO credentials

# Run database migrations
npx prisma migrate dev --schema=prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Seed database with initial data
npm run db:seed

# Create admin user (if needed)
npm run db:create-admin

# Start development server
npm run dev
```

---

## 2. Development Workflow

### 2.1 Starting Development Services

**Option 1: Use Docker for dependencies**
```bash
# Start PostgreSQL and MinIO
docker-compose up -d postgres minio

# Start development server
npm run dev
```

**Option 2: With Background Processor**
```bash
# For testing upload queue functionality
npm run dev:with-processor
```

Access at http://localhost:8021

### 2.2 Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Create new migration
npm run db:dev

# Check migration status
npm run db:status

# Reset database (WARNING: deletes data)
npm run db:reset
```

---

## 3. Code Style & Standards

### 3.1 TypeScript
- Strict mode enabled
- All files must be typed
- No `any` types without justification

### 3.2 React Components
- Use functional components with hooks
- Separate client/server components with `"use client"` directive
- Keep components focused and reusable

### 3.3 ESLint & Prettier
- ESLint configured with Next.js rules
- Automatic code formatting with Prettier (if configured)

---

## 4. Available Scripts

### 4.1 Development

```bash
npm run dev                    # Start development server (port 8021)
npm run dev:custom             # Start custom development server
npm run dev:with-processor     # Start dev server with background processor
npm run build                  # Build for production
npm run start                  # Start production server
npm run start:local            # Start local development server
npm run start:local:with-processor  # Start local server with processor
npm run start:production       # Start production server with all services
npm run lint                   # Run ESLint
npm run typecheck              # Run TypeScript checks
```

### 4.2 Database Management

```bash
npm run db:migrate             # Run database migrations
npm run db:migrate:force       # Force run migrations
npm run db:dev                 # Development migration
npm run db:deploy              # Deploy migrations
npm run db:check               # Check database schema
npm run db:reset               # Reset database (WARNING: deletes data)
npm run db:status              # Check migration status
npm run db:studio              # Open Prisma Studio
npm run db:seed                # Seed database with initial data
npm run db:create-admin        # Create admin user
npm run db:migrate:seed        # Run migrations and seed
```

### 4.3 Background Processing

```bash
npm run processor              # Start background processor
npm run processor:pm2          # Start processor with PM2
npm run processor:pm2:stop     # Stop PM2 processor
npm run processor:pm2:restart  # Restart PM2 processor
npm run processor:pm2:logs     # View PM2 processor logs
```

### 4.4 Data Management

```bash
npm run seed:demo-data         # Seed demo data
npm run seed:upload-queue      # Seed upload queue with test data
npm run fix:stages             # Fix stage mismatches
npm run fix:stages:dry-run     # Dry run for stage fixes
npm run fix:applicant-status   # Fix applicant status issues
npm run fix:status-rename      # Update components to use statusId
```

### 4.5 Docker Management

```bash
npm run start:docker           # Start Docker containers
npm run stop:docker            # Stop Docker containers
npm run logs:docker            # View Docker logs
```

### 4.6 Setup & Utilities

```bash
npm run setup:local            # Setup local development environment
npm run clean                  # Clean build artifacts
```

---

## 5. Common Development Tasks

### 5.1 Adding a New API Endpoint

1. Create route file: `src/app/api/your-endpoint/route.ts`
2. Export HTTP methods (GET, POST, PUT, DELETE)
3. Add authentication/authorization checks
4. Document in Swagger if needed

**Example:**
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({ data: 'example' });
}
```

### 5.2 Adding a New Page

1. Create page file: `src/app/your-page/page.tsx`
2. Add to sidebar navigation if needed
3. Update routing configuration

**Example:**
```typescript
// src/app/example/page.tsx
export default function ExamplePage() {
  return (
    <div>
      <h1>Example Page</h1>
    </div>
  );
}
```

### 5.3 Adding a New Database Model

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --schema=prisma/schema.prisma` or create migration
3. Generate Prisma client: `npx prisma generate`
4. Update types if needed

### 5.4 Adding a New Component

1. Create component file in appropriate directory
2. Use TypeScript with proper typing
3. Follow component naming conventions
4. Add to component exports if shared

---

## 6. Testing

```bash
# Run tests (if configured)
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 7. Debugging

### 7.1 Browser DevTools
- React DevTools for component inspection
- Network tab for API debugging
- Console for runtime errors

### 7.2 Server-Side Debugging

```bash
# View application logs
docker-compose logs -f app

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f minio

# Access database directly
docker exec -it <postgres-container> psql -U user -d database
```

### 7.3 Prisma Studio

```bash
# Open Prisma Studio for database inspection
npm run db:studio
```

---

## 8. Code Quality

### 8.1 Before Committing

```bash
# Run lint checks
npm run lint

# Run type checks
npm run typecheck

# Run tests
npm run test
```

### 8.2 Commit Message Format

Use conventional commit format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

---

## 9. Related Documentation

- [Architecture](../architecture/Architecture.md) - System architecture overview
- [Sustainable Engineering](../Sustainable Engineering.md) - Code quality and standards
- [API Overview](./API Overview.md) - REST API reference
- [CLI Reference](./CLI Reference.md) - Command-line tools
- [Contributing](../../CONTRIBUTING.md) - Contribution guidelines
