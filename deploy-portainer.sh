#!/bin/bash

# =====================================================
# CandiTrack Portainer Deployment Script
# This script automates the deployment of CandiTrack through Portainer with Git integration
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}CandiTrack Portainer Deployment Script${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found, checking for 'docker compose' (v2)"
    if ! docker compose version &> /dev/null; then
        print_error "Neither docker-compose nor docker compose found"
        echo "Please install Docker Compose:"
        echo "  sudo apt-get install docker-compose-plugin"
        exit 1
    else
        COMPOSE_CMD="docker compose"
        print_status "Using Docker Compose v2"
    fi
else
    COMPOSE_CMD="docker-compose"
    print_status "Using Docker Compose v1"
fi

print_status "Docker environment verified"

# Check if required files exist
REQUIRED_FILES=("docker-compose.yml" "pg-init-scripts/init-db.sql")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done

print_status "All required files found"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating .env file with default values"
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpassword
POSTGRES_DB=canditrack_db
DATABASE_URL=postgresql://devuser:devpassword@postgres:5432/canditrack_db

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minio_secret_password
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minio_secret_password
MINIO_BUCKET_NAME=canditrack-resumes
MINIO_USE_SSL=false

# Redis Configuration
REDIS_URL=redis://redis:6379

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:9846
NEXTAUTH_SECRET=super-secret-nextauth-key-replace-this

# Azure AD Configuration (optional)
AZURE_AD_CLIENT_ID=your_azure_ad_application_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret_value
AZURE_AD_TENANT_ID=your_azure_ad_directory_tenant_id

# Environment
NODE_ENV=production
EOF
    print_status ".env file created"
else
    print_status ".env file already exists"
fi

# Make init script executable
chmod +x pg-init-scripts/init-database.sh
print_status "Made initialization script executable"

# Pull latest images
print_info "Pulling latest Docker images..."
$COMPOSE_CMD pull

# Start services
print_info "Starting CandiTrack services..."
$COMPOSE_CMD up -d

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 10

# Check if services are running
print_info "Checking service status..."
$COMPOSE_CMD ps

# Check database initialization
print_info "Checking database initialization..."
sleep 5

# Try to connect to database and check initialization
if docker exec $(docker ps -q -f name=postgres) psql -U devuser -d canditrack_db -c "SELECT value FROM \"SystemSetting\" WHERE key = 'databaseInitialized';" 2>/dev/null | grep -q "true"; then
    print_status "Database initialized successfully"
else
    print_warning "Database initialization check failed, but this is normal on first run"
    print_info "The database will be initialized automatically on first startup"
fi

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}CandiTrack Deployment Completed!${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}Application URL: http://localhost:9846${NC}"
echo -e "${GREEN}MinIO Console: http://localhost:9848${NC}"
echo -e "${GREEN}Admin Login: admin@ncc.com / nccadmin${NC}"
echo -e "${BLUE}=====================================================${NC}"

print_info "Useful commands:"
echo "  View logs: $COMPOSE_CMD logs -f"
echo "  Stop services: $COMPOSE_CMD down"
echo "  Restart services: $COMPOSE_CMD restart"
echo "  Update services: $COMPOSE_CMD pull && $COMPOSE_CMD up -d"

print_warning "Remember to:"
echo "  1. Change the default admin password"
echo "  2. Configure your Azure AD settings in .env"
echo "  3. Set up proper backups for the postgres_data volume"
echo "  4. Configure SSL certificates for production use"

# CandiTrack Portainer Deployment Script
# This script automates the deployment of CandiTrack through Portainer with Git integration
# Run this script on your Ubuntu server where Portainer is installed

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Configuration
GIT_REPO_URL="https://github.com/yourusername/canditrack.git"  # Update with your actual repo
BRANCH="main"  # or "master" depending on your default branch
STACK_NAME="canditrack"
COMPOSE_FILE="docker-compose.yml"

log "Starting CandiTrack deployment for Portainer..."

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    error "Docker Compose is not available. Please install Docker Compose first."
fi

