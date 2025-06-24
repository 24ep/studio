# Stack Deployment Troubleshooting Guide

## Issue: "Failed redeploying stack"

This guide provides step-by-step solutions for Docker Compose stack deployment failures.

## 🚨 Immediate Action Plan

### Step 1: Complete Cleanup
1. **Stop all containers:**
   ```bash
   docker-compose down
   ```

2. **Remove all volumes:**
   ```bash
   docker volume rm studio_postgres_data studio_minio_data studio_redis_data
   ```

3. **Remove all containers:**
   ```bash
   docker-compose rm -f
   ```

4. **Clean Docker system:**
   ```bash
   docker system prune -f
   ```

### Step 2: Check Port Conflicts
Check if these ports are already in use:
- **5432** (PostgreSQL)
- **9846** (Application)
- **9847** (MinIO API)
- **9848** (MinIO Console)
- **9849** (Redis)

**Windows Command:**
```cmd
netstat -ano | findstr :5432
netstat -ano | findstr :9846
netstat -ano | findstr :9847
netstat -ano | findstr :9848
netstat -ano | findstr :9849
```

### Step 3: Use Alternative Configuration
If you have port conflicts, use the alternative configuration:

```bash
# Use alternative docker-compose file
docker-compose -f docker-compose-alt.yml up -d
```

## 🔧 Alternative Solutions

### Solution 1: Simplified Deployment (No Health Checks)
Use `docker-compose-alt.yml` which removes health checks to avoid timing issues:

```bash
docker-compose -f docker-compose-alt.yml up -d
```

### Solution 2: Manual Service Startup
Start services one by one:

```bash
# 1. Start PostgreSQL first
docker-compose up -d postgres

# 2. Wait 30 seconds, then start MinIO
sleep 30
docker-compose up -d minio

# 3. Wait 10 seconds, then start Redis
sleep 10
docker-compose up -d redis

# 4. Wait 10 seconds, then start the app
sleep 10
docker-compose up -d app
```

### Solution 3: Different Ports
If you have port conflicts, modify the ports in `docker-compose.yml`:

```yaml
# PostgreSQL
ports:
  - "5433:5432"  # Use 5433 instead of 5432

# Application
ports:
  - "9845:9846"  # Use 9845 instead of 9846

# MinIO
ports:
  - "9850:9000"  # Use 9850 instead of 9847
  - "9851:9001"  # Use 9851 instead of 9848

# Redis
ports:
  - "9852:6379"  # Use 9852 instead of 9849
```

## 🔍 Diagnostic Commands

### Check Docker Status
```bash
# Check Docker version
docker --version
docker-compose --version

# Check Docker daemon
docker info
```

### Check Container Status
```bash
# List all containers
docker ps -a

# Check specific container logs
docker logs <container_name>

# Check container health
docker inspect <container_name> | grep -A 10 "Health"
```

### Check Network
```bash
# List networks
docker network ls

# Inspect network
docker network inspect studio_default
```

## 🐛 Common Issues and Solutions

### Issue 1: Port Already in Use
**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
1. Find what's using the port:
   ```cmd
   netstat -ano | findstr :5432
   ```
2. Kill the process or change the port
3. Use alternative ports in docker-compose.yml

### Issue 2: Volume Mount Errors
**Error:** `Error response from daemon: invalid volume specification`

**Solution:**
1. Remove problematic volumes:
   ```bash
   docker volume rm studio_postgres_data
   ```
2. Recreate volumes:
   ```bash
   docker volume create studio_postgres_data
   ```

### Issue 3: Permission Denied
**Error:** `permission denied while trying to connect to the Docker daemon`

**Solution:**
1. Run as administrator
2. Add user to docker group
3. Restart Docker Desktop

### Issue 4: Insufficient Resources
**Error:** `no space left on device`

**Solution:**
1. Clean Docker system:
   ```bash
   docker system prune -a
   ```
2. Increase Docker Desktop resources
3. Clean up disk space

### Issue 5: Health Check Timeouts
**Error:** `container is unhealthy`

**Solution:**
1. Use simplified configuration without health checks
2. Increase health check timeouts
3. Start services manually

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Docker Desktop is running
- [ ] No port conflicts
- [ ] Sufficient disk space
- [ ] Sufficient memory (at least 4GB)
- [ ] All volumes removed (if retrying)

### During Deployment
- [ ] PostgreSQL starts successfully
- [ ] MinIO starts successfully
- [ ] Redis starts successfully
- [ ] Application starts successfully
- [ ] All services are healthy

### Post-Deployment
- [ ] Application is accessible at http://localhost:9846
- [ ] MinIO console is accessible at http://localhost:9848
- [ ] Database is initialized with tables
- [ ] MinIO bucket is created

## 🚀 Quick Start Commands

### Fresh Start (Recommended)
```bash
# 1. Complete cleanup
docker-compose down
docker volume rm studio_postgres_data studio_minio_data studio_redis_data
docker system prune -f

# 2. Start with alternative config
docker-compose -f docker-compose-alt.yml up -d

# 3. Check status
docker-compose -f docker-compose-alt.yml ps
```

### Manual Startup
```bash
# 1. Start services one by one
docker-compose up -d postgres
timeout 30
docker-compose up -d minio
timeout 10
docker-compose up -d redis
timeout 10
docker-compose up -d app

# 2. Check logs
docker-compose logs -f
```

## 📞 Emergency Recovery

If nothing works, try this nuclear option:

```bash
# 1. Stop Docker Desktop completely
# 2. Delete Docker data (WARNING: This removes ALL Docker data)
# 3. Restart Docker Desktop
# 4. Start fresh
docker-compose up -d
```

## 🔍 Monitoring Deployment

### Real-time Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f minio
docker-compose logs -f redis
docker-compose logs -f app
```

### Health Monitoring
```bash
# Check service status
docker-compose ps

# Check resource usage
docker stats

# Check network connectivity
docker network inspect studio_default
```

This guide should help you resolve the stack deployment issues. Start with the "Fresh Start" approach for the best chance of success. 