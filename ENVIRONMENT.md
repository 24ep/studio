# Environment Variables Configuration

This document provides detailed information about all environment variables used in the Candidate Matching application.

## Quick Setup

1. **Copy the example file:**
   ```bash
   # Windows
   setup-env.bat
   
   # Linux/Mac
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual values

3. **Test your configuration:**
   ```bash
   # Windows
   test-env.bat
   ```

## Environment Variables Reference

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://devuser:devpassword@postgres:5432/canditrack_db` | Yes |
| `POSTGRES_USER` | PostgreSQL username | `devuser` | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password | `devpassword` | Yes |
| `POSTGRES_DB` | PostgreSQL database name | `canditrack_db` | Yes |
| `POSTGRES_PORT` | PostgreSQL external port | `5432` | No |

**Example:**
```env
DATABASE_URL=postgresql://myuser:mypassword@postgres:5432/mydb
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
```

### MinIO Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MINIO_ENDPOINT` | MinIO server endpoint | `minio` | Yes |
| `MINIO_PORT` | MinIO internal port | `9000` | Yes |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` | Yes |
| `MINIO_SECRET_KEY` | MinIO secret key | `minio_secret_password` | Yes |
| `MINIO_BUCKET_NAME` | MinIO bucket for file storage | `canditrack-resumes` | Yes |
| `MINIO_USE_SSL` | Use SSL for MinIO | `false` | Yes |
| `MINIO_PUBLIC_BASE_URL` | Public URL for MinIO files | `http://localhost:9847` | Yes |
| `MINIO_ROOT_USER` | MinIO root user | `minioadmin` | Yes |
| `MINIO_ROOT_PASSWORD` | MinIO root password | `minio_secret_password` | Yes |

**Example:**
```env
MINIO_ENDPOINT=minio
MINIO_ACCESS_KEY=myaccesskey
MINIO_SECRET_KEY=mysecretkey
MINIO_BUCKET_NAME=my-resumes
MINIO_PUBLIC_BASE_URL=http://myhost.com:9847
```

### Redis Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection string | `redis://redis:6379` | Yes |
| `REDIS_PORT` | Redis internal port | `6379` | No |

**Example:**
```env
REDIS_URL=redis://redis:6379
```

### NextAuth Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXTAUTH_URL` | Public URL of your application | `http://localhost:9846` | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth encryption | - | Yes |

**Example:**
```env
NEXTAUTH_URL=http://myapp.com
NEXTAUTH_SECRET=your_generated_secret_here
```

**Generate NEXTAUTH_SECRET:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

### Azure AD Configuration (Optional)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_AD_CLIENT_ID` | Azure AD application client ID | - | No |
| `AZURE_AD_CLIENT_SECRET` | Azure AD application client secret | - | No |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID | - | No |
| `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` | Public Azure AD client ID | - | No |
| `NEXT_PUBLIC_AZURE_AD_TENANT_ID` | Public Azure AD tenant ID | - | No |

**Example:**
```env
AZURE_AD_CLIENT_ID=your_azure_client_id
AZURE_AD_CLIENT_SECRET=your_azure_client_secret
AZURE_AD_TENANT_ID=your_azure_tenant_id
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your_azure_client_id
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your_azure_tenant_id
```

### Google API Configuration (Optional)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GOOGLE_API_KEY` | Google AI API key for Genkit | - | No |
| `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY` | Google Fonts API key | - | No |

**Example:**
```env
GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=your_google_fonts_key
```

### N8N Webhook Configuration (Optional)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `N8N_RESUME_WEBHOOK_URL` | n8n webhook for resume processing | - | No |
| `N8N_GENERIC_PDF_WEBHOOK_URL` | n8n webhook for generic PDF processing | - | No |

**Example:**
```env
N8N_RESUME_WEBHOOK_URL=https://my-n8n.com/webhook/resume
N8N_GENERIC_PDF_WEBHOOK_URL=https://my-n8n.com/webhook/pdf
```

### Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node.js environment | `production` | No |
| `APP_PORT` | Main application port | `9846` | No |
| `MINIO_API_PORT` | MinIO API external port | `9847` | No |
| `MINIO_CONSOLE_PORT` | MinIO Console external port | `9848` | No |
| `REDIS_EXTERNAL_PORT` | Redis external port | `9849` | No |

**Example:**
```env
NODE_ENV=production
APP_PORT=3000
MINIO_API_PORT=9001
MINIO_CONSOLE_PORT=9002
```

### Host Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HOST_URL` | Host URL for the application | `http://localhost:9846` | No |
| `PUBLIC_HOST_URL` | Public host URL | `http://localhost:9846` | No |

**Example:**
```env
HOST_URL=http://myapp.com
PUBLIC_HOST_URL=https://myapp.com
```

### Upload Queue Processor Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PROCESSOR_INTERVAL_MS` | Background processor interval in milliseconds | `5000` | No |
| `PROCESSOR_URL` | URL for the upload queue processor | `http://app:9846/api/upload-queue/process` | No |

**Example:**
```env
PROCESSOR_INTERVAL_MS=10000
PROCESSOR_URL=http://app:3000/api/upload-queue/process
```

## Environment-Specific Configurations

### Development Environment

```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:9846
HOST_URL=http://localhost:9846
PUBLIC_HOST_URL=http://localhost:9846
```

### Production Environment

```env
NODE_ENV=production
NEXTAUTH_URL=https://myapp.com
HOST_URL=https://myapp.com
PUBLIC_HOST_URL=https://myapp.com
```

### Docker Environment

```env
DATABASE_URL=postgresql://devuser:devpassword@postgres:5432/canditrack_db
MINIO_ENDPOINT=minio
REDIS_URL=redis://redis:6379
PROCESSOR_URL=http://app:9846/api/upload-queue/process
```

### Local Development (Outside Docker)

```env
DATABASE_URL=postgresql://devuser:devpassword@localhost:5432/canditrack_db
MINIO_ENDPOINT=localhost
REDIS_URL=redis://localhost:9849
PROCESSOR_URL=http://localhost:9846/api/upload-queue/process
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for `NEXTAUTH_SECRET`
3. **Rotate API keys** regularly
4. **Use environment-specific configurations**
5. **Limit access** to production environment variables

## Troubleshooting

### Common Issues

1. **Authentication errors**: Check `NEXTAUTH_URL` matches your actual application URL
2. **Database connection errors**: Verify `DATABASE_URL` and database credentials
3. **File upload failures**: Check MinIO configuration and bucket permissions
4. **Background processor errors**: Verify `PROCESSOR_URL` is accessible

### Testing Configuration

Use the provided test script:
```bash
# Windows
test-env.bat

# Linux/Mac
# Check each variable manually or create a similar script
```

### Validation Commands

```bash
# Test database connection
docker-compose exec app npx prisma db push

# Test MinIO connection
docker-compose exec app node -e "console.log(require('./src/lib/minio').testConnection())"

# Test Redis connection
docker-compose exec app node -e "console.log(require('./src/lib/redis').testConnection())"
```

## Migration from Hardcoded Values

If you're migrating from a version with hardcoded values:

1. **Backup your current configuration**
2. **Create `.env` file** using `setup-env.bat`
3. **Update values** in `.env` file
4. **Test configuration** using `test-env.bat`
5. **Restart services** with `docker-compose up -d` 