# Check if Portainer is running
if ! docker ps | grep -q portainer; then
    warn "Portainer container not found. Make sure Portainer is running."
fi

log "Prerequisites check completed successfully"

# Create deployment directory
DEPLOY_DIR="$HOME/canditrack-deployment"
log "Setting up deployment directory: $DEPLOY_DIR"

if [ -d "$DEPLOY_DIR" ]; then
    log "Removing existing deployment directory..."
    rm -rf "$DEPLOY_DIR"
fi

mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Clone the repository
log "Cloning repository from: $GIT_REPO_URL"
if ! git clone -b "$BRANCH" "$GIT_REPO_URL" .; then
    error "Failed to clone repository. Please check your Git URL and branch name."
fi

# Verify essential files exist
log "Verifying project files..."
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Docker Compose file not found: $COMPOSE_FILE"
fi

if [ ! -f "Dockerfile" ]; then
    error "Dockerfile not found"
fi

if [ ! -d "pg-init-scripts" ]; then
    error "Database initialization scripts directory not found"
fi

if [ ! -f "pg-init-scripts/init-db.sql" ]; then
    error "Database initialization script not found"
fi

log "Project files verified successfully"

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    log "Creating default environment file..."
    cat > .env << EOF
# CandiTrack Environment Configuration
# Update these values according to your deployment environment

# Database Configuration
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpassword
POSTGRES_DB=canditrack_db
DATABASE_URL=postgresql://devuser:devpassword@postgres:5432/canditrack_db

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minio_secret_password
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minio_secret_password
MINIO_BUCKET_NAME=canditrack-resumes
MINIO_USE_SSL=false

# Redis Configuration
REDIS_URL=redis://redis:6379

# NextAuth Configuration
# IMPORTANT: Update NEXTAUTH_URL to your actual domain
NEXTAUTH_URL=http://your-domain.com:9846
NEXTAUTH_SECRET=super-secret-nextauth-key-replace-this

# Azure AD Configuration (Optional - for SSO)
AZURE_AD_CLIENT_ID=your_azure_ad_application_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret_value
AZURE_AD_TENANT_ID=your_azure_ad_directory_tenant_id

# n8n Integration (Optional)
N8N_RESUME_WEBHOOK_URL=
N8N_GENERIC_PDF_WEBHOOK_URL=

# Application Settings
NODE_ENV=production
EOF
    log "Default .env file created. Please review and update the values."
else
    log "Environment file already exists"
fi

