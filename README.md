
# CandiTrack - Applicant Tracking System (Next.js Prototype)

This is a Next.js application prototype for CandiTrack, an Applicant Tracking System, built with Firebase Studio.

## Features

*   Dashboard Overview
*   Candidate Management (View, Add, Update Status, Delete, Resume Upload via Modal)
*   Position Management (View, Mock Add/Edit/Delete)
*   User Management (View, Mock Add/Edit/Delete via Modals)
*   Settings:
    *   Preferences (Theme, App Logo - conceptual)
    *   Integrations (n8n Webhook, SMTP - conceptual)
    *   Setup Guide (Informational)
*   API Documentation Page
*   Application Logs Page (Database-backed)
*   Authentication:
    *   Azure AD SSO
    *   Credentials (Email/Password - Mock)
*   Styling with ShadCN UI components and Tailwind CSS.
*   Backend API routes for Candidates, Positions, and Logs using PostgreSQL (via `pg` library) and file uploads to MinIO.

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
    cd canditrack-app 
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
        *   Azure AD (Client ID, Client Secret, Tenant ID)
        *   `NEXTAUTH_URL` (e.g., `http://localhost:9002` for local dev)
        *   `NEXTAUTH_SECRET` (Generate a strong secret: `openssl rand -base64 32`)
        *   `DATABASE_URL` (e.g., `postgresql://devuser:devpassword@localhost:5432/canditrack_db` if running PostgreSQL outside Docker, or `postgresql://devuser:devpassword@postgres:5432/canditrack_db` if using the provided Docker Compose setup)
        *   MinIO credentials and endpoint (if different from Docker Compose defaults)
        *   Redis URL (if different from Docker Compose defaults)

4.  **Database Setup (PostgreSQL):**
    *   Ensure you have a PostgreSQL instance running (either locally or via Docker).
    *   Connect to your PostgreSQL instance and create the `canditrack_db` database (or the database name specified in your `DATABASE_URL`).
    *   Create the necessary tables. Example DDL statements are provided in the comments of `src/lib/db.ts`. You should adapt these and run them in your database. This includes tables like `Position`, `Candidate`, `TransitionRecord`, and `LogEntry`.

5.  **MinIO Setup:**
    *   Ensure your MinIO server is running.
    *   Create the bucket specified by `MINIO_BUCKET_NAME` in your `.env.local` (default: `canditrack-resumes`). The application attempts to create it if it doesn't exist, but manual creation is also an option.

### Running the Application (Development Mode)

*   **To run the Next.js app standalone (requires external PostgreSQL, MinIO, Redis):**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

*   **To run with Genkit AI flows (if implemented, conceptual for now):**
    ```bash
    npm run genkit:dev
    # or for watching changes
    npm run genkit:watch
    ```

### Running with Docker (Recommended for Full Stack Development)

This is the recommended way to run the application along with its backend services (PostgreSQL, MinIO, Redis) locally.

1.  **Ensure Docker and Docker Compose are installed and running.**
2.  **Set up your `.env.local` file as described in Step 3 of Installation.**
    *   The `DATABASE_URL` should point to the Docker service name: `postgresql://devuser:devpassword@postgres:5432/canditrack_db`
    *   The `MINIO_ENDPOINT` should be `minio` (the service name).
    *   The `REDIS_URL` should be `redis://redis:6379`.
3.  **Build and run the services using Docker Compose:**
    From the project root directory, run:
    ```bash
    docker-compose up --build
    ```
    *   Use `docker-compose up --build -d` to run in detached mode.
    *   You can use the provided `start.sh` script as well: `./start.sh` (make it executable: `chmod +x start.sh`).

4.  **Accessing Services:**
    *   **CandiTrack App:** `http://localhost:9002`
    *   **PostgreSQL:** Accessible on `localhost:5432` from your host machine (or `postgres:5432` from within the Docker network).
    *   **MinIO API:** `http://localhost:9000`
    *   **MinIO Console:** `http://localhost:9001` (Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from your `.env.local` or `docker-compose.yml`).
    *   **Redis:** Accessible on `localhost:6379` from your host machine (or `redis:6379` from within the Docker network).

5.  **Stopping the services:**
    ```bash
    docker-compose down
    ```
    To also remove volumes (be careful, this deletes data):
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

*   **Robust Error Handling & Logging:** Implement comprehensive server-side logging.
*   **API Authorization:** Enhance API security with role-based access control.
*   **Testing:** Add unit, integration, and end-to-end tests.
*   **Database Migrations:** Use a formal migration tool (e.g., Prisma Migrate if you were using Prisma, or others like Flyway/Liquibase for raw SQL) instead of manual DDL for schema changes.
*   **AI Feature Implementation:** Develop and integrate Genkit flows for resume parsing, candidate matching, etc.
*   **Real-time Features:** Implement WebSocket connections and Redis pub/sub for real-time updates.
*   **UX/UI Polish:** Continue refining the user experience and interface.
