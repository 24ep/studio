#!/bin/bash

# HR AI Screening Application - Port 8021 Deployment Script
# This script sets up the deployment environment for the 8021 HR AI screening application

set -e

echo "=========================================="
echo "HR AI Screening Application - Port 8021"
echo "Deployment Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Create necessary directories
print_status "Creating deployment directories..."

# Create main deployment directory
sudo mkdir -p /var/dockers/8021

# Create subdirectories for different services
sudo mkdir -p /var/dockers/8021/uploads
sudo mkdir -p /var/dockers/8021/logs
sudo mkdir -p /var/dockers/8021/data
sudo mkdir -p /var/dockers/8021/postgres_data
sudo mkdir -p /var/dockers/8021/minio_data
sudo mkdir -p /var/dockers/8021/redis_data
sudo mkdir -p /var/dockers/8021/processor_logs

# Set proper permissions
print_status "Setting directory permissions..."
sudo chown -R $USER:$USER /var/dockers/8021
sudo chmod -R 755 /var/dockers/8021

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating from template..."
    if [ -f "env.8021.template" ]; then
        cp env.8021.template .env
        print_status "Created .env file from template"
        print_warning "Please review and update the .env file with your specific configuration"
    else
        print_error "env.8021.template not found. Please create a .env file manually."
        exit 1
    fi
else
    print_status ".env file already exists"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

print_status "Environment setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Review and update the .env file with your specific configuration"
echo "2. Build and start the application:"
echo "   docker-compose -f docker-compose.8021.yml up -d --build"
echo "3. Check the application status:"
echo "   docker-compose -f docker-compose.8021.yml ps"
echo "4. View logs:"
echo "   docker-compose -f docker-compose.8021.yml logs -f"
echo ""
print_status "Application will be available at: http://10.0.10.71:8021"
print_status "Portainer can be accessed at: http://10.0.10.71:9000/"
echo ""
print_warning "Remember to configure your firewall to allow access to port 8021" 