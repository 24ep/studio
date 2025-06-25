# Candidate Matching - Applicant Tracking System (Next.js Prototype)

This is a Next.js application prototype for an Applicant Tracking System, built with Firebase Studio. It provides features for managing candidates, positions, users, and includes integrations for automated workflows.

## Key Features

*   **Dashboard Overview:** Visual summary with metrics like candidates per position (via chart).
*   **Candidate Management:**
    *   View, Add, Edit (detailed profile and status updates), Delete candidates.
    *   Resume Uploads: Direct upload to MinIO, with optional n8n webhook trigger for processing.
    *   **Resume History:** Tracks all uploaded resume versions for a candidate (API support; UI display for history is a future enhancement).
    *   **Profile Image Upload:** Upload and display candidate profile images.
    *   Drag-and-drop interface for reordering recruitment stages.
    *   Transition History: Track candidate stage changes with notes; ability to edit notes and delete records.
    *   Recruiter Assignment: Assign candidates to specific recruiters.
    *   Custom Fields: Support for defining and using custom data fields for candidates.
    *   Comprehensive Filtering: Filter by name, position, status, education, fit score.
    *   Import/Export: Bulk import and export of candidate data (CSV format).
*   **Position Management:**
    *   View, Add, Edit, Delete job positions.
    *   Attributes: Includes title, department, description, open status, and `position_level`.
    *   Custom Fields: Support for defining and using custom data fields for positions.
    *   Comprehensive Filtering: Filter by title, department, status, position level.
    *   Import/Export: Bulk import and export of position data (CSV format).
*   **User Management:**
    *   View, Add, Edit, Delete users.
    *   Role-Based Access Control (RBAC): Admin, Recruiter, Hiring Manager roles.
    *   Module Permissions: Granular control over feature access (e.g., import/export, managing specific settings).
    *   Password Management: Securely hashed passwords using `bcrypt`. Admins can reset user passwords. Users can change their own passwords.
    *   User Group Management: Create and manage user groups, assign permissions to groups.
    *   Attribute Filtering: Filter users by name, email, role.
*   **My Task Board:** Kanban and list view for Recruiters/Admins to manage their assigned candidates with enhanced filtering.
*   **Settings & Configuration:**
    *   **Server-Side Preferences:** App Name, App Logo (actual theme application is client-side, preference stored server-side).
    *   Integrations (Conceptual SMTP, Server-Side Webhooks):
        *   Server-configured n8n webhook for processing resumes of existing candidates.
        *   Server-configured n8n webhook for creating new candidates from generic PDF uploads.
    *   Recruitment Stages: Manage custom stages in the hiring pipeline. **Stages can be deleted with a replacement strategy if in use.**
    *   **Server-Side Data Model UI Preferences:** View and set local UI display preferences for Candidate and Position attributes per user.
    *   Custom Field Definitions: Define custom data fields for Candidates and Positions.
    *   Webhook Payload Mapping: Configure how incoming JSON from n8n maps to candidate attributes.
    *   **User Groups:** Create groups, assign users, and configure module permissions for groups.
    *   **Notification Settings:** Configure which system events trigger notifications and via which channels (e.g., email, webhook). (UI for configuration; actual notification triggering is future work).
*   **API Documentation:** Page detailing available API endpoints.
*   **Application Logs:** View system and audit logs stored in the database, with filtering and search capabilities.
*   **Authentication:**
    *   Azure AD SSO (via NextAuth.js).
    *   Credentials (Email/Password): Backend by PostgreSQL, passwords hashed using `bcrypt`.
