# HR AI Screening Application - Port 8021 Deployment

## Overview
This document provides instructions for deploying the HR AI Screening Application on port 8021 using Docker and Docker Compose.

## Prerequisites
- Docker Engine (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Portainer (optional, for web-based management)
- Access to the Docker development server at `10.0.10.71`

## Directory Structure
The application will be deployed to `/var/dockers/8021` with the following structure:
```
/var/dockers/8021/
├── uploads/           # File uploads
├── logs/             # Application logs
├── data/             # Application data
├── postgres_data/    # PostgreSQL database files
├── minio_data/       # MinIO object storage
├── redis_data/       # Redis cache data
└── processor_logs/   # Upload queue processor logs
```

## Quick Start

### 1. Setup Environment
Run the deployment script to create necessary directories and setup the environment:
```bash
chmod +x deploy-8021.sh
./deploy-8021.sh
```

### 2. Configure Environment Variables
Copy the environment template and update with your specific configuration:
```bash
cp env.8021.template .env
# Edit .env file with your specific settings
```

### 3. Build and Deploy
Build and start the application:
```bash
docker-compose -f docker-compose.8021.yml up -d --build
```

### 4. Verify Deployment
Check the status of all services:
```bash
docker-compose -f docker-compose.8021.yml ps
```

## Portainer Deployment

### Stack Configuration
If using Portainer, create a new stack with the following configuration:

**Stack Name:** `8021_hr_ai_screening`

**Compose File Content:**
```yaml
version: "3.8"

services:
  8021_hr_ai_screening:
    image: 8021_hr_ai_screening:latest
    restart: always
    environment:
      # Copy environment variables from .env file
      NODE_ENV: production
      APP_PORT: 8021
      # ... (all other environment variables)
    volumes:
      - /var/dockers/8021/uploads:/app/uploads
      - /var/dockers/8021/logs:/app/logs
      - /var/dockers/8021/data:/app/data
    ports:
      - "8021:8021"
    networks:
      - docker_internal
    # ... (other configuration)

  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: studio_user
      POSTGRES_PASSWORD: StudioSecurePass2024!
      POSTGRES_DB: studio_db
    volumes:
      - /var/dockers/8021/postgres_data:/var/lib/postgresql/data
    networks:
      - docker_internal

  minio:
    image: minio/minio:latest
    restart: always
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: MinioSecurePass2024!
    command: server /data --console-address ":9001" --address ":9000"
    volumes:
      - /var/dockers/8021/minio_data:/data
    networks:
      - docker_internal

  redis:
    image: redis:alpine
    restart: always
    volumes:
      - /var/dockers/8021/redis_data:/data
    networks:
      - docker_internal

  upload-queue-processor:
    image: 8021_upload_processor:latest
    restart: always
    environment:
      # Copy environment variables from .env file
    volumes:
      - /var/dockers/8021/processor_logs:/app/logs
    networks:
      - docker_internal
    depends_on:
      - 8021_hr_ai_screening
      - postgres
      - minio
      - redis

networks:
  default:
    external: true
    name: docker_external

  docker_internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.21.0/24
          gateway: 172.20.21.1
```

## Services

### Main Application (8021_hr_ai_screening)
- **Port:** 8021
- **Image:** `8021_hr_ai_screening:latest`
- **Description:** Main HR AI screening application
- **Health Check:** Available at `/api/health`

### PostgreSQL Database
- **Port:** 5432 (internal), 80211 (external)
- **Image:** `postgres:14-alpine`
- **Description:** Primary database for the application
- **Data Persistence:** `/var/dockers/8021/postgres_data`
- **External Access:** Available at `10.0.10.71:80211`

### MinIO Object Storage
- **Ports:** 9000 (API), 9001 (Console)
- **Image:** `minio/minio:latest`
- **Description:** Object storage for file uploads
- **Data Persistence:** `/var/dockers/8021/minio_data`

### Redis Cache
- **Port:** 6379 (internal)
- **Image:** `redis:alpine`
- **Description:** Caching and session storage
- **Data Persistence:** `/var/dockers/8021/redis_data`

### Upload Queue Processor
- **Image:** `8021_upload_processor:latest`
- **Description:** Background processor for file uploads
- **Logs:** `/var/dockers/8021/processor_logs`

## Network Configuration

### External Network
- **Name:** `docker_external`
- **Type:** External network (must exist)

### Internal Network
- **Name:** `docker_internal`
- **Type:** Bridge network
- **Subnet:** `172.20.21.0/24`
- **Gateway:** `172.20.21.1`

## Environment Variables

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `MINIO_ENDPOINT`: MinIO server endpoint
- `REDIS_URL`: Redis connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `NEXTAUTH_URL`: Application URL

### Optional Variables
- `AZURE_AD_CLIENT_ID`: Azure AD integration
- `GOOGLE_API_KEY`: Google services integration
- `RESUME_PROCESSING_WEBHOOK_URL`: External webhook processing

## Management Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.8021.yml logs -f

# Specific service
docker-compose -f docker-compose.8021.yml logs -f 8021_hr_ai_screening
```

### Stop Services
```bash
docker-compose -f docker-compose.8021.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.8021.yml restart
```

### Update Application
```bash
docker-compose -f docker-compose.8021.yml pull
docker-compose -f docker-compose.8021.yml up -d
```

## Monitoring

### Health Checks
- Application: `http://10.0.10.71:8021/api/health`
- MinIO Console: `http://10.0.10.71:9848`
- Database: `10.0.10.71:80211` (PostgreSQL)

### Log Locations
- Application logs: `/var/dockers/8021/logs/`
- Processor logs: `/var/dockers/8021/processor_logs/`
- Database logs: Available via `docker-compose logs postgres`

## Troubleshooting

### Common Issues

1. **Port 8021 already in use**
   ```bash
   sudo netstat -tulpn | grep 8021
   # Stop the conflicting service or change the port
   ```

2. **Database connection issues**
   ```bash
   docker-compose -f docker-compose.8021.yml logs postgres
   # Check if PostgreSQL is running and accessible
   ```

3. **Permission issues**
   ```bash
   sudo chown -R $USER:$USER /var/dockers/8021
   sudo chmod -R 755 /var/dockers/8021
   ```

4. **Network connectivity issues**
   ```bash
   docker network ls
   # Ensure docker_external network exists
   docker network create docker_external
   ```

### Support
For additional support, check the application logs and ensure all environment variables are properly configured.

## Security Notes

1. **Change default passwords** in the `.env` file
2. **Use strong secrets** for `NEXTAUTH_SECRET`
3. **Configure firewall** to allow only necessary ports
4. **Regular updates** of Docker images and dependencies
5. **Backup data** regularly from `/var/dockers/8021/`

## Backup and Recovery

### Backup
```bash
# Database backup
docker-compose -f docker-compose.8021.yml exec postgres pg_dump -U studio_user studio_db > backup.sql

# File backup
tar -czf backup-$(date +%Y%m%d).tar.gz /var/dockers/8021/
```

### Recovery
```bash
# Restore database
docker-compose -f docker-compose.8021.yml exec -T postgres psql -U studio_user studio_db < backup.sql

# Restore files
tar -xzf backup-YYYYMMDD.tar.gz -C /
``` 