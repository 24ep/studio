import {
  Database,
  HardDrive,
  KeyRound,
  ListChecks,
  Zap,
} from "lucide-react";
import type { StatusItem } from './system-status-types';

export const AZURE_AD_SSO_CONCEPTUAL_KEY = 'azureAdSsoConceptualEnabled';

export const SYSTEM_STATUS_INITIAL_ITEMS: StatusItem[] = [
  {
    id: "postgres_connection",
    name: "PostgreSQL Database Connection",
    status: 'info',
    message: "Expected: Connected. Status verified by application server logs at startup.",
    details: "The Next.js application attempts to connect to PostgreSQL when `src/lib/db.ts` is initialized. Check your application server's console logs for 'Successfully connected...' or connection error messages. Ensure DATABASE_URL environment variable is correctly set.",
    icon: Database,
  },
  {
    id: "db_schema",
    name: "Database Schema (Tables)",
    status: 'ok',
    message: "Expected: Initialized. Setup automated via Docker Compose (init-db.sql).",
    details: "The 'init-db.sql' script (mounted into /docker-entrypoint-initdb.d/) automatically creates tables when the PostgreSQL Docker container starts with an empty data volume. If tables are missing, use the 'Check Database Schema' button on the Setup Page to verify and get troubleshooting steps. Check PostgreSQL container logs for script execution details.",
    icon: ListChecks,
  },
  {
    id: "storage_connection",
    name: "Object Storage Connection",
    status: 'info',
    message: "Expected: Connected. Status verified by application server logs at startup.",
    details: "The Next.js application connects through the S3-compatible storage client. Check server logs for storage connection errors. Configure STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, and STORAGE_BUCKET.",
    icon: HardDrive,
  },
  {
    id: "storage_bucket_check",
    name: "Object Storage Bucket",
    status: 'info',
    message: "Expected: Created. Application attempts auto-creation. Click to verify.",
    details: "The application tries to create the bucket specified by STORAGE_BUCKET. You can click the button to perform an on-demand check. Requires Admin role.",
    icon: HardDrive,
    actionLabel: "Check Bucket Status",
    isLoading: false,
  },
  {
    id: "azure_ad_env_vars",
    name: "Azure AD SSO Server Configuration (Environment Variables)",
    status: 'info',
    message: "Expected: Configured. Functionality depends on server-side ENV VARS.",
    details: "Functionality depends on AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID being correctly set on the server. The Azure AD sign-in button on the login page also depends on these.",
    icon: KeyRound,
  },
  {
    id: "azure_ad_sso_conceptual",
    name: "Azure AD SSO (Conceptual Toggle)",
    status: 'disabled',
    message: "Azure AD SSO configuration status.",
    details: "This toggle shows the Azure AD SSO configuration status. The actual SSO functionality is determined by server-side environment variables.",
    icon: KeyRound,
    actionLabel: "Conceptually Enable SSO",
    isLoading: false,
  },
  {
    id: "nextauth_secret",
    name: "NextAuth Secret",
    status: 'info',
    message: "Expected: Set. Critical server-side environment variable.",
    details: "The NEXTAUTH_SECRET environment variable must be set on the server for NextAuth.js to function securely for session management.",
    icon: KeyRound,
  },
  {
    id: "automation_resume_webhook_env_var",
    name: "PDF Processing Webhook (Server-Side)",
    status: 'info',
    message: "Expected: Configured if PDF processing automation is used. Relies on server-side RESUME_PROCESSING_WEBHOOK_URL.",
    details: "For all PDF processing including resume uploads and the 'Create via Resume (Automated)' feature, the RESUME_PROCESSING_WEBHOOK_URL environment variable must be set on the server. This unified webhook handles all PDF processing workflows.",
    icon: Zap,
  },
];
