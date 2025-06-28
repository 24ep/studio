pipeline {
    agent any
    
    environment {
        // Application settings
        APP_NAME = 'candidate-matching'
        APP_PORT = '9846'
        NODE_VERSION = '20'
        
        // Docker settings for GitLab self-hosted registry
        DOCKER_IMAGE = 'candidate-matching'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        GITLAB_REGISTRY = 'registry.gitlab.com' // Change to your GitLab registry URL
        GITLAB_NAMESPACE = 'your-group/your-project' // Change to your GitLab namespace/project
        GITLAB_REGISTRY_URL = "https://${GITLAB_REGISTRY}"
        
        // Database settings
        POSTGRES_USER = 'devuser'
        POSTGRES_PASSWORD = 'devpassword'
        POSTGRES_DB = 'canditrack_db'
        POSTGRES_PORT = '5432'
        
        // MinIO settings
        MINIO_ROOT_USER = 'minioadmin'
        MINIO_ROOT_PASSWORD = 'minioadmin'
        MINIO_API_PORT = '9847'
        MINIO_CONSOLE_PORT = '9848'
        
        // Redis settings
        REDIS_EXTERNAL_PORT = '9850'
        WS_QUEUE_BRIDGE_PORT = '3002'
        
        // Environment
        NODE_ENV = 'production'
        NEXT_TELEMETRY_DISABLED = '1'
        
        // Portainer settings
        PORTAINER_URL = 'http://your-portainer-url:9000' // Change this to your Portainer URL
        PORTAINER_STACK_NAME = 'candidate-matching-stack'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '🔍 Checking out source code...'
                checkout scm
                
                script {
                    // Clean workspace
                    cleanWs()
                }
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo '⚙️ Setting up build environment...'
                
                script {
                    // Setup Node.js
                    nodejs(nodeJSInstallationName: "NodeJS-${NODE_VERSION}") {
                        sh 'node --version'
                        sh 'npm --version'
                    }
                    
                    // Create .env file for build
                    sh '''
                        cat > .env << EOF
                        # Database Configuration
                        DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:${POSTGRES_PORT}/${POSTGRES_DB}
                        POSTGRES_USER=${POSTGRES_USER}
                        POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
                        POSTGRES_DB=${POSTGRES_DB}
                        POSTGRES_PORT=${POSTGRES_PORT}
                        
                        # MinIO Configuration
                        MINIO_ENDPOINT=minio
                        MINIO_PORT=9000
                        MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
                        MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
                        MINIO_BUCKET_NAME=candidates
                        MINIO_USE_SSL=false
                        MINIO_PUBLIC_BASE_URL=http://localhost:${MINIO_API_PORT}
                        MINIO_ROOT_USER=${MINIO_ROOT_USER}
                        MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
                        MINIO_API_PORT=${MINIO_API_PORT}
                        MINIO_CONSOLE_PORT=${MINIO_CONSOLE_PORT}
                        
                        # Redis Configuration
                        REDIS_URL=redis://redis:6379
                        REDIS_EXTERNAL_PORT=${REDIS_EXTERNAL_PORT}
                        
                        # Application Configuration
                        NEXTAUTH_URL=http://localhost:${APP_PORT}
                        NEXTAUTH_SECRET=your-secret-key-here
                        NODE_ENV=${NODE_ENV}
                        NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED}
                        
                        # WebSocket Configuration
                        WS_QUEUE_BRIDGE_PORT=${WS_QUEUE_BRIDGE_PORT}
                        WS_ALLOWED_ORIGINS=http://localhost:${APP_PORT}
                        
                        # Optional: Azure AD (uncomment if using)
                        # AZURE_AD_CLIENT_ID=your-azure-client-id
                        # AZURE_AD_CLIENT_SECRET=your-azure-client-secret
                        # AZURE_AD_TENANT_ID=your-azure-tenant-id
                        # NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-azure-client-id
                        # NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-azure-tenant-id
                        
                        # Optional: Google AI (uncomment if using)
                        # GOOGLE_API_KEY=your-google-api-key
                        # NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=your-google-fonts-key
                        
                        # Optional: Webhook URLs (uncomment if using)
                        # RESUME_PROCESSING_WEBHOOK_URL=your-webhook-url
                        # GENERAL_PDF_WEBHOOK_URL=your-webhook-url
                        # PROCESSOR_API_KEY=your-processor-api-key
                        # PROCESSOR_INTERVAL_MS=5000
                        # PROCESSOR_URL=your-processor-url
                        EOF
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                
                nodejs(nodeJSInstallationName: "NodeJS-${NODE_VERSION}") {
                    sh '''
                        # Install dependencies
                        npm ci --only=production=false
                        
                        # Generate Prisma client
                        npx prisma generate
                    '''
                }
            }
        }
        
        stage('Run Optimizations') {
            steps {
                echo '🚀 Running build optimizations...'
                
                nodejs(nodeJSInstallationName: "NodeJS-${NODE_VERSION}") {
                    sh '''
                        # Run the optimization script to remove unnecessary force-dynamic directives
                        node scripts/optimize-build.js
                        
                        echo "✅ Build optimizations completed"
                    '''
                }
            }
        }
        
        stage('Lint & Test') {
            steps {
                echo '🔍 Running linting and tests...'
                
                nodejs(nodeJSInstallationName: "NodeJS-${NODE_VERSION}") {
                    sh '''
                        # Run linting
                        npm run lint
                        
                        # Run tests (if you have them)
                        # npm test
                        
                        echo "✅ Linting completed"
                    '''
                }
            }
        }
        
        stage('Build Application') {
            steps {
                echo '🏗️ Building optimized application...'
                
                nodejs(nodeJSInstallationName: "NodeJS-${NODE_VERSION}") {
                    sh '''
                        # Build with optimizations (prebuild script runs automatically)
                        npm run build
                        
                        echo "✅ Build completed successfully"
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                
                script {
                    // Build Docker image with build args
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}", 
                        "--build-arg DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:${POSTGRES_PORT}/${POSTGRES_DB} " +
                        "--build-arg NEXTAUTH_URL=http://localhost:${APP_PORT} " +
                        "--build-arg NEXTAUTH_SECRET=your-secret-key-here " +
                        "--build-arg AZURE_AD_CLIENT_ID= " +
                        "--build-arg AZURE_AD_CLIENT_SECRET= " +
                        "--build-arg AZURE_AD_TENANT_ID= " +
                        "--build-arg GOOGLE_API_KEY= " +
                        "--build-arg NEXT_PUBLIC_GOOGLE_FONTS_API_KEY= " +
                        "."
                    )
                    
                    // Tag with latest
                    sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                echo '🔒 Running security scan...'
                
                script {
                    // Run npm audit
                    nodejs(nodeJSInstallationName: "NodeJS-${NODE_VERSION}") {
                        sh '''
                            # Run security audit
                            npm audit --audit-level=moderate || true
                            
                            echo "✅ Security scan completed"
                        '''
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'dev'
                    branch 'develop'
                }
            }
            steps {
                echo '📤 Pushing to Docker registry...'
                
                script {
                    // Tag for registry
                    sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:latest"
                    
                    // Push to registry
                    docker.withRegistry("https://${GITLAB_REGISTRY}", 'docker-registry-credentials') {
                        sh "docker push ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }
        
        stage('Create Portainer Stack File') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'dev'
                    branch 'develop'
                }
            }
            steps {
                echo '📝 Creating Portainer stack file...'
                
                script {
                    // Create docker-compose file for Portainer
                    sh '''
                        cat > docker-compose.portainer.yml << EOF
                        version: '3.8'
                        
                        services:
                          app:
                            image: ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}
                            ports:
                              - "${APP_PORT}:9846"
                            environment:
                              DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:${POSTGRES_PORT}/${POSTGRES_DB}
                              MINIO_ENDPOINT: minio
                              MINIO_PORT: 9000
                              MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
                              MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
                              MINIO_BUCKET_NAME: candidates
                              MINIO_USE_SSL: false
                              MINIO_PUBLIC_BASE_URL: http://localhost:${MINIO_API_PORT}
                              REDIS_URL: redis://redis:6379
                              NEXTAUTH_URL: http://localhost:${APP_PORT}
                              NEXTAUTH_SECRET: your-secret-key-here
                              NODE_ENV: ${NODE_ENV}
                              WS_QUEUE_BRIDGE_PORT: ${WS_QUEUE_BRIDGE_PORT}
                              WS_ALLOWED_ORIGINS: http://localhost:${APP_PORT}
                            depends_on:
                              postgres:
                                condition: service_healthy
                              minio:
                                condition: service_healthy
                              redis:
                                condition: service_healthy
                            restart: unless-stopped
                            healthcheck:
                              test: ["CMD", "curl", "-f", "http://localhost:9846/api/health"]
                              interval: 60s
                              timeout: 15s
                              retries: 3
                              start_period: 120s
                            command: sh -c "echo 'Starting application...' && sleep 5 && echo 'Creating initial migration...' && npx prisma migrate dev --name init --create-only && echo 'Applying migrations...' && npx prisma migrate deploy && echo 'Seeding database...' && npx prisma db seed && echo 'Starting Next.js application...' && npm start"
                        
                          postgres:
                            image: postgres:14-alpine
                            ports:
                              - "${POSTGRES_PORT}:5432"
                            environment:
                              POSTGRES_USER: ${POSTGRES_USER}
                              POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
                              POSTGRES_DB: ${POSTGRES_DB}
                              POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
                            volumes:
                              - postgres_data:/var/lib/postgresql/data
                            restart: unless-stopped
                            healthcheck:
                              test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
                              interval: 10s
                              timeout: 5s
                              retries: 5
                              start_period: 30s
                        
                          minio:
                            image: minio/minio:latest
                            ports:
                              - "${MINIO_API_PORT}:9000"
                              - "${MINIO_CONSOLE_PORT}:9001"
                            environment:
                              MINIO_ROOT_USER: ${MINIO_ROOT_USER}
                              MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
                              MINIO_SERVER_URL: http://localhost:9000
                              MINIO_BROWSER_REDIRECT_URL: http://localhost:${MINIO_CONSOLE_PORT}
                            command: server /data --console-address ":9001" --address ":9000"
                            volumes:
                              - minio_data:/data
                            restart: unless-stopped
                            healthcheck:
                              test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
                              interval: 10s
                              timeout: 5s
                              retries: 5
                              start_period: 30s
                        
                          redis:
                            image: redis:alpine
                            ports:
                              - "${REDIS_EXTERNAL_PORT}:6379"
                            volumes:
                              - redis_data:/data
                            restart: unless-stopped
                            healthcheck:
                              test: ["CMD", "redis-cli", "ping"]
                              interval: 10s
                              timeout: 5s
                              retries: 5
                              start_period: 30s
                        
                          upload-queue-processor:
                            image: ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}
                            command: sh -c "until nc -z postgres ${POSTGRES_PORT}; do echo Waiting for Postgres...; sleep 2; done; until nc -z minio 9000; do echo Waiting for MinIO...; sleep 2; done; until nc -z redis 6379; do echo Waiting for Redis...; sleep 2; done; node process-upload-queue.mjs"
                            environment:
                              DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:${POSTGRES_PORT}/${POSTGRES_DB}
                              MINIO_ENDPOINT: minio
                              MINIO_PORT: 9000
                              MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
                              MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
                              MINIO_BUCKET_NAME: candidates
                              MINIO_USE_SSL: false
                              MINIO_PUBLIC_BASE_URL: http://localhost:${MINIO_API_PORT}
                              REDIS_URL: redis://redis:6379
                              NEXTAUTH_URL: http://localhost:${APP_PORT}
                              NEXTAUTH_SECRET: your-secret-key-here
                              NODE_ENV: ${NODE_ENV}
                            depends_on:
                              app:
                                condition: service_healthy
                              postgres:
                                condition: service_healthy
                              minio:
                                condition: service_healthy
                              redis:
                                condition: service_healthy
                            restart: unless-stopped
                        
                          ws-queue-bridge:
                            image: ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}
                            command: sh -c "until nc -z redis 6379; do echo Waiting for Redis...; sleep 2; done; node ws-queue-bridge.js"
                            environment:
                              REDIS_URL: redis://redis:6379
                              WS_QUEUE_BRIDGE_PORT: ${WS_QUEUE_BRIDGE_PORT}
                              WS_ALLOWED_ORIGINS: http://localhost:${APP_PORT}
                              NODE_ENV: ${NODE_ENV}
                            ports:
                              - "${WS_QUEUE_BRIDGE_PORT}:3002"
                            depends_on:
                              redis:
                                condition: service_healthy
                            restart: unless-stopped
                        
                        volumes:
                          postgres_data:
                          minio_data:
                          redis_data:
                        EOF
                    '''
                }
            }
        }
        
        stage('Deploy to Portainer') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo '🚀 Deploying to Portainer...'
                
                script {
                    // Option 1: Deploy using Portainer API (if you have API access)
                    // sh '''
                    #     curl -X POST "${PORTAINER_URL}/api/stacks" \\
                    #         -H "X-API-Key: your-portainer-api-key" \\
                    #         -H "Content-Type: application/json" \\
                    #         -d '{
                    #             "Name": "${PORTAINER_STACK_NAME}",
                    #             "SwarmID": "your-swarm-id",
                    #             "StackFileContent": "$(cat docker-compose.portainer.yml | base64 -w 0)"
                    #         }'
                    # '''
                    
                    // Option 2: Create deployment instructions
                    sh '''
                        echo "=== PORTAINER DEPLOYMENT INSTRUCTIONS ==="
                        echo "1. Log into Portainer at: ${PORTAINER_URL}"
                        echo "2. Go to Stacks section"
                        echo "3. Click 'Add stack'"
                        echo "4. Stack name: ${PORTAINER_STACK_NAME}"
                        echo "5. Copy the contents of docker-compose.portainer.yml"
                        echo "6. Paste into the web editor"
                        echo "7. Click 'Deploy the stack'"
                        echo ""
                        echo "=== STACK FILE LOCATION ==="
                        echo "File: docker-compose.portainer.yml"
                        echo "Build: ${env.BUILD_NUMBER}"
                        echo "Image: ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}"
                        echo ""
                        echo "=== ACCESS URLs ==="
                        echo "Application: http://localhost:${APP_PORT}"
                        echo "MinIO Console: http://localhost:${MINIO_CONSOLE_PORT}"
                        echo "PostgreSQL: localhost:${POSTGRES_PORT}"
                        echo "Redis: localhost:${REDIS_EXTERNAL_PORT}"
                        echo "WebSocket Bridge: localhost:${WS_QUEUE_BRIDGE_PORT}"
                    '''
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                echo '🚀 Deploying to staging...'
                
                script {
                    // Create staging deployment instructions
                    sh '''
                        echo "=== STAGING DEPLOYMENT INSTRUCTIONS ==="
                        echo "1. Log into Portainer at: ${PORTAINER_URL}"
                        echo "2. Go to Stacks section"
                        echo "3. Click 'Add stack'"
                        echo "4. Stack name: ${PORTAINER_STACK_NAME}-staging"
                        echo "5. Copy the contents of docker-compose.portainer.yml"
                        echo "6. Paste into the web editor"
                        echo "7. Click 'Deploy the stack'"
                        echo ""
                        echo "=== STACK FILE LOCATION ==="
                        echo "File: docker-compose.portainer.yml"
                        echo "Build: ${env.BUILD_NUMBER}"
                        echo "Image: ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo '🧹 Cleaning up...'
            
            script {
                // Clean up Docker images
                sh '''
                    # Remove dangling images
                    docker image prune -f
                    
                    # Remove build cache
                    docker builder prune -f
                '''
                
                // Clean workspace
                cleanWs()
            }
        }
        
        success {
            echo '✅ Pipeline completed successfully!'
            
            script {
                // Send success notification
                emailext (
                    subject: "✅ ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} Successful",
                    body: """
                    <h2>Build Successful!</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build:</strong> #${env.BUILD_NUMBER}</p>
                    <p><strong>Branch:</strong> ${env.GIT_BRANCH}</p>
                    <p><strong>Commit:</strong> ${env.GIT_COMMIT}</p>
                    <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Docker Image:</strong> ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}</p>
                    <p><strong>Portainer URL:</strong> <a href="${PORTAINER_URL}">${PORTAINER_URL}</a></p>
                    """,
                    recipientProviders: [[$class: 'DevelopersRecipientProvider']]
                )
            }
        }
        
        failure {
            echo '❌ Pipeline failed!'
            
            script {
                // Send failure notification
                emailext (
                    subject: "❌ ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} Failed",
                    body: """
                    <h2>Build Failed!</h2>
                    <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                    <p><strong>Build:</strong> #${env.BUILD_NUMBER}</p>
                    <p><strong>Branch:</strong> ${env.GIT_BRANCH}</p>
                    <p><strong>Commit:</strong> ${env.GIT_COMMIT}</p>
                    <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                    <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                    """,
                    recipientProviders: [[$class: 'DevelopersRecipientProvider']]
                )
            }
        }
        
        cleanup {
            echo '🧹 Final cleanup...'
            
            script {
                // Stop any running containers
                sh '''
                    # Stop containers if running
                    docker-compose down || true
                    
                    # Remove containers
                    docker container prune -f
                    
                    # Remove networks
                    docker network prune -f
                '''
            }
        }
    }
} 