*   **Styling:** ShadCN UI components and Tailwind CSS.
*   **File Storage:** Uses MinIO for resume and other file storage (e.g., candidate avatars).
*   **Caching:** Uses Redis for caching frequently accessed data like recruitment stages.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** Tailwind CSS, ShadCN UI
*   **Authentication:** NextAuth.js (Azure AD, Credentials providers)
*   **Backend API:** Next.js API Routes
*   **Database:** PostgreSQL (via `pg` library)
*   **File Storage:** MinIO
*   **Caching:** Redis (via `redis` library)
*   **Password Hashing:** `bcrypt`
*   **AI (Conceptual/Future):** Genkit (Google AI for LLMs/Image Generation)
*   **Deployment:** Docker & Docker Compose

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Docker Desktop (or Docker Engine + Docker Compose)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd candidate-matching-app # Or your project directory name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    *   **Option 1: Use the setup script (Windows):**
        ```bash
        setup-env.bat
        ```
        This will copy `.env.example` to `.env` and provide instructions.
    
    *   **Option 2: Manual setup:**
        ```bash
        # Copy the example environment file
        cp .env.example .env
        ```
    
    *   **Edit the `.env` file** with your actual values:
        *   **Database Configuration:** Update `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
        *   **NextAuth:** Set `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
        *   **MinIO:** Configure `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`
        *   **API Keys:** Add your `GOOGLE_API_KEY`, `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY`
        *   **Webhooks:** Set `N8N_RESUME_WEBHOOK_URL`, `N8N_GENERIC_PDF_WEBHOOK_URL`
        *   **Azure AD (Optional):** Configure `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
        *   **Host Configuration:** Update `HOST_URL`, `PUBLIC_HOST_URL` for your deployment

4.  **Environment Variables Reference:**
    *   **Essential Variables:**
        *   `NEXTAUTH_URL`: Public URL of your application (e.g., `http://localhost:9846`)
        *   `NEXTAUTH_SECRET`: Strong secret for NextAuth (generate with `openssl rand -base64 32`)
        *   `DATABASE_URL`: PostgreSQL connection string
        *   `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`: MinIO credentials
        *   `MINIO_BUCKET_NAME`: MinIO bucket for file storage
    
    *   **Optional Variables:**
        *   `AZURE_AD_*`: Azure AD SSO configuration
        *   `GOOGLE_API_KEY`: Google AI API key for Genkit
        *   `N8N_*_WEBHOOK_URL`: n8n webhook URLs for automation
        *   `PROCESSOR_INTERVAL_MS`: Background processor interval (default: 5000ms)
    
    *   **Port Configuration:**
        *   `APP_PORT`: Main application port (default: 9846)
        *   `MINIO_API_PORT`: MinIO API port (default: 9847)
        *   `MINIO_CONSOLE_PORT`: MinIO Console port (default: 9848)
        *   `REDIS_EXTERNAL_PORT`: Redis external port (default: 9849)

### Default Admin Credentials (for Initial Setup)
*   **Email:** `admin@ncc.com`
*   **Password:** `nccadmin`
    *   This password's `bcrypt` hash is included in `pg-init-scripts/init-db.sql`.
    *   **It is STRONGLY recommended to change this password immediately after the first login.**
    *   To generate a new hash for a different default password (BEFORE first run if changing):
        1.  Create `generate-hash.js`:
            ```javascript
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const plaintextPassword = 'your_new_password'; // Change this

            bcrypt.hash(plaintextPassword, saltRounds, function(err, hash) {
              if (err) { console.error("Error hashing password:", err); return; }
              console.log(`Bcrypt hash for '${plaintextPassword}': ${hash}`);
            });
            ```
        2.  Run `node generate-hash.js`.
        3.  Copy the output hash and replace the existing hash for `admin@ncc.com` in `pg-init-scripts/init-db.sql`.

### Running with Docker (Recommended)

This method runs the Next.js app, PostgreSQL, MinIO, and Redis in Docker containers.

1.  **Ensure Docker and Docker Compose are installed and running.**
2.  **Verify your `.env` file (see Step 3 of Installation).** Key settings for Docker:
    *   `NEXTAUTH_URL=http://localhost:9846` (if using default port mapping in `docker-compose.yml`). **This is critical.**
    *   `DATABASE_URL=postgresql://devuser:devpassword@postgres:5432/canditrack_db`
    *   `MINIO_ENDPOINT=minio`
    *   `MINIO_PORT=9000` (internal MinIO port)
    *   `REDIS_URL=redis://redis:6379` (internal Redis port)
    *   `PROCESSOR_URL=http://app:9846/api/upload-queue/process` (for background processor)

