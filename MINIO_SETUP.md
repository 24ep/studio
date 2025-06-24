# MinIO Automatic Bucket Initialization

## Overview

The Studio recruitment management system includes automatic MinIO bucket initialization to ensure file uploads work seamlessly without manual configuration.

## How It Works

### 1. Automatic Bucket Creation

When the application starts or when file uploads are attempted, the system automatically:

- **Checks if MinIO is available** - Tests connection to the MinIO server
- **Creates the bucket if it doesn't exist** - Uses the `ensureBucketExists()` function
- **Configures bucket settings** - Sets up public read access and versioning (optional)
- **Tests bucket access** - Verifies the bucket is ready for use

### 2. Environment Variables

Configure MinIO connection using these environment variables:

```env
# MinIO Server Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Bucket Configuration
MINIO_BUCKET_NAME=uploads
MINIO_PUBLIC_BASE_URL=http://localhost:9000
```

### 3. API Endpoints

#### Check MinIO Status
```http
GET /api/setup/check-minio-bucket
```

**Response:**
```json
{
  "status": "success",
  "bucket": "uploads",
  "message": "Bucket is ready for uploads",
  "created": false
}
```

#### Initialize Application Services
```http
POST /api/setup/initialize
```

**Response:**
```json
{
  "status": "ready",
  "minio": {
    "status": "success",
    "message": "MinIO bucket initialized successfully",
    "bucket": "uploads"
  },
  "database": {
    "status": "success",
    "message": "Database connection successful"
  }
}
```

### 4. Bucket Configuration

When a new bucket is created, the system automatically configures:

- **Public Read Access** - Allows public access to uploaded files
- **Versioning** - Enables file versioning for data protection
- **Bucket Policy** - Sets up S3-compatible access policies

### 5. Error Handling

The system provides detailed error messages for common issues:

- **Connection Errors** - "Cannot connect to MinIO server. Please check if MinIO is running."
- **Authentication Errors** - "Access denied. Please check MinIO credentials."
- **Bucket Errors** - "Bucket does not exist and could not be created."

### 6. Startup Integration

You can integrate MinIO initialization into your application startup:

```typescript
import { startupMinIOInitialization } from '@/lib/minio';

// During app startup
const result = await startupMinIOInitialization();
if (result.status === 'success') {
  console.log('MinIO ready for file uploads');
} else {
  console.warn('MinIO not available:', result.message);
}
```

### 7. Manual Initialization

If you need to manually initialize the bucket:

```typescript
import { initializeMinIO } from '@/lib/minio';

const result = await initializeMinIO();
console.log('MinIO initialization result:', result);
```

## Benefits

1. **Zero Configuration** - Bucket is created automatically on first use
2. **Error Resilience** - Graceful handling of MinIO unavailability
3. **Detailed Logging** - Comprehensive logging for troubleshooting
4. **Health Monitoring** - API endpoints for monitoring bucket status
5. **Production Ready** - Proper error handling and status reporting

## Troubleshooting

### MinIO Not Running
```
Error: Cannot connect to MinIO server. Please check if MinIO is running.
```
**Solution:** Start your MinIO server or check the connection settings.

### Invalid Credentials
```
Error: Access denied. Please check MinIO credentials.
```
**Solution:** Verify `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` environment variables.

### Bucket Creation Failed
```
Error: Bucket does not exist and could not be created.
```
**Solution:** Check MinIO server permissions and ensure the access key has bucket creation rights.

## Docker Integration

When running with Docker, ensure MinIO is properly configured in your `docker-compose.yml`:

```yaml
services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
```

The Studio application will automatically detect and configure the MinIO bucket when it starts. 