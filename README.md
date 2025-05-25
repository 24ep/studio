
# NCC Candidate Management - Applicant Tracking System (Next.js Prototype)

This is a Next.js application prototype for NCC Candidate Management, an Applicant Tracking System, built with Firebase Studio.

## Features

*   Dashboard Overview
*   Candidate Management (View, Add, Update Status, Delete, Resume Upload via Modal)
*   Position Management (View, Mock Add/Edit/Delete)
*   User Management (View, Add/Edit/Delete via Modals - interacts with PostgreSQL)
*   Settings:
    *   Preferences (Theme, App Logo - conceptual)
    *   Integrations (n8n Webhook, SMTP - conceptual)
    *   Setup Guide (Informational, with DB schema check)
*   API Documentation Page
*   Application Logs Page (Database-backed)
*   Authentication:
    *   Azure AD SSO
    *   Credentials (Email/Password - backed by PostgreSQL)
*   Styling with ShadCN UI components and Tailwind CSS.
*   Backend API routes for Candidates, Positions, Users, and Logs using PostgreSQL (via `pg` library) and file uploads to MinIO.
*   Resume uploads can optionally trigger an n8n webhook if `N8N_RESUME_WEBHOOK_URL` is configured.

## Tech Stack

*   Next.js (App Router)
*   React
*   TypeScript
*   Tailwind CSS
*   ShadCN UI
*   NextAuth.js (for authentication)
*   PostgreSQL (via `pg` library for database)
*   MinIO (for file storage)
*   Redis (conceptual, for future real-time features)
*   Genkit (conceptual, for future AI features)
*   Docker & Docker Compose

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Docker Desktop (or Docker Engine + Docker Compose)
*   Portainer (if deploying/managing via Portainer)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd ncc-candidate-management
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
        cp .env.local.example .env.local
        ```
    *   Open `.env.local` and fill in your actual credentials and configurations for:
        *   Azure AD (Client ID, Client Secret, Tenant ID) - if using Azure SSO.
        *   `NEXTAUTH_URL` (e.g., `http://localhost:9002` for local dev).
        *   `NEXTAUTH_SECRET` (Generate a strong secret: `openssl rand -base64 32`).
        *   PostgreSQL credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) - if different from defaults.
        *   `DATABASE_URL` (e.g., `postgresql://devuser:devpassword@localhost:5432/ncc_db` if running app outside Docker but DB in Docker, or `postgresql://devuser:devpassword@postgres:5432/ncc_db` if app also runs in Docker).
        *   MinIO credentials (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`) and app connection details (`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`). The `MINIO_ENDPOINT` for the app when running in Docker should be the service name (e.g., `minio`).
        *   Redis URL (`REDIS_URL`).
        *   `N8N_RESUME_WEBHOOK_URL` (Optional: Your n8n webhook URL if you want to integrate resume uploads).

### Running with Docker (Recommended for Full Stack Development)

This is the recommended way to run the application along with its backend services (PostgreSQL, MinIO, Redis) locally or via Portainer.

1.  **Ensure Docker and Docker Compose are installed and running.**
2.  **Set up your `.env.local` file as described in Step 3 of Installation.**
    *   The `DATABASE_URL` for the Next.js app (running in Docker) should point to the Docker service name: `postgresql://devuser:devpassword@postgres:5432/ncc_db` (or use the `${DATABASE_URL}` variable which defaults to this if `.env.local` doesn't override it).
    *   The `MINIO_ENDPOINT` for the app should be `minio` (the service name).
    *   The `REDIS_URL` for the app should be `redis://redis:6379`.

3.  **Automated Database Schema Setup (PostgreSQL):**
    *   The PostgreSQL container is configured in `docker-compose.yml` to **automatically execute the `init-db.sql` script** (located in the project root) on its first startup when the database is initialized. This creates all necessary tables (`User`, `Candidate`, `Position`, `TransitionRecord`, `LogEntry`).
    *   This automatic initialization **only happens once when the `postgres_data` Docker volume is first created** (or if the volume is empty/being newly created).

4.  **IMPORTANT: If Database Tables Are Missing (e.g., "relation ... does not exist" errors):**
    If your application logs errors indicating that tables like "Candidate", "Position", or "User" do not exist, it means the `init-db.sql` script did not run or did not complete successfully during the last PostgreSQL container startup. This is almost always because the `postgres_data` volume already existed with data.
    **To force a fresh database initialization and ensure `init-db.sql` runs:**
    *   **For Local Docker Compose:**
        1.  **Stop all services:** `docker-compose down`
        2.  **CRITICAL: Remove all Docker volumes (this will delete ALL existing database data and MinIO files):**
            ```bash
            docker-compose down -v
            ```
        3.  **Restart the services (this will rebuild if necessary):**
            ```bash
            docker-compose up --build -d
            # or just: docker-compose up --build
            ```
    *   **When Deploying/Managing with Portainer:**
        1.  When deploying or updating your stack in Portainer, if you need the `init-db.sql` script to run (e.g., for a fresh setup or if tables are missing), you **must ensure that Portainer does not reuse an existing `postgres_data` volume that already contains a database.**
        2.  You may need to:
            *   Manually delete the `postgres_data` volume associated with your stack via Portainer's "Volumes" section before redeploying the stack.
            *   Or, if Portainer provides an option during stack update/redeployment to "recreate" containers and specify "do not persist volumes" or "use new volumes" for the PostgreSQL service, select that.
        3.  After ensuring the volume will be fresh, deploy/update your stack in Portainer. The PostgreSQL container will initialize a new database and execute `init-db.sql`.
    *   **Check PostgreSQL Logs:** After startup, if you still suspect issues, check the logs of the PostgreSQL container for any errors during the execution of `init-db.sql`:
        *   Local Docker: `docker logs <your_postgres_container_name>` (Find `<your_postgres_container_name>` with `docker ps`)
        *   Portainer: View the logs for the PostgreSQL container within the Portainer UI.
        Look for messages indicating scripts from `/docker-entrypoint-initdb.d/` are being run, or any SQL errors.
    *   **Specific Error: `psql:/docker-entrypoint-initdb.d/init-db.sql: error: could not read from input file: Is a directory`**
        If you see this error in the PostgreSQL container logs, it means that when `docker-compose` mounted the `init-db.sql` file, it was incorrectly interpreted as a directory inside the container. This can happen if:
        *   The `./init-db.sql` path on your host machine (where `docker-compose` is run) was somehow a directory at the time of mounting. Ensure it is a file.
        *   There's a very subtle issue with how Docker is handling the file mount in your specific environment.
        **Solution:**
        1.  Triple-check that `init-db.sql` in your project root is a file.
        2.  Execute the `docker-compose down -v` and `docker-compose up --build -d` commands as described above. This often resolves issues related to Docker's cached state of volumes or mounts.
        3.  If the issue persists, ensure there are no permission problems with `init-db.sql` on your host system that might prevent Docker from correctly mounting it as a file.

5.  **MinIO Bucket Creation (Automated by Application):**
    *   The MinIO bucket specified by `MINIO_BUCKET_NAME` (default: `canditrack-resumes`) will be **attempted to be created automatically by the application** when it first tries to interact with MinIO (e.g., during a resume upload via the `ensureBucketExists` function in `src/lib/minio.ts`).
    *   You can also manually create it via the MinIO Console if preferred.

6.  **Verify Service Connectivity (Application Logs):**
    *   When your Next.js application starts, check its logs (e.g., `docker logs <your_app_container_name> -f` or via Portainer logs).
    *   You should see messages like "Successfully connected to PostgreSQL database..." and "Successfully connected to MinIO server..." or "MinIO: Bucket ... already exists/created...".
    *   If you see connection error messages, verify your `.env.local` settings, Docker networking, and that the backend services are running correctly.

7.  **Accessing Services:**
    *   **NCC Candidate Management App:** `http://localhost:9002` (or your configured host/port in Portainer)
    *   **PostgreSQL:** Accessible on `localhost:5432` from your host machine (or `postgres:5432` from within the Docker network, or as exposed by Portainer).
    *   **MinIO API:** `http://localhost:9000` (from host, or as exposed by Portainer on port 9847).
    *   **MinIO Console:** `http://localhost:9001` (Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from your `.env.local` or `docker-compose.yml` defaults. Exposed on port 9848 by default).
    *   **Redis:** Accessible on `localhost:6379` from your host machine (or `redis:6379` from within the Docker network, or as exposed by Portainer on port 9849).

8.  **Starting the services using the script (for local development):**
    (Ensure the script is executable: `chmod +x start.sh`)
    ```bash
    ./start.sh
    ```

9.  **Stopping the services (for local development):**
    ```bash
    docker-compose down
    ```
    To also remove volumes (be careful, this deletes data including your database and MinIO files):
    ```bash
    docker-compose down -v
    ```

## Available Scripts

*   `npm run dev`: Starts the Next.js development server.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a Next.js production server.
*   `npm run lint`: Lints the codebase.
*   `npm run typecheck`: Runs TypeScript type checking.

## Further Development

This application is a prototype. For production readiness, consider the following:

*   **Robust Error Handling & Logging:** Implement comprehensive server-side logging beyond the current database logging.
*   **API Authorization:** RBAC is implemented; review and enhance as needed for all actions.
*   **Testing:** Add unit, integration, and end-to-end tests.
*   **Database Migrations:** For ongoing schema changes, use a formal migration tool (e.g., Prisma Migrate, Flyway, Liquibase). The current `init-db.sql` is for initial setup.
*   **AI Feature Implementation:** Develop and integrate Genkit flows for resume parsing, candidate matching, etc.
*   **Real-time Features:** Implement WebSocket connections and Redis pub/sub for real-time updates.
*   **UX/UI Polish:** Continue refining the user experience and interface.
*   **Security Hardening:** Implement rate limiting, advanced security headers, etc. (Consider using an API Gateway like Kong for some of these aspects).
*   **Password Hashing:** Ensure passwords for the Credentials login are securely hashed (e.g., using bcrypt) in the `User` table and during login checks. The current prototype uses plaintext for simplicity in the `User` table and `CredentialsProvider`. **THIS IS CRITICAL FOR PRODUCTION.**

## Connectivity Checks

*   **PostgreSQL:** The application attempts to connect and execute a test query (`SELECT NOW()`) when the `src/lib/db.ts` module is initialized. Check your application server's console logs for "Successfully connected to PostgreSQL database..." or connection error messages.
*   **MinIO:** The application attempts to connect and check/create the resume bucket when `src/lib/minio.ts` is initialized. Check application server logs for "Successfully connected to MinIO server..." or "MinIO: Bucket ... already exists/created..." or related error messages.