3.  **Database Initialization (`init-db.sql`):**
    *   The `init-db.sql` file is **automatically executed by PostgreSQL on its first startup** when the database volume (`postgres_data`) is empty or newly created.
    *   This script creates all necessary tables and inserts the default admin user.
    *   **If you encounter "relation ... does not exist" errors:** This means `init-db.sql` did not run or complete. This usually happens if the `postgres_data` Docker volume already existed from a previous run. To force re-initialization:
        1.  Stop services: `docker-compose down`
        2.  **CRITICAL: Remove all Docker volumes (this deletes ALL database, MinIO, and Redis data):**
            ```bash
            docker-compose down -v
            # OR, use the provided script:
            # ./start.sh --reinit
            ```
        3.  Ensure `init-db.sql` is correct (especially the admin password hash if changed).
        4.  Restart services: `docker-compose up --build -d` (or `./start.sh`)
    *   **Check PostgreSQL container logs** for script execution messages or errors: `docker logs <your_postgres_container_name>` (find name with `docker ps`).

4.  **MinIO Bucket Creation:**
    *   The MinIO bucket (default: `canditrack-resumes`) is attempted to be created automatically by the application on startup (`src/lib/minio.ts`). For faster server startup, the blocking check has been removed. The bucket will be created on-demand when first needed.

5.  **Start Services:**
    *   Use the provided script (ensure it's executable: `chmod +x start.sh`):
        ```bash
        ./start.sh
        ```
    *   To force re-initialization of the database and other volumes:
        ```bash
        ./start.sh --reinit
        ```
    *   Or manually: `docker-compose up --build -d`

6.  **Accessing Services (default ports mapped to host):**
    *   **Candidate Matching App:** `http://localhost:${APP_PORT:-9846}`
    *   **MinIO API:** `http://localhost:${MINIO_API_PORT:-9847}` (Internally `minio:9000`)
    *   **MinIO Console:** `http://localhost:${MINIO_CONSOLE_PORT:-9848}` (Login with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)
    *   **PostgreSQL:** `localhost:${POSTGRES_PORT:-5432}` (from host)
    *   **Redis:** `localhost:${REDIS_EXTERNAL_PORT:-9849}` (from host, corresponds to `redis:6379` internally)

7.  **Stopping Services:**
    ```bash
    docker-compose down
    ```
    To also remove volumes (deletes data): `docker-compose down -v`

## Available Scripts (for local development outside Docker, or for use inside Docker container)

*   `npm run dev`: Starts Next.js development server (default `http://localhost:9846`).
*   `npm run build`: Builds for production.
*   `npm run start`: Starts Next.js production server.
*   `npm run lint`: Lints code.
*   `npm run typecheck`: Runs TypeScript checks.

## Further Development Considerations

*   **Robust Error Handling & Monitoring:** Enhance server-side logging, integrate monitoring tools.
*   **Testing:** Implement comprehensive unit, integration, and end-to-end tests.
*   **Database Migrations:** For schema changes beyond initial setup, use a formal migration tool (e.g., Flyway, Liquibase, or Prisma Migrate if Prisma were in use).
*   **AI Feature Implementation:** Develop and integrate Genkit flows for advanced resume parsing, candidate-job matching, etc.
*   **Real-time Features:** Implement WebSocket connections and leverage Redis for real-time updates (e.g., notifications).
*   **Security Hardening:** Implement rate limiting, Content Security Policy (CSP), advanced security headers.
*   **Scalability:** Design for scalability if high load is anticipated.
*   **User Group Permission Inheritance:** Fully implement logic for users to inherit permissions from their assigned groups.
*   **Notification Triggering:** Implement backend logic to send notifications based on configured settings.

## Connectivity Checks (Application Logs)

*   **PostgreSQL:** Check Next.js app logs for "Successfully connected to PostgreSQL database..."
*   **MinIO:** Check Next.js app logs for "Successfully connected to MinIO server..." or "MinIO: Bucket ... already exists/created..."
*   **Redis:** Check Next.js app logs for "Successfully connected to Redis server." or "Redis client connection established and ready."
If connection errors occur, verify your `.env` settings, Docker networking, and ensure backend services are running correctly.
