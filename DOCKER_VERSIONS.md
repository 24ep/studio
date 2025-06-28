# Docker Versions for Studio Application

This project provides multiple Docker configurations to use the pre-built `24ep/studio:dev` image instead of building from scratch.

## Available Docker Versions

### 1. Dockerfile.minimal
**File:** `Dockerfile.minimal` + `docker-compose.minimal.yml`

The most minimal version that uses the pre-built image directly with minimal customization.

**Features:**
- Uses `24ep/studio:dev` as base image
- Minimal environment variables
- No additional files copied
- Fastest deployment

**Usage:**
```bash
docker-compose -f docker-compose.minimal.yml up -d
```

### 2. Dockerfile.dev
**File:** `Dockerfile.dev` + `docker-compose.dev.yml`

Development version with additional runtime files and development settings.

**Features:**
- Uses `24ep/studio:dev` as base image
- Copies additional runtime files (`process-upload-queue.mjs`, `ws-queue-bridge.js`, `wait-for-db.sh`)
- Development environment settings
- Runs in development mode (`npm run dev`)
- Different ports to avoid conflicts (5433, 6380, 9002, 9003)

**Usage:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Dockerfile.prod
**File:** `Dockerfile.prod` + `docker-compose.prod.yml`

Production version with all necessary runtime files and production settings.

**Features:**
- Uses `24ep/studio:dev` as base image
- Copies additional runtime files (`process-upload-queue.mjs`, `ws-queue-bridge.js`, `wait-for-db.sh`)
- Production environment settings
- Runs in production mode (`npm run start`)
- Standard ports (5432, 6379, 9000, 9001)

**Usage:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Comparison

| Version | Base Image | Additional Files | Environment | Ports | Use Case |
|---------|------------|------------------|-------------|-------|----------|
| Minimal | 24ep/studio:dev | None | Production | 5434, 6381, 9004, 9005 | Quick testing |
| Dev | 24ep/studio:dev | Runtime files | Development | 5433, 6380, 9002, 9003 | Development |
| Prod | 24ep/studio:dev | Runtime files | Production | 5432, 6379, 9000, 9001 | Production |

## Environment Variables

All versions use the same environment variables from your `.env` file:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - NextAuth.js URL
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `AZURE_AD_CLIENT_ID` - Azure AD client ID
- `AZURE_AD_CLIENT_SECRET` - Azure AD client secret
- `AZURE_AD_TENANT_ID` - Azure AD tenant ID
- `GOOGLE_API_KEY` - Google API key
- `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY` - Google Fonts API key
- `REDIS_URL` - Redis connection string
- `MINIO_ENDPOINT` - MinIO endpoint
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key
- `MINIO_BUCKET_NAME` - MinIO bucket name

## Resource Limits

All versions include resource limits to prevent excessive CPU and memory usage:

- **App:** 1GB memory, 0.5 CPU cores
- **PostgreSQL:** 512MB memory, 0.25 CPU cores
- **Redis:** 256MB memory, 0.1 CPU cores
- **MinIO:** 512MB memory, 0.25 CPU cores

## Deployment in Portainer

1. **Upload the docker-compose file** you want to use to Portainer
2. **Set up environment variables** in Portainer or use a `.env` file
3. **Deploy the stack** using the selected docker-compose file

## Benefits of Using Pre-built Image

1. **Faster deployment** - No build time required
2. **More reliable** - Pre-built and tested image
3. **Lower resource usage** - No build process consuming CPU/memory
4. **Consistent builds** - Same image across all deployments
5. **Easier debugging** - Known working base image

## Troubleshooting

### If the pre-built image doesn't work:
1. Check if `24ep/studio:dev` image exists and is accessible
2. Verify the image has all necessary dependencies
3. Check the image's CMD/ENTRYPOINT configuration
4. Consider using the original `Dockerfile` for full build

### If additional files are missing:
1. Use `Dockerfile.dev` or `Dockerfile.prod` instead of `Dockerfile.minimal`
2. Check if the base image includes the required files
3. Verify file paths in the COPY commands

### Port conflicts:
- Each version uses different ports to avoid conflicts
- Check the port mappings in each docker-compose file
- Modify ports if needed for your environment 