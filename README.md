
# Candidate Matching - Applicant Tracking System (Next.js Prototype)

This is a Next.js application prototype for an Applicant Tracking System, built with Firebase Studio. It provides features for managing candidates, positions, users, and includes integrations for automated workflows.

## Key Features

*   **Dashboard Overview:** Visual summary with metrics like candidates per position (via chart).
*   **Candidate Management:**
    *   View, Add, Edit (detailed profile and status updates), Delete candidates.
    *   Resume Uploads: Direct upload to MinIO, with optional n8n webhook trigger for processing.
    *   Transition History: Track candidate stage changes with notes; ability to edit notes and delete records.
    *   Recruiter Assignment: Assign candidates to specific recruiters.
    *   Custom Fields: Support for defining and using custom data fields for candidates.
*   **Position Management:**
    *   View, Add, Edit, Delete job positions.
    *   Attributes: Includes title, department, description, open status, and `position_level`.
    *   Custom Fields: Support for defining and using custom data fields for positions.
*   **User Management:**
    *   View, Add, Edit, Delete users.
    *   Role-Based Access Control (RBAC): Admin, Recruiter, Hiring Manager roles.
    *   Module Permissions: Granular control over feature access.
    *   Password Management: Securely hashed passwords using `bcrypt`.
    *   User Group Management: Create and manage user groups (for future bulk permission assignment).
*   **My Task Board:** Kanban and list view for Recruiters/Admins to manage their assigned candidates.
*   **Settings & Configuration:**
    *   Preferences: Theme selection, App Name, App Logo (client-side, stored in localStorage).
    *   Integrations (Conceptual SMTP, Server-Side Webhooks):
        *   Server-configured n8n webhook for processing resumes of existing candidates.
        *   Server-configured n8n webhook for creating new candidates from generic PDF uploads.
    *   Recruitment Stages: Manage custom stages in the hiring pipeline.
    *   Data Models: View and set local UI preferences for Candidate and Position attributes.
    *   Custom Field Definitions: Define custom data fields for Candidates and Positions.
    *   Webhook Payload Mapping: Configure how incoming JSON from n8n maps to candidate attributes.
*   **API Documentation:** Page detailing available API endpoints.
*   **Application Logs:** View system and audit logs stored in the database.
*   **Authentication:**
    *   Azure AD SSO (via NextAuth.js).
    *   Credentials (Email/Password): Backend by PostgreSQL, passwords hashed using `bcrypt`.
*   **Styling:** ShadCN UI components and Tailwind CSS.
*   **File Storage:** Uses MinIO for resume and other file storage.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** Tailwind CSS, ShadCN UI
*   **Authentication:** NextAuth.js (Azure AD, Credentials providers)
*   **Backend API:** Next.js API Routes
*   **Database:** PostgreSQL (via `pg` library)
*   **File Storage:** MinIO
*   **Password Hashing:** `bcrypt`
*   **AI (Conceptual/Future):** Genkit (Google AI for LLMs/Image Generation)
*   **Real-time (Conceptual/Future):** Redis
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

This method runs the Next.js app, PostgreSQL, and MinIO in Docker containers.

1.  **Ensure Docker and Docker Compose are installed and running.**
2.  **Verify your `.env.local` file (see Step 3 of Installation).** Key settings for Docker:
    *   `NEXTAUTH_URL=http://localhost:9846` (if using default port mapping in `docker-compose.yml`).
    *   `DATABASE_URL=postgresql://devuser:devpassword@postgres:5432/canditrack_db`
    *   `MINIO_ENDPOINT=minio`
    *   `MINIO_PORT=9000` (internal MinIO port)
    *   `REDIS_URL=redis://redis:6379` (if Redis is used)

3.  **Database Initialization (`pg-init-scripts/init-db.sql`):**
    *   The `pg-init-scripts/init-db.sql` file (located in the `pg-init-scripts` directory in your project root) is **automatically executed by PostgreSQL on its first startup** when the database volume (`postgres_data`) is empty or newly created.
    *   This script creates all necessary tables and inserts the default admin user.
    *   **If you encounter "relation ... does not exist" errors:** This means `init-db.sql` did not run or complete. This usually happens if the `postgres_data` Docker volume already existed from a previous run. To force re-initialization:
        1.  Stop services: `docker-compose down`
        2.  **CRITICAL: Remove all Docker volumes (this deletes ALL database and MinIO data):**
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
    *   **Redis:** `localhost:9849` (from host, if Redis service is active)

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
*   **User Group Permissions:** Fully implement permission assignment based on user groups.

## Connectivity Checks (Application Logs)

*   **PostgreSQL:** Check Next.js app logs for "Successfully connected to PostgreSQL database..."
*   **MinIO:** Check Next.js app logs for "Successfully connected to MinIO server..." or "MinIO: Bucket ... already exists/created..."
If connection errors occur, verify your `.env.local` settings, Docker networking, and ensure backend services are running correctly.
```