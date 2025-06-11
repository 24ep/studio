
# Candidate Matching - Applicant Tracking System (Next.js Prototype)

This is a Next.js application prototype for Candidate Matching, an Applicant Tracking System, built with Firebase Studio.

## Features

*   Dashboard Overview (with candidates per position chart)
*   Candidate Management (View, Add, Update Status, Delete, Resume Upload via Modal)
    *   Detailed candidate profile structure.
    *   Transition history tracking with ability to edit notes and delete records.
    *   Candidate assignment to Recruiters.
*   Position Management (View, Add/Edit/Delete, including `position_level` attribute)
*   User Management (View, Add/Edit/Delete users, manage module permissions - interacts with PostgreSQL)
    *   Passwords are hashed using `bcrypt`.
*   My Task Board (for Recruiters/Admins to see assigned candidates)
*   Settings:
    *   Preferences (Theme, App Logo - conceptual, stored in localStorage)
    *   Integrations (n8n Webhook for specific candidate resumes, SMTP - conceptual, Generic PDF to n8n upload for new candidate creation)
*   API Documentation Page
*   Application Logs Page (Database-backed, with audit trail for key actions)
*   Authentication:
    *   Azure AD SSO
    *   Credentials (Email/Password - backed by PostgreSQL, passwords are hashed)
