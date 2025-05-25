
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Terminal, Database, HardDrive, Settings, Info, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DockerDeploymentPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-primary"><path d="M5.71 1.71A12.28 12.28 0 0 0 .73 12.5h0a12.28 12.28 0 0 0 4.94 10.79H18.3a12.28 12.28 0 0 0 4.94-10.79h0A12.28 12.28 0 0 0 18.33 1.71Z"/><path d="M10 17H5"/><path d="M13.29 17H19"/><path d="M19 13.71V17"/><path d="M5 13.71V17"/><path d="M10.63 8.25A2.59 2.59 0 0 0 8.39 7a2.43 2.43 0 0 0-2.39 2.5c0 .9.34 1.58.8 2"/><path d="M16.34 8.25a2.59 2.59 0 0 0-2.24-1.25 2.43 2.43 0 0 0-2.39 2.5c0 .9.34 1.58.8 2"/><path d="M12 17v-2.09"/><path d="M12 12.5v-2.09"/></svg>
            Docker Setup & Deployment Guide
          </CardTitle>
          <CardDescription>
            Instructions for setting up and running NCC Candidate Management using Docker and Docker Compose.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Settings className="mr-2 h-5 w-5 text-primary" /> Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              This application is designed to be run with Docker Compose, which orchestrates the Next.js application,
              PostgreSQL database, MinIO file storage, and Redis cache. The setup automates several steps, including
              database schema initialization and MinIO bucket creation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-primary" /> Prerequisites
            </h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li>Docker Desktop (or Docker Engine + Docker Compose CLI) installed and running.</li>
              <li>Git (to clone the repository).</li>
              <li>A code editor (like VS Code).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Code2 className="mr-2 h-5 w-5 text-primary" /> Environment Variables (.env.local)
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Before starting the application, you must create a <code>.env.local</code> file in the project root.
              Copy the contents from <code>.env.local.example</code> and fill in your actual secrets and configurations.
            </p>
            <div className="p-3 bg-muted rounded-md text-xs">
              <pre className="whitespace-pre-wrap break-all">
                {`# .env.local example
# NextAuth & Azure AD (if using SSO)
AZURE_AD_CLIENT_ID=your_azure_ad_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret
AZURE_AD_TENANT_ID=your_azure_ad_tenant_id
NEXTAUTH_URL=http://localhost:9002 # Or your app's URL
NEXTAUTH_SECRET=generate_a_strong_secret # e.g., openssl rand -base64 32

# Database (PostgreSQL) - These often match docker-compose.yml defaults
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpassword
POSTGRES_DB=canditrack_db
DATABASE_URL="postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}"

# MinIO Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minio_secret_password
# For the app to connect to MinIO:
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=\${MINIO_ROOT_USER}
MINIO_SECRET_KEY=\${MINIO_ROOT_PASSWORD}
MINIO_BUCKET_NAME=canditrack-resumes
MINIO_USE_SSL=false

# Redis
REDIS_URL=redis://redis:6379

# Optional: n8n Webhook URL
N8N_RESUME_WEBHOOK_URL=`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Note:</strong> The <code>DATABASE_URL</code>, <code>MINIO_ENDPOINT</code>, and <code>REDIS_URL</code> for the app
              should use the Docker service names (<code>postgres</code>, <code>minio</code>, <code>redis</code>) when the app itself runs within Docker.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-primary" /> Building & Running
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Open your terminal in the project root directory and run:
            </p>
            <div className="p-3 bg-muted rounded-md text-sm font-mono">
              docker-compose up --build -d
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Alternatively, you can use the provided shell script (make it executable first: <code>chmod +x start.sh</code>):
            </p>
            <div className="p-3 bg-muted rounded-md text-sm font-mono">
              ./start.sh
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This command will:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li>Build the Docker image for the Next.js application (if it doesn't exist or if code has changed).</li>
              <li>Pull images for PostgreSQL, MinIO, and Redis.</li>
              <li>Start all services in detached mode (<code>-d</code>).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Database className="mr-2 h-5 w-5 text-green-600" /> Automated Setup
            </h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 pl-2">
              <li>
                <strong>PostgreSQL Database Schema:</strong> The <code>init-db.sql</code> script in the project root
                is automatically executed by the PostgreSQL container on its first startup (when the <code>postgres_data</code> volume is empty).
                This creates all necessary tables (<code>User</code>, <code>Candidate</code>, <code>Position</code>, <code>TransitionRecord</code>, <code>LogEntry</code>).
              </li>
              <li>
                <strong>MinIO Bucket:</strong> The application code (<code>src/lib/minio.ts</code>) attempts to create the MinIO
                bucket specified by <code>MINIO_BUCKET_NAME</code> (default: <code>canditrack-resumes</code>) when it first tries to interact with MinIO.
              </li>
            </ul>
             <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-md text-xs">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 shrink-0 mt-0.5" />
                  <div>
                    <strong>Troubleshooting Missing Tables:</strong> If you find database tables are missing after startup (e.g., errors like "relation ... does not exist"),
                    it usually means the <code>postgres_data</code> volume was not empty, and the <code>init-db.sql</code> script did not run. To fix this:
                    <ol className="list-decimal list-inside pl-4 mt-1">
                      <li>Stop services: <code>docker-compose down</code></li>
                      <li>Remove volumes (this deletes existing data!): <code>docker-compose down -v</code></li>
                      <li>Restart: <code>docker-compose up --build -d</code></li>
                    </ol>
                  </div>
                </div>
              </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <ExternalLink className="mr-2 h-5 w-5 text-primary" /> Accessing Services
            </h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li><strong>NCC Candidate Management App:</strong> <code>http://localhost:9002</code> (or your configured <code>NEXTAUTH_URL</code>, check `docker-compose.yml` for app port mapping, e.g. `9846:9002` means host port `9846`).</li>
              <li><strong>MinIO Console:</strong> <code>http://localhost:9001</code> (or your configured mapping for port 9001, e.g., `9848:9001`). Login with <code>MINIO_ROOT_USER</code> and <code>MINIO_ROOT_PASSWORD</code>.</li>
              <li><strong>PostgreSQL Database:</strong> Accessible on <code>localhost:5432</code> from your host machine (or `postgres:5432` from within the Docker network).</li>
              <li><strong>Redis:</strong> Accessible on <code>localhost:6379</code> from your host machine (or `redis:6379` from within the Docker network).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-primary" /> Stopping Services
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              To stop all services:
            </p>
            <div className="p-3 bg-muted rounded-md text-sm font-mono">
              docker-compose down
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              To stop services and remove data volumes (database, MinIO files, Redis data - use with caution):
            </p>
            <div className="p-3 bg-muted rounded-md text-sm font-mono">
              docker-compose down -v
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Info className="mr-2 h-5 w-5 text-primary" /> Notes for Production Deployment
            </h2>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 pl-2">
                <li><strong>Secrets Management:</strong> Use your hosting provider's (e.g., Portainer secrets, cloud provider secret manager) mechanism to manage environment variables securely. Do not commit <code>.env.local</code> with real production secrets.</li>
                <li><strong>Remove Development Mounts:</strong> The <code>app</code> service in <code>docker-compose.yml</code> has its source code volume mount (<code>.:/app</code>) commented out. This is correct for production; the app should run from the code baked into the Docker image.</li>
                <li><strong>Database Backups:</strong> Implement a regular backup strategy for your PostgreSQL database and MinIO storage.</li>
                <li><strong>Resource Allocation:</strong> Adjust CPU and memory limits for your containers in your production environment as needed.</li>
                <li><strong>HTTPS/SSL:</strong> Terminate SSL at a load balancer or reverse proxy (like Nginx, Traefik, or your cloud provider's LB) in front of your application.</li>
                <li><strong>CI/CD:</strong> Implement a Continuous Integration/Continuous Deployment pipeline for automated builds, tests, and deployments.</li>
                <li><strong>Logging & Monitoring:</strong> Configure centralized logging and monitoring for all services.</li>
              </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

    