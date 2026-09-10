# Installation Guide

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

## 1. Prerequisites

### 1.1 System Requirements
- **Docker & Docker Compose** (for production deployment)
- **Node.js 18+** (for development)
- **PostgreSQL 15+** (if not using Docker)
- **8GB RAM minimum** (16GB recommended for production)
- **2 CPU cores minimum** (4+ cores recommended for production)

---

## 2. Quick Start

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd studio-1
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp env.local.template .env.local
   
   # Edit with your configuration
   nano .env.local
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - **Main App**: http://localhost:8021
   - **MinIO Console**: http://localhost:9848
   - **N8N Workflow Automation**: http://localhost:8921
   - **Default Login**: Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured before first seed.
   - **N8N Login**: admin / admin

### Option 2: Portainer Deployment

1. **Upload to Portainer:**
   - Upload the project files to your server
   - Create a new stack in Portainer
   - Use the provided `docker-compose.yml`

2. **Configure environment variables in Portainer:**
   - Set all required environment variables
   - Ensure proper network configuration

3. **Deploy the stack:**
   - Portainer will automatically build and deploy
   - Database will be seeded with initial data

---

## 3. Environment Configuration

### 3.1 Essential Configuration

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=http://your-domain:8021
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@postgres:8521/dbname

# MinIO Storage
MINIO_ENDPOINT=minio
MINIO_ACCESS_KEY=CHANGE_ME_MINIO_ACCESS_KEY
MINIO_SECRET_KEY=CHANGE_ME_MINIO_SECRET_KEY
MINIO_BUCKET_NAME=studio-files
```

### 3.2 Optional Configuration

```env
# Azure AD SSO
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Webhook Integration
RESUME_PROCESSING_WEBHOOK_URL=https://your-webhook-endpoint
RESUME_PROCESSING_WEBHOOK_TOKEN=your_bearer_token_here
GENERAL_PDF_WEBHOOK_URL=https://your-pdf-processor
GENERAL_PDF_WEBHOOK_TOKEN=your_bearer_token_here
RESUME_PROCESSING_WEBHOOK_TIMEOUT=1800
WEBHOOK_CONNECTION_TIMEOUT=900

# AI Integration
GOOGLE_API_KEY=your-google-api-key
```

**Note**: AI API Key Fallback System - Configure multiple API keys with automatic failover for high availability.

### 3.3 Port Configuration

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| **Main App** | 8021 | 8021 | Next.js application |
| **MinIO API** | 9000 | 9847 | Object storage API |
| **MinIO Console** | 9001 | 9848 | Storage management UI |
| **PostgreSQL** | 8521 | 5432 | Database |
| **N8N** | 5678 | 8921 | Workflow automation |

---

## 4. Authentication Setup

### 4.1 Default Admin Account
- **Email**: Value of `ADMIN_EMAIL` (default: `admin@example.com`)
- **Password**: Value of `ADMIN_PASSWORD`; if unset, check startup logs for the generated password.

**Security Note**: Change the default password immediately after first login.

### 4.2 Creating Admin User
If the default admin user doesn't exist, create one using:
```bash
npm run db:create-admin
```

### 4.3 Authentication Methods
1. **Email/Password**: Traditional login with bcrypt hashing
2. **Azure AD SSO**: Enterprise single sign-on (optional)

### 4.4 Basic Authentication Toggle
You can enable/disable basic username/password login from:
- **System Settings UI**: Settings -> System Settings -> System tab -> Feature Configuration
- **CLI Backdoor**: See [CLI Reference](../development/CLI Reference.md)

---

## 5. Deployment Options

### 5.1 Docker Compose (Recommended)

```bash
docker-compose up -d
```

### 5.2 Portainer Stack
- Upload `docker-compose.yml` to Portainer
- Configure environment variables
- Deploy the stack

### 5.3 Manual Docker

```bash
# Build the optimized image (uses Next.js standalone output)
docker build -t hri:latest .

# Run with environment variables
docker run -d \
  --name hri \
  -p 8021:8021 \
  --env-file .env \
  hri:latest
```

**Note**: The Docker image uses Next.js standalone output mode, resulting in ~70% smaller image sizes compared to traditional builds. The final image is approximately 300-500MB instead of 2-3GB.

### 5.4 Production Deployment

For production environments, consider:
- Using a reverse proxy (Nginx/Traefik)
- Setting up SSL certificates
- Configuring backup strategies
- Implementing monitoring and logging

---

## 6. Database Initialization

The application automatically initializes the database on first startup:

1. **Schema Creation**: Prisma pushes the schema to PostgreSQL
2. **Data Seeding**: Initial data is automatically inserted:
   - Admin user account
   - Default recruitment stages
   - User groups and permissions
   - Notification channels and events
   - Sample positions

For details on managing migrations, see the [Migration Guide](./Migration Guide.md).

---

## 7. Verification

After installation, verify the setup:

1. **Health Check**:
   ```bash
   curl http://localhost:8021/api/health
   ```

2. **Database Connection**:
   ```bash
   curl http://localhost:8021/api/health/database
   ```

3. **MinIO Connection**:
   ```bash
   curl http://localhost:8021/api/health/minio
   ```

4. **Login Test**:
   - Navigate to http://localhost:8021/auth/signin
   - Login with default credentials

---

## 8. Related Documentation

- [Architecture](../architecture/Architecture.md) - System architecture overview
- [Development Guide](../development/Development Guide.md) - Local development setup
- [Troubleshooting](../development/Troubleshooting.md) - Common issues and solutions
- [CLI Reference](../development/CLI Reference.md) - Command-line tools

**Project Name:** HRI Enterprise  
**Document Version:** 1.0  
**Date:** December 16, 2025  
**Status:** Active Development

---

## 1. Prerequisites

### 1.1 System Requirements
- **Docker & Docker Compose** (for production deployment)
- **Node.js 18+** (for development)
- **PostgreSQL 15+** (if not using Docker)
- **8GB RAM minimum** (16GB recommended for production)
- **2 CPU cores minimum** (4+ cores recommended for production)

---

## 2. Quick Start

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd studio-1
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp env.local.template .env.local
   
   # Edit with your configuration
   nano .env.local
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - **Main App**: http://localhost:8021
   - **MinIO Console**: http://localhost:9848
   - **N8N Workflow Automation**: http://localhost:8921
   - **Default Login**: Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured before first seed.
   - **N8N Login**: admin / admin

### Option 2: Portainer Deployment

1. **Upload to Portainer:**
   - Upload the project files to your server
   - Create a new stack in Portainer
   - Use the provided `docker-compose.yml`

2. **Configure environment variables in Portainer:**
   - Set all required environment variables
   - Ensure proper network configuration

3. **Deploy the stack:**
   - Portainer will automatically build and deploy
   - Database will be seeded with initial data

---

## 3. Environment Configuration

### 3.1 Essential Configuration

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=http://your-domain:8021
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@postgres:8521/dbname

# MinIO Storage
MINIO_ENDPOINT=minio
MINIO_ACCESS_KEY=CHANGE_ME_MINIO_ACCESS_KEY
MINIO_SECRET_KEY=CHANGE_ME_MINIO_SECRET_KEY
MINIO_BUCKET_NAME=studio-files
```