*   Styling with ShadCN UI components and Tailwind CSS.
*   Backend API routes for Candidates, Positions, Users, and Logs using PostgreSQL (via `pg` library) and file uploads to MinIO.
*   Resume uploads can optionally trigger an n8n webhook if `N8N_RESUME_WEBHOOK_URL` is configured.
*   Generic PDF uploads (from Candidates page) can trigger a different n8n webhook (`N8N_GENERIC_PDF_WEBHOOK_URL`) for new candidate creation.
*   Audit Logging: Key actions (CRUD operations, logins, logouts, settings changes) are logged to the database.
*   Role-Based Access Control (RBAC) implemented for API endpoints.

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
*   `bcrypt` for password hashing.

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
    cd candidate-matching-app # Assuming project directory name might change
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
    *   Open `.env.local` and fill in your actual credentials and configurations for:
        *   Azure AD (Client ID, Client Secret, Tenant ID) - if using Azure SSO.
        *   `NEXTAUTH_URL`: **Crucial for correct redirects.** This should be the URL you use to access the application in your browser. If using the default Docker Compose setup, this will likely be `http://localhost:9846`.
        *   `NEXTAUTH_SECRET` (Generate a strong secret: `openssl rand -base64 32`).
        *   PostgreSQL credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) - if different from defaults.
        *   `DATABASE_URL` (e.g., `postgresql://devuser:devpassword@localhost:5432/canditrack_db` if running app outside Docker but DB in Docker, or `postgresql://devuser:devpassword@postgres:5432/canditrack_db` if app also runs in Docker).
        *   MinIO credentials (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`) and app connection details (`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`). The `MINIO_ENDPOINT` for the app when running in Docker should be the service name (e.g., `minio`).
        *   Redis URL (`REDIS_URL`).
        *   `N8N_RESUME_WEBHOOK_URL` (Optional: Your n8n webhook URL for candidate-specific resume processing).
        *   `N8N_GENERIC_PDF_WEBHOOK_URL` (Optional: Your n8n webhook URL for generic PDF processing leading to new candidate creation).

### Default Admin Credentials (for Initial Setup)
*   **Email:** `admin@ncc.com`
*   **Password:** `nccadmin` (This is the plaintext password. The `pg-init-scripts/init-db.sql` script includes its bcrypt hash. **You must replace the placeholder `'YOUR_BCRYPT_HASH_OF_nccadmin_HERE'` in `pg-init-scripts/init-db.sql` ONLY if you change the default password or need to regenerate the hash for some reason.** The provided hash for `nccadmin` is `$2b$10$2BYzu2nUAp8IxK/SUReOd.yONfsS0IThoukn8zjvOFlamKvr58Rly`.)
*   **It is highly recommended to change this password immediately after the first login.**

### Running with Docker (Recommended for Full Stack Development)

This is the recommended way to run the application along with its backend services (PostgreSQL, MinIO, Redis) locally or via Portainer.

1.  **Ensure Docker and Docker Compose are installed and running.**
2.  **Set up your `.env.local` file as described in Step 3 of Installation.**
    *   **Important:** `NEXTAUTH_URL` should be set to the URL you use to access the app in your browser (e.g., `http://localhost:9846` with default Docker setup).
    *   The `DATABASE_URL` for the Next.js app (running in Docker) should point to the Docker service name: `postgresql://devuser:devpassword@postgres:5432/canditrack_db` (or use the `${DATABASE_URL}` variable which defaults to this if `.env.local` doesn't override it).
    *   The `MINIO_ENDPOINT` for the app should be `minio` (the service name).
    *   The `REDIS_URL` for the app should be `redis://redis:6379`.

3.  **Automated Database Schema Setup (PostgreSQL):**
    *   The PostgreSQL container is configured in `docker-compose.yml` to **automatically execute all `.sql` and `.sh` scripts located in the `./pg-init-scripts` directory** (relative to your project root) on its first startup when the database is initialized.
    *   **You must have a directory named `pg-init-scripts` in your project root, and your `init-db.sql` file (containing all `CREATE TABLE` statements) must be inside this directory.**
    *   This automatic initialization **only happens once when the `postgres_data` Docker volume is first created** (or if the volume is empty/being newly created).
    *   The `init-db.sql` includes an `INSERT` statement for a default admin user (`admin@ncc.com`) with a pre-hashed password.
    *   If you need to generate a new hash for a different default password:
        ```javascript
        // save as generate-hash.js
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const plaintextPassword = 'your_new_password';

        bcrypt.hash(plaintextPassword, saltRounds, function(err, hash) {
          if (err) { console.error("Error hashing password:", err); return; }
          console.log(`Bcrypt hash for '${plaintextPassword}': ${hash}`);
        });
        ```
        Run `node generate-hash.js` and copy the output into `init-db.sql` for the admin user password.

4.  **IMPORTANT: If Database Tables Are Missing (e.g., "relation ... does not exist" errors):**
    If your application logs errors indicating that tables like "Candidate", "Position", or "User" do not exist, it means the scripts in `./pg-init-scripts/` (specifically `init-db.sql`) did not run or did not complete successfully during the last PostgreSQL container startup.
    **This is almost always because the `postgres_data` Docker volume already existed with data, or there was an issue mounting the `./pg-init-scripts` directory into the container.**

    **To force a fresh database initialization and ensure `pg-init-scripts/init-db.sql` runs:**
    *   **For Local Docker Compose:**
        1.  **Stop all services:** `docker-compose down`
        2.  **CRITICAL: Remove all Docker volumes (this will delete ALL existing database data and MinIO files):**
            ```bash
            docker-compose down -v
            ```
            This command removes named volumes defined in `docker-compose.yml` and anonymous volumes attached to containers.
        3.  **Ensure `pg-init-scripts/init-db.sql` exists and is correctly configured:** Verify that you have a `pg-init-scripts` directory in your project root and that `init-db.sql` is inside it with the correct hashed password for the default admin user.
        4.  **Restart the services (this will rebuild if necessary):**
            ```bash
            docker-compose up --build -d
            # or just: docker-compose up --build
            ```
    *   **When Deploying/Managing with Portainer:**
        1.  When deploying or updating your stack in Portainer, if you need the `init-db.sql` script to run (e.g., for a fresh setup or if tables are missing), you **must ensure that Portainer does not reuse an existing `postgres_data` volume that already contains a database.**
        2.  You may need to:
            *   Manually delete the `postgres_data` volume associated with your stack via Portainer's "Volumes" section before redeploying the stack. Ensure this volume is named according to your `docker-compose.yml` (e.g., `yourstackname_postgres_data`).
            *   Or, if Portainer provides an option during stack update/redeployment to "recreate" containers and specify "do not persist volumes" or "use new volumes" for the PostgreSQL service, select that.
        3.  **Ensure `pg-init-scripts/init-db.sql` is in your Git repository and correctly configured:** If Portainer deploys from Git, the `pg-init-scripts` directory and its contents (with the hashed password in `init-db.sql`) must be in your repository for the volume mount to work correctly. The path `./pg-init-scripts` in `docker-compose.yml` will be relative to the root of the Git repository checked out by Portainer.
        4.  After ensuring the volume will be fresh, deploy/update your stack in Portainer. The PostgreSQL container will initialize a new database and execute scripts from `/docker-entrypoint-initdb.d/`.

    **Check PostgreSQL Container Logs for Errors:**
    After startup, if you still suspect issues (especially if tables are missing), **check the logs of the PostgreSQL container**.
    *   Local Docker: `docker logs <your_postgres_container_name>` (Find `<your_postgres_container_name>` with `docker ps`)
    *   Portainer: View the logs for the PostgreSQL container within the Portainer UI.
    Look for messages indicating scripts from `/docker-entrypoint-initdb.d/` are being run, or any SQL errors. A common error is `psql:/docker-entrypoint-initdb.d/init-db.sql: error: could not read from input file: Is a directory`. This means Docker could not find the `pg-init-scripts` directory on the host and created an empty directory for the mount point inside the container. Ensure `pg-init-scripts` is at the root of your project (where `docker-compose.yml` is) and that Portainer has access to this path if deploying from Git.

5.  **MinIO Bucket Creation (Automated by Application):**
    *   The MinIO bucket specified by `MINIO_BUCKET_NAME` (default: `canditrack-resumes`) will be **attempted to be created automatically by the application** when it first tries to interact with MinIO (e.g., during a resume upload via the `ensureBucketExists` function in `src/lib/minio.ts`).
    *   You can also manually create it via the MinIO Console if preferred.

6.  **Verify Service Connectivity (Application Logs):**
    *   When your Next.js application starts, check its logs (e.g., `docker logs <your_app_container_name> -f` or via Portainer logs).
    *   You should see messages like "Successfully connected to PostgreSQL database..." and "Successfully connected to MinIO server..." or "MinIO: Bucket ... already exists/created...".
    *   If you see connection error messages, verify your `.env.local` settings, Docker networking, and that the backend services are running correctly.

7.  **Accessing Services:**
    *   **Candidate Matching App:** `http://localhost:9846` (This is the default host port mapped to the app's internal port 9002. Ensure your `NEXTAUTH_URL` in `.env.local` matches this if using default Docker setup).
    *   **PostgreSQL:** Accessible on `localhost:5432` from your host machine (or `postgres:5432` from within the Docker network, or as exposed by Portainer).
    *   **MinIO API:** `http://localhost:9000` (from host, or as exposed by Portainer on host port 9847).
    *   **MinIO Console:** `http://localhost:9001` (Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from your `.env.local` or `docker-compose.yml` defaults. Exposed on host port 9848 by default).
    *   **Redis:** Accessible on `localhost:6379` from your host machine (or `redis://redis:6379` from within the Docker network, or as exposed by Portainer on host port 9849).

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
*   **Database Migrations:** For ongoing schema changes, use a formal migration tool (e.g., Prisma Migrate, Flyway, Liquibase). The current `init-db.sql` (executed from `./pg-init-scripts`) is for initial setup.
*   **AI Feature Implementation:** Develop and integrate Genkit flows for resume parsing, candidate matching, etc.
*   **Real-time Features:** Implement WebSocket connections and Redis pub/sub for real-time updates.
*   **UX/UI Polish:** Continue refining the user experience and interface.
*   **Security Hardening:** Implement rate limiting, advanced security headers, etc. (Consider using an API Gateway like Kong for some of these aspects).
*   **Password Hashing:** User passwords for the Credentials login are now hashed using `bcrypt`. Ensure strong password policies are encouraged.

## Connectivity Checks

*   **PostgreSQL:** The application attempts to connect and execute a test query (`SELECT NOW()`) when the `src/lib/db.ts` module is initialized. Check your application server's console logs for "Successfully connected to PostgreSQL database..." or connection error messages.
*   **MinIO:** The application attempts to connect and check/create the resume bucket when `src/lib/minio.ts` is initialized. Check application server logs for "Successfully connected to MinIO server..." or "MinIO: Bucket ... already exists/created..." or related error messages.

    

    