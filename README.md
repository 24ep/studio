
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
    *   Setup Guide (Informational)
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

This is the recommended way to run the application along with its backend services (PostgreSQL, MinIO, Redis) locally.

1.  **Ensure Docker and Docker Compose are installed and running.**
2.  **Set up your `.env.local` file as described in Step 3 of Installation.**
    *   The `DATABASE_URL` for the Next.js app (running in Docker) should point to the Docker service name: `postgresql://devuser:devpassword@postgres:5432/ncc_db` (or use the `${DATABASE_URL}` variable which defaults to this if `.env.local` doesn't override it).
    *   The `MINIO_ENDPOINT` for the app should be `minio` (the service name).
    *   The `REDIS_URL` for the app should be `redis://redis:6379`.

3.  **Build and run the services using Docker Compose:**
    From the project root directory (where `docker-compose.yml` and `init-db.sql` are located), run:
    ```bash
    docker-compose up --build
    ```
    *   Use `docker-compose up --build -d` to run in detached mode.
    *   You can use the provided `start.sh` script as well: `./start.sh` (make it executable: `chmod +x start.sh`).

4.  **Automated Database Schema Setup (PostgreSQL):**
    *   The PostgreSQL container is configured in `docker-compose.yml` to **automatically execute the `init-db.sql` script** (located in the project root) on its first startup when the database is initialized. This creates all necessary tables (`User`, `Candidate`, `Position`, `TransitionRecord`, `LogEntry`).
    *   This automatic initialization only happens once when the `postgres_data` Docker volume is first created (or if the volume is empty).
    *   **Troubleshooting - Tables Not Created?** If you find that tables like "Candidate", "Position", or "User" are missing (e.g., you see "relation ... does not exist" errors in your application logs):
        1.  Stop all services: `docker-compose down`
        2.  **Completely remove Docker volumes (this will delete existing database data):** `docker-compose down -v`
        3.  Restart the services: `docker-compose up --build -d` (or `docker-compose up --build`)
        This ensures a fresh database initialization, forcing the `init-db.sql` script to run.
        You can also check the logs of the PostgreSQL container for any errors during the execution of `init-db.sql`: `docker logs <your_postgres_container_name>` (find the name with `docker ps`).

5.  **MinIO Bucket Creation (Automated by Application):**
    *   The MinIO bucket specified by `MINIO_BUCKET_NAME` (default: `canditrack-resumes`) will be **attempted to be created automatically by the application** when it first tries to interact with MinIO (e.g., during a resume upload via the `ensureBucketExists` function in `src/lib/minio.ts`).
    *   You can also manually create it via the MinIO Console if preferred.

6.  **Verify Service Connectivity (Application Logs):**
    *   When your Next.js application starts, check its logs (e.g., `docker logs <your_app_container_name> -f`).
    *   You should see messages like "Successfully connected to PostgreSQL database..." and "Successfully connected to MinIO server..." or "MinIO: Bucket ... already exists/created...".
    *   If you see connection error messages, verify your `.env.local` settings, Docker networking, and that the backend services are running correctly.

7.  **Accessing Services:**
    *   **NCC Candidate Management App:** `http://localhost:9002`
    *   **PostgreSQL:** Accessible on `localhost:5432` from your host machine (or `postgres:5432` from within the Docker network).
    *   **MinIO API:** `http://localhost:9000` (from host).
    *   **MinIO Console:** `http://localhost:9001` (Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from your `.env.local` or `docker-compose.yml` defaults).
    *   **Redis:** Accessible on `localhost:6379` from your host machine (or `redis:6379` from within the Docker network).

8.  **Stopping the services:**
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
*   **Database Migrations:** For ongoing schema changes, use a formal migration tool (e.g., Flyway, Liquibase). The current `init-db.sql` is for initial setup.
*   **AI Feature Implementation:** Develop and integrate Genkit flows for resume parsing, candidate matching, etc.
*   **Real-time Features:** Implement WebSocket connections and Redis pub/sub for real-time updates.
*   **UX/UI Polish:** Continue refining the user experience and interface.
*   **Security Hardening:** Implement rate limiting, advanced security headers, etc. (Consider using an API Gateway like Kong for some of these aspects).
*   **Password Hashing:** Ensure passwords for the Credentials login are securely hashed (e.g., using bcrypt) in the `User` table and during login checks. The current prototype uses plaintext for simplicity in the `User` table and `CredentialsProvider`. **THIS IS CRITICAL FOR PRODUCTION.**

