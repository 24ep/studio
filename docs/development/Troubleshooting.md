# Troubleshooting Guide

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

## 1. Database Schema Issues

If you encounter errors like `column u.authenticationMethod does not exist`:

### Quick Fix
```bash
chmod +x fix-db-schema.sh
./fix-db-schema.sh
```

### Manual Fix
```bash
npx prisma generate
npx prisma migrate reset --force --schema=prisma/schema.prisma
npx prisma db seed
```

### Windows PowerShell
```powershell
.\fix-db-schema.ps1
```

---

## 2. Common Issues

### "Prisma client did not initialize yet"
```bash
npx prisma generate
# Restart the application
```

### "Database connection failed"
- Check `DATABASE_URL` environment variable
- Ensure PostgreSQL is running
- Verify network connectivity

### "MinIO connection failed"
- Check MinIO service status
- Verify `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
- Check MinIO endpoint configuration

### "Failed to fetch" errors
- Usually indicate authentication issues or network problems

### "Authentication required"
- User needs to sign in

### "applicant not found"
- The applicant ID is invalid or doesn't exist

### "Access denied"
- User doesn't have permission to view the resource

---

## 3. applicant Detail Modal Stuck

If modal shows "Loading applicant details...":

1. **Check authentication**:
   - Navigate to `http://localhost:8021/auth/signin`
   - Sign in with credentials

2. **Create admin user if needed**:
   ```bash
   $env:DATABASE_URL="postgresql://USER:PASSWORD@localhost:PORT/DATABASE"
   npm run db:create-admin
   ```

3. **Verify database is running**:
   ```bash
   netstat -an | findstr :8521
   ```

4. **Verify dev server is running**:
   ```bash
   netstat -an | findstr :8021
   ```

---

## 4. Log Analysis

```bash
# Docker Compose logs
docker-compose logs -f app

# Container logs
docker logs <container-name>

# Application logs
tail -f logs/app.log
```

---

## 5. Health Check Endpoints

- **Application**: `http://localhost:8021/api/health`
- **Session**: `http://localhost:8021/api/auth/session`
- **Database**: `http://localhost:8021/api/health/database`
- **MinIO**: `http://localhost:8021/api/health/minio`

---

## 6. Real-time (SSE)

The app uses Server-Sent Events:

- **Server**: `src/lib/realtime.ts` - `subscribe()` and `broadcast()`
- **Route**: `src/app/api/sse/route.ts`
- **Client**: `useEventSource('/api/sse')` from `src/hooks/useEventSource.ts`

Example broadcast:
```ts
import { broadcast } from '@/lib/realtime';
broadcast({ type: 'notification', message: 'hello' }, 'notification');
```

---

## Related Docs
- [Installation](../infrastructure/INSTALLATION.md)
- [Development](./DEVELOPMENT.md)
- [CLI Reference](./CLI_REFERENCE.md)
