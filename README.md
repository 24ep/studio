# CandiTrack - Modern Applicant Tracking System

A comprehensive, enterprise-grade Applicant Tracking System (ATS) built with Next.js, featuring advanced candidate management, automated workflows, and seamless integrations.

![CandiTrack](https://img.shields.io/badge/Next.js-14.2.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-green?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-20.10-blue?style=for-the-badge&logo=docker)

## 🚀 Features

### 📊 **Dashboard & Analytics**
- Real-time metrics and KPIs
- Candidate distribution charts
- Recruitment pipeline visualization
- Performance analytics

### 👥 **Candidate Management**
- **Comprehensive Profiles**: Detailed candidate information with custom fields
- **Resume Management**: Upload, version control, and automated parsing
- **Stage Tracking**: Visual Kanban board with drag-and-drop functionality
- **Transition History**: Complete audit trail of candidate progress
- **Recruiter Assignment**: Assign candidates to specific team members
- **Advanced Filtering**: Filter by skills, experience, location, and more
- **Bulk Operations**: Import/export candidates via CSV
- **AI Integration**: Automated resume parsing and candidate matching

### 💼 **Position Management**
- **Job Posting Creation**: Rich text editor with custom fields
- **Department Organization**: Structured position hierarchy
- **Status Tracking**: Open/closed position management
- **Candidate Matching**: AI-powered job-candidate matching
- **Bulk Import/Export**: CSV-based position management

### 👤 **User & Access Management**
- **Role-Based Access Control (RBAC)**: Admin, Recruiter, Hiring Manager roles
- **Granular Permissions**: Module-level access control
- **User Groups**: Create and manage permission groups
- **Azure AD Integration**: Single Sign-On (SSO) support
- **Password Security**: bcrypt hashing with force-change policies

### ⚙️ **System Configuration**
- **Custom Fields**: Define custom attributes for candidates and positions
- **Recruitment Stages**: Customizable hiring pipeline
- **Webhook Integration**: Connect with external automation services
- **Notification System**: Email and webhook notifications
- **Theme Customization**: Branded UI with custom colors and logos
- **API Documentation**: Built-in Swagger documentation

### 🔧 **Technical Features**
- **Real-time Updates**: WebSocket-based live collaboration
- **File Storage**: MinIO integration for secure file management
- **Caching**: Redis-powered performance optimization
- **Audit Logging**: Complete system activity tracking
- **Health Monitoring**: Built-in health checks and monitoring

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **UI Framework** | Tailwind CSS, ShadCN UI Components |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL 15 |
| **Authentication** | NextAuth.js (Azure AD + Credentials) |
| **File Storage** | MinIO Object Storage |
| **Caching** | Redis |
| **AI/ML** | Genkit (Google AI) |
| **Deployment** | Docker, Docker Compose |
| **Monitoring** | Built-in health checks, audit logging |

## 📋 Prerequisites

- **Docker & Docker Compose** (for production deployment)
- **Node.js 18+** (for development)
- **PostgreSQL 15+** (if not using Docker)
- **Redis 6+** (if not using Docker)

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd studio-2
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit with your configuration
   nano .env
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - **Main App**: http://localhost:9846
   - **MinIO Console**: http://localhost:9848
   - **Default Login**: admin@ncc.com / nccadmin

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

## ⚙️ Configuration

### Environment Variables

#### **Essential Configuration**
```env
# Application
NODE_ENV=production
NEXTAUTH_URL=http://your-domain:9846
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/dbname

# MinIO Storage
MINIO_ENDPOINT=minio
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=studio-files

# Redis Cache
REDIS_URL=redis://redis:6379
```

#### **Optional Configuration**
```env
# Azure AD SSO
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Webhook Integration
RESUME_PROCESSING_WEBHOOK_URL=https://your-webhook-endpoint
GENERAL_PDF_WEBHOOK_URL=https://your-pdf-processor

# AI Integration
GOOGLE_API_KEY=your-google-ai-key
```

### Port Configuration

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| **Main App** | 9846 | 9846 | Next.js application |
| **MinIO API** | 9000 | 9847 | Object storage API |
| **MinIO Console** | 9001 | 9848 | Storage management UI |
| **PostgreSQL** | 5432 | 5432 | Database |
| **Redis** | 6379 | 9849 | Cache |

## 🔐 Authentication

### Default Admin Account
- **Email**: `admin@ncc.com`
- **Password**: `nccadmin`

⚠️ **Security Note**: Change the default password immediately after first login.

### Authentication Methods
1. **Email/Password**: Traditional login with bcrypt hashing
2. **Azure AD SSO**: Enterprise single sign-on (optional)

## 📊 Database Schema

The application uses Prisma ORM with the following key models:

- **User**: Authentication and user management
- **Candidate**: Candidate profiles and data
- **Position**: Job positions and requirements
- **RecruitmentStage**: Hiring pipeline stages
- **UserGroup**: Role-based access control
- **SystemSetting**: Application configuration
- **AuditLog**: System activity tracking

## 🔄 Database Initialization

The application automatically initializes the database on first startup:

1. **Schema Creation**: Prisma pushes the schema to PostgreSQL
2. **Data Seeding**: Initial data is automatically inserted:
   - Admin user account
   - Default recruitment stages
   - User groups and permissions
   - Notification channels and events
   - Sample positions

## 🚀 Deployment Options

### 1. **Docker Compose** (Recommended)
```bash
docker-compose up -d
```

### 2. **Portainer Stack**
- Upload `docker-compose.yml` to Portainer
- Configure environment variables
- Deploy the stack

### 3. **Manual Docker**
```bash
# Build the image
docker build -t candidatrack .

# Run with environment variables
docker run -d \
  --name candidatrack \
  -p 9846:9846 \
  --env-file .env \
  candidatrack
```

### 4. **Production Deployment**
For production environments, consider:
- Using a reverse proxy (Nginx/Traefik)
- Setting up SSL certificates
- Configuring backup strategies
- Implementing monitoring and logging

## 🔧 Development

### Local Development Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run database migrations
npx prisma db push

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run processor    # Start background processor
```

## 📈 Monitoring & Health Checks

### Health Endpoint
- **URL**: `/api/health`
- **Method**: GET
- **Response**: Application status and version

### Built-in Monitoring
- Database connection status
- MinIO storage health
- Redis cache connectivity
- Background processor status

## 🔗 API Documentation

Access the interactive API documentation at:
- **URL**: `/api-docs`
- **Format**: Swagger/OpenAPI 3.0

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure NextAuth.js sessions
- **CSRF Protection**: Built-in CSRF tokens
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
docker exec postgres pg_dump -U user database > backup.sql

# Restore backup
docker exec -i postgres psql -U user database < backup.sql
```

### File Storage Backup
MinIO data is stored in Docker volumes. Backup the volume:
```bash
docker run --rm -v candidatrack_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz -C /data .
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation at `/docs`
- Review the API documentation at `/api-docs`
- Check application logs for error details
- Ensure all environment variables are properly configured

## 🔧 Troubleshooting

### Database Schema Issues

If you encounter errors like `column u.authenticationMethod does not exist`, it means the database schema is out of sync with the Prisma schema.

#### **Quick Fix (Recommended)**
```bash
# Run the schema fix script
chmod +x fix-db-schema.sh
./fix-db-schema.sh
```

#### **Manual Fix**
```bash
# Generate Prisma client
npx prisma generate

# Force reset database schema
npx prisma db push --force-reset --accept-data-loss

# Seed the database
npx prisma db seed
```

#### **Windows PowerShell**
```powershell
# Run the PowerShell fix script
.\fix-db-schema.ps1
```

### Common Issues

1. **"Prisma client did not initialize yet"**
   - Run `npx prisma generate`
   - Restart the application

2. **"Database connection failed"**
   - Check `DATABASE_URL` environment variable
   - Ensure PostgreSQL is running
   - Verify network connectivity

3. **"MinIO connection failed"**
   - Check MinIO service status
   - Verify `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
   - Check MinIO endpoint configuration

4. **"Redis connection failed"**
   - Check Redis service status
   - Verify `REDIS_URL` environment variable
   - Ensure Redis is accessible

### Log Analysis

Check application logs for detailed error information:
```bash
# Docker Compose logs
docker-compose logs -f app

# Container logs
docker logs <container-name>

# Application logs
tail -f logs/app.log
```

## 🔄 Changelog

### Latest Updates
- ✅ Fixed React rendering errors in Settings page
- ✅ Improved database initialization and seeding
- ✅ Enhanced system settings management
- ✅ Added comprehensive error handling
- ✅ Updated Docker deployment configuration

---

**CandiTrack** - Modern, scalable, and feature-rich Applicant Tracking System 