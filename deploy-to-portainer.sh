#!/bin/bash

# Deploy to Portainer Script
# This script can be used to deploy the candidate-matching application to Portainer

set -e

# Configuration
PORTAINER_URL="${PORTAINER_URL:-http://localhost:9000}"
PORTAINER_API_KEY="${PORTAINER_API_KEY:-your-portainer-api-key}"
STACK_NAME="${STACK_NAME:-candidate-matching-stack}"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.portainer.yml}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required files exist
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    if [ -z "$PORTAINER_API_KEY" ] || [ "$PORTAINER_API_KEY" = "your-portainer-api-key" ]; then
        print_warning "Portainer API key not set. You'll need to deploy manually."
        return 1
    fi
    
    print_success "Prerequisites check passed"
    return 0
}

# Function to deploy using Portainer API
deploy_via_api() {
    print_status "Deploying via Portainer API..."
    
    # Check if stack exists
    STACK_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "X-API-Key: $PORTAINER_API_KEY" \
        "$PORTAINER_URL/api/stacks")
    
    if [ "$STACK_EXISTS" = "200" ]; then
        print_status "Stack exists, updating..."
        METHOD="PUT"
        ENDPOINT="$PORTAINER_URL/api/stacks/1"
    else
        print_status "Creating new stack..."
        METHOD="POST"
        ENDPOINT="$PORTAINER_URL/api/stacks"
    fi
    
    # Read docker-compose file and encode it
    COMPOSE_CONTENT=$(cat "$DOCKER_COMPOSE_FILE" | base64 -w 0)
    
    # Deploy stack
    RESPONSE=$(curl -s -w "%{http_code}" \
        -X "$METHOD" \
        -H "X-API-Key: $PORTAINER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"Name\": \"$STACK_NAME\",
            \"SwarmID\": \"1\",
            \"StackFileContent\": \"$COMPOSE_CONTENT\"
        }" \
        "$ENDPOINT")
    
    HTTP_CODE="${RESPONSE: -3}"
    RESPONSE_BODY="${RESPONSE%???}"
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        print_success "Stack deployed successfully!"
        print_status "Response: $RESPONSE_BODY"
    else
        print_error "Failed to deploy stack. HTTP Code: $HTTP_CODE"
        print_error "Response: $RESPONSE_BODY"
        exit 1
    fi
}

# Function to provide manual deployment instructions
manual_deployment() {
    print_warning "Manual deployment required"
    echo ""
    echo "=== MANUAL DEPLOYMENT INSTRUCTIONS ==="
    echo "1. Log into Portainer at: $PORTAINER_URL"
    echo "2. Go to Stacks section"
    echo "3. Click 'Add stack'"
    echo "4. Stack name: $STACK_NAME"
    echo "5. Copy the contents of $DOCKER_COMPOSE_FILE"
    echo "6. Paste into the web editor"
    echo "7. Click 'Deploy the stack'"
    echo ""
    echo "=== STACK FILE LOCATION ==="
    echo "File: $DOCKER_COMPOSE_FILE"
    echo ""
    echo "=== ACCESS URLs ==="
    echo "Application: http://localhost:9846"
    echo "MinIO Console: http://localhost:9848"
    echo "PostgreSQL: localhost:5432"
    echo "Redis: localhost:9850"
    echo "WebSocket Bridge: localhost:3002"
    echo ""
}

# Function to validate deployment
validate_deployment() {
    print_status "Validating deployment..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check if application is responding
    if curl -f -s "http://localhost:9846/api/health" > /dev/null; then
        print_success "Application is responding"
    else
        print_warning "Application not responding yet (this is normal during startup)"
    fi
    
    # Check if MinIO is responding
    if curl -f -s "http://localhost:9847/minio/health/live" > /dev/null; then
        print_success "MinIO is responding"
    else
        print_warning "MinIO not responding yet"
    fi
}

# Main execution
main() {
    print_status "Starting Portainer deployment..."
    
    # Check prerequisites
    if check_prerequisites; then
        # Try API deployment
        if deploy_via_api; then
            validate_deployment
        else
            manual_deployment
        fi
    else
        manual_deployment
    fi
    
    print_success "Deployment process completed!"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --url URL           Portainer URL (default: http://localhost:9000)"
    echo "  -k, --api-key KEY       Portainer API key"
    echo "  -s, --stack-name NAME   Stack name (default: candidate-matching-stack)"
    echo "  -f, --file FILE         Docker Compose file (default: docker-compose.portainer.yml)"
    echo ""
    echo "Environment variables:"
    echo "  PORTAINER_URL           Portainer URL"
    echo "  PORTAINER_API_KEY       Portainer API key"
    echo "  STACK_NAME              Stack name"
    echo "  DOCKER_COMPOSE_FILE     Docker Compose file"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 --url http://portainer.example.com --api-key your-api-key"
    echo "  PORTAINER_API_KEY=your-key $0"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            PORTAINER_URL="$2"
            shift 2
            ;;
        -k|--api-key)
            PORTAINER_API_KEY="$2"
            shift 2
            ;;
        -s|--stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        -f|--file)
            DOCKER_COMPOSE_FILE="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main "$@" 