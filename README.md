
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
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and fill in your actual credentials and configurations. **Crucial variables include:**
        *   `NEXTAUTH_URL`: **Essential for redirects.** This should be the URL you use to access the application in your browser.
            *   If using default Docker Compose setup (app on host port 9846): `http://localhost:9846`
            *   If running `npm run dev` directly (app on port 9002): `http://localhost:9002`
        *   `NEXTAUTH_SECRET`: Generate a strong secret (e.g., `openssl rand -base64 32`).
        *   `DATABASE_URL`: Connection string for PostgreSQL.
            *   If Next.js app runs **inside Docker** (default with `docker-compose up`): `postgresql://devuser:devpassword@postgres:5432/canditrack_db` (or use values from `.env.local` if overridden).
            *   If Next.js app runs **outside Docker** (e.g., `npm run dev`) but DB is in Docker: `postgresql://devuser:devpassword@localhost:5432/canditrack_db`.
        *   MinIO Credentials: `MINIO_ENDPOINT` (e.g., `minio` if app in Docker, `localhost` if app outside Docker but MinIO in Docker), `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`.
        *   Redis URL: `REDIS_URL`
            *   If Next.js app runs **inside Docker**: `redis://redis:6379`
            *   If Next.js app runs **outside Docker** but Redis is in Docker: `redis://localhost:9849` (if using default port mapping)
        *   Azure AD (Optional): `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`.
        *   n8n Webhooks (Optional): `N8N_RESUME_WEBHOOK_URL`, `N8N_GENERIC_PDF_WEBHOOK_URL`.
        *   Google API Key (Optional, for Genkit): `GOOGLE_API_KEY`.

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
2.  **Verify your `.env.local` file (see Step 3 of Installation).** Key settings for Docker:
    *   `NEXTAUTH_URL=http://localhost:9846` (if using default port mapping in `docker-compose.yml`).
    *   `DATABASE_URL=postgresql://devuser:devpassword@postgres:5432/canditrack_db`
    *   `MINIO_ENDPOINT=minio`
    *   `MINIO_PORT=9000` (internal MinIO port)
    *   `REDIS_URL=redis://redis:6379` (internal Redis port)

3.  **Database Initialization (`pg-init-scripts/init-db.sql`):**
    *   The `pg-init-scripts/init-db.sql` file (located in the `pg-init-scripts` directory in your project root) is **automatically executed by PostgreSQL on its first startup** when the database volume (`postgres_data`) is empty or newly created.
    *   This script creates all necessary tables and inserts the default admin user.
    *   **If you encounter "relation ... does not exist" errors:** This means `init-db.sql` did not run or complete. This usually happens if the `postgres_data` Docker volume already existed from a previous run. To force re-initialization:
        1.  Stop services: `docker-compose down`
        2.  **CRITICAL: Remove all Docker volumes (this deletes ALL database, MinIO, and Redis data):**
            ```bash
            docker-compose down -v
            # OR, use the provided script:
            # ./start.sh --reinit
            ```
        3.  Ensure `pg-init-scripts/init-db.sql` is correct (especially the admin password hash if changed).
        4.  Restart services: `docker-compose up --build -d` (or `./start.sh`)
    *   **Check PostgreSQL container logs** for script execution messages or errors: `docker logs <your_postgres_container_name>` (find name with `docker ps`).

4.  **MinIO Bucket Creation:**
    *   The MinIO bucket (default: `canditrack-resumes`) is attempted to be created automatically by the application on startup (`src/lib/minio.ts`).

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
    *   **Candidate Matching App:** `http://localhost:9846`
    *   **MinIO API:** `http://localhost:9847` (Internally `minio:9000`)
    *   **MinIO Console:** `http://localhost:9848` (Login with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)
    *   **PostgreSQL:** `localhost:5432` (from host)
    *   **Redis:** `localhost:9849` (from host, corresponds to `redis:6379` internally)

7.  **Stopping Services:**
    ```bash
    docker-compose down
    ```
    To also remove volumes (deletes data): `docker-compose down -v`

## Available Scripts (for local development outside Docker, or for use inside Docker container)

*   `npm run dev`: Starts Next.js development server (default `http://localhost:9002`).
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
If connection errors occur, verify your `.env.local` settings, Docker networking, and ensure backend services are running correctly.