### 3.2 Optional Configuration

```env
# Azure AD SSO
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Webhook Integration
RESUME_PROCESSING_WEBHOOK_URL=https://your-webhook-endpoint
RESUME_PROCESSING_WEBHOOK_TOKEN=your_bearer_token_here
GENERAL_PDF_WEBHOOK_URL=https://your-pdf-processor
GENERAL_PDF_WEBHOOK_TOKEN=your_bearer_token_here
RESUME_PROCESSING_WEBHOOK_TIMEOUT=1800
WEBHOOK_CONNECTION_TIMEOUT=900

# AI Integration
GOOGLE_API_KEY=your-google-api-key
```

> **Note**: AI API Key Fallback System - Configure multiple API keys with automatic failover for high availability.

### 3.3 Port Configuration

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| **Main App** | 8021 | 8021 | Next.js application |
| **MinIO API** | 9000 | 9847 | Object storage API |
| **MinIO Console** | 9001 | 9848 | Storage management UI |
| **PostgreSQL** | 8521 | 5432 | Database |
| **N8N** | 5678 | 8921 | Workflow automation |

---

## 4. Authentication Setup

### 4.1 Default Admin Account
- **Email**: Value of `ADMIN_EMAIL` (default: `admin@example.com`)
- **Password**: Value of `ADMIN_PASSWORD`; if unset, check startup logs for the generated password.

⚠️ **Security Note**: Change the default password immediately after first login.

### 4.2 Creating Admin User
If the default admin user doesn't exist, create one using:
```bash
npm run db:create-admin
```

### 4.3 Authentication Methods
1. **Email/Password**: Traditional login with bcrypt hashing
2. **Azure AD SSO**: Enterprise single sign-on (optional)

### 4.4 Basic Authentication Toggle
You can enable/disable basic username/password login from:
- **System Settings UI**: Settings → System Settings → System tab → Feature Configuration
- **CLI Backdoor**: See [CLI Reference](../development/CLI_REFERENCE.md)

---

## 5. Deployment Options

### 5.1 Docker Compose (Recommended)

```bash
docker-compose up -d
```

### 5.2 Portainer Stack
- Upload `docker-compose.yml` to Portainer
- Configure environment variables
- Deploy the stack

### 5.3 Manual Docker

```bash
# Build the optimized image (uses Next.js standalone output)
docker build -t hri:latest .

# Run with environment variables
docker run -d \
  --name hri \
  -p 8021:8021 \
  --env-file .env \
  hri:latest
```

> **Note**: The Docker image uses Next.js standalone output mode, resulting in ~70% smaller image sizes compared to traditional builds. The final image is approximately 300-500MB instead of 2-3GB.

### 5.4 Production Deployment

For production environments, consider:
- Using a reverse proxy (Nginx/Traefik)
- Setting up SSL certificates
- Configuring backup strategies
- Implementing monitoring and logging

---

## 6. Database Initialization

The application automatically initializes the database on first startup:

1. **Schema Creation**: Prisma pushes the schema to PostgreSQL
2. **Data Seeding**: Initial data is automatically inserted:
   - Admin user account
   - Default recruitment stages
   - User groups and permissions
   - Notification channels and events
   - Sample positions

For details on managing migrations, see the [Migration Guide](./Migration Guide.md).

---

## 7. Verification

After installation, verify the setup:

1. **Health Check**:
   ```bash
   curl http://localhost:8021/api/health
   ```

2. **Database Connection**:
   ```bash
   curl http://localhost:8021/api/health/database
   ```

3. **MinIO Connection**:
   ```bash
   curl http://localhost:8021/api/health/minio
   ```

4. **Login Test**:
   - Navigate to http://localhost:8021/auth/signin
   - Login with default credentials

---

## 8. Related Documentation

- [Architecture](../architecture/Architecture.md) - System architecture overview
- [Development Guide](../development/Development Guide.md) - Local development setup
- [Troubleshooting](../development/Troubleshooting.md) - Common issues and solutions
- [CLI Reference](../development/CLI Reference.md) - Command-line tools
- [n8n Integration](../integrations/n8n Integration.md) - Automation setup details
