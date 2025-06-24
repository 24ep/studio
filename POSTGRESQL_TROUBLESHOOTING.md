# PostgreSQL Troubleshooting Guide

## Issue: "container candidate-match-postgres-1 is unhealthy"

This guide helps you resolve PostgreSQL health check failures in the Docker Compose setup.

## Quick Fix Steps

### 1. Check Container Status
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres
```

### 2. Restart PostgreSQL Service
```bash
# Stop and remove the PostgreSQL container
docker-compose down postgres

# Remove the PostgreSQL volume (WARNING: This will delete all data)
docker volume rm studio_postgres_data

# Start PostgreSQL again
docker-compose up -d postgres

# Wait for it to be healthy
docker-compose ps postgres
```

### 3. Test PostgreSQL Connection
```bash
# Run the troubleshooting script
node troubleshoot-postgres.js

# Or test manually
docker-compose exec postgres psql -U devuser -d canditrack_db -c "SELECT 1;"
```

## Detailed Troubleshooting

### Health Check Configuration

The PostgreSQL health check is configured as:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U devuser -d canditrack_db -h localhost"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

### Common Issues and Solutions

#### 1. Database Initialization Failure

**Symptoms:**
- PostgreSQL starts but health check fails
- Logs show SQL syntax errors
- Tables are missing

**Solution:**
```bash
# Check init-db.sql for syntax errors
docker-compose logs postgres | grep -i error

# If there are syntax errors, fix them and restart
docker-compose down postgres
docker volume rm studio_postgres_data
docker-compose up -d postgres
```

#### 2. Permission Issues

**Symptoms:**
- Authentication failed
- Permission denied errors

**Solution:**
```bash
# Verify environment variables in docker-compose.yml
POSTGRES_USER: devuser
POSTGRES_PASSWORD: devpassword
POSTGRES_DB: canditrack_db

# Check if the user exists
docker-compose exec postgres psql -U postgres -c "\du"
```

#### 3. Port Conflicts

**Symptoms:**
- Connection refused
- Port already in use

**Solution:**
```bash
# Check if port 5432 is already in use
netstat -tulpn | grep 5432

# Change the port in docker-compose.yml if needed
ports:
  - "5433:5432"  # Use different external port
```

#### 4. Volume Issues

**Symptoms:**
- Data corruption
- Inconsistent state

**Solution:**
```bash
# Backup data if needed
docker run --rm -v studio_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Remove and recreate volume
docker-compose down postgres
docker volume rm studio_postgres_data
docker-compose up -d postgres
```

### Manual Database Setup

If automatic initialization fails, you can set up the database manually:

```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U devuser -d canditrack_db

# Run the initialization script manually
\i /docker-entrypoint-initdb.d/01-init-db.sql

# Or copy and paste the contents of init-db.sql
```

### Testing Database Connection

#### From Host Machine
```bash
# Test connection using the troubleshooting script
node troubleshoot-postgres.js

# Test with psql (if installed)
psql -h localhost -p 5432 -U devuser -d canditrack_db
```

#### From Inside Container
```bash
# Connect to PostgreSQL container
docker-compose exec postgres sh

# Test connection
psql -U devuser -d canditrack_db -c "SELECT version();"

# Check tables
psql -U devuser -d canditrack_db -c "\dt"
```

### Environment Variables

Ensure these environment variables are set correctly:

```yaml
environment:
  POSTGRES_USER: devuser
  POSTGRES_PASSWORD: devpassword
  POSTGRES_DB: canditrack_db
  POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
```

### Application Database URL

The application expects this database URL:
```
postgresql://devuser:devpassword@postgres:5432/canditrack_db
```

### Debugging Commands

```bash
# Check all container statuses
docker-compose ps

# Check PostgreSQL logs in real-time
docker-compose logs -f postgres

# Check health check status
docker inspect studio_postgres_1 | grep -A 10 "Health"

# Test health check manually
docker-compose exec postgres pg_isready -U devuser -d canditrack_db -h localhost

# Check PostgreSQL processes
docker-compose exec postgres ps aux

# Check disk space
docker-compose exec postgres df -h
```

### Performance Issues

If PostgreSQL is slow to start:

```yaml
# Add these to the postgres service in docker-compose.yml
environment:
  POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C --wal-segsize=16"
  POSTGRES_SHARED_PRELOAD_LIBRARIES: "pg_stat_statements"
```

### Backup and Recovery

#### Create Backup
```bash
# Create a backup of the database
docker-compose exec postgres pg_dump -U devuser canditrack_db > backup.sql
```

#### Restore Backup
```bash
# Restore from backup
docker-compose exec -T postgres psql -U devuser -d canditrack_db < backup.sql
```

### Complete Reset

If all else fails, perform a complete reset:

```bash
# Stop all services
docker-compose down

# Remove all volumes
docker volume rm studio_postgres_data studio_minio_data studio_redis_data

# Remove all containers
docker-compose rm -f

# Start fresh
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

### Monitoring

#### Check Service Health
```bash
# Check all service health
docker-compose ps

# Check specific service
docker-compose ps postgres
```

#### View Logs
```bash
# All logs
docker-compose logs

# PostgreSQL logs only
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f postgres
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `connection refused` | PostgreSQL not running | `docker-compose up -d postgres` |
| `authentication failed` | Wrong credentials | Check POSTGRES_USER/PASSWORD |
| `database does not exist` | Database not created | Check init-db.sql execution |
| `permission denied` | User permissions | Check user roles and grants |
| `port already in use` | Port conflict | Change external port mapping |

### Prevention

1. **Regular Backups**: Set up automated backups
2. **Health Monitoring**: Monitor health check status
3. **Resource Limits**: Set appropriate memory/CPU limits
4. **Log Rotation**: Configure log rotation to prevent disk space issues

This guide should help you resolve the PostgreSQL health check issues and get your application running properly. 