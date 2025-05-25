
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Settings, Database, HardDrive, Zap, KeyRound, Info } from "lucide-react";

interface StatusItem {
  name: string;
  status: 'checking' | 'ok' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  icon: React.ElementType;
}

const N8N_WEBHOOK_URL_KEY = 'n8nWebhookUrl'; // From settings/integrations page

export default function SystemStatusPage() {
  const [isClient, setIsClient] = useState(false);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const checkStatuses: StatusItem[] = [
        {
          name: "PostgreSQL Database Connection",
          status: 'info',
          message: "Status: Verified via application startup logs.",
          details: "The application attempts to connect to PostgreSQL at startup and logs success or failure. Check server logs for 'Successfully connected...' or connection error messages. Ensure DATABASE_URL environment variable is correctly set in your .env.local or server environment.",
          icon: Database,
        },
        {
          name: "Database Schema (Tables)",
          status: 'ok', // Updated as this is automated
          message: "Status: Automated initialization by Docker.",
          details: "The 'init-db.sql' script automatically creates tables (User, Position, Candidate, TransitionRecord, LogEntry) when the PostgreSQL container starts with an empty data volume. If tables are missing, ensure the 'postgres_data' Docker volume was correctly cleared and re-initialized (e.g., via `docker-compose down -v`).",
          icon: Database,
        },
        {
          name: "MinIO File Storage Connection",
          status: 'info',
          message: "Status: Verified via application startup logs.",
          details: "The application attempts to connect to the MinIO server at startup and logs success or failure. Check server logs for 'Successfully connected to MinIO server...' or connection error messages. Ensure MinIO environment variables (MINIO_ENDPOINT, MINIO_ACCESS_KEY, etc.) are correctly set.",
          icon: HardDrive,
        },
        {
          name: "MinIO Bucket ('canditrack-resumes')",
          status: 'ok', // Updated to reflect application's attempt
          message: "Status: Application attempts auto-creation if not exists.",
          details: "The application's MinIO client (src/lib/minio.ts) will try to create the bucket defined by MINIO_BUCKET_NAME upon first interaction. Errors during this process (e.g., permission issues) would be logged by the application server.",
          icon: HardDrive,
        },
        {
          name: "Redis Cache Connection",
          status: 'info',
          message: "Status: Application connects when Redis-dependent features are used.",
          details: "Currently, no specific features in this prototype explicitly use Redis. If integrated, connection status would be logged. Ensure REDIS_URL environment variable is correctly set for future use.",
          icon: Zap,
        },
        {
          name: "Azure AD SSO Server Configuration",
          status: 'info',
          message: "Status: Configuration dependent on server-side environment variables.",
          details: "Azure AD Single Sign-On relies on AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID being correctly set in the server's environment variables. If these are not configured, SSO will not function. The Azure AD sign-in button's visibility on the login page is a partial client-side indicator.",
          icon: KeyRound,
        },
        {
          name: "NextAuth Secret",
          status: 'info',
          message: "Status: Critical server-side environment variable.",
          details: "The NEXTAUTH_SECRET environment variable must be set on the server for NextAuth to function securely and reliably. This is crucial for session management.",
          icon: KeyRound,
        },
        {
          name: "n8n Webhook URL (Client Setting)",
          status: localStorage.getItem(N8N_WEBHOOK_URL_KEY) ? 'ok' : 'warning',
          message: localStorage.getItem(N8N_WEBHOOK_URL_KEY) 
            ? "Status: Configured in local browser settings." 
            : "Status: Not configured in local browser settings.",
          details: `This is set on the Settings > Integrations page and stored in browser localStorage. For backend usage (like in /api/resumes/upload), the N8N_RESUME_WEBHOOK_URL environment variable must be set on the server. Current local setting: ${localStorage.getItem(N8N_WEBHOOK_URL_KEY) || 'Not set'}.`,
          icon: localStorage.getItem(N8N_WEBHOOK_URL_KEY) ? CheckCircle2 : AlertTriangle,
        },
      ];
      setStatuses(checkStatuses);
    }
  }, [isClient]);

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'ok': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };
  
  const getStatusBadgeVariant = (status: StatusItem['status']): "default" | "secondary" | "destructive" | "outline" => {
     switch (status) {
      case 'ok': return 'default'; 
      case 'warning': return 'secondary'; 
      case 'error': return 'destructive';
      case 'info': return 'outline'; 
      default: return 'outline';
    }
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 border rounded-md bg-muted">
                <div className="h-6 bg-muted-foreground/20 rounded w-1/3 mb-1"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Settings className="mr-3 h-7 w-7 text-primary" />
            System Status & Configuration
          </CardTitle>
          <CardDescription>
            Overview of key application dependencies and their expected setup status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statuses.length === 0 && <p>Loading status checks...</p>}
          {statuses.map((item) => (
            <Card key={item.name} className="p-4 shadow-sm bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <item.icon className={`mr-2 h-5 w-5 shrink-0 ${getStatusColor(item.status)}`} />
                  {item.name}
                </h3>
                <Badge variant={getStatusBadgeVariant(item.status)} className={item.status === 'ok' ? 'bg-green-500/80 text-primary-foreground' : ''}>
                  {item.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
              {item.details && (
                 <div className="mt-2 p-3 bg-muted/50 border border-muted rounded-md text-xs text-muted-foreground">
                    <Info className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-px" />
                    {item.details}
                 </div>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
