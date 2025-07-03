"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, Settings, Database, HardDrive, Zap, KeyRound, Info, ListChecks, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSession, signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StatusItem {
  id: string;
  name: string;
  status: 'checking' | 'ok' | 'warning' | 'error' | 'info' | 'disabled' | 'enabled';
  message: string;
  details?: string;
  icon: React.ElementType;
  action?: () => void;
  actionLabel?: string;
  isLoading?: boolean;
}

const AZURE_AD_SSO_CONCEPTUAL_KEY = 'azureAdSsoConceptualEnabled';

export default function SystemStatusPage() {
  const [isClient, setIsClient] = useState(false);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();

  const initialStatuses: StatusItem[] = [
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
      id: "minio_connection",
      name: "MinIO File Storage Connection",
      status: 'info',
      message: "Expected: Connected. Status verified by application server logs at startup.",
      details: "The Next.js application attempts to connect to MinIO when `src/lib/minio.ts` is initialized. Check server logs for 'Successfully connected to MinIO server...' or errors. Ensure MinIO environment variables (MINIO_ENDPOINT, MINIO_ACCESS_KEY, etc.) are correctly set.",
      icon: HardDrive,
    },
    {
      id: "minio_bucket_check",
      name: "MinIO Bucket ('canditrack-resumes')",
      status: 'info', 
      message: "Expected: Created. Application attempts auto-creation. Click to verify.",
      details: "The application (src/lib/minio.ts) tries to create the bucket specified by MINIO_BUCKET_NAME. You can click the button to perform an on-demand check. Requires Admin role.",
      icon: HardDrive,
      actionLabel: "Check Bucket Status",
      isLoading: false,
    },
    {
      id: "redis_connection",
      name: "Redis Cache Connection",
      status: 'info',
      message: "Expected: Available. App connects if Redis-dependent features are used (currently none active).",
      details: "Redis is available for caching and session storage. Ensure REDIS_URL is set for optimal performance.",
      icon: Zap,
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
      status: 'disabled', // Default to disabled, will be updated from localStorage
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
      name: "Resume Processing Webhook (Server-Side)",
      status: 'info',
      message: "Expected: Configured if resume processing automation is used. Relies on server-side RESUME_PROCESSING_WEBHOOK_URL.",
      details: "For resume uploads to trigger automation workflows, the RESUME_PROCESSING_WEBHOOK_URL environment variable must be set on the server. This is used by the /api/resumes/upload endpoint.",
      icon: Zap,
    },
    {
      id: "automation_generic_pdf_webhook_env_var",
      name: "Generic PDF Webhook (Server-Side)",
      status: 'info',
      message: "Expected: Configured if generic PDF to candidate creation is used. Relies on GENERAL_PDF_WEBHOOK_URL.",
      details: "For the 'Create via Resume (Automated)' feature on the Candidates page to create new candidates from PDFs, the GENERAL_PDF_WEBHOOK_URL environment variable must be set on the server.",
      icon: Zap,
    },
  ];

  const updateStatusItem = (id: string, updates: Partial<StatusItem>) => {
    setStatuses(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleCheckMinioBucket = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || session?.user?.role !== 'Admin') {
      toast.error('You must be an Admin to perform this check.');
      return;
    }
    updateStatusItem('minio_bucket_check', { isLoading: true, status: 'checking' });
    try {
      const response = await fetch('/api/setup/check-minio-bucket');
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            signIn(undefined, { callbackUrl: window.location.pathname });
            updateStatusItem('minio_bucket_check', { isLoading: false, status: 'error', message: 'Unauthorized to check bucket.' });
            return;
        }
        updateStatusItem('minio_bucket_check', { status: 'error', message: data.message || `Error: ${response.status}`, isLoading: false });
        toast.error(data.message || 'Could not verify bucket status.');
      } else {
        updateStatusItem('minio_bucket_check', { status: data.status as StatusItem['status'], message: data.message, isLoading: false });
        toast.success(data.message);
      }
    } catch (error) {
      console.error('Error during MinIO bucket check:', error);
      const errorMsg = (error as Error).message;
      updateStatusItem('minio_bucket_check', { status: 'error', message: `API Error: ${errorMsg}`, isLoading: false });
      toast.error(`Could not connect to API: ${errorMsg}`);
    }
  }, [session, sessionStatus]);

  const handleToggleAzureAdSsoConceptual = useCallback(() => {
    const currentSetting = localStorage.getItem(AZURE_AD_SSO_CONCEPTUAL_KEY) === 'true';
    const newSetting = !currentSetting;
    localStorage.setItem(AZURE_AD_SSO_CONCEPTUAL_KEY, String(newSetting));
    const newStatus = newSetting ? 'enabled' : 'disabled';
    updateStatusItem('azure_ad_sso_conceptual', {
      status: newStatus,
      message: `Conceptual SSO is currently ${newStatus}. Actual SSO depends on server ENV VARS.`,
      actionLabel: newSetting ? "Conceptually Disable SSO" : "Conceptually Enable SSO"
    });
    toast.success(`Azure AD SSO status set to ${newStatus}.`);
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: window.location.pathname });
      return;
    }
    
    const conceptualSsoEnabled = localStorage.getItem(AZURE_AD_SSO_CONCEPTUAL_KEY) === 'true';

    setStatuses(
      initialStatuses.map(item => {
        if (item.id === 'azure_ad_sso_conceptual') {
          const conceptualStatus = conceptualSsoEnabled ? 'enabled' : 'disabled';
          return {
            ...item,
            status: conceptualStatus,
            message: `Azure AD SSO is currently ${conceptualStatus}.`,
            actionLabel: conceptualSsoEnabled ? "Conceptually Disable SSO" : "Conceptually Enable SSO",
          };
        }
        return item;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, sessionStatus, pathname]); // initialStatuses is stable

   useEffect(() => {
    setStatuses(prev => prev.map(item => {
        if (item.id === 'minio_bucket_check') {
            return { ...item, action: handleCheckMinioBucket };
        }
        if (item.id === 'azure_ad_sso_conceptual') {
            return { ...item, action: handleToggleAzureAdSsoConceptual };
        }
        return item;
    }));
   }, [handleCheckMinioBucket, handleToggleAzureAdSsoConceptual]);


  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'ok':
      case 'enabled':
         return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': 
      case 'disabled':
        return 'text-red-500';
      case 'info':
      case 'checking':
        return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const getStatusBadgeVariant = (status: StatusItem['status']): "default" | "secondary" | "destructive" | "outline" => {
     switch (status) {
      case 'ok':
      case 'enabled':
        return 'default'; 
      case 'warning': return 'secondary'; 
      case 'error':
      case 'disabled':
        return 'destructive';
      case 'info':
      case 'checking':
        return 'outline'; 
      default: return 'outline';
    }
  }

  const getToggleIcon = (status: StatusItem['status']) => {
    if (status === 'enabled') return <ToggleRight className="mr-2 h-4 w-4 text-green-500" />;
    if (status === 'disabled') return <ToggleLeft className="mr-2 h-4 w-4 text-muted-foreground" />;
    return <Settings className="mr-2 h-4 w-4" />;
  }


  if (sessionStatus === 'loading' || (sessionStatus === 'unauthenticated' && pathname !== '/auth/signin' && !pathname.startsWith('/_next/')) || !isClient) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Settings className="mr-3 h-7 w-7 text-primary" />
            System Status & Configuration Overview
          </CardTitle>
          <CardDescription>
            Overview of key application dependencies, their expected setup, and how to verify their status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statuses.length === 0 && <p>Loading status checks...</p>}
          {statuses.map((item) => (
            <Card key={item.id} className="p-4 shadow-sm bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <item.icon className={`mr-2 h-5 w-5 shrink-0 ${getStatusColor(item.status)}`} />
                  {item.name}
                </h3>
                <Badge variant={getStatusBadgeVariant(item.status)} className={cn(
                  'self-start sm:self-center whitespace-nowrap',
                  {'bg-green-500/80 text-primary-foreground': item.status === 'ok' || item.status === 'enabled'},
                  {'bg-yellow-400/80 text-secondary-foreground': item.status === 'warning'},
                  {'bg-red-500/80 text-destructive-foreground': item.status === 'error' || item.status === 'disabled'}
                )}>
                  {item.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 ml-7 sm:ml-0">{item.message}</p>
              {item.details && (
                 <div className="mt-2 p-3 bg-muted/50 border border-muted rounded-md text-xs text-muted-foreground ml-7 sm:ml-0">
                    <Info className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-px" />
                    {item.details}
                 </div>
              )}
              {item.action && item.actionLabel && (
                <div className="mt-3 ml-7 sm:ml-0">
                  <Button 
                    onClick={item.action} 
                    disabled={item.isLoading || (item.id === 'minio_bucket_check' && session?.user?.role !== 'Admin')} 
                    variant="outline" 
                    size="sm" 
                    className={cn("btn-hover-primary-gradient",
                      item.id === 'azure_ad_sso_conceptual' && item.status === 'enabled' && 'bg-green-500 hover:bg-green-600 text-white border-green-600',
                      item.id === 'azure_ad_sso_conceptual' && item.status === 'disabled' && 'bg-muted hover:bg-muted/70 text-white border-border',
                    )}
                  >
                    {item.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                     item.id === 'azure_ad_sso_conceptual' ? getToggleIcon(item.status) :
                     item.id === 'minio_bucket_check' ? <HardDrive className="mr-2 h-4 w-4" /> : null}
                    {item.isLoading ? "Processing..." : item.actionLabel}
                  </Button>
                   {item.id === 'minio_bucket_check' && session?.user?.role !== 'Admin' && (
                     <p className="text-xs text-destructive mt-1">Admin role required to perform this check.</p>
                   )}
                </div>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
