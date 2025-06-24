# Docker MinIO Setup Guide

## Overview

This guide explains the MinIO configuration in the Docker Compose setup for the Studio recruitment management system.

## Docker Compose Configuration

### MinIO Service Configuration

```yaml
minio:
  image: minio/minio:latest
  ports:
    - "9847:9000" # MinIO API port (external:internal)
    - "9848:9001" # MinIO Console port (external:internal)
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minio_secret_password
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3
    start_period: 40s
```

### Application Environment Variables

```yaml
environment:
  MINIO_ENDPOINT: minio          # Internal Docker service name
  MINIO_PORT: 9000               # Internal port (not external)
  MINIO_ACCESS_KEY: minioadmin   # Must match MINIO_ROOT_USER
  MINIO_SECRET_KEY: minio_secret_password  # Must match MINIO_ROOT_PASSWORD
  MINIO_BUCKET_NAME: canditrack-resumes
  MINIO_USE_SSL: false
  MINIO_PUBLIC_BASE_URL: http://10.0.10.57:9847  # External access URL
```

## Port Configuration

### External Ports (Host Machine)
- **9847** - MinIO API (for file uploads/downloads)
- **9848** - MinIO Console (web interface)

### Internal Ports (Docker Network)
- **9000** - MinIO API (used by the application)
- **9001** - MinIO Console

### Why This Configuration?

1. **Internal Communication**: The app uses `minio:9000` to communicate within the Docker network
2. **External Access**: Files are accessed via `http://10.0.10.57:9847` from outside Docker
3. **Console Access**: MinIO web interface available at `http://10.0.10.57:9848`

## Access URLs

### For Application (Internal)
- **API**: `http://minio:9000` (within Docker network)
- **Console**: `http://minio:9001` (within Docker network)

### For External Access
- **API**: `http://10.0.10.57:9847` (for file downloads)
- **Console**: `http://10.0.10.57:9848` (for administration)

## Health Checks

The MinIO service includes a health check that:
- Tests the `/minio/health/live` endpoint
- Runs every 30 seconds
- Times out after 20 seconds
- Retries 3 times before marking unhealthy
- Waits 40 seconds before first check

## Dependencies

The application waits for MinIO to be healthy before starting:

```yaml
depends_on:
  minio:
    condition: service_healthy
```

## Testing the Configuration

### 1. Start the Services

```bash
docker-compose up -d
```

### 2. Check Service Status

```bash
docker-compose ps
```

### 3. Test MinIO Connection

```bash
# Run the test script
node test-minio-config.js
```

### 4. Access MinIO Console

Open your browser and go to: `http://10.0.10.57:9848`

Login with:
- Username: `minioadmin`
- Password: `minio_secret_password`

### 5. Test API Endpoints

```bash
# Check MinIO bucket status
curl http://localhost:9846/api/setup/check-minio-bucket

# Initialize application services
curl -X POST http://localhost:9846/api/setup/initialize
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution**: Check if MinIO container is running
```bash
docker-compose ps minio
```

#### 2. Access Denied
```
Error: Access Denied
```
**Solution**: Verify credentials match between app and MinIO service

#### 3. Bucket Not Found
```
Error: NoSuchBucket
```
**Solution**: The bucket will be created automatically on first use

#### 4. Health Check Failing
```
minio_1 | curl: command not found
```
**Solution**: The MinIO image doesn't include curl. Update health check:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9000/minio/health/live"]
```

### Debugging Commands

```bash
# Check MinIO logs
docker-compose logs minio

# Check app logs
docker-compose logs app

# Access MinIO container
docker-compose exec minio sh

# Test network connectivity
docker-compose exec app ping minio
```

## Security Considerations

### Production Deployment

1. **Change Default Credentials**:
   ```yaml
   environment:
     MINIO_ROOT_USER: your_secure_username
     MINIO_ROOT_PASSWORD: your_secure_password
   ```

2. **Enable SSL**:
   ```yaml
   environment:
     MINIO_USE_SSL: true
   ```

3. **Use Environment Files**:
   ```bash
   # .env file
   MINIO_ROOT_USER=your_secure_username
   MINIO_ROOT_PASSWORD=your_secure_password
   ```

4. **Restrict Network Access**:
   ```yaml
   # Only expose necessary ports
   ports:
     - "127.0.0.1:9847:9000"  # Only localhost access
   ```

## File Storage

### Bucket Structure
- **Bucket Name**: `canditrack-resumes`
- **Purpose**: Store candidate resumes and documents
- **Access**: Public read, authenticated write

### File Organization
```
canditrack-resumes/
├── resumes/
│   ├── candidate-1/
│   │   ├── resume.pdf
│   │   └── cover-letter.pdf
│   └── candidate-2/
│       └── resume.docx
└── avatars/
    ├── user-1.jpg
    └── user-2.png
```

## Monitoring

### Health Check Endpoints
- **MinIO Health**: `http://10.0.10.57:9847/minio/health/live`
- **App Health**: `http://localhost:9846/api/setup/initialize`

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f minio
docker-compose logs -f app
```

## Backup and Recovery

### Backup MinIO Data
```bash
# Backup the entire MinIO data volume
docker run --rm -v studio_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz -C /data .
```

### Restore MinIO Data
```bash
# Restore from backup
docker run --rm -v studio_minio_data:/data -v $(pwd):/backup alpine tar xzf /backup/minio-backup.tar.gz -C /data
```

## Performance Tuning

### MinIO Configuration
```yaml
command: server /data --console-address ":9001" --address ":9000" --cache-drive "/cache" --cache-drive-opts "max-use=80"
```

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

This configuration ensures that MinIO is properly set up for the Studio application with automatic bucket initialization and proper networking. 