# Create Portainer stack configuration
log "Creating Portainer stack configuration..."
cat > portainer-stack.yml << EOF
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "9846:9002"
    environment:
      # Database
      DATABASE_URL: \${DATABASE_URL}
      
      # MinIO
      MINIO_ENDPOINT: \${MINIO_ENDPOINT}
      MINIO_PORT: \${MINIO_PORT}
      MINIO_ACCESS_KEY: \${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: \${MINIO_SECRET_KEY}
      MINIO_BUCKET_NAME: \${MINIO_BUCKET_NAME}
      MINIO_USE_SSL: \${MINIO_USE_SSL}
      
      # Redis
      REDIS_URL: \${REDIS_URL}
      
      # NextAuth
      NEXTAUTH_URL: \${NEXTAUTH_URL}
      NEXTAUTH_SECRET: \${NEXTAUTH_SECRET}
      
      # Azure AD
      AZURE_AD_CLIENT_ID: \${AZURE_AD_CLIENT_ID}
      AZURE_AD_CLIENT_SECRET: \${AZURE_AD_CLIENT_SECRET}
      AZURE_AD_TENANT_ID: \${AZURE_AD_TENANT_ID}
      
      # n8n
      N8N_RESUME_WEBHOOK_URL: \${N8N_RESUME_WEBHOOK_URL}
      N8N_GENERIC_PDF_WEBHOOK_URL: \${N8N_GENERIC_PDF_WEBHOOK_URL}
      
      # App
      NODE_ENV: \${NODE_ENV}
    volumes:
      - app_node_modules:/app/node_modules
      - app_next:/app/.next
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_started
      redis:
        condition: service_started
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./pg-init-scripts:/docker-entrypoint-initdb.d:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  minio:
    image: minio/minio:latest
    ports:
      - "9847:9000"
      - "9848:9001"
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "9849:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
  redis_data:
  app_node_modules:
  app_next:
EOF

log "Portainer stack configuration created"

# Create deployment instructions
log "Creating deployment instructions..."
cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# CandiTrack Portainer Deployment Instructions

## Prerequisites
- Ubuntu server with Docker and Portainer installed
- Git repository access
- Domain name (optional but recommended)

## Deployment Steps

### 1. Environment Configuration
Edit the \`.env\` file and update the following critical values:

- **NEXTAUTH_URL**: Set to your actual domain (e.g., http://your-domain.com:9846)
- **NEXTAUTH_SECRET**: Generate a secure secret using: \`openssl rand -base64 32\`
- **Database credentials**: Update if you want different default credentials
- **Azure AD settings**: Configure if using Azure AD for authentication

### 2. Portainer Stack Deployment

1. Open Portainer in your browser
2. Navigate to "Stacks" in the left sidebar
3. Click "Add stack"
4. Enter stack name: \`canditrack\`
5. Choose "Upload" method
6. Upload the \`portainer-stack.yml\` file
7. Click "Deploy the stack"

### 3. Verify Deployment

After deployment, check the following:

1. **Application**: http://your-server-ip:9846
2. **MinIO Console**: http://your-server-ip:9848
   - Username: minioadmin
   - Password: minio_secret_password
3. **Database**: PostgreSQL on port 5432

### 4. Initial Setup

1. Access the application at http://your-server-ip:9846
2. You should see the setup page
3. The database will be automatically initialized with:
   - Default admin user: admin@canditrack.com
   - Default recruitment stages
   - System settings

### 5. Post-Deployment Configuration

1. **MinIO Bucket Setup**:
   - Access MinIO console at http://your-server-ip:9848
   - Create bucket: \`canditrack-resumes\`
   - Set bucket policy to allow uploads

2. **SSL/HTTPS Setup** (Recommended):
   - Configure reverse proxy (nginx/traefik)
   - Set up SSL certificates
   - Update NEXTAUTH_URL to use HTTPS

3. **Backup Configuration**:
   - Set up regular backups of the \`postgres_data\` volume
   - Backup MinIO data directory

## Troubleshooting

### Database Issues
- Check PostgreSQL logs: \`docker logs canditrack_postgres_1\`
- Verify initialization script execution
- Check database connectivity

### Application Issues
- Check application logs: \`docker logs canditrack_app_1\`
- Verify environment variables
- Check NextAuth configuration

### MinIO Issues
- Check MinIO logs: \`docker logs canditrack_minio_1\`
- Verify bucket creation
- Check file permissions

## Default Credentials

- **Application Admin**: admin@canditrack.com (no password set initially)
- **MinIO Console**: minioadmin / minio_secret_password
- **PostgreSQL**: devuser / devpassword

## Security Recommendations

1. Change all default passwords
2. Use strong NEXTAUTH_SECRET
3. Configure proper firewall rules
4. Set up SSL/HTTPS
5. Regular security updates
6. Monitor logs for suspicious activity

## Support

For issues or questions:
1. Check the application logs
2. Review this deployment guide
3. Check the project documentation
4. Create an issue in the project repository
EOF

log "Deployment instructions created"

# Create health check script
log "Creating health check script..."
cat > health-check.sh << 'EOF'
#!/bin/bash

# CandiTrack Health Check Script
# Run this script to verify all services are running correctly

set -e

echo "=== CandiTrack Health Check ==="

# Check if containers are running
echo "Checking container status..."
if docker ps | grep -q canditrack_app; then
    echo "✓ Application container is running"
else
    echo "✗ Application container is not running"
    exit 1
fi

if docker ps | grep -q canditrack_postgres; then
    echo "✓ PostgreSQL container is running"
else
    echo "✗ PostgreSQL container is not running"
    exit 1
fi

if docker ps | grep -q canditrack_minio; then
    echo "✓ MinIO container is running"
else
    echo "✗ MinIO container is not running"
    exit 1
fi

if docker ps | grep -q canditrack_redis; then
    echo "✓ Redis container is running"
else
    echo "✗ Redis container is not running"
    exit 1
fi

# Check database connectivity
echo "Checking database connectivity..."
if docker exec canditrack_postgres_1 pg_isready -U devuser -d canditrack_db; then
    echo "✓ Database is accessible"
else
    echo "✗ Database is not accessible"
    exit 1
fi

# Check application health
echo "Checking application health..."
if curl -f http://localhost:9846/api/system/initial-setup-check > /dev/null 2>&1; then
    echo "✓ Application is responding"
else
    echo "✗ Application is not responding"
    exit 1
fi

# Check MinIO
echo "Checking MinIO..."
if curl -f http://localhost:9848 > /dev/null 2>&1; then
    echo "✓ MinIO console is accessible"
else
    echo "✗ MinIO console is not accessible"
    exit 1
fi

echo "=== All health checks passed! ==="
echo "Application URL: http://localhost:9846"
echo "MinIO Console: http://localhost:9848"
EOF

chmod +x health-check.sh

# Create backup script
log "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash

# CandiTrack Backup Script
# Run this script to create a backup of your data

set -e

BACKUP_DIR="/opt/canditrack-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="canditrack_backup_$DATE"

echo "Creating backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL data
echo "Backing up PostgreSQL data..."
docker run --rm \
  --volumes-from canditrack_postgres_1 \
  -v "$BACKUP_DIR:/backup" \
  postgres:14-alpine \
  tar czf "/backup/${BACKUP_NAME}_postgres.tar.gz" /var/lib/postgresql/data

# Backup MinIO data
echo "Backing up MinIO data..."
docker run --rm \
  --volumes-from canditrack_minio_1 \
  -v "$BACKUP_DIR:/backup" \
  alpine \
  tar czf "/backup/${BACKUP_NAME}_minio.tar.gz" /data

# Backup Redis data
echo "Backing up Redis data..."
docker run --rm \
  --volumes-from canditrack_redis_1 \
  -v "$BACKUP_DIR:/backup" \
  alpine \
  tar czf "/backup/${BACKUP_NAME}_redis.tar.gz" /data

# Create backup info file
cat > "$BACKUP_DIR/${BACKUP_NAME}_info.txt" << INFO
CandiTrack Backup Information
============================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
PostgreSQL: ${BACKUP_NAME}_postgres.tar.gz
MinIO: ${BACKUP_NAME}_minio.tar.gz
Redis: ${BACKUP_NAME}_redis.tar.gz

To restore:
1. Stop the canditrack stack
2. Restore volumes from backup files
3. Start the stack again
INFO

echo "Backup completed: $BACKUP_NAME"
echo "Backup location: $BACKUP_DIR"
EOF

chmod +x backup.sh

# Final summary
log "Deployment preparation completed successfully!"
echo
echo "=== DEPLOYMENT SUMMARY ==="
echo "Repository: $GIT_REPO_URL"
echo "Branch: $BRANCH"
echo "Deployment directory: $DEPLOY_DIR"
echo
echo "=== NEXT STEPS ==="
echo "1. Review and update the .env file"
echo "2. Upload portainer-stack.yml to Portainer"
echo "3. Deploy the stack in Portainer"
echo "4. Run health-check.sh to verify deployment"
echo
echo "=== IMPORTANT FILES ==="
echo "- .env (environment configuration)"
echo "- portainer-stack.yml (Portainer stack configuration)"
echo "- DEPLOYMENT_INSTRUCTIONS.md (detailed instructions)"
echo "- health-check.sh (health verification script)"
echo "- backup.sh (backup script)"
echo
echo "=== DEFAULT ACCESS ==="
echo "Application: http://your-server-ip:9846"
echo "MinIO Console: http://your-server-ip:9848 (minioadmin/minio_secret_password)"
echo "Default Admin: admin@canditrack.com"
echo
log "Ready for Portainer deployment